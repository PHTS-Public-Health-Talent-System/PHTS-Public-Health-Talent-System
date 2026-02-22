import type { SyncStats } from '@/modules/system/sync/services/sync.types.js';

export const createSyncStats = (): SyncStats => ({
  users: { added: 0, updated: 0, skipped: 0 },
  employees: { upserted: 0, skipped: 0 },
  support_employees: { upserted: 0, skipped: 0 },
  signatures: { added: 0, skipped: 0 },
  licenses: { upserted: 0 },
  quotas: { upserted: 0 },
  leaves: { upserted: 0, skipped: 0 },
  movements: { added: 0 },
  roles: { updated: 0, skipped: 0, missing: 0 },
});
