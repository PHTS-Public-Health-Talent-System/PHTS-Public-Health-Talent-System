import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import db from '@config/database.js';
import {
  assignRoles,
  RoleAssignmentService,
} from '@/modules/system/identity/services/role-assignment.service.js';
import { clearScopeCache } from '@/modules/request/scope/scope.service.js';
import { requestRepository } from '@/modules/request/data/repositories/request.repository.js';
import {
  parseSpecialPositionScopes,
  removeOverlaps,
  inferScopeType,
} from '@/modules/request/scope/utils.js';
import { applyImmediateMovementEligibilityCutoff } from '@/modules/workforce-compliance/services/immediate-rules.service.js';
import type { SyncRuntimeStatus, SyncStats } from '@/modules/system/sync/services/sync.types.js';
import { createSyncStats } from '@/modules/system/sync/services/sync-stats.service.js';
import {
  acquireSyncLock,
  createSyncLockValue,
  getLastSyncStatus as getSyncStatusFromCache,
  releaseSyncLock,
  setLastSyncResult,
  startSyncLockHeartbeat,
} from '@/modules/system/sync/services/sync-lock.service.js';
import {
  hasLeaveStatusColumn,
  hasSupportLevelColumn,
  upsertEmployeeProfile,
  upsertLeaveQuota,
} from '@/modules/system/sync/services/sync-db-helpers.service.js';
import { syncUsersFromProfilesAndSupport } from '@/modules/system/sync/services/sync-users.service.js';
import {
  syncEmployees,
  syncSupportEmployees,
  upsertSingleEmployeeProfile,
  upsertSingleSupportEmployee,
} from '@/modules/system/sync/services/sync-hr.service.js';


export const VIEW_EMPLOYEE_COLUMNS = [
  'citizen_id',
  'title',
  'first_name',
  'last_name',
  'sex',
  'birth_date',
  'position_name',
  'position_number',
  'level',
  'special_position',
  'employee_type',
  'start_current_position',
  'first_entry_date',
  'mission_group',
  'department',
  'sub_department',
  'specialist',
  'expert',
  'original_status',
  'is_currently_active',
] as const;

export const VIEW_SUPPORT_COLUMNS = [
  'citizen_id',
  'title',
  'first_name',
  'last_name',
  'sex',
  'position_name',
  'position_number',
  'special_position',
  'employee_type',
  'start_current_position',
  'first_entry_date',
  'mission_group',
  'department',
  'is_currently_active',
] as const;

export const VIEW_LEAVE_COLUMNS = [
  'ref_id',
  'citizen_id',
  'leave_type',
  'start_date',
  'end_date',
  'duration_days',
  'fiscal_year',
  'remark',
  'status',
] as const;

export const citizenIdJoinBinary = (leftAlias: string, rightAlias: string) =>
  `CAST(${leftAlias}.citizen_id AS BINARY) = CAST(${rightAlias}.citizen_id AS BINARY)`;

export const citizenIdWhereBinary = (alias: string, placeholder: string) =>
  `CAST(${alias}.citizen_id AS BINARY) = CAST(${placeholder} AS BINARY)`;

export const selectColumns = (alias: string, columns: readonly string[]) =>
  columns.map((column) => `${alias}.${column}`).join(', ');

export const citizenIdSelectUtf8 = (alias: string) =>
  `CAST(${alias}.citizen_id AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci`;

export const binaryEquals = (leftExpr: string, rightExpr: string) =>
  `CAST(${leftExpr} AS BINARY) = CAST(${rightExpr} AS BINARY)`;

export const buildLicensesViewQuery = () => `
  INSERT INTO emp_licenses (citizen_id, license_name, license_no, valid_from, valid_until, status, synced_at)
  SELECT l.citizen_id,
         l.license_name,
         l.license_no,
         l.valid_from,
         CAST(l.valid_until AS DATE),
         l.status,
         NOW()
  FROM vw_hrms_licenses l
  ON DUPLICATE KEY UPDATE
    license_name=VALUES(license_name),
    valid_from=VALUES(valid_from),
    valid_until=VALUES(valid_until),
    status=VALUES(status),
    synced_at=NOW()
`;

