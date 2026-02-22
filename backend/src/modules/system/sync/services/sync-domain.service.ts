import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { SyncStats } from '@/modules/system/sync/services/sync.types.js';

type LeaveRecordSqlOptions = {
  hasStatusColumn: boolean;
};

export const syncSignatures = async (
  conn: PoolConnection,
  stats: SyncStats,
  deps: {
    buildSignaturesViewQuery: () => string;
  },
): Promise<void> => {
  console.log('[SyncService] Processing signatures...');
  const [existingSigs] = await conn.query<RowDataPacket[]>('SELECT citizen_id FROM sig_images');
  const sigSet = new Set(existingSigs.map((s) => s.citizen_id));

  const [viewSigs] = await conn.query<RowDataPacket[]>(deps.buildSignaturesViewQuery());

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

export const syncLicensesAndQuotas = async (
  conn: PoolConnection,
  stats: SyncStats,
  deps: {
    buildLicensesViewQuery: () => string;
    buildQuotasViewQuery: () => string;
    upsertLeaveQuota: (
      conn: PoolConnection,
      citizenId: string,
      fiscalYear: unknown,
      totalQuota: unknown,
    ) => Promise<void>;
  },
): Promise<void> => {
  console.log('[SyncService] Processing licenses and quotas...');
  await conn.query(deps.buildLicensesViewQuery());

  const [viewQuotas] = await conn.query<RowDataPacket[]>(deps.buildQuotasViewQuery());
  for (const q of viewQuotas) {
    await deps.upsertLeaveQuota(conn, q.citizen_id, q.fiscal_year, q.total_quota);
    stats.quotas.upserted++;
  }
};

export const syncLeaves = async (
  conn: PoolConnection,
  stats: SyncStats,
  deps: {
    hasLeaveStatusColumn: (conn: PoolConnection) => Promise<boolean>;
    buildLeaveRecordSql: (options: LeaveRecordSqlOptions) => { sql: string; fields: string[] };
    buildLeaveRecordValues: (vLeave: RowDataPacket, options: LeaveRecordSqlOptions) => unknown[];
    buildLeaveViewQuery: () => string;
    isChanged: (oldVal: unknown, newVal: unknown) => boolean;
  },
): Promise<void> => {
  console.log('[SyncService] Processing leave requests...');
  const hasStatusColumn = await deps.hasLeaveStatusColumn(conn);

  const sqlOptions: LeaveRecordSqlOptions = { hasStatusColumn };
  const { sql } = deps.buildLeaveRecordSql(sqlOptions);

  const existingFields = ['ref_id', 'start_date', 'end_date'];
  if (hasStatusColumn) existingFields.push('status');
  const existingSelect = `SELECT ${existingFields.join(', ')} FROM leave_records WHERE ref_id IS NOT NULL`;

  const [existingLeaves] = await conn.query<RowDataPacket[]>(existingSelect);
  const leaveMap = new Map(existingLeaves.map((l) => [l.ref_id, l]));

  const [viewLeaves] = await conn.query<RowDataPacket[]>(deps.buildLeaveViewQuery());

  for (const vLeave of viewLeaves) {
    if (!vLeave.ref_id) continue;
    const dbLeave = leaveMap.get(vLeave.ref_id);

    if (dbLeave) {
      const dateChanged =
        deps.isChanged(dbLeave.start_date, vLeave.start_date) ||
        deps.isChanged(dbLeave.end_date, vLeave.end_date);
      const statusChanged = hasStatusColumn ? deps.isChanged(dbLeave.status, vLeave.status) : false;
      if (!dateChanged && !statusChanged) {
        stats.leaves.skipped++;
        continue;
      }
    }

    const values = deps.buildLeaveRecordValues(vLeave, sqlOptions);
    await conn.execute(sql, values);
    stats.leaves.upserted++;
  }
};

export const syncMovements = async (
  conn: PoolConnection,
  deps: {
    buildMovementsViewQuery: () => string;
    applyImmediateMovementEligibilityCutoff: (date: Date, conn: PoolConnection) => Promise<unknown>;
  },
): Promise<void> => {
  console.log('[SyncService] Processing movements...');
  await conn.query(deps.buildMovementsViewQuery());
  await deps.applyImmediateMovementEligibilityCutoff(new Date(), conn);
};

export const syncSingleSignature = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
  deps: {
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
  },
): Promise<void> => {
  const [viewSigs] = await conn.query<RowDataPacket[]>(
    `
      SELECT s.citizen_id, s.signature_blob
      FROM vw_hrms_signatures s
      WHERE ${deps.citizenIdWhereBinary('s', '?')}
    `,
    [citizenId],
  );
  const vSig = viewSigs[0];
  if (!vSig) return;
  const [existingSigs] = await conn.query<RowDataPacket[]>(
    `SELECT citizen_id FROM sig_images WHERE ${deps.citizenIdWhereBinary('sig_images', '?')}`,
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

export const syncSingleLicenses = async (
  conn: PoolConnection,
  citizenId: string,
  deps: {
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
  },
): Promise<void> => {
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
      WHERE ${deps.citizenIdWhereBinary('l', '?')}
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

export const syncSingleQuotas = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
  deps: {
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
    upsertLeaveQuota: (
      conn: PoolConnection,
      citizenId: string,
      fiscalYear: unknown,
      totalQuota: unknown,
    ) => Promise<void>;
  },
): Promise<void> => {
  const [viewQuotas] = await conn.query<RowDataPacket[]>(
    `
      SELECT q.citizen_id, q.fiscal_year, q.total_quota
      FROM vw_hrms_leave_quotas q
      WHERE ${deps.citizenIdWhereBinary('q', '?')}
    `,
    [citizenId],
  );
  for (const q of viewQuotas) {
    await deps.upsertLeaveQuota(conn, q.citizen_id, q.fiscal_year, q.total_quota);
    stats.quotas.upserted++;
  }
};

export const syncSingleLeaves = async (
  conn: PoolConnection,
  citizenId: string,
  stats: SyncStats,
  deps: {
    hasLeaveStatusColumn: (conn: PoolConnection) => Promise<boolean>;
    buildLeaveRecordSql: (options: LeaveRecordSqlOptions) => { sql: string; fields: string[] };
    buildLeaveRecordValues: (vLeave: RowDataPacket, options: LeaveRecordSqlOptions) => unknown[];
    selectColumns: (alias: string, columns: readonly string[]) => string;
    viewLeaveColumns: readonly string[];
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
  },
): Promise<void> => {
  const hasStatusColumn = await deps.hasLeaveStatusColumn(conn);
  const leaveSqlOptions: LeaveRecordSqlOptions = { hasStatusColumn };
  const { sql: leaveSql } = deps.buildLeaveRecordSql(leaveSqlOptions);

  const [viewLeaves] = await conn.query<RowDataPacket[]>(
    `SELECT ${deps.selectColumns('lr', deps.viewLeaveColumns)}
     FROM vw_hrms_leave_requests lr
     WHERE ${deps.citizenIdWhereBinary('lr', '?')}`,
    [citizenId],
  );

  for (const vLeave of viewLeaves) {
    if (!vLeave.ref_id) continue;
    const leaveValues = deps.buildLeaveRecordValues(vLeave, leaveSqlOptions);
    await conn.execute(leaveSql, leaveValues);
    stats.leaves.upserted++;
  }
};

export const syncSingleMovements = async (
  conn: PoolConnection,
  citizenId: string,
  deps: {
    citizenIdSelectUtf8: (alias: string) => string;
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
    applyImmediateMovementEligibilityCutoff: (date: Date, conn: PoolConnection) => Promise<unknown>;
  },
): Promise<void> => {
  await conn.execute(
    `
      INSERT INTO emp_movements (citizen_id, movement_type, effective_date, remark, synced_at)
      SELECT ${deps.citizenIdSelectUtf8('m')} AS citizen_id,
             CASE
               WHEN CAST(m.movement_type AS BINARY) = CAST('UNKNOWN' AS BINARY)
                 THEN 'OTHER'
               ELSE m.movement_type
             END,
             m.effective_date,
             m.remark,
             NOW()
      FROM vw_hrms_movements m
      WHERE ${deps.citizenIdWhereBinary('m', '?')}
      ON DUPLICATE KEY UPDATE
        movement_type = VALUES(movement_type),
        effective_date = VALUES(effective_date),
        remark = VALUES(remark),
        synced_at = NOW()
    `,
    [citizenId],
  );
  await deps.applyImmediateMovementEligibilityCutoff(new Date(), conn);
};
