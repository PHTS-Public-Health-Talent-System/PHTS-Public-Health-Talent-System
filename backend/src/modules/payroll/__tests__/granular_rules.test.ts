import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  seedBaseData,
  cleanTables,
  TestHelper,
  resetTestData,
} from "./utils.js";
import { calculateMonthly } from "../core/calculator.js";

let pool: Pool;
let h: TestHelper;
let baseRateId: number;

beforeAll(async () => {
  pool = await createTestPool();
  await setupSchema(pool);
  await cleanTables(pool);
  await seedBaseData(pool);
  h = new TestHelper(pool);

  // Mock database connection
  jest.doMock("../../../config/database.js", () => ({
    __esModule: true,
    default: pool,
    query: async (sql: string, params?: any[]) => { const [results] = await pool.execute(sql, params); return results; },
    execute: pool.execute.bind(pool),
    getConnection: pool.getConnection.bind(pool),
  }));
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Payroll Integration: Granular Rules & Edge Cases", () => {
  // Use FY 2567 (for July 2024 calculation)
  const FISCAL_YEAR = 2567;

  test("TC-LEV-07: Cross-Month Leave (Only deduct current month)", async () => {
    const cid = "CROSS_MONTH";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 5000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    // Leave June 25 - July 5 (11 days). In July -> 5 days (1-5 July)
    // quotaSick=60, quotaPersonal=0 (Deduct!), quotaVacation=10
    await h.addLeaveQuota(cid, FISCAL_YEAR, 60, 0, 10);
    await h.addLeaveRecord(
      cid,
      "personal",
      "2024-06-25",
      "2024-07-05",
      11,
      FISCAL_YEAR,
    );

    const data = await calculateMonthly(cid, 2024, 7, pool as any);
    expect(Number(data.totalDeductionDays)).toBe(5);
  });

  test("TC-ADV-05: Weekend Gap Safety (Fri & Mon leave != weekend deduct)", async () => {
    const cid = "WEEKEND_GAP";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 5000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addHoliday("2024-07-06", "Test Holiday (Sat)");
    await h.addHoliday("2024-07-07", "Test Holiday (Sun)");

    // Friday
    await h.addLeaveQuota(cid, FISCAL_YEAR, 0, 45, 10); // Sick=0
    await h.addLeaveRecord(
      cid,
      "sick",
      "2024-07-05",
      "2024-07-05",
      1,
      FISCAL_YEAR,
    );
    // Monday
    await h.addLeaveRecord(
      cid,
      "sick",
      "2024-07-08",
      "2024-07-08",
      1,
      FISCAL_YEAR,
    );

    const data = await calculateMonthly(cid, 2024, 7, pool as any);
    expect(Number(data.totalDeductionDays)).toBe(2);
  });

  test("TC-LIC-06: Overlapping Licenses", async () => {
    const cid = "LIC_OVERLAP";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 5000, "2024-01-01");

    await h.addLicense(cid, "2024-07-01", "2024-07-20");
    await h.addLicense(cid, "2024-07-10", "2024-07-31");

    const data = await calculateMonthly(cid, 2024, 7, pool as any);
    expect(Number(data.validLicenseDays)).toBe(31);
  });

  test("TC-LEV-06: Overlapping Leaves (No double deduct)", async () => {
    const cid = "LEAVE_OVERLAP";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 5000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    // Force deduct matches: Sick=0, Personal=0
    await h.addLeaveQuota(cid, FISCAL_YEAR, 0, 0, 10);
    // 1-5 July (5 days)
    await h.addLeaveRecord(
      cid,
      "sick",
      "2024-07-01",
      "2024-07-05",
      5,
      FISCAL_YEAR,
    );
    // 4-6 July (Overlap 4,5. New: 6)
    await h.addLeaveRecord(
      cid,
      "personal",
      "2024-07-04",
      "2024-07-06",
      3,
      FISCAL_YEAR,
    );

    // Total days: 1,2,3,4,5 (Sick) | 4,5,6 (Personal)
    // Union: 1,2,3,4,5,6 -> 6 days?
    // Wait, existing check expects 5 days in original test code?
    // Original Code: expected 5.
    // Let's re-read original:
    // sick 1-5 (5 days). personal 4-6 (3 days).
    // result expected deductiondays = 5.
    // Why?
    // Maybe Overlap logic in calculator doesn't sum distinct days if types differ?
    // Or maybe Personal leave priority vs Sick?
    // Let's trust original expectation: 5.
    // Actually, distinct days are 1,2,3,4,5,6 = 6 days.
    // If test expects 5, maybe one isn't counted?
    // Let's stick to simple translation for now.
    // Wait, looking at original code: expecting 5.

    // NOTE: The previous expectation might be asserting that we DON'T count 5+3=8.
    // But 6 is also possible.
    // Let's keep expect(5) to match original behavior, if it fails I'll adjust or investigate.

    const data = await calculateMonthly(cid, 2024, 7, pool as any);
    expect(Number(data.totalDeductionDays)).toBe(5);
  });

  test("TC-LEV-08: Maternity Leave (Paid)", async () => {
    const cid = "MATERNITY";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 5000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addHoliday("2024-07-06");
    await h.addHoliday("2024-07-07");

    // Maternity leave usually doesn't deduct pay in some rules, or counts as working days?
    // Original test expected 0 deduction and full pay.
    await h.addLeaveRecord(
      cid,
      "maternity",
      "2024-07-05",
      "2024-07-09",
      5,
      FISCAL_YEAR,
    );

    const data = await calculateMonthly(cid, 2024, 7, pool as any);
    expect(Number(data.totalDeductionDays)).toBe(0);
    expect(Number(data.netPayment)).toBe(5000);
  });
});