export const buildQuotasViewQuery = () => `
  SELECT q.citizen_id, q.fiscal_year, q.total_quota
  FROM vw_hrms_leave_quotas q
`;

export const buildLeaveViewQuery = () => `
  SELECT ${selectColumns('lr', VIEW_LEAVE_COLUMNS)}
  FROM vw_hrms_leave_requests lr
`;

export const buildMovementsViewQuery = () => `
  INSERT INTO emp_movements (citizen_id, movement_type, effective_date, remark, synced_at)
  SELECT ${citizenIdSelectUtf8('m')} AS citizen_id,
         CASE
           WHEN ${binaryEquals('m.movement_type', "'UNKNOWN'")} THEN 'OTHER'
           ELSE m.movement_type
         END,
         m.effective_date,
         m.remark,
         NOW()
  FROM vw_hrms_movements m
  ON DUPLICATE KEY UPDATE
    movement_type = VALUES(movement_type),
    effective_date = VALUES(effective_date),
    remark = VALUES(remark),
    synced_at = NOW()
`;

export const buildSignaturesViewQuery = () => `
  SELECT s.citizen_id, s.signature_blob
  FROM vw_hrms_signatures s
`;

// Convert undefined to null for safe DB inserts.
const toNull = (val: any) => (val === undefined ? null : val);

// ─── SQL Builder Helpers (for duplication reduction) ────────────────────────

interface LeaveRecordSqlOptions {
  hasStatusColumn: boolean;
}

export const buildLeaveRecordSql = (options: LeaveRecordSqlOptions): { sql: string; fields: string[] } => {
  const { hasStatusColumn } = options;

  const baseFields = [
    'ref_id',
    'citizen_id',
    'leave_type',
    'start_date',
    'end_date',
    'duration_days',
    'fiscal_year',
    'remark',
  ];
  const fields = [...baseFields];
  const updateFields = [
    'start_date = VALUES(start_date)',
    'end_date = VALUES(end_date)',
    'duration_days = VALUES(duration_days)',
  ];

  if (hasStatusColumn) {
    fields.push('status');
    updateFields.push('status = VALUES(status)');
  }
  fields.push('synced_at');
  updateFields.push('synced_at = NOW()');

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `
    INSERT INTO leave_records (${fields.join(', ')})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}
  `;

  return { sql, fields };
};

export const buildLeaveRecordValues = (vLeave: any, options: LeaveRecordSqlOptions): any[] => {
  const { hasStatusColumn } = options;
  const values = [
    toNull(vLeave.ref_id),
    toNull(vLeave.citizen_id),
    toNull(vLeave.leave_type),
    toNull(vLeave.start_date),
    toNull(vLeave.end_date),
    toNull(vLeave.duration_days),
    toNull(vLeave.fiscal_year),
    toNull(vLeave.remark),
  ];

  if (hasStatusColumn) {
    values.push(toNull(vLeave.status));
  }
  values.push(null); // synced_at handled by NOW()

  return values;
};

interface SupportEmployeeSqlOptions {
  hasLevelColumn: boolean;
}

