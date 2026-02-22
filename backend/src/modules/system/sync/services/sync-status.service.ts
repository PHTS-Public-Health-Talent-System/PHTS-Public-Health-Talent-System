import { SyncService } from "@/modules/system/sync/services/sync.service.js";
import type { SyncRuntimeStatus } from "@/modules/system/sync/services/sync.types.js";

export const getSyncRuntimeStatus = async (): Promise<SyncRuntimeStatus> => {
  return SyncService.getLastSyncStatus();
};
