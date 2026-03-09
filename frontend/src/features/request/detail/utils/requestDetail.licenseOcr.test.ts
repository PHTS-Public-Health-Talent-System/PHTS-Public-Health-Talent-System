import { describe, expect, it } from "vitest";

import {
  findLicenseOcrSummary,
  getLicenseOcrNotice,
  shouldSuppressLicenseOcrUi,
} from "./requestDetail.licenseOcr";

describe("requestDetail.licenseOcr", () => {
  it("builds OCR comparison summary for license documents", () => {
    const summary = findLicenseOcrSummary({
      fullName: "นางสาวอัณศยาณัช แดงไฟ",
      licenseNo: "6411314081",
      validUntil: "2026-03-28",
      results: [
        {
          name: "page-2.pdf",
          ok: true,
          document_kind: "license",
          fields: {
            person_name: "นางสาวอัณศยาณัช แดงไฟ",
            license_no: "6411314081",
            license_valid_until: "28 มีนาคม 2569",
          },
        },
      ],
    });

    expect(summary).toEqual({
      fileName: "page-2.pdf",
      reviewCount: 0,
      nearCount: 0,
      summaryStatus: "match",
      checks: [
        {
          label: "ชื่อผู้ถือใบอนุญาต",
          expectedValue: "นางสาวอัณศยาณัช แดงไฟ",
          extractedValue: "นางสาวอัณศยาณัช แดงไฟ",
          status: "match",
        },
        {
          label: "เลขที่ใบอนุญาต",
          expectedValue: "6411314081",
          extractedValue: "6411314081",
          status: "match",
        },
        {
          label: "วันหมดอายุ",
          expectedValue: "28 มีนาคม 2569",
          extractedValue: "28 มีนาคม 2569",
          status: "match",
        },
      ],
    });
  });

  it("falls back to frontend document detection when backend kind is still general", () => {
    const summary = findLicenseOcrSummary({
      fullName: "นางสาวอัณศยาณัช แดงไฟ",
      licenseNo: "6411314081",
      validUntil: "2026-03-28",
      results: [
        {
          name: "page-2.pdf",
          ok: true,
          document_kind: "general",
          markdown:
            "ใบอนุญาตปี ๒๕๑๑๓๑๕๐๕๑ ตออายุตรงที ๑ ใบอนุญาตประกอบวิชาจีตการแยายาลและการผดุงครรภ์ จอกใบอนุญาตธี้ให้แก่",
          fields: {
            person_name: "นางส่าวอัณตยาณัช แดงไฟ",
            license_no: "2511315051",
            license_valid_until:
              "25 มีนาคม 2555",
          },
        },
      ],
    });

    expect(summary?.fileName).toBe("page-2.pdf");
    expect(summary?.summaryStatus).toBe("review");
    expect(summary?.reviewCount).toBe(1);
    expect(summary?.nearCount).toBe(1);
    expect(summary?.checks.map((check) => check.status)).toEqual([
      "match",
      "near",
      "review",
    ]);
    expect(summary?.checks[2]?.extractedValue).toBe("25 มีนาคม 2555");
  });

  it("returns null when no license OCR result is available", () => {
    expect(
      findLicenseOcrSummary({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        licenseNo: "6411314081",
        validUntil: "2026-03-28",
        results: [
          {
            name: "memo.pdf",
            ok: true,
            document_kind: "memo",
            fields: {
              subject: "ขอส่งสำเนาใบอนุญาต",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("prefers the license OCR page with more matched fields", () => {
    const summary = findLicenseOcrSummary({
      fullName: "นางสาวอัณศยาณัช แดงไฟ",
      licenseNo: "6411314081",
      validUntil: "2026-03-28",
      results: [
        {
          name: "page-4.pdf",
          ok: true,
          document_kind: "license",
          fields: {},
        },
        {
          name: "page-2.pdf",
          ok: true,
          document_kind: "license",
          fields: {
            person_name: "นางสาวอัณศยาณัช แดงไฟ",
            license_no: "6411314081",
            license_valid_until: "28 มีนาคม 2569",
          },
        },
      ],
    });

    expect(summary?.fileName).toBe("page-2.pdf");
    expect(summary?.summaryStatus).toBe("match");
    expect(summary?.reviewCount).toBe(0);
    expect(summary?.nearCount).toBe(0);
  });

  it("does not build license OCR summary when OCR could not extract any usable value", () => {
    expect(
      findLicenseOcrSummary({
        fullName: "นางปราณี บำรุงจิต",
        licenseNo: "5411226112",
        validUntil: "2026-03-20",
        results: [
          {
            name: "page-4.pdf",
            ok: true,
            document_kind: "license",
            fields: {},
          },
        ],
      }),
    ).toBeNull();
  });

  it("ignores license OCR pages that clearly belong to another person", () => {
    expect(
      findLicenseOcrSummary({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        licenseNo: "6411314081",
        validUntil: "2026-03-28",
        results: [
          {
            name: "page-3.pdf",
            ok: true,
            document_kind: "license",
            fields: {
              person_name: "นางนิลยา ธรรมสุทธิ์",
              license_no: null,
              license_valid_until: null,
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("returns a clear notice when a license page belongs to another person", () => {
    expect(
      getLicenseOcrNotice({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        result: {
          name: "page-3.pdf",
          ok: true,
          document_kind: "license",
          fields: {
            person_name: "นางนิลยา ธรรมสุทธิ์",
          },
        },
      }),
    ).toBe("ชื่อผู้ถือใบอนุญาตไม่ตรงกับบุคลากรคนนี้");
    expect(
      shouldSuppressLicenseOcrUi({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        result: {
          name: "page-3.pdf",
          ok: true,
          document_kind: "license",
          fields: {
            person_name: "นางนิลยา ธรรมสุทธิ์",
          },
        },
      }),
    ).toBe(true);
  });

  it("returns a clear notice when OCR cannot read the license holder name", () => {
    expect(
      getLicenseOcrNotice({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        result: {
          name: "page-4.pdf",
          ok: true,
          document_kind: "license",
          fields: {},
        },
      }),
    ).toBe("ระบบอ่านชื่อผู้ถือใบอนุญาตได้ไม่ชัด");
    expect(
      shouldSuppressLicenseOcrUi({
        fullName: "นางสาวอัณศยาณัช แดงไฟ",
        result: {
          name: "page-4.pdf",
          ok: true,
          document_kind: "license",
          fields: {},
        },
      }),
    ).toBe(true);
  });
});
