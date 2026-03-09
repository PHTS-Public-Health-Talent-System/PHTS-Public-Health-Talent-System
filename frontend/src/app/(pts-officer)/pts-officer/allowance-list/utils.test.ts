import { describe, expect, it } from "vitest"

import type { EligibilityRecord } from "@/features/request"
import { formatRateItemLabel, mapEligibility } from "./utils"

describe("formatRateItemLabel", () => {
  it("returns the full sub item when the database already sends a complete path", () => {
    expect(formatRateItemLabel("3.1", "3.1.3")).toBe("3.1.3")
  })

  it("appends the trailing segment when the database sends only the suffix", () => {
    expect(formatRateItemLabel("3.1", "3")).toBe("3.1.3")
  })

  it("falls back to the item number when no sub item exists", () => {
    expect(formatRateItemLabel("2.1", null)).toBe("2.1")
  })
})

describe("mapEligibility", () => {
  it("normalizes the displayed rate item for allowance list rows", () => {
    const row: EligibilityRecord = {
      eligibility_id: 1,
      user_id: 10,
      master_rate_id: 100,
      request_id: 200,
      effective_date: "2026-01-01",
      title: "นางสาว",
      first_name: "นันทน์ฐณัฐ",
      last_name: "กุลชนกวิน",
      position_name: "พยาบาลวิชาชีพ",
      profession_code: "NURSE",
      latest_license_valid_until: "2025-08-30",
      group_no: 3,
      item_no: "3.1",
      sub_item_no: "3.1.3",
      rate_amount: 2000,
    }
    const person = mapEligibility(row)

    expect(person.rateItem).toBe("3.1.3")
  })
})
