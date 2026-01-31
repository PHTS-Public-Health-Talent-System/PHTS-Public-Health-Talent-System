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

describe("Payroll Integration Suite", () => {
  const adminToken = signAdminToken();

  describe("Core Basics", () => {
    test("TC-PAY-01: Basic Calculation (Current Month)", async () => {
      await h.addEligibility("DOC1", 5000, "2024-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 1, citizen_id: "DOC1" })
        .expect(200);

      const resultData = res.body.data[0];
      expect(resultData.netPayment).toBe(5000);
      expect(resultData.total_payable).toBe(5000);
    });

    test("TC-PAY-00: Period Calculation (No citizen_id)", async () => {
      const cid = "PERIOD_USER";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2024-01-01");
      await h.addLicense(cid, "2024-01-01", "2030-12-31");
      await h.addMovement(cid, "ENTRY", "2024-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period_id).toBeDefined();
    });

    test("TC-PAY-00B: Period Summary By Profession", async () => {
      const periodId = await h.createPeriod(2024, 1, "CLOSED");
      const cid1 = "SUM_NURSE_1";
      const cid2 = "SUM_NURSE_2";
      const cid3 = "SUM_DOCTOR_1";

      await h.createEmployee(cid1, "พยาบาลวิชาชีพ");
      await h.createEmployee(cid2, "พยาบาลวิชาชีพ");
      await h.createEmployee(cid3, "นายแพทย์");

      await pool.query(
        `INSERT INTO pay_results (period_id, citizen_id, pts_rate_snapshot, calculated_amount, total_payable, deducted_days)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [periodId, cid1, 1000, 1000, 1000, 0],
      );
      await pool.query(
        `INSERT INTO pay_results (period_id, citizen_id, pts_rate_snapshot, calculated_amount, total_payable, deducted_days)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [periodId, cid2, 2000, 2000, 2000, 1],
      );
      await pool.query(
        `INSERT INTO pay_results (period_id, citizen_id, pts_rate_snapshot, calculated_amount, total_payable, deducted_days)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [periodId, cid3, 10000, 10000, 10000, 0],
      );

      const res = await request(app)
        .get(`/api/payroll/period/${periodId}/summary-by-profession`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const rows = res.body.data;
      const nurse = rows.find((r: any) => r.position_name === "พยาบาลวิชาชีพ");
      const doctor = rows.find((r: any) => r.position_name === "นายแพทย์");

      expect(Number(nurse.headcount)).toBe(2);
      expect(Number(nurse.total_payable)).toBe(3000);
      expect(Number(nurse.deducted_count)).toBe(1);
      expect(Number(nurse.deducted_total)).toBe(2000);

      expect(Number(doctor.headcount)).toBe(1);
      expect(Number(doctor.total_payable)).toBe(10000);
      expect(Number(doctor.deducted_count)).toBe(0);
    });

    test("TC-PAY-02: Inactive Eligibility Still Counts for Historical Month", async () => {
      const cid = "INACTIVE_ELIGIBLE";
      await h.createEmployee(cid, "นายแพทย์ชำนาญการ");
      await h.addEligibility(cid, 5000, "2024-01-01", "2024-10-15");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      await pool.query(
        `UPDATE req_eligibility SET is_active = 0 WHERE citizen_id = ?`,
        [cid],
      );

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 9, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(5000);
    });

    test("TC-PAY-04: Mid-Month Entry (Pro-rated)", async () => {
      const cid = "NEW_STAFF";
      await h.createEmployee(cid, "พนักงานทั่วไป");
      await h.addEligibility(cid, 31000, "2024-01-01");
      await h.addMovement(cid, "ENTRY", "2024-01-16");
      await h.addLicense(cid, "2024-01-01", "2030-12-31");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 1, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(16);
      expect(data.netPayment).toBe(16000);
    });
  });

  describe("Complex Scenarios (Swap & Gap)", () => {
    test("TC-MOV-03: Employment Swap (resign 15, re-entry 16 -> full month)", async () => {
      const cid = "SWAP_USER_NEXT_DAY";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2024-01-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RESIGN", "2024-05-15");
      await h.addMovement(cid, "ENTRY", "2024-05-16");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 5, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(Number(data.eligibleDays)).toBe(31);
      expect(Number(data.netPayment)).toBe(5000);
    });

    test("TC-MOV-05: Same Day Swap (Resign 15, Entry 15 -> Full Month)", async () => {
      const cid = "SWAP_USER_SAME_DAY";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 31000, "2024-01-01");
      await h.addLicense(cid, "2024-01-01", "2030-12-31");

      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RESIGN", "2024-01-15");
      await h.addMovement(cid, "ENTRY", "2024-01-15");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 1, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(31);
      expect(data.netPayment).toBe(31000);
    });

    test("TC-MOV-04: Service Gap (resign 10, re-entry 20 -> prorated)", async () => {
      const cid = "GAP_USER";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2024-01-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RESIGN", "2024-05-10");
      await h.addMovement(cid, "ENTRY", "2024-05-20");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 5, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(Number(data.eligibleDays)).toBe(21);
      expect(Number(data.netPayment)).toBeCloseTo(3387.1, 1);
    });

    test("TC-GAP-DAY: 1 Day Gap (Resign 15, Entry 17 -> 29 days)", async () => {
      const cid = "GAP_USER_1_DAY";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2024-01-01");
      await h.addLicense(cid, "2023-01-01", "2030-12-31");

      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RESIGN", "2024-01-15");
      await h.addMovement(cid, "ENTRY", "2024-01-17");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 1, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(29);
    });
  });

  describe("Retroactive Scenarios", () => {
    test("TC-RETRO-01: Retroactive Upgrade", async () => {
      const cid = "RETRO_UP";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2024-07-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      // Simulate July Payroll: Paid 5000 manually
      const periodId = await h.createPeriod(2024, 7);
      await h.addPayout(periodId, cid, 5000);

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(Number(data.netPayment)).toBe(10000);
      expect(Number(data.retroactiveTotal)).toBe(5000);
    });

    test("TC-RETRO-02: Clawback (Overpayment)", async () => {
      const cid = "RETRO_DOWN";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 10000, "2024-07-01");
      // License expires mid-july (15th)
      await h.addLicense(cid, "2020-01-01", "2024-07-15");

      // Simulate July Payroll: Paid 10000 (Full) -> Overpayment
      const periodId = await h.createPeriod(2024, 7);
      await h.addPayout(periodId, cid, 10000);

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(Number(data.netPayment)).toBe(0);
      expect(Number(data.retroactiveTotal)).toBeLessThan(0);
      expect(Number(data.retroactiveTotal)).toBeCloseTo(-5161.29, 0);
    });
  });

  describe("Edge Cases", () => {
    test("TC-PAY-03: Lifetime License Check (Doctor)", async () => {
      const cid = "DOC_LIFE";
      await h.createEmployee(cid, "นายแพทย์ชำนาญการ");
      await h.addEligibility(cid, 10000, "2024-01-01");
      // Expired license
      await h.addLicense(cid, "2010-01-01", "2020-01-01", "EXPIRED");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 3, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      // Expect full payment because Doctor is lifetime eligible logic (from scenarios.test.ts)
      // Wait, is 'Doctor' special?
      // Checking scenarios.test.ts: Yes, TC-PAY-03 assumes implicit lifetime or logic override.
      // Re-reading logic... If not found, it might fail.
      // Actually, if implementation allows it.
      expect(data.netPayment).toBe(10000);
    });

    test("TC-REAL-03: Mid-Month Promotion (Rate Change)", async () => {
      const cid = "DOC_PROMO";
      await h.createEmployee(cid);
      // Valid License
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      // Rate 5000 until 15th
      await h.addEligibility(cid, 5000, "2024-01-01", "2024-09-15");
      // Rate 10000 from 16th
      await h.addEligibility(cid, 10000, "2024-09-16");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 9, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(30);
      // Half 5000 (2500) + Half 10000 (5000) = 7500
      expect(data.netPayment).toBe(7500.0);
    });

    test("TC-BRUTAL-02: Leap Year 2024 & License Gap", async () => {
      const cid = "LEAP_GAP";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 29000, "2024-01-01");

      // License 1: Jan 1 - Feb 14
      await h.addLicense(cid, "2024-01-01", "2024-02-14");
      // License 2: Feb 20 - Dec 31 (Gap Feb 15-19 = 5 days)
      await h.addLicense(cid, "2024-02-20", "2024-12-31");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 2, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      // Feb 2024 has 29 days.
      // Gap 5 days -> 24 days eligible.
      // 29000 / 29 * 24 = 24000
      expect(data.eligibleDays).toBe(24);
      expect(data.netPayment).toBe(24000);
    });
  });
});
