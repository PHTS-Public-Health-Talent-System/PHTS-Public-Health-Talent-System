import { describe, expect, it } from "vitest";
import {
  canEditPeriod,
  getPeriodStatusLabel,
  toPeriodLabel,
} from "@/features/payroll/period-utils";

describe("payroll period utils", () => {
  it("maps status to thai label", () => {
    expect(getPeriodStatusLabel("OPEN")).toBe("เปิดงวด");
    expect(getPeriodStatusLabel("WAITING_HR")).toBe("รอหัวหน้า HR");
    expect(getPeriodStatusLabel("WAITING_HEAD_FINANCE")).toBe("รอหัวหน้าการเงิน");
    expect(getPeriodStatusLabel("WAITING_DIRECTOR")).toBe("รอผอ.");
    expect(getPeriodStatusLabel("CLOSED")).toBe("ปิดงวด");
  });

  it("returns fallback for unknown status", () => {
    expect(getPeriodStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });

  it("allows edit only when open", () => {
    expect(canEditPeriod("OPEN")).toBe(true);
    expect(canEditPeriod("WAITING_HR")).toBe(false);
  });

  it("builds period label", () => {
    expect(toPeriodLabel({ period_month: 1, period_year: 2024 })).toBe("01/2024");
  });
});
