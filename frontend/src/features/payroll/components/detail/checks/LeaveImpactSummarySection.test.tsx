import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaveImpactSummarySection } from "./LeaveImpactSummarySection";

describe("LeaveImpactSummarySection", () => {
  it("renders leave impact summary with leave rows and quota usage", () => {
    render(
      <LeaveImpactSummarySection
        citizenId="1111111111111"
        summary={{
          deductedDays: 5,
          deductedAmount: 500,
          leavesInPeriod: [
            {
              leaveRecordId: 12,
              leaveType: "personal",
              startDate: "2026-02-10",
              endDate: "2026-02-13",
              overlapStartDate: "2026-02-10",
              overlapEndDate: "2026-02-13",
              daysInPeriod: 4,
              deductedDays: 3,
              deductedAmount: 300,
              isNoPay: false,
              overQuota: true,
              exceedDate: "2026-02-11",
              returnReportStatus: null,
              studyInstitution: null,
              studyProgram: null,
              studyMajor: null,
            },
          ],
          quotaByType: [
            {
              leaveType: "personal",
              quotaLimit: 5,
              ruleType: "cumulative",
              tracksBalance: true,
              quotaUnit: "business_days",
              usedBeforePeriod: 2,
              usedInPeriod: 6,
              remainingBeforePeriod: 3,
              remainingAfterPeriod: 0,
              overQuota: true,
              exceedDate: "2026-02-11",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("สรุปวันลาที่กระทบงวดนี้")).toBeInTheDocument();
    expect(screen.getByText("วันลาที่มีผลในงวดนี้")).toBeInTheDocument();
    expect(screen.getAllByText("ลากิจส่วนตัว")).toHaveLength(2);
    expect(screen.getAllByText("เกินสิทธิตั้งแต่ 11 ก.พ. 2569")).toHaveLength(2);
    expect(screen.getByText("สรุปสิทธิที่ควรเฝ้าระวัง")).toBeInTheDocument();
    expect(screen.getByText("0 วัน")).toBeInTheDocument();
    expect(screen.getByText("ยอดหักรวม")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ไปจัดการวันลา/i })).toHaveAttribute(
      "href",
      "/pts-officer/leave-management?search=1111111111111",
    );
  });
});