export const buildSupportEmployeeSql = (
  options: SupportEmployeeSqlOptions,
): { sql: string; fields: string[] } => {
  const { hasLevelColumn } = options;

  const baseFields = ['citizen_id', 'title', 'first_name', 'last_name', 'position_name'];
  const fields = [...baseFields];
  const updateFields = [
    'title = VALUES(title)',
    'first_name = VALUES(first_name)',
    'last_name = VALUES(last_name)',
    'position_name = VALUES(position_name)',
  ];

  if (hasLevelColumn) {
    fields.push('level');
    updateFields.push('level = VALUES(level)');
  }

  fields.push(
    'special_position',
    'emp_type',
    'department',
    'is_currently_active',
    'last_synced_at',
  );
  updateFields.push(
    'special_position = VALUES(special_position)',
    'emp_type = VALUES(emp_type)',
    'department = VALUES(department)',
    'is_currently_active = VALUES(is_currently_active)',
    'last_synced_at = NOW()',
  );

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `
    INSERT INTO emp_support_staff (${fields.join(', ')})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}
  `;

  return { sql, fields };
};

export const buildSupportEmployeeValues = (vSup: any, options: SupportEmployeeSqlOptions): any[] => {
  const { hasLevelColumn } = options;
  const values = [
    toNull(vSup.citizen_id),
    toNull(vSup.title),
    toNull(vSup.first_name),
    toNull(vSup.last_name),
    toNull(vSup.position_name),
  ];

  if (hasLevelColumn) {
    values.push(toNull(vSup.level));
  }

  values.push(
    toNull(vSup.special_position),
    toNull(vSup.employee_type),
    toNull(vSup.department),
    toNull(vSup.is_currently_active),
    null, // last_synced_at handled by NOW()
  );

  return values;
};

// ─────────────────────────────────────────────────────────────────────────────

const toDateOnly = (value: any): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isActiveOriginalStatus = (status: string | null): boolean => {
  if (!status) return false;
  return status.trim().startsWith('ปฏิบัติงาน');
};

export const deriveUserIsActive = (
  profileStatus: string | null,
  _supportIsEnableLogin: number | null,
): boolean => {
  return isActiveOriginalStatus(profileStatus);
};

// Detect value change with support for dates and nullish values.
const isChanged = (oldVal: any, newVal: any) => {
  const oldDate = toDateOnly(oldVal);
  const newDate = toDateOnly(newVal);
  if (oldDate || newDate) {
    return oldDate !== newDate;
  }
  if (typeof oldVal === 'number' && typeof newVal === 'string') {
    return oldVal !== Number.parseFloat(newVal);
  }
  return String(oldVal ?? '') !== String(newVal ?? '');
};

const getUserIdMap = async (conn: PoolConnection) => {
  const [existingUsers] = await conn.query<RowDataPacket[]>('SELECT id, citizen_id FROM users');
  return new Map(existingUsers.map((u) => [u.citizen_id, u.id]));
};

const syncSignatures = async (conn: PoolConnection, stats: SyncStats) => {
  console.log('[SyncService] Processing signatures...');
  const [existingSigs] = await conn.query<RowDataPacket[]>('SELECT citizen_id FROM sig_images');
  const sigSet = new Set(existingSigs.map((s) => s.citizen_id));

  const [viewSigs] = await conn.query<RowDataPacket[]>(buildSignaturesViewQuery());

  for (const vSig of viewSigs) {
    if (!vSig.citizen_id || sigSet.has(vSig.citizen_id)) {
      stats.signatures.skipped++;
      continue;
    }
    await conn.execute(
      `
          INSERT INTO sig_images (citizen_id, signature_image, updated_at) VALUES (?, ?, NOW())
        `,
      [vSig.citizen_id, vSig.signature_blob],
    );
    stats.signatures.added++;
  }
};

const syncLicensesAndQuotas = async (conn: PoolConnection, stats: SyncStats) => {
  console.log('[SyncService] Processing licenses and quotas...');
  await conn.query(buildLicensesViewQuery());

  const [viewQuotas] = await conn.query<RowDataPacket[]>(buildQuotasViewQuery());
  for (const q of viewQuotas) {
    await upsertLeaveQuota(conn, q.citizen_id, q.fiscal_year, q.total_quota);
    stats.quotas.upserted++;
  }
};

