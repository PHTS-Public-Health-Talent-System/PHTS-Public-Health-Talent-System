import { describe, expect, it } from "vitest"
import { buildReturnReportSummary } from "./returnReportSummary"

describe("buildReturnReportSummary", () => {
  it("marks as DONE with latest report date when events exist", () => {
    const result = buildReturnReportSummary([
      { report_date: "2026-01-10" },
      { report_date: "2026-01-05" },
    ])

    expect(result.return_report_status).toBe("DONE")
    expect(result.return_date).toBe("2026-01-10")
  })

  it("marks as PENDING and clears return_date when no events", () => {
    const result = buildReturnReportSummary([])

    expect(result.return_report_status).toBe("PENDING")
    expect(result.return_date).toBeUndefined()
  })
})
