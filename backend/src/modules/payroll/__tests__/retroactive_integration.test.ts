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

describe("Payroll Integration: Retroactive & Fiscal", () => {
  const adminToken = signAdminToken();

  describe("Standard Retroactive Scenarios", () => {
    test("TC-PAY-02: Retroactive Logic (Fix Verification)", async () => {
      const cid = "RETRO_USER_02";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addLicense(cid, "2023-01-01", "2030-12-31");

      // Last month (Jan) closed & paid 5000 (Rate 5000)
      const pJan = await h.createPeriod(2024, 1, "CLOSED");
      await h.addPayout(pJan, cid, 5000);

      // Current month (Feb), user upgraded to Rate 10000 effective Jan 1
      await h.addEligibility(cid, 10000, "2024-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 2, citizen_id: cid })
        .expect(200);

      const resultData = res.body.data[0];
      // Feb Salary: 10000
      // Retro Jan: 10000 - 5000 = 5000
      // Total: 15000
      expect(resultData.netPayment).toBe(10000);
      expect(resultData.retroactiveTotal).toBe(5000);
      expect(resultData.total_payable).toBe(15000);
    });

    test("TC-PAY-08: Retroactive Deduction (Clawback/Overpayment)", async () => {
      const cid = "CLAWBACK_USER";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      // Last month (Jan) closed & paid 10000 (Full)
      const pJan = await h.createPeriod(2024, 1, "CLOSED");
      await h.addPayout(pJan, cid, 10000);

      // Actually eligible for only 5000 in Jan
      await h.addEligibility(cid, 5000, "2024-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 2, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      // Feb Salary: 5000
      // Retro Jan: 5000 - 10000 = -5000
      // Total: 0
      expect(data.netPayment).toBe(5000);
      expect(data.retroactiveTotal).toBe(-5000);
      expect(data.total_payable).toBe(0);
    });

    test("TC-REAL-01: Split Month & Retroactive (Doctor Split Periods)", async () => {
      const cid = "DOC_SPLIT";
      await h.createEmployee(cid, "นายแพทย์ชำนาญการพิเศษ");
      await h.addEligibility(cid, 10000, "2024-01-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      // Movements: Entry Jun 1, Transfer Out Jun 7, Entry Aug 25
      await h.addMovement(cid, "ENTRY", "2024-06-01");
      await h.addMovement(cid, "TRANSFER_OUT", "2024-06-07");
      await h.addMovement(cid, "ENTRY", "2024-08-25");

      // June and July closed
      await h.createPeriod(2024, 6, "CLOSED");
      await h.createPeriod(2024, 7, "CLOSED");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];

      // Aug: 25-31 (7 days). 10000 * (7/31) = 2258.06
      expect(data.netPayment).toBe(2258.06);
      expect(data.eligibleDays).toBe(7);

      expect(data.retroactiveTotal).toBe(2000.0);

      const retroJune = data.retroDetails.find((d: any) => d.month === 6);
      expect(retroJune).toBeDefined();
      expect(retroJune.diff).toBe(2000.0);
    });

    test("TC-RETRO-03: Multi-month retro (June+July unpaid, Aug current)", async () => {
      const cid = "RETRO_MULTI";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addEligibility(cid, 5000, "2024-06-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      await h.createPeriod(2024, 6, "CLOSED");
      await h.createPeriod(2024, 7, "CLOSED");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(5000);
      expect(data.retroactiveTotal).toBe(10000);
      expect(data.total_payable).toBe(15000);

      const retroJune = data.retroDetails.find((d: any) => d.month === 6);
      const retroJuly = data.retroDetails.find((d: any) => d.month === 7);
      expect(retroJune?.diff).toBe(5000);
      expect(retroJuly?.diff).toBe(5000);
    });

    test("TC-RETRO-04: License continuity fixed (retroactive add for July)", async () => {
      const cid = "RETRO_LICENSE_FIX";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addEligibility(cid, 1500, "2024-07-01");
      await h.addLicense(cid, "2024-07-01", "2024-07-19");
      await h.addLicense(cid, "2024-07-20", "2029-12-31");

      const pJuly = await h.createPeriod(2024, 7, "CLOSED");
      await h.addPayout(pJuly, cid, 919.35);

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(1500);
      expect(data.retroactiveTotal).toBeCloseTo(580.65, 2);
      expect(data.total_payable).toBeCloseTo(2080.65, 2);
    });
  });

  describe("Complex Fiscal & Sequential Scenarios", () => {
    test("TC-BRUTAL-01: Double Retro Trap (Prevent Duplicates)", async () => {
      const cid = "DOUBLE_RETRO";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addEligibility(cid, 10000, "2024-01-01");
      await h.addLicense(cid, "2020-01-01", "2030-12-31");

      // Jan: Paid 5000 (Rate 5000)
      const pJan = await h.createPeriod(2024, 1, "CLOSED");
      await h.addPayout(pJan, cid, 5000);

      // Feb: Paid 10000 (Rate 10000) + Retro Jan (5000)
      const pFeb = await h.createPeriod(2024, 2, "CLOSED");
      await pool.query(
        `INSERT INTO pay_results (period_id, citizen_id, pts_rate_snapshot, calculated_amount, total_payable, retroactive_amount)
         VALUES (?, ?, 10000, 10000, 15000, 5000)`,
        [pFeb, cid],
      );
      const [rows]: any[] = await pool.query(
        "SELECT payout_id FROM pay_results WHERE period_id = ?",
        [pFeb],
      );

      await h.addRetroItem(rows[0].payout_id, 5000, 1, 2024);

      // Now Calc March. Should NOT pay Retro Jan again.
      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 3, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(10000);
      expect(data.retroactiveTotal).toBe(0);
    });

    test("TC-BRUTAL-03: Sequential Retroactive (Adjust on Adjust)", async () => {
      const cid = "SEQ_RETRO";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addLicense(cid, "2023-01-01", "2030-12-31");

      // Jan: Paid 5000
      const pJan = await h.createPeriod(2024, 1, "CLOSED");
      await h.addPayout(pJan, cid, 5000);

      // Feb: Paid 10000 + Retro Jan (5000) = 15000
      const pFeb = await h.createPeriod(2024, 2, "CLOSED");
      await pool.query(
        `INSERT INTO pay_results (period_id, citizen_id, pts_rate_snapshot, calculated_amount, total_payable, retroactive_amount)
         VALUES (?, ?, 10000, 10000, 15000, 5000)`,
        [pFeb, cid],
      );
      const [rowsFeb]: any[] = await pool.query(
        "SELECT payout_id FROM pay_results WHERE period_id = ?",
        [pFeb],
      );
      await h.addRetroItem(rowsFeb[0].payout_id, 5000, 1, 2024);

      // Upgrade to 15000
      await h.addEligibility(cid, 15000, "2024-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 3, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(15000);

      const retroJan = data.retroDetails.find((d: any) => d.month === 1);
      const retroFeb = data.retroDetails.find((d: any) => d.month === 2);

      expect(retroJan?.diff).toBe(5000);
      expect(retroFeb?.diff).toBe(5000);
      expect(data.retroactiveTotal).toBe(10000);
    });

    test("TC-PAY-09: Fiscal Year Reset (Leave Quota Reset on Oct 1st)", async () => {
      const cid = "FISCAL_USER";
      await h.createEmployee(cid);
      await h.addMovement(cid, "ENTRY", "2023-01-01");
      await h.addEligibility(cid, 30000, "2023-01-01");
      await h.addLicense(cid, "2023-01-01", "2030-12-31");

      // Quota 2567 consumed (0 left)
      await h.addLeaveQuota(cid, 2567, 0);
      await h.addLeaveRecord(cid, "sick", "2024-09-25", "2024-09-26", 2, 2567);

      // New fiscal year quota (2568) refreshed
      await h.addLeaveQuota(cid, 2568, 60);
      await h.addLeaveRecord(cid, "sick", "2024-10-01", "2024-10-02", 2, 2568);

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 10, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.totalDeductionDays).toBe(0);
      expect(data.netPayment).toBe(30000);
    });
  });
});
