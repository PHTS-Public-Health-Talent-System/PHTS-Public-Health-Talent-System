import { SyncService } from "@/modules/sync/services/sync.service.js";

export const getSyncRuntimeStatus = async () => {
  return SyncService.getLastSyncStatus();
};
