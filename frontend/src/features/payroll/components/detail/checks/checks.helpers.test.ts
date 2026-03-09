import { describe, expect, it } from "vitest"
import { normalizeReturnReportStatus } from "./checks.helpers"

describe("normalizeReturnReportStatus", () => {
  it("returns reported for known done values", () => {
    expect(normalizeReturnReportStatus("DONE")).toBe("reported")
    expect(normalizeReturnReportStatus("reported")).toBe("reported")
    expect(normalizeReturnReportStatus("READY")).toBe("reported")
  })

  it("returns pending for known waiting values", () => {
    expect(normalizeReturnReportStatus("PENDING")).toBe("pending")
    expect(normalizeReturnReportStatus("waiting")).toBe("pending")
  })

  it("returns null for empty and unknown values", () => {
    expect(normalizeReturnReportStatus("")).toBeNull()
    expect(normalizeReturnReportStatus("   ")).toBeNull()
    expect(normalizeReturnReportStatus("UNKNOWN")).toBeNull()
  })
})
