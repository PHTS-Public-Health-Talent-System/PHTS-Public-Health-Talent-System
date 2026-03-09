import { describe, expect, it } from "vitest";
import {
  getDefaultHistoryActionMode,
  matchesHistoryActionFilter,
  type HistoryActionFilter,
} from "@/features/head-approval/history.utils";

describe("history.utils", () => {
  it("defaults PTS officer history to all actions", () => {
    expect(getDefaultHistoryActionMode("PTS_OFFICER")).toBe("all");
    expect(getDefaultHistoryActionMode("HEAD_HR")).toBe("important");
  });

  it("matches on-behalf filter only for officer-created requests", () => {
    const onBehalfRow = {
      lastActionType: "SUBMIT" as const,
      isOfficerCreated: true,
    };
    const normalRow = {
      lastActionType: "APPROVE" as const,
      isOfficerCreated: false,
    };

    expect(matchesHistoryActionFilter(onBehalfRow, "ON_BEHALF")).toBe(true);
    expect(matchesHistoryActionFilter(normalRow, "ON_BEHALF")).toBe(false);
    expect(matchesHistoryActionFilter(normalRow, "all")).toBe(true);
    expect(matchesHistoryActionFilter(normalRow, "APPROVE")).toBe(true);
    expect(matchesHistoryActionFilter(onBehalfRow, "APPROVE" satisfies HistoryActionFilter)).toBe(false);
  });
});