const syncLeaves = async (conn: PoolConnection, stats: SyncStats) => {
  console.log('[SyncService] Processing leave requests...');
  const hasStatusColumn = await hasLeaveStatusColumn(conn);

  const sqlOptions: LeaveRecordSqlOptions = { hasStatusColumn };
  const { sql } = buildLeaveRecordSql(sqlOptions);

  const existingFields = ['ref_id', 'start_date', 'end_date'];
  if (hasStatusColumn) existingFields.push('status');
  const existingSelect = `SELECT ${existingFields.join(', ')} FROM leave_records WHERE ref_id IS NOT NULL`;

  const [existingLeaves] = await conn.query<RowDataPacket[]>(existingSelect);
  const leaveMap = new Map(existingLeaves.map((l) => [l.ref_id, l]));

  const [viewLeaves] = await conn.query<RowDataPacket[]>(buildLeaveViewQuery());

  for (const vLeave of viewLeaves) {
    if (!vLeave.ref_id) continue;
    const dbLeave = leaveMap.get(vLeave.ref_id);

    if (dbLeave) {
      const dateChanged =
        isChanged(dbLeave.start_date, vLeave.start_date) ||
        isChanged(dbLeave.end_date, vLeave.end_date);
      const statusChanged = hasStatusColumn ? isChanged(dbLeave.status, vLeave.status) : false;
      if (!dateChanged && !statusChanged) {
        stats.leaves.skipped++;
        continue;
      }
    }

    const values = buildLeaveRecordValues(vLeave, sqlOptions);
    await conn.execute(sql, values);
    stats.leaves.upserted++;
  }
};

const syncMovements = async (conn: PoolConnection, _stats: SyncStats) => {
  console.log('[SyncService] Processing movements...');
  await conn.query(buildMovementsViewQuery());
  await applyImmediateMovementEligibilityCutoff(new Date(), conn);
};

export const buildScopesFromSpecialPosition = (specialPosition: string | null) => {
  if (!specialPosition) return { wardScopes: [], deptScopes: [] };
  const allScopes = parseSpecialPositionScopes(specialPosition);
  const wardScopes: string[] = [];
  const deptScopes: string[] = [];

  const normalizeScopeName = (scope: string): string => {
    const parts = scope.split('-');
    return parts.length > 1 ? parts.slice(1).join('-').trim() : scope.trim();
  };

  const addScope = (target: string[], scopeName: string): void => {
    if (!scopeName || inferScopeType(scopeName) === 'IGNORE') return;
    target.push(scopeName);
  };

  for (const scope of allScopes) {
    if (scope.includes('ตำแหน่งด้านบริหาร')) continue;
    const isHeadWard = scope.includes('หัวหน้าตึก') || scope.includes('หัวหน้างาน-');
    const isHeadDept = scope.includes('หัวหน้ากลุ่มงาน') || scope.includes('หัวหน้ากลุ่มภารกิจ');
    const scopeName = normalizeScopeName(scope);

    if (isHeadWard) {
      addScope(wardScopes, scopeName);
      if (inferScopeType(scopeName) === 'DEPT') addScope(deptScopes, scopeName);
      continue;
    }

    if (isHeadDept) {
      addScope(deptScopes, scopeName);
      continue;
    }
  }

  const cleanedWardScopes = removeOverlaps(wardScopes, deptScopes);
  const uniqWard = Array.from(new Set(cleanedWardScopes.map((s) => s.trim())));
  const uniqDept = Array.from(new Set(deptScopes.map((s) => s.trim())));
  return { wardScopes: uniqWard, deptScopes: uniqDept };
};

