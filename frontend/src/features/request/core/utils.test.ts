import { describe, expect, it } from "vitest";
import { getOnBehalfMetadata } from "@/features/request/core/utils";

describe("getOnBehalfMetadata", () => {
  it("returns officer-created metadata when submission data marks on behalf flow", () => {
    expect(
      getOnBehalfMetadata({
        created_by_officer_id: 46941,
        created_by_officer_role: "PTS_OFFICER",
        created_mode: "OFFICER_ON_BEHALF",
      }),
    ).toEqual({
      createdByOfficerId: 46941,
      createdByOfficerRole: "PTS_OFFICER",
      isOfficerCreated: true,
    });
  });

  it("returns non officer-created when submission data has no on behalf marker", () => {
    expect(
      getOnBehalfMetadata({
        title: "นางสาว",
      }),
    ).toEqual({
      createdByOfficerId: null,
      createdByOfficerRole: null,
      isOfficerCreated: false,
    });
  });
});
