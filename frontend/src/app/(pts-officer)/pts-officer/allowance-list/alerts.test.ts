import { describe, expect, it } from "vitest";
import { buildAllowanceAlerts } from "./alerts";

describe("buildAllowanceAlerts", () => {
  it("shows expired warning from latest license status even when eligibility expiry is absent", () => {
    const alerts = buildAllowanceAlerts(
      {
        latest_license_status: "EXPIRED",
        latest_license_valid_until: "2025-07-19",
        original_status: "ปฏิบัติงาน (ตรง จ.)",
      },
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(alerts[0]?.title).toBe("ใบอนุญาตไม่พร้อมใช้งาน");
    expect(alerts[0]?.severity).toBe("error");
  });

  it("shows missing license as error", () => {
    const alerts = buildAllowanceAlerts(
      {
        latest_license_status: null,
        latest_license_valid_until: null,
      },
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(alerts[0]?.title).toBe("ไม่มีข้อมูลใบอนุญาต");
    expect(alerts[0]?.severity).toBe("error");
  });

  it("can detect no-license alert explicitly", () => {
    const alerts = buildAllowanceAlerts(
      {
        latest_license_status: null,
        latest_license_valid_until: null,
        active_eligibility_count: 1,
      },
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(alerts.some((alert) => alert.title === "ไม่มีข้อมูลใบอนุญาต")).toBe(true);
  });

  it("shows duplicate active eligibility as an error", () => {
    const alerts = buildAllowanceAlerts(
      {
        latest_license_status: "ACTIVE",
        latest_license_valid_until: "2027-01-01",
        active_eligibility_count: 2,
      },
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(alerts.some((alert) => alert.title === "พบสิทธิซ้ำ")).toBe(true);
    expect(alerts.find((alert) => alert.title === "พบสิทธิซ้ำ")?.severity).toBe("error");
  });

  it("shows upcoming personnel change as a warning", () => {
    const alerts = buildAllowanceAlerts(
      {
        latest_license_status: "ACTIVE",
        latest_license_valid_until: "2027-01-01",
        upcoming_change_type: "RESIGN",
        upcoming_change_effective_date: "2026-02-01",
      },
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(alerts.some((alert) => alert.title === "มีการเปลี่ยนสถานะใกล้ถึงกำหนด")).toBe(true);
    expect(alerts.find((alert) => alert.title === "มีการเปลี่ยนสถานะใกล้ถึงกำหนด")?.severity).toBe("warning");
  });
});