const syncSpecialPositionScopes = async (conn: PoolConnection) => {
  console.log('[SyncService] Processing special_position scope mapping...');

  const [rows] = await conn.query<RowDataPacket[]>(
    `
      SELECT u.id AS user_id,
             u.citizen_id,
             u.role,
             e.special_position,
             e.original_status,
             s.is_currently_active AS support_active
      FROM users u
      LEFT JOIN emp_profiles e ON ${citizenIdJoinBinary('u', 'e')}
      LEFT JOIN emp_support_staff s ON ${citizenIdJoinBinary('u', 's')}
      WHERE u.role IN ('HEAD_WARD','HEAD_DEPT')
    `,
  );

  for (const row of rows) {
    const citizenId = row.citizen_id as string;
    const role = row.role as string;
    const specialPosition = row.special_position as string | null;
    const originalStatus = row.original_status as string | null;
    const supportActive = row.support_active as number | null;

    const isActive = isActiveOriginalStatus(originalStatus) || Number(supportActive) === 1;

    if (!isActive) {
      if (row.user_id) {
        await requestRepository.disableScopeMappings(row.user_id as number, role, conn);
      } else {
        await requestRepository.disableScopeMappingsByCitizenId(citizenId, role, conn);
      }
      continue;
    }

    const scopes = buildScopesFromSpecialPosition(specialPosition);

    if (row.user_id) {
      await requestRepository.disableScopeMappings(row.user_id as number, role, conn);
    } else {
      await requestRepository.disableScopeMappingsByCitizenId(citizenId, role, conn);
    }

    if (scopes.wardScopes.length === 0 && scopes.deptScopes.length === 0) {
      console.warn(
        `[SyncService] special_position parse failed: citizen_id=${citizenId}, role=${role}, special_position="${specialPosition ?? ''}"`,
      );
      continue;
    }

    const inputs = [
      ...scopes.wardScopes.map((scopeName) => ({
        user_id: row.user_id as number | undefined,
        citizen_id: citizenId,
        role,
        scope_type: 'UNIT' as const,
        scope_name: scopeName,
        source: 'AUTO' as const,
      })),
      ...scopes.deptScopes.map((scopeName) => ({
        user_id: row.user_id as number | undefined,
        citizen_id: citizenId,
        role,
        scope_type: 'DEPT' as const,
        scope_name: scopeName,
        source: 'AUTO' as const,
      })),
    ];

    await requestRepository.insertScopeMappings(inputs, conn);

    const userId = row.user_id as number;
    if (userId) {
      clearScopeCache(userId);
    }
  }
};

const syncSpecialPositionScopesForCitizen = async (conn: PoolConnection, citizenId: string) => {
  const [rows] = await conn.query<RowDataPacket[]>(
    `
      SELECT u.id AS user_id,
             u.citizen_id,
             u.role,
             e.special_position,
             e.original_status,
             s.is_currently_active AS support_active
      FROM users u
      LEFT JOIN emp_profiles e ON ${citizenIdJoinBinary('u', 'e')}
      LEFT JOIN emp_support_staff s ON ${citizenIdJoinBinary('u', 's')}
      WHERE u.citizen_id = ?
        AND u.role IN ('HEAD_WARD','HEAD_DEPT')
      LIMIT 1
    `,
    [citizenId],
  );

  const row = rows[0];
  if (!row) return;

  const role = row.role as string;
  const specialPosition = row.special_position as string | null;
  const originalStatus = row.original_status as string | null;
  const supportActive = row.support_active as number | null;

  const isActive = isActiveOriginalStatus(originalStatus) || Number(supportActive) === 1;

  if (!isActive) {
    if (row.user_id) {
      await requestRepository.disableScopeMappings(row.user_id as number, role, conn);
    } else {
      await requestRepository.disableScopeMappingsByCitizenId(citizenId, role, conn);
    }
    return;
  }

  const scopes = buildScopesFromSpecialPosition(specialPosition);

  if (row.user_id) {
    await requestRepository.disableScopeMappings(row.user_id as number, role, conn);
  } else {
    await requestRepository.disableScopeMappingsByCitizenId(citizenId, role, conn);
  }

  if (scopes.wardScopes.length === 0 && scopes.deptScopes.length === 0) {
    console.warn(
      `[SyncService] special_position parse failed: citizen_id=${citizenId}, role=${role}, special_position="${specialPosition ?? ''}"`,
    );
    return;
  }

  const inputs = [
    ...scopes.wardScopes.map((scopeName) => ({
      user_id: row.user_id as number | undefined,
      citizen_id: citizenId,
      role,
      scope_type: 'UNIT' as const,
      scope_name: scopeName,
      source: 'AUTO' as const,
    })),
    ...scopes.deptScopes.map((scopeName) => ({
      user_id: row.user_id as number | undefined,
      citizen_id: citizenId,
      role,
      scope_type: 'DEPT' as const,
      scope_name: scopeName,
      source: 'AUTO' as const,
    })),
  ];

  await requestRepository.insertScopeMappings(inputs, conn);

  const userId = row.user_id as number;
  if (userId) {
    clearScopeCache(userId);
  }
};

