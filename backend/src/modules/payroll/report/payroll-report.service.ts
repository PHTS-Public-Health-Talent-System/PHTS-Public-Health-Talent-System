import PDFDocument from "pdfkit";
import { PayrollRepository } from "../repositories/payroll.repository.js";

export async function buildPeriodReport(periodId: number): Promise<Buffer> {
  const period = await PayrollRepository.findPeriodById(periodId);
  if (!period) {
    throw new Error("Period not found");
  }

  const payouts = await PayrollRepository.findPayoutsByPeriod(periodId);
  const summary = await PayrollRepository.findProfessionSummaryByPeriod(periodId);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text(
        `รายงานงวดเงินเพิ่ม พ.ต.ส. ${period.period_month}/${period.period_year}`,
      );
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .text(`สถานะ: ${period.status}  จำนวนคน: ${period.total_headcount ?? 0}`);
      doc
        .fontSize(10)
        .text(`ยอดรวม: ${Number(period.total_amount ?? 0).toLocaleString()} บาท`);

      doc.moveDown();
      doc.fontSize(12).text("สรุปตามวิชาชีพ");
      doc.moveDown(0.3);

      summary.forEach((row: any) => {
        doc
          .fontSize(10)
          .text(
            `${row.position_name} | จำนวน ${row.headcount} | รวม ${Number(
              row.total_payable,
            ).toLocaleString()} บาท`,
          );
      });

      doc.moveDown();
      doc.fontSize(12).text("รายการจ่ายเงิน");
      doc.moveDown(0.3);

      payouts.forEach((row: any) => {
        const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
        const line = [
          name || row.citizen_id,
          row.position_name ?? "-",
          `สิทธิ ${row.eligible_days ?? 0}`,
          `หัก ${row.deducted_days ?? 0}`,
          `อัตรา ${Number(row.rate ?? 0).toLocaleString()}`,
          `รวม ${Number(row.total_payable ?? 0).toLocaleString()}`,
        ].join(" | ");
        doc.fontSize(9).text(line);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
