import request from "supertest";
import path from "path";
import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  seedBaseData,
  cleanTables,
  resetTestData,
  signAdminToken,
  TestHelper,
} from "./utils.js";

let pool: Pool;
let app: any;
let h: TestHelper;

jest.setTimeout(20000);

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

  const appPath = path.join(process.cwd(), "src/index.ts");
  const imported = await import(appPath);
  app = imported.default;
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Payroll Integration: Deductions & Leave", () => {
  const adminToken = signAdminToken();

  test("TC-PAY-06: Leave Deduction (Sick Leave > 60 days)", async () => {
    const cid = "SICK_USER";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");

    // Default rate is usually 10k/20k. Here we need 31k.
    // addEligibility will auto-create this rate if not exists.
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 0, 45, 10); // Consumed all sick quota
    await h.addLeaveRecord(cid, "sick", "2024-01-25", "2024-01-26", 2, 2567);

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(2);
    // 31000 / 31 = 1000 per day.
    // Deduct 2 days = 2000.
    // Net: 29000.
    expect(data.netPayment).toBe(29000);
  });

  test("TC-PAY-07: Study Leave (Paid within 60 days)", async () => {
    const cid = "STUDY_DOC";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 10000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addMovement(cid, "STUDY", "2024-01-01");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(0);
    expect(data.netPayment).toBe(10000);
  });

  test("TC-REAL-02: Long Term Training > 60 Days (Nurse Case)", async () => {
    const cid = "NURSE_TRAIN";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 1500, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    // Leave 119 days spanning fiscal years/months?
    // Start 2024-11-30 to 2025-03-28.
    // Calculating Jan 2025.
    // Fiscal 2568.
    await h.addLeaveRecord(
      cid,
      "education",
      "2024-11-30",
      "2025-03-28",
      119,
      2568,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2025, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];

    // Jan 2025 has 31 days.
    // Eligible days 28? (Why 28? Maybe deduction?)
    // Original test: eligibleDays 28, deductionDays 3.
    // 28 + 3 = 31.
    expect(data.eligibleDays).toBe(28);
    expect(data.totalDeductionDays).toBe(3);
    // 1500 / 31 * 28 = 1354.84
    expect(data.netPayment).toBeCloseTo(1354.84);
  });

  test("TC-EDU-01: Education leave is per-event (no cross-event deduction)", async () => {
    const cid = "EDU_PER_EVENT";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    // Fiscal year 2568: Oct 2024 - Sep 2025
    await h.addLeaveRecord(
      cid,
      "education",
      "2024-10-01",
      "2024-11-09",
      40,
      2568,
    );
    await h.addLeaveRecord(
      cid,
      "education",
      "2024-12-01",
      "2025-01-29",
      60,
      2568,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2025, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(0);
    expect(data.netPayment).toBe(31000);
  });

  test("TC-EDU-02: STUDY movement over 60 days -> no pay after limit", async () => {
    const cid = "STUDY_OVER_60";
    await h.createEmployee(cid);
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    // Study starts Jan 1, 2024; March 2024 should be beyond 60 days.
    await h.addMovement(cid, "STUDY", "2024-01-01");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 3, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(31);
    expect(data.netPayment).toBe(0);
  });

  test("TC-LEV-09: Half-day personal leave over quota deducts 0.5 day", async () => {
    const cid = "HALF_DAY_PERSONAL";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 60, 0, 10); // personal quota = 0
    await h.addLeaveRecord(
      cid,
      "personal",
      "2024-01-02",
      "2024-01-02",
      0.5,
      2567,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(0.5);
    expect(data.netPayment).toBeCloseTo(31000 - (31000 / 31) * 0.5, 2);
  });

  test("TC-LEV-01: Sick leave within 60 business days -> no deduction", async () => {
    const cid = "SICK_WITHIN_60";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 60, 45, 10);
    await h.addLeaveRecord(cid, "sick", "2024-01-08", "2024-01-12", 5, 2567);

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(0);
    expect(data.netPayment).toBe(31000);
  });

  test("TC-LEV-03: Personal leave exceeds quota -> deduction", async () => {
    const cid = "PERSONAL_OVER";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 60, 0, 10);
    await h.addLeaveRecord(
      cid,
      "personal",
      "2024-01-22",
      "2024-01-23",
      2,
      2567,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(2);
    expect(data.netPayment).toBe(31000 - (31000 / 31) * 2);
  });

  test("TC-ADV-05: Leave Fri & Mon -> No weekend deduction", async () => {
    const cid = "NO_WEEKEND_DEDUCT";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 60, 45, 0);
    await h.addHoliday("2024-08-24");
    await h.addHoliday("2024-08-25");
    await h.addLeaveRecord(
      cid,
      "vacation",
      "2024-08-23",
      "2024-08-23",
      1,
      2567,
    );
    await h.addLeaveRecord(
      cid,
      "vacation",
      "2024-08-26",
      "2024-08-26",
      1,
      2567,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 8, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(2);
  });

  test("TC-LEV-06: Overlapping sick & personal within quota -> no double deduction", async () => {
    const cid = "OVERLAP_LEAVE";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 60, 45, 10);
    await h.addLeaveRecord(cid, "sick", "2024-07-01", "2024-07-05", 5, 2567);
    await h.addLeaveRecord(
      cid,
      "personal",
      "2024-07-04",
      "2024-07-06",
      3,
      2567,
    );

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 7, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBe(0);
  });

  test("TC-LEV-07: Cross-month leave counts only target month", async () => {
    const cid = "CROSS_MONTH";
    await h.createEmployee(cid);
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 31000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2030-12-31");

    await h.addLeaveQuota(cid, 2567, 0, 45, 10);
    await h.addLeaveRecord(cid, "sick", "2024-06-20", "2024-07-10", 21, 2567);

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 7, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.totalDeductionDays).toBeGreaterThan(0);
  });

  test("TC-LIC-03: Nursing license expires mid-month -> prorated", async () => {
    const cid = "NURSE_LIC_MID";
    await h.createEmployee(cid, "พยาบาลวิชาชีพ");
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 3000, "2024-01-01");
    await h.addLicense(cid, "2020-01-01", "2024-06-15");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 6, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.validLicenseDays).toBe(15);
    expect(data.netPayment).toBe(1500);
  });

  test("TC-LIC-04: Nursing license starts mid-month -> prorated", async () => {
    const cid = "NURSE_LIC_START";
    await h.createEmployee(cid, "พยาบาลวิชาชีพ");
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 3000, "2024-01-01");
    await h.addLicense(cid, "2024-06-16", "2024-12-31");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 6, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.validLicenseDays).toBe(15);
    expect(data.netPayment).toBe(1500);
  });

  test("TC-LIC-05: Nursing license gap between two licenses", async () => {
    const cid = "NURSE_LIC_GAP";
    await h.createEmployee(cid, "พยาบาลวิชาชีพ");
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 3000, "2024-01-01");
    await h.addLicense(cid, "2024-06-01", "2024-06-15");
    await h.addLicense(cid, "2024-06-20", "2024-12-31");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 6, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.validLicenseDays).toBe(26);
    expect(data.netPayment).toBe(2600);
  });

  test("TC-LIC-06: Nursing overlapping licenses counted uniquely", async () => {
    const cid = "NURSE_LIC_OVERLAP";
    await h.createEmployee(cid, "พยาบาลวิชาชีพ");
    await h.addMovement(cid, "ENTRY", "2023-01-01");
    await h.addEligibility(cid, 3000, "2024-01-01");
    await h.addLicense(cid, "2024-06-01", "2024-06-30");
    await h.addLicense(cid, "2024-06-10", "2024-06-20");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 6, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.validLicenseDays).toBe(30);
    expect(data.netPayment).toBe(3000);
  });

  test("TC-LIC-01: Non-target profession bypasses license expiry (doctor)", async () => {
    const cid = "DOC_NO_LICENSE";
    await h.createEmployee(cid, "นายแพทย์ปฏิบัติการ");
    await h.addEligibility(cid, 10000, "2024-01-01");
    // No license on purpose.

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.netPayment).toBe(10000);
  });

  test("TC-LIC-02: Nursing requires valid license (expired -> no pay)", async () => {
    const cid = "NURSE_EXPIRED";
    await h.createEmployee(cid, "พยาบาลวิชาชีพ");
    await h.addEligibility(cid, 1500, "2024-01-01");
    await h.addLicense(cid, "2019-01-01", "2023-12-31");

    const res = await request(app)
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ year: 2024, month: 1, citizen_id: cid })
      .expect(200);

    const data = res.body.data[0];
    expect(data.netPayment).toBe(0);
  });
});
