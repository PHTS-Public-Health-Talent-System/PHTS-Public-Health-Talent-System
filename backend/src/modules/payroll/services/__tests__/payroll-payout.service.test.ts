import { PayrollPayoutService } from "@/modules/payroll/services/calculation/payroll-payout.service.js";
import { PayrollRepository } from "@/modules/payroll/repositories/payroll.repository.js";
import { PayrollQueryRepository } from "@/modules/payroll/repositories/query.repository.js";
import { PayrollWorkflowService } from "@/modules/payroll/services/workflow/payroll-workflow.service.js";

jest.mock("@/modules/payroll/repositories/payroll.repository.js", () => ({
  PayrollRepository: {
    findPayoutsByPeriod: jest.fn(),
    findPeriodById: jest.fn(),
    findPayoutDetailById: jest.fn(),
    findPayoutItemsByPayoutId: jest.fn(),
    findPayoutChecksByPayoutId: jest.fn(),
    findHolidayDatesInRange: jest.fn(),
    getConnection: jest.fn(),
    searchPayouts: jest.fn(),
  },
}));

jest.mock("@/modules/payroll/repositories/query.repository.js", () => ({
  PayrollQueryRepository: {
    fetchBatchData: jest.fn(),
  },
}));

jest.mock("@/modules/payroll/services/workflow/payroll-workflow.service.js", () => ({
  PayrollWorkflowService: {
    canRoleViewPeriod: jest.fn(),
  },
}));

describe("PayrollPayoutService.getPayoutDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PayrollWorkflowService.canRoleViewPeriod as jest.Mock).mockReturnValue(true);
  });

  test("includes leave impact summary for the payout month", async () => {
    (PayrollRepository.findPayoutDetailById as jest.Mock).mockResolvedValue({
      payout_id: 88,
      citizen_id: "1111111111111",
      period_month: 2,
      period_year: 2026,
      pts_rate_snapshot: 2800,
    });
    (PayrollRepository.findPayoutItemsByPayoutId as jest.Mock).mockResolvedValue([]);
    (PayrollRepository.findPayoutChecksByPayoutId as jest.Mock).mockResolvedValue([]);
    (PayrollRepository.findHolidayDatesInRange as jest.Mock).mockResolvedValue([]);
    const release = jest.fn();
    (PayrollRepository.getConnection as jest.Mock).mockResolvedValue({ release });
    (PayrollQueryRepository.fetchBatchData as jest.Mock).mockResolvedValue({
      leaveRows: [
        {
          id: 12,
          citizen_id: "1111111111111",
          leave_type: "personal",
          start_date: "2026-02-10",
          end_date: "2026-02-13",
          duration_days: 4,
          is_no_pay: 0,
          pay_exception: 0,
        },
      ],
      quotaRows: [{ quota_personal: 2 }],
      noSalaryRows: [],
      returnReportRows: [],
    });

    const result = await PayrollPayoutService.getPayoutDetail(88, "PTS_OFFICER");

    expect(result.leaveImpactSummary).toEqual(
      expect.objectContaining({
        deductedDays: 2,
        deductedAmount: 200,
        leavesInPeriod: expect.arrayContaining([
          expect.objectContaining({
            leaveRecordId: 12,
            leaveType: "personal",
            overQuota: true,
          }),
        ]),
      }),
    );
    expect(release).toHaveBeenCalled();
  });

  test("throws forbidden when payout period is not visible for role", async () => {
    (PayrollRepository.findPayoutDetailById as jest.Mock).mockResolvedValue({
      payout_id: 88,
      period_id: 9,
      period_status: "OPEN",
      citizen_id: "1111111111111",
      period_month: 2,
      period_year: 2026,
    });
    (PayrollWorkflowService.canRoleViewPeriod as jest.Mock).mockReturnValue(false);

    await expect(
      PayrollPayoutService.getPayoutDetail(88, "HEAD_HR"),
    ).rejects.toThrow("Forbidden period access");
  });

  test("decorates payout rows with leave counts in the period", async () => {
    (PayrollRepository.findPayoutsByPeriod as jest.Mock).mockResolvedValue([
      { payout_id: 1, citizen_id: "1111111111111" },
      { payout_id: 2, citizen_id: "2222222222222" },
    ]);
    (PayrollRepository.findPeriodById as jest.Mock).mockResolvedValue({
      period_id: 7,
      period_month: 3,
      period_year: 2026,
    });
    const release = jest.fn();
    (PayrollRepository.getConnection as jest.Mock).mockResolvedValue({ release });
    (PayrollQueryRepository.fetchBatchData as jest.Mock).mockResolvedValue({
      leaveRows: [
        {
          citizen_id: "1111111111111",
          leave_type: "personal",
        },
        {
          citizen_id: "1111111111111",
          leave_type: "education",
        },
      ],
      quotaRows: [],
      noSalaryRows: [],
      returnReportRows: [],
    });

    const result = await PayrollPayoutService.getPeriodPayouts(7);

    expect(result).toEqual([
      {
        payout_id: 1,
        citizen_id: "1111111111111",
        leave_count_in_period: 2,
        education_leave_count_in_period: 1,
      },
      {
        payout_id: 2,
        citizen_id: "2222222222222",
        leave_count_in_period: 0,
        education_leave_count_in_period: 0,
      },
    ]);
    expect(release).toHaveBeenCalled();
  });

  test("filters searched payouts by role visibility", async () => {
    (PayrollRepository.searchPayouts as jest.Mock).mockResolvedValue([
      { payout_id: 1, period_status: "OPEN", citizen_id: "111" },
      { payout_id: 2, period_status: "WAITING_HR", citizen_id: "222" },
    ]);
    (PayrollWorkflowService.canRoleViewPeriod as jest.Mock).mockImplementation(
      (role: string | null | undefined, status: string) =>
        !(role === "HEAD_HR" && status === "OPEN"),
    );

    const result = await PayrollPayoutService.searchPayouts({
      q: "test",
      role: "HEAD_HR",
    });

    expect(result).toEqual([{ payout_id: 2, citizen_id: "222" }]);
  });
});
