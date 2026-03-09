import { describe, expect, it } from "vitest";

import {
  getOcrFieldEntries,
  getOcrFallbackReasonLabel,
  getOcrFieldLabel,
  getOcrDocumentKindLabel,
  getOcrEngineLabel,
  getOcrQualitySummaryText,
} from "./requestDetail.ocrMeta";

describe("requestDetail.ocrMeta", () => {
  it("maps OCR engine labels to Thai", () => {
    expect(getOcrEngineLabel("tesseract")).toBe("Tesseract");
    expect(getOcrEngineLabel("typhoon")).toBe("Typhoon OCR");
    expect(getOcrEngineLabel("auto")).toBe("เลือกอัตโนมัติ");
  });

  it("maps OCR document kind labels to Thai", () => {
    expect(getOcrDocumentKindLabel("memo")).toBe("หนังสือนำส่ง");
    expect(getOcrDocumentKindLabel("assignment_order")).toBe(
      "คำสั่งมอบหมายงาน",
    );
    expect(getOcrDocumentKindLabel("license")).toBe("ใบอนุญาต");
    expect(getOcrDocumentKindLabel("general")).toBe("เอกสารทั่วไป");
  });

  it("maps OCR field labels and quality summary to Thai", () => {
    expect(getOcrFieldLabel("document_no")).toBe("เลขที่หนังสือ");
    expect(getOcrFieldLabel("section_title")).toBe("หัวข้องาน");
    expect(getOcrFieldLabel("unknown_field")).toBe("unknown_field");
    expect(
      getOcrQualitySummaryText({
        required_fields: 4,
        captured_fields: 2,
        passed: false,
      }),
    ).toBe("พบข้อมูลสำคัญ 2 จาก 4 รายการ");
    expect(getOcrFallbackReasonLabel("missing_required_fields")).toBe(
      "ข้อมูลสำคัญยังไม่ครบ",
    );
  });

  it("returns displayable OCR field entries", () => {
    expect(
      getOcrFieldEntries({
        document_no: "อต 0033.104/000953",
        subject: "ขอส่งสำเนาใบอนุญาต",
        empty: "",
      }),
    ).toEqual([
      ["เลขที่หนังสือ", "อต 0033.104/000953"],
      ["เรื่อง", "ขอส่งสำเนาใบอนุญาต"],
    ]);
  });
});