const syncSingleSignature = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
): Promise<void> => {
  const [viewSigs] = await conn.query<RowDataPacket[]>(
    `
      SELECT s.citizen_id, s.signature_blob
      FROM vw_hrms_signatures s
      WHERE ${citizenIdWhereBinary('s', '?')}
    `,
    [citizenId],
  );
  const vSig = viewSigs[0];
  if (!vSig) return;
  const [existingSigs] = await conn.query<RowDataPacket[]>(
    `SELECT citizen_id FROM sig_images WHERE ${citizenIdWhereBinary('sig_images', '?')}`,
    [vSig.citizen_id],
  );
  if (existingSigs.length) {
    stats.signatures.skipped++;
    return;
  }
  await conn.execute(
    `INSERT INTO sig_images (citizen_id, signature_image, updated_at) VALUES (?, ?, NOW())`,
    [vSig.citizen_id, vSig.signature_blob],
  );
  stats.signatures.added++;
};

const syncSingleLicenses = async (conn: PoolConnection, citizenId: string): Promise<void> => {
  await conn.execute(
    `
      INSERT INTO emp_licenses (citizen_id, license_name, license_no, valid_from, valid_until, status, synced_at)
      SELECT l.citizen_id,
             l.license_name,
             l.license_no,
             l.valid_from,
             CAST(l.valid_until AS DATE),
             l.status,
             NOW()
      FROM vw_hrms_licenses l
      WHERE ${citizenIdWhereBinary('l', '?')}
      ON DUPLICATE KEY UPDATE
        license_name=VALUES(license_name),
        valid_from=VALUES(valid_from),
        valid_until=VALUES(valid_until),
        status=VALUES(status),
        synced_at=NOW()
    `,
    [citizenId],
  );
};

const syncSingleQuotas = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
): Promise<void> => {
  const [viewQuotas] = await conn.query<RowDataPacket[]>(
    `
      SELECT q.citizen_id, q.fiscal_year, q.total_quota
      FROM vw_hrms_leave_quotas q
      WHERE ${citizenIdWhereBinary('q', '?')}
    `,
    [citizenId],
  );
  for (const q of viewQuotas) {
    await upsertLeaveQuota(conn, q.citizen_id, q.fiscal_year, q.total_quota);
    stats.quotas.upserted++;
  }
};

const syncSingleLeaves = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
): Promise<void> => {
  const hasStatusColumn = await hasLeaveStatusColumn(conn);
  const leaveSqlOptions: LeaveRecordSqlOptions = { hasStatusColumn };
  const { sql: leaveSql } = buildLeaveRecordSql(leaveSqlOptions);

  const [viewLeaves] = await conn.query<RowDataPacket[]>(
    `SELECT ${selectColumns('lr', VIEW_LEAVE_COLUMNS)}
     FROM vw_hrms_leave_requests lr
     WHERE ${citizenIdWhereBinary('lr', '?')}`,
    [citizenId],
  );

  for (const vLeave of viewLeaves) {
    if (!vLeave.ref_id) continue;
    const leaveValues = buildLeaveRecordValues(vLeave, leaveSqlOptions);
    await conn.execute(leaveSql, leaveValues);
    stats.leaves.upserted++;
  }
};

