import { describe, expect, it } from "vitest"
import {
  buildScopeOptions,
  formatRequesterName,
  isSignatureReadyForApproval,
} from "../approver-utils"

describe("approver-utils", () => {
  it("builds scope options with ALL at top", () => {
    const input = [
      { value: "หอผู้ป่วยพิเศษ", label: "หอผู้ป่วยพิเศษ", type: "UNIT" as const },
      { value: "กลุ่มงานอายุรกรรม", label: "กลุ่มงานอายุรกรรม", type: "DEPT" as const },
    ]

    const options = buildScopeOptions(input)

    expect(options[0]).toEqual({ value: "ALL", label: "ทั้งหมด" })
    expect(options).toHaveLength(3)
    expect(options[1].value).toBe("หอผู้ป่วยพิเศษ")
  })

  it("formats requester name with fallbacks", () => {
    expect(formatRequesterName({ first_name: "สมศรี", last_name: "ใจดี" })).toBe("สมศรี ใจดี")
    expect(formatRequesterName({ first_name: "สมศรี", last_name: "" })).toBe("สมศรี")
    expect(formatRequesterName({ first_name: "", last_name: "" })).toBe("-")
  })

  it("validates signature readiness for approval", () => {
    expect(isSignatureReadyForApproval("SAVED", true, false)).toBe(true)
    expect(isSignatureReadyForApproval("SAVED", false, false)).toBe(false)
    expect(isSignatureReadyForApproval("NEW", false, true)).toBe(true)
    expect(isSignatureReadyForApproval("NEW", true, false)).toBe(false)
  })
})
