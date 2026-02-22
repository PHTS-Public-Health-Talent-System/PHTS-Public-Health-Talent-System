import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { SyncStats } from '@/modules/system/sync/services/sync.types.js';

export const assignRoleForSingleUser = async (
  conn: PoolConnection,
  dbUser: RowDataPacket,
  citizenId: string,
  stats: SyncStats,
  deps: {
    citizenIdWhereBinary: (alias: string, placeholder: string) => string;
    roleAssignmentService: {
      PROTECTED_ROLES: Set<string>;
      deriveRole: (hrRow: unknown) => string;
    };
    clearScopeCache: (userId: number) => void;
  },
): Promise<void> => {
  try {
    const [hrRows] = await conn.query<RowDataPacket[]>(
      `
        SELECT citizen_id, position_name, special_position, department, sub_department
        FROM emp_profiles WHERE ${deps.citizenIdWhereBinary('emp_profiles', '?')}
        UNION ALL
        SELECT citizen_id, position_name, special_position, department, NULL AS sub_department
        FROM emp_support_staff WHERE ${deps.citizenIdWhereBinary('emp_support_staff', '?')}
        LIMIT 1
      `,
      [citizenId, citizenId],
    );
    const hrRow = hrRows[0] as RowDataPacket | undefined;
    if (!hrRow) {
      stats.roles.missing++;
      return;
    }
    const currentRole = dbUser.role as string;
    if (deps.roleAssignmentService.PROTECTED_ROLES.has(currentRole)) {
      stats.roles.skipped++;
      return;
    }
    const nextRole = deps.roleAssignmentService.deriveRole(hrRow);
    if (nextRole === currentRole) {
      stats.roles.skipped++;
      return;
    }
    await conn.execute(
      `UPDATE users
       SET role = ?, updated_at = NOW()
       WHERE ${deps.citizenIdWhereBinary('users', '?')}`,
      [nextRole, citizenId],
    );
    deps.clearScopeCache(dbUser.id as number);
    stats.roles.updated++;
  } catch (roleError) {
    console.warn('[SyncService] Single role assignment failed:', roleError);
  }
};
