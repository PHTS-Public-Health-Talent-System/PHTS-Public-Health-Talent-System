import { describe, expect, it } from "vitest";

import {
  buildOcrDocumentOverview,
  detectOcrDocumentKind,
  findMemoSummary,
  findMentionedPeopleInMemoDocuments,
  getOcrDocumentTypeLabel,
  shouldSuppressMemoOcrActions,
} from "./requestDetail.ocrDocuments";

const memoMarkdown = `
หน้า 1: บันทึกข้อความ
บันทึกข้อความ
ส่วนราชการ  โรงพยาบาลอุดรดิตถ์ กลุ่มภารกิจด้านการพยาบาล  โทร ๒๒๑๖
ที่  อต ๐๐๓๓.๑๐๔/๐๐๐๙๕๓
วันที่  ๑๕ มกราคม ๒๕๖๙
เรื่อง  ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง

เรียน  หัวหน้ากลุ่มงานทรัพยากรบุคคล

ด้วย กลุ่มภารกิจด้านการพยาบาล โรงพยาบาลอุดรดิตถ์ มีบุคลากรตำแหน่งพยาบาลวิชาชีพ
ซึ่งมีใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์หมดอายุฯ ในเดือน มีนาคม ๒๕๖๙
ได้ดำเนินการต่อใบอนุญาตประกอบวิชาชีพฯ ดังรายชื่อต่อไปนี้
๑. นางสาวอันศยานัช แดงไพ
๒. นางนิลยา ธรรมสุทธิ์
๓. นางชลดา แข็ง
`;

