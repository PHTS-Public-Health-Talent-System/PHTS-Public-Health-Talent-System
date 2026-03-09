import { describe, expect, it } from "vitest";

import {
  findAssignmentOrderSummary,
  parseAssignmentOrderSummary,
  shouldSuppressAssignmentOrderOcrUi,
} from "./requestDetail.assignmentOrder";

const sampleMarkdown = `
หน้า 5-6: คำสั่งกลุ่มงานเภสัชกรรม (ที่ ๑/๒๕๖๔)
คำสั่งกลุ่มงานเภสัชกรรม
ที่ ๑/๒๕๖๔
เรื่อง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน

๑. งานเตรียมหรือผลิตยาเคมีบำบัดและการบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบำบัด
๑.๑ นายกฤษณพงศ์ ไชยวงศ์  เภสัชกรชำนาญการ  หัวหน้างาน
๑.๒ นางสาวภัทรชา หอมสร้อย  เภสัชกรปฏิบัติการ

โดยมีหน้าที่ ดังนี้
๑. ตรวจสอบวิเคราะห์คำสั่งการใช้ยาเคมีบำบัด
๒. คำนวณขนาดยา ปริมาณยา และเตรียมยาให้พร้อมใช้
๓. ให้การบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบำบัด
ทั้งนี้ ตั้งแต่วันที่ ๑ พฤศจิกายน พ.ศ. ๒๕๖๔
สั่ง ณ วันที่ ๓ ตุลาคม ๒๕๖๔
`;

describe("requestDetail.assignmentOrder", () => {
  it("parses important assignment-order fields for matched person", () => {
    const summary = parseAssignmentOrderSummary(
      {
        fileName: "คำสั่ง.pdf",
        markdown: sampleMarkdown,
      },
      "ภัทรชา หอมสร้อย",
    );

    expect(summary).toEqual(
      expect.objectContaining({
        fileName: "คำสั่ง.pdf",
        orderNo: "๑/๒๕๖๔",
        subject: "ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน",
        department: "กลุ่มงานเภสัชกรรม",
        effectiveDate: "๑ พฤศจิกายน พ.ศ. ๒๕๖๔",
        signedDate: "๓ ตุลาคม ๒๕๖๔",
        personMatched: true,
        personLine: expect.stringContaining("ภัทรชา หอมสร้อย"),
        sectionTitle: expect.stringContaining("งานเตรียมหรือผลิตยาเคมีบำบัด"),
        dutyHighlights: [
          "๑. ตรวจสอบวิเคราะห์คำสั่งการใช้ยาเคมีบำบัด",
          "๒. คำนวณขนาดยา ปริมาณยา และเตรียมยาให้พร้อมใช้",
          "๓. ให้การบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบำบัด",
        ],
      }),
    );
  });

  it("selects the document that matches the person when multiple OCR documents exist", () => {
    const summary = findAssignmentOrderSummary(
      [
        {
          fileName: "หนังสือส่งใบอนุญาต.pdf",
          markdown: "บันทึกข้อความ เรื่อง ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพ",
        },
        {
          fileName: "คำสั่ง.pdf",
          markdown: sampleMarkdown,
        },
      ],
      "ภัทรชา หอมสร้อย",
    );

    expect(summary?.fileName).toBe("คำสั่ง.pdf");
    expect(summary?.personMatched).toBe(true);
  });

  it("parses noisy assignment-order OCR and reports no person match when person is absent", () => {
    const summary = parseAssignmentOrderSummary(
      {
        fileName: "page-5-6.pdf",
        markdown: `
คําสังกลุ่มงานเภสัชกรรม
ที ๑/๒๕๒๐๕
เรอง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
๑. งานเตรียมหรือผลิตยาเคมีบําบัดและการบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบําบัด
๑.๑ นายกฤษณพงศ์ ไขยวงศ์ เภสัชกรชํานาญการ
ทั้งนี้ ตั้งแต่วันที่ ๑ พฤศจิกายน พ.ศ. ๒๕๖๔
สั่ง ณ วันที่ ๓ ตุลาคม ๒๕๖๔
`,
      },
      "กันยกร กาญจนวัฒนากุล",
    );

    expect(summary).toEqual(
      expect.objectContaining({
        fileName: "page-5-6.pdf",
        effectiveDate: "๑ พฤศจิกายน พ.ศ. ๒๕๖๔",
        signedDate: "๓ ตุลาคม ๒๕๖๔",
        personMatched: false,
      }),
    );
  });

  it("strips OCR noise before the matched person line", () => {
    const summary = parseAssignmentOrderSummary(
      {
        fileName: "page-5-6.pdf",
        markdown: `
คําสังกลุ่มงานเภสัชกรรม
ที ๑/๒๕๒๐๕
เรอง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
ง/ ๑.๒ นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ
`,
      },
      "จริยา ใจใหญ่",
    );

    expect(summary?.personLine).toBe("๑.๒ นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ");
  });

  it("does not return assignment-order summary when the person is not matched", () => {
    const summary = findAssignmentOrderSummary(
      [
        {
          fileName: "page-5-6.pdf",
          markdown: `
คําสังกลุ่มงานเภสัชกรรม
ที ๑/๒๕๒๐๕
เรอง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
๑. งานเตรียมหรือผลิตยาเคมีบําบัดและการบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบําบัด
๑.๒ นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ
`,
        },
      ],
      "กันยกร กาญจนวัฒนากุล",
    );

    expect(summary).toBeNull();
  });

  it("marks unmatched assignment-order OCR as suppressible in allowance UI", () => {
    expect(
      shouldSuppressAssignmentOrderOcrUi(
        {
          fileName: "page-5-6.pdf",
          markdown: `
คําสังกลุ่มงานเภสัชกรรม
ที ๑/๒๕๒๐๕
เรอง ยกเลิกและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
๑. งานเตรียมหรือผลิตยาเคมีบําบัดและการบริบาลเภสัชกรรมผู้ป่วยที่ได้รับยาเคมีบําบัด
๑.๒ นางสาวจริยา ใจใหญ่ เภสัชกรปฏิบัติการ
`,
        },
        "กันยกร กาญจนวัฒนากุล",
      ),
    ).toBe(true);
  });

  it("does not parse memo documents as assignment orders even if they mention assignment keywords", () => {
    const summary = parseAssignmentOrderSummary(
      {
        fileName: "20260213-004.pdf",
        markdown: `
บันทึกข้อความ
ส่วนราชการ โรงพยาบาลอุตรดิตถ์ กลุ่มภารกิจด้านการพยาบาล โทร ๒๑๑๒
ที่ อต ๐๐๓๓๑๐๕/๐๐๐6 วันที่ ๑๕ มกราคม ๒๕๖๙
เรื่อง ขอส่งสำเนาใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ ชั้นหนึ่ง
เรียน หัวหน้ากลุ่มงานทรัพยากรบุคคล
อ้างถึงคำสั่งเดิมและมอบหมายเจ้าหน้าที่รับผิดชอบในการปฏิบัติงาน
`,
      },
      "กันยกร กาญจนวัฒนากุล",
    );

    expect(summary).toBeNull();
  });
});
