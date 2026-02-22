import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

export const buildScopesFromSpecialPosition = (
  specialPosition: string | null,
  deps: {
    parseSpecialPositionScopes: (specialPosition: string) => string[];
    removeOverlaps: (wardScopes: string[], deptScopes: string[]) => string[];
    inferScopeType: (scopeName: string) => 'UNIT' | 'DEPT' | 'IGNORE' | 'UNKNOWN';
  },
) => {
  if (!specialPosition) return { wardScopes: [], deptScopes: [] };
  const allScopes = deps.parseSpecialPositionScopes(specialPosition);
  const wardScopes: string[] = [];
  const deptScopes: string[] = [];

  const normalizeScopeName = (scope: string): string => {
    const parts = scope.split('-');
    return parts.length > 1 ? parts.slice(1).join('-').trim() : scope.trim();
  };

  const addScope = (target: string[], scopeName: string): void => {
    if (!scopeName || deps.inferScopeType(scopeName) === 'IGNORE') return;
    target.push(scopeName);
  };

  for (const scope of allScopes) {
    if (scope.includes('ตำแหน่งด้านบริหาร')) continue;
    const isHeadWard = scope.includes('หัวหน้าตึก') || scope.includes('หัวหน้างาน-');
    const isHeadDept = scope.includes('หัวหน้ากลุ่มงาน') || scope.includes('หัวหน้ากลุ่มภารกิจ');
    const scopeName = normalizeScopeName(scope);

    if (isHeadWard) {
      addScope(wardScopes, scopeName);
      if (deps.inferScopeType(scopeName) === 'DEPT') addScope(deptScopes, scopeName);
      continue;
    }

    if (isHeadDept) {
      addScope(deptScopes, scopeName);
      continue;
    }
  }

  const cleanedWardScopes = deps.removeOverlaps(wardScopes, deptScopes);
  const uniqWard = Array.from(new Set(cleanedWardScopes.map((s) => s.trim())));
  const uniqDept = Array.from(new Set(deptScopes.map((s) => s.trim())));
  return { wardScopes: uniqWard, deptScopes: uniqDept };
};

export const syncSpecialPositionScopes = async (
  conn: PoolConnection,
  deps: {
    citizenIdJoinBinary: (leftAlias: string, rightAlias: string) => string;
    isActiveOriginalStatus: (status: string | null) => boolean;
    parseScopes: (specialPosition: string | null) => { wardScopes: string[]; deptScopes: string[] };
    disableScopeMappings: (userId: number, role: string, conn: PoolConnection) => Promise<void>;
    disableScopeMappingsByCitizenId: (
      citizenId: string,
      role: string,
      conn: PoolConnection,
    ) => Promise<void>;
    insertScopeMappings: (
      inputs: Array<{
        user_id?: number;
        citizen_id: string;
        role: string;
        scope_type: 'UNIT' | 'DEPT';
        scope_name: string;
        source: 'AUTO';
      }>,
      conn: PoolConnection,
    ) => Promise<void>;
    clearScopeCache: (userId: number) => void;
  },
): Promise<void> => {
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
      LEFT JOIN emp_profiles e ON ${deps.citizenIdJoinBinary('u', 'e')}
      LEFT JOIN emp_support_staff s ON ${deps.citizenIdJoinBinary('u', 's')}
      WHERE u.role IN ('HEAD_WARD','HEAD_DEPT')
    `,
  );

  for (const row of rows) {
    const citizenId = row.citizen_id as string;
    const role = row.role as string;
    const specialPosition = row.special_position as string | null;
    const originalStatus = row.original_status as string | null;
    const supportActive = row.support_active as number | null;

    const isActive = deps.isActiveOriginalStatus(originalStatus) || Number(supportActive) === 1;

    if (!isActive) {
      if (row.user_id) {
        await deps.disableScopeMappings(row.user_id as number, role, conn);
      } else {
        await deps.disableScopeMappingsByCitizenId(citizenId, role, conn);
      }
      continue;
    }

    const scopes = deps.parseScopes(specialPosition);

    if (row.user_id) {
      await deps.disableScopeMappings(row.user_id as number, role, conn);
    } else {
      await deps.disableScopeMappingsByCitizenId(citizenId, role, conn);
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

    await deps.insertScopeMappings(inputs, conn);

    const userId = row.user_id as number;
    if (userId) {
      deps.clearScopeCache(userId);
    }
  }
};

export const syncSpecialPositionScopesForCitizen = async (
  conn: PoolConnection,
  citizenId: string,
  deps: {
    citizenIdJoinBinary: (leftAlias: string, rightAlias: string) => string;
    isActiveOriginalStatus: (status: string | null) => boolean;
    parseScopes: (specialPosition: string | null) => { wardScopes: string[]; deptScopes: string[] };
    disableScopeMappings: (userId: number, role: string, conn: PoolConnection) => Promise<void>;
    disableScopeMappingsByCitizenId: (
      citizenId: string,
      role: string,
      conn: PoolConnection,
    ) => Promise<void>;
    insertScopeMappings: (
      inputs: Array<{
        user_id?: number;
        citizen_id: string;
        role: string;
        scope_type: 'UNIT' | 'DEPT';
        scope_name: string;
        source: 'AUTO';
      }>,
      conn: PoolConnection,
    ) => Promise<void>;
    clearScopeCache: (userId: number) => void;
  },
): Promise<void> => {
  const [rows] = await conn.query<RowDataPacket[]>(
    `
      SELECT u.id AS user_id,
             u.citizen_id,
             u.role,
             e.special_position,
             e.original_status,
             s.is_currently_active AS support_active
      FROM users u
      LEFT JOIN emp_profiles e ON ${deps.citizenIdJoinBinary('u', 'e')}
      LEFT JOIN emp_support_staff s ON ${deps.citizenIdJoinBinary('u', 's')}
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

  const isActive = deps.isActiveOriginalStatus(originalStatus) || Number(supportActive) === 1;

  if (!isActive) {
    if (row.user_id) {
      await deps.disableScopeMappings(row.user_id as number, role, conn);
    } else {
      await deps.disableScopeMappingsByCitizenId(citizenId, role, conn);
    }
    return;
  }

  const scopes = deps.parseScopes(specialPosition);

  if (row.user_id) {
    await deps.disableScopeMappings(row.user_id as number, role, conn);
  } else {
    await deps.disableScopeMappingsByCitizenId(citizenId, role, conn);
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

  await deps.insertScopeMappings(inputs, conn);

  const userId = row.user_id as number;
  if (userId) {
    deps.clearScopeCache(userId);
  }
};