describe("requestDetail.ocrDocuments", () => {
  it("parses important memo fields and matches listed person", () => {
    const summary = findMemoSummary(
      [
        {
          fileName: "หนังสือนำส่ง.pdf",
          markdown: memoMarkdown,
        },
      ],
      "นิลยา ธรรมสุทธิ์",
    );

    expect(summary).toEqual(
      expect.objectContaining({
        fileName: "หนังสือนำส่ง.pdf",
        documentNo: "อต ๐๐๓๓.๑๐๔/๐๐๐๙๕๓",
        subject: "ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง",
        department: "โรงพยาบาลอุดรดิตถ์ กลุ่มภารกิจด้านการพยาบาล",
        addressedTo: "หัวหน้ากลุ่มงานทรัพยากรบุคคล",
        personMatched: true,
        personLine: expect.stringContaining("นางนิลยา ธรรมสุทธิ์"),
      }),
    );
  });

  it("detects document kinds for OCR labels", () => {
    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "คำสั่ง.pdf",
          markdown:
            "คำสั่งกลุ่มงานเภสัชกรรม เรื่อง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน",
        }),
      ),
    ).toBe("คำสั่งมอบหมายงาน");

    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "memo.pdf",
          markdown: memoMarkdown,
        }),
      ),
    ).toBe("หนังสือนำส่ง");

    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "license.pdf",
          markdown:
            "ใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ใบอนุญาตที่ ๕๔๑๑๓๔๐๘๑",
        }),
      ),
    ).toBe("ใบอนุญาต");
  });

  it("detects noisy assignment-order OCR as assignment order", () => {
    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "page-5-6.pdf",
          markdown:
            "คําสังกลุ่มงานเภสัชกรรม เรื่อง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน",
        }),
      ),
    ).toBe("คำสั่งมอบหมายงาน");
  });

  it("keeps memo classification when a memo mentions assignment wording in the body", () => {
    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "20260213-004.pdf",
          markdown: `
บันทึกข้อความ
ส่วนราชการ โรงพยาบาลอุตรดิตถ์ กลุ่มภารกิจด้านการพยาบาล โทร ๒๑๑๒
ที่ อต ๐๐๓๓๑๐๕/๐๐๐6 วันที่ ๑๕ มกราคม ๒๕๖๙
เรื่อง ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง
เรียน หัวหน้ากลุ่มงานทรัพยากรบุคคล
อ้างถึงคำสั่งเดิมและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
`,
        }),
      ),
    ).toBe("หนังสือนำส่ง");
  });

  it("does not return memo summary when the person is not matched", () => {
    const summary = findMemoSummary(
      [
        {
          fileName: "20260213-004.pdf",
          markdown: `
บันทึกข้อความ
ส่วนราชการ โรงพยาบาลอุตรดิตถ์ กลุ่มภารกิจด้านการพยาบาล โทร ๒๑๑๒
ที่ อต ๐๐๓๓๑๐๕/๐๐๐6 วันที่ ๑๕ มกราคม ๒๕๖๙
เรื่อง ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง
เรียน หัวหน้ากลุ่มงานทรัพยากรบุคคล
๑. นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ
`,
        },
      ],
      "กันยกร กาญจนวัฒนากุล",
    );

    expect(summary).toBeNull();
  });

  it("marks unmatched memo OCR as suppressible for actions in allowance UI", () => {
    expect(
      shouldSuppressMemoOcrActions(
        {
          fileName: "page-1.pdf",
          markdown: `
บันทึกข้อความ
ส่วนราชการ โรงพยาบาลอุตรดิตถ์ กลุ่มภารกิจด้านการพยาบาล โทร ๒๑๑๒
ที่ อต ๐๐๓๓๑๐๕/๐๐๐6 วันที่ ๑๕ มกราคม ๒๕๖๙
เรื่อง ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง
เรียน หัวหน้ากลุ่มงานทรัพยากรบุคคล
๑. นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ
`,
        },
        "กันยกร กาญจนวัฒนากุล",
      ),
    ).toBe(true);
  });

  it("builds document overview counts across OCR documents", () => {
    const overview = buildOcrDocumentOverview([
      { fileName: "memo.pdf", markdown: memoMarkdown },
      { fileName: "license-1.pdf", markdown: "ใบอนุญาตประกอบวิชาชีพ ใบอนุญาตที่ 123" },
      { fileName: "license-2.pdf", markdown: "ใบอนุญาตประกอบวิชาชีพ ใบอนุญาตที่ 456" },
      {
        fileName: "page-5-6.pdf",
        markdown: "คําสังกลุ่มงานเภสัชกรรม เรื่อง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน",
      },
    ]);

    expect(overview).toEqual({
      total: 4,
      memo: 1,
      license: 2,
      assignment_order: 1,
      general: 0,
    });
  });

  it("extracts mentioned people from memo documents", () => {
    const people = findMentionedPeopleInMemoDocuments([
      {
        fileName: "memo.pdf",
        markdown: memoMarkdown,
      },
    ]);

    expect(people).toEqual([
      "นางสาวอันศยานัช แดงไพ",
      "นางนิลยา ธรรมสุทธิ์",
      "นางชลดา แข็ง",
    ]);
  });

  it("classifies scanned license pages as license documents", () => {
    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "page-2.pdf",
          markdown: `
ใบอนุญาตที่ ๕๔๑๑๓๔๐๘๑
ต่ออายุครั้งที่ ๑
ใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์
ออกใบอนุญาตนี้ให้แก่
นางสาวอันศยานัช แดงไพ
หมดอายุ วันที่ ๒๘ เดือน มีนาคม พุทธศักราช ๒๕๖๙
`,
        }),
      ),
    ).toBe("ใบอนุญาต");
  });

  it("classifies noisy scanned license OCR as license documents", () => {
    expect(
      getOcrDocumentTypeLabel(
        detectOcrDocumentKind({
          fileName: "page-2.pdf",
          markdown: `
ง          1        เร
ใบอนุญาตปี ๒๕๑๑๓๑๕๐๕๑                               ตออายุตรงที ๑
ใบอนุญาตประกอบวิชาจีตการแยายาลและการผดุงครรภ์
จอกใบอนุญาตธี้ให้แก่
นางส่าวอัณตยาณัช แดงไฟ
หผดอายุ วันที่ ๒๕ เดียน - -มีนําคม     ยุทธศักราช์ |: ๒๕๕๕
`,
        }),
      ),
    ).toBe("ใบอนุญาต");
  });
});
