import { describe, expect, it } from "vitest"
import { buildReturnReportSummary } from "./returnReportSummary"

describe("buildReturnReportSummary", () => {
  it("marks as DONE with latest report date when latest event is final return", () => {
    const result = buildReturnReportSummary([
      { report_date: "2026-01-05", resume_date: "2026-01-20", resume_study_program: "B" },
      { report_date: "2026-01-10" },
    ])

    expect(result.return_report_status).toBe("DONE")
    expect(result.return_date).toBe("2026-01-10")
  })

  it("keeps PENDING when latest event is resume study", () => {
    const result = buildReturnReportSummary([
      { report_date: "2026-01-05" },
      { report_date: "2026-01-10", resume_date: "2026-01-20", resume_study_program: "B" },
    ])

    expect(result.return_report_status).toBe("PENDING")
    expect(result.return_date).toBeUndefined()
  })

  it("marks as PENDING and clears return_date when no events", () => {
    const result = buildReturnReportSummary([])

    expect(result.return_report_status).toBe("PENDING")
    expect(result.return_date).toBeUndefined()
  })
})
