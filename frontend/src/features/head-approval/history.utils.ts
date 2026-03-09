import type { ApprovalAction } from "@/types/request.types";

export type HistoryActionMode = "important" | "all";
export type HistoryActionFilter = "all" | "APPROVE" | "REJECT" | "RETURN" | "ON_BEHALF";

export const getDefaultHistoryActionMode = (roleKey: string): HistoryActionMode =>
  roleKey === "PTS_OFFICER" ? "all" : "important";

export const matchesHistoryActionFilter = (
  row: {
    lastActionType: ApprovalAction["action"] | "-";
    isOfficerCreated: boolean;
  },
  filter: HistoryActionFilter,
) => {
  if (filter === "all") return true;
  if (filter === "ON_BEHALF") return row.isOfficerCreated;
  return row.lastActionType === filter;
};
