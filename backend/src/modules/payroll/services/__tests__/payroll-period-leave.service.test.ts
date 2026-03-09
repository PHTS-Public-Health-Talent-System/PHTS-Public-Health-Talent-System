import { PayrollPeriodLeaveService } from "@/modules/payroll/services/facade/payroll-period-leave.service.js";
import { PayrollRepository } from "@/modules/payroll/repositories/payroll.repository.js";

const listLeaveManagementByPeriod = jest.fn();
const countLeaveManagementByPeriod = jest.fn();
const summarizeLeaveManagementByProfessionByPeriod = jest.fn();

jest.mock("@/modules/payroll/repositories/payroll.repository.js", () => ({
  PayrollRepository: {
    findPeriodById: jest.fn(),
  },
}));

jest.mock("@/modules/leave-management/repositories/leave-management.repository.js", () => ({
  LeaveManagementRepository: jest.fn().mockImplementation(() => ({
    listLeaveManagementByPeriod,
    countLeaveManagementByPeriod,
    summarizeLeaveManagementByProfessionByPeriod,
  })),
}));

describe("PayrollPeriodLeaveService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("lists leave rows by payroll period range", async () => {
    (PayrollRepository.findPeriodById as jest.Mock).mockResolvedValue({
      period_id: 9,
      period_month: 3,
      period_year: 2026,
    });
    listLeaveManagementByPeriod.mockResolvedValue([{ id: 1 }] as any);
    countLeaveManagementByPeriod.mockResolvedValue(1);

    const result = await PayrollPeriodLeaveService.listPeriodLeaves(9, {
      profession_code: "NURSE",
      limit: 50,
      offset: 0,
      sort_by: "start_date",
      sort_dir: "desc",
    });

    expect(listLeaveManagementByPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: "2026-03-01",
        end_date: "2026-03-31",
        profession_code: "NURSE",
      }),
    );
    expect(result.total).toBe(1);
  });

  test("summarizes leave rows by profession in the payroll period", async () => {
    (PayrollRepository.findPeriodById as jest.Mock).mockResolvedValue({
      period_id: 9,
      period_month: 2,
      period_year: 2569,
    });
    summarizeLeaveManagementByProfessionByPeriod.mockResolvedValue([
      { profession_code: "NURSE", profession_name: "พยาบาล", leave_count: 3 },
    ] as any);

    const result = await PayrollPeriodLeaveService.summarizePeriodLeavesByProfession(9, {
      search: "พยาบาล",
    });

    expect(summarizeLeaveManagementByProfessionByPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: "2026-02-01",
        end_date: "2026-02-28",
        search: "พยาบาล",
      }),
    );
    expect(result).toEqual([
      { profession_code: "NURSE", profession_name: "พยาบาล", leave_count: 3 },
    ]);
  });
});