const syncSingleMovements = async (conn: PoolConnection, citizenId: string): Promise<void> => {
  await conn.execute(
    `
      INSERT INTO emp_movements (citizen_id, movement_type, effective_date, remark, synced_at)
      SELECT ${citizenIdSelectUtf8('m')} AS citizen_id,
             CASE
               WHEN CAST(m.movement_type AS BINARY) = CAST('UNKNOWN' AS BINARY)
                 THEN 'OTHER'
               ELSE m.movement_type
             END,
             m.effective_date,
             m.remark,
             NOW()
      FROM vw_hrms_movements m
      WHERE ${citizenIdWhereBinary('m', '?')}
      ON DUPLICATE KEY UPDATE
        movement_type = VALUES(movement_type),
        effective_date = VALUES(effective_date),
        remark = VALUES(remark),
        synced_at = NOW()
    `,
    [citizenId],
  );
  await applyImmediateMovementEligibilityCutoff(new Date(), conn);
};

const assignRoleForSingleUser = async (
  conn: PoolConnection,
  dbUser: RowDataPacket,
  citizenId: string,
  stats: SyncStats,
): Promise<void> => {
  try {
    const [hrRows] = await conn.query<RowDataPacket[]>(
      `
        SELECT citizen_id, position_name, special_position, department, sub_department
        FROM emp_profiles WHERE ${citizenIdWhereBinary('emp_profiles', '?')}
        UNION ALL
        SELECT citizen_id, position_name, special_position, department, NULL AS sub_department
        FROM emp_support_staff WHERE ${citizenIdWhereBinary('emp_support_staff', '?')}
        LIMIT 1
      `,
      [citizenId, citizenId],
    );
    const hrRow = hrRows[0] as any;
    if (!hrRow) {
      stats.roles.missing++;
      return;
    }
    const currentRole = dbUser.role as string;
    if (RoleAssignmentService.PROTECTED_ROLES.has(currentRole)) {
      stats.roles.skipped++;
      return;
    }
    const nextRole = RoleAssignmentService.deriveRole(hrRow);
    if (nextRole === currentRole) {
      stats.roles.skipped++;
      return;
    }
    await conn.execute(
      `UPDATE users
       SET role = ?, updated_at = NOW()
       WHERE ${citizenIdWhereBinary('users', '?')}`,
      [nextRole, citizenId],
    );
    clearScopeCache(dbUser.id as number);
    stats.roles.updated++;
  } catch (roleError) {
    console.warn('[SyncService] Single role assignment failed:', roleError);
  }
};

export class SyncService {
  /**
   * Return cached status (fast path for dashboards).
   */
  static async getLastSyncStatus(): Promise<SyncRuntimeStatus> {
    return getSyncStatusFromCache();
  }

