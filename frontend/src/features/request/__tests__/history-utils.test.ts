import { describe, expect, it } from "vitest"
import type { RequestWithDetails } from "@/types/request.types"
import { sortRequestsByCreatedAtDesc } from "../history-utils"

describe("history-utils", () => {
  it("sorts requests by created_at desc", () => {
    const items = [
      { request_id: 1, created_at: "2025-01-01T00:00:00.000Z" },
      { request_id: 2, created_at: "2025-01-03T00:00:00.000Z" },
      { request_id: 3, created_at: "2025-01-02T00:00:00.000Z" },
    ] as RequestWithDetails[]

    const sorted = sortRequestsByCreatedAtDesc(items)

    expect(sorted.map((i) => i.request_id)).toEqual([2, 3, 1])
  })
})