  /**
   * Run the full smart sync workflow with distributed lock + status caching.
   */
  static async performFullSync() {
    console.log('[SyncService] Requesting synchronization...');

    const lockValue = createSyncLockValue();
    const locked = await acquireSyncLock(lockValue);
    if (!locked) {
      console.warn('[SyncService] Synchronization aborted: already in progress.');
      throw new Error('Synchronization is already in progress. Please wait.');
    }
    const lockHeartbeat = startSyncLockHeartbeat(lockValue);

    const startTotal = Date.now();
    const stats = createSyncStats();

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const userIdMap = await getUserIdMap(conn);
      await syncEmployees(conn, stats, userIdMap, {
        viewEmployeeColumns: VIEW_EMPLOYEE_COLUMNS,
        isChanged,
        upsertEmployeeProfile,
        clearScopeCache,
      });
      await syncSupportEmployees(conn, stats, userIdMap, {
        viewSupportColumns: VIEW_SUPPORT_COLUMNS,
        isChanged,
        hasSupportLevelColumn,
        buildSupportEmployeeSql,
        buildSupportEmployeeValues,
        clearScopeCache,
      });
      await syncUsersFromProfilesAndSupport(
        conn,
        stats,
        {
          deriveUserIsActive,
          protectedRoles: RoleAssignmentService.PROTECTED_ROLES,
        },
      );
      await syncSignatures(conn, stats);
      await syncLicensesAndQuotas(conn, stats);
      await syncLeaves(conn, stats);
      await syncMovements(conn, stats);
      await syncSpecialPositionScopes(conn);

      await conn.commit();

      // 7. Assign roles based on HR data (after commit)
      console.log('[SyncService] Assigning roles based on HR data...');
      try {
        const roleResult = await assignRoles();
        stats.roles = roleResult;
        console.log(
          `[SyncService] Role assignment: ${roleResult.updated} updated, ${roleResult.skipped} skipped`,
        );
      } catch (roleError) {
        console.warn(
          '[SyncService] Role assignment failed (non-fatal):',
          roleError instanceof Error ? roleError.message : roleError,
        );
        // We do not throw here to allow the overall sync to maintain "success" state
        // since the data sync part (users, employees, etc.) was successfully committed.
      }

      const duration = ((Date.now() - startTotal) / 1000).toFixed(2);
      const resultData = {
        success: true,
        duration,
        stats,
        timestamp: new Date().toISOString(),
      };

      console.log(`[SyncService] Synchronization completed in ${duration}s`);

      await setLastSyncResult(resultData);

      return resultData;
    } catch (error) {
      await conn.rollback();
      console.error('[SyncService] Synchronization failed:', error);
      throw error;
    } finally {
      clearInterval(lockHeartbeat);
      await releaseSyncLock(lockValue);
      conn.release();
    }
  }

  /**
   * Sync a single user by userId (granular sync).
   */
  static async performUserSync(userId: number) {
    const conn = await db.getConnection();
    try {
      const [userRows] = await conn.query<RowDataPacket[]>(
        'SELECT id, citizen_id, role FROM users WHERE id = ? LIMIT 1',
        [userId],
      );
      const dbUser = userRows[0];
      if (!dbUser?.citizen_id) {
        throw new Error('User not found for sync');
      }

      const citizenId = dbUser.citizen_id as string;
      const stats = createSyncStats();

      await conn.beginTransaction();

      const userIdMap = new Map<string, number>([[citizenId, dbUser.id as number]]);
      await upsertSingleEmployeeProfile(conn, citizenId, userIdMap, stats, {
        viewEmployeeColumns: VIEW_EMPLOYEE_COLUMNS,
        citizenIdWhereBinary,
        upsertEmployeeProfile,
        clearScopeCache,
      });
      await upsertSingleSupportEmployee(conn, citizenId, stats, {
        viewSupportColumns: VIEW_SUPPORT_COLUMNS,
        citizenIdWhereBinary,
        hasSupportLevelColumn,
        buildSupportEmployeeSql,
        buildSupportEmployeeValues,
      });
      await syncUsersFromProfilesAndSupport(
        conn,
        stats,
        {
          deriveUserIsActive,
          protectedRoles: RoleAssignmentService.PROTECTED_ROLES,
        },
        { citizenId },
      );
      await syncSingleSignature(conn, citizenId, stats);
      await syncSingleLicenses(conn, citizenId);
      await syncSingleQuotas(conn, citizenId, stats);
      await syncSingleLeaves(conn, citizenId, stats);
      await syncSingleMovements(conn, citizenId);
      await syncSpecialPositionScopesForCitizen(conn, citizenId);

      await conn.commit();
      await assignRoleForSingleUser(conn, dbUser, citizenId, stats);

      return {
        success: true,
        stats,
        citizenId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
