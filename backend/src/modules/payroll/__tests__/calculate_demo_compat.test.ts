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

describe("Calculate Demo Compatibility", () => {
  const adminToken = signAdminToken();

  describe("Core calculations", () => {
    test("TC-CORE-01: Full month, active license, no leave -> full payment", async () => {
      const cid = "CORE_FULL_MONTH";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 1500, "2025-01-01");
      await h.addLicense(cid, "2025-01-01", "2025-12-31");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBe(1500);
      expect(data.totalDeductionDays).toBe(0);
    });

    test("TC-CORE-02: Specialist rate applied", async () => {
      const cid = "CORE_SPECIAL_RATE";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 3000, "2025-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].netPayment).toBe(3000);
    });

    test("TC-CORE-06: Response includes pts group/item from rate", async () => {
      const cid = "CORE_PTS_GROUP_ITEM";
      await h.createEmployee(cid);

      const [resRate]: any = await pool.query(
        `INSERT INTO cfg_payment_rates (profession_code, group_no, item_no, amount)
         VALUES ('DOCTOR', 3, '3.1', 15000)`,
      );
      await pool.query(
        `INSERT INTO req_eligibility (citizen_id, master_rate_id, effective_date, is_active)
         VALUES (?, ?, ?, 1)`,
        [cid, resRate.insertId, "2025-01-01"],
      );

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.ptsGroupNo).toBe(3);
      expect(data.ptsItemNo).toBe("3.1");
    });

    test("TC-CORE-03: Ineligible staff (rate 0)", async () => {
      const cid = "CORE_RATE_ZERO";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 0, "2025-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].netPayment).toBe(0);
    });

    test("TC-CORE-05: Rounding precision (single eligible day)", async () => {
      const cid = "CORE_ROUNDING";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 10000, "2025-01-01");
      await h.addLicense(cid, "2025-04-01", "2025-04-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 4, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.validLicenseDays).toBe(1);
      expect(data.netPayment).toBeCloseTo(333.33, 2);
    });
  });

  describe("Rate changes & precision", () => {
    test("TC-ADV-02: Split rate mid-month (upgrade)", async () => {
      const cid = "RATE_SPLIT";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2025-08-01", "2025-08-15");
      await h.addEligibility(cid, 10000, "2025-08-16");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 8, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].netPayment).toBeCloseTo(7580.65, 2);
    });

    test("TC-INT-04: Satang precision accumulation", async () => {
      const cid = "PRECISION_FULL";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 1234, "2025-01-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].netPayment).toBeCloseTo(1234, 2);
    });
  });

  describe("Movement handling", () => {
    test("TC-MOV-02: Resign mid-month -> pay until day before resign", async () => {
      const cid = "MOV_RESIGN";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 31000, "2025-01-01");
      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RESIGN", "2025-08-20");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(19);
    });

    test("TC-MOV-05: Retire next month -> full pay this month", async () => {
      const cid = "MOV_RETIRE_NEXT";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2025-01-01");
      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RETIRE", "2025-10-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 9, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(30);
      expect(data.netPayment).toBe(5000);
    });

    test("TC-MOV-06: Retire first day -> zero payment", async () => {
      const cid = "MOV_RETIRE_DAY1";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 5000, "2025-01-01");
      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "RETIRE", "2025-10-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 10, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].netPayment).toBe(0);
    });

    test("TC-MOV-07: Double movements choose latest active period", async () => {
      const cid = "MOV_DOUBLE";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2025-01-01");
      await h.addMovement(cid, "ENTRY", "2024-01-01");
      await h.addMovement(cid, "TRANSFER_OUT", "2025-07-15");
      await h.addMovement(cid, "ENTRY", "2025-08-20");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 8, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.eligibleDays).toBe(12);
    });
  });

  describe("Leave & calendar logic", () => {
    test("TC-LEV-02: Sick leave exceeds 60 business days -> deduction", async () => {
      const cid = "SICK_OVER_60";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2025-01-01");
      await h.addLeaveQuota(cid, 2568, 60, 45, 10);
      await h.addLeaveRecord(
        cid,
        "sick",
        "2025-04-01",
        "2025-07-31",
        122,
        2568,
      );

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].totalDeductionDays).toBeGreaterThan(0);
    });

    test("TC-LEV-03: Personal leave exceeds 45 days -> deduction", async () => {
      const cid = "PERSONAL_OVER_45";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2025-01-01");
      await h.addLeaveQuota(cid, 2568, 60, 45, 10);
      await h.addLeaveRecord(
        cid,
        "personal",
        "2025-05-01",
        "2025-07-31",
        92,
        2568,
      );

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].totalDeductionDays).toBeGreaterThan(0);
    });

    test("TC-INT-03: Ordain leave counts calendar days (holidays included)", async () => {
      const cid = "ORDAIN_CALENDAR";
      await h.createEmployee(cid);
      await h.addEligibility(cid, 10000, "2025-01-01");
      await h.addHoliday("2025-04-13", "Songkran");
      await h.addHoliday("2025-04-14", "Songkran");
      await h.addHoliday("2025-04-15", "Songkran");

      await pool.query(
        `UPDATE emp_profiles SET start_work_date = ? WHERE citizen_id = ?`,
        ["2024-10-01", cid],
      );

      await h.addLeaveRecord(
        cid,
        "ordain",
        "2025-04-10",
        "2025-04-18",
        9,
        2568,
      );

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 4, citizen_id: cid })
        .expect(200);

      expect(res.body.data[0].totalDeductionDays).toBe(9);
    });
  });

  describe("Complex scenarios", () => {
    test("TC-INT-01: Leap year February uses 29 days", async () => {
      const cid = "LEAP_FEB";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 2900, "2024-01-01");
      await h.addLicense(cid, "2024-02-01", "2024-02-01");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2024, month: 2, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.validLicenseDays).toBe(1);
      expect(data.netPayment).toBeCloseTo(100, 2);
    });

    test("TC-INT-02: Perfect storm (resign + license gap + leave exceed)", async () => {
      const cid = "PERFECT_STORM";
      await h.createEmployee(cid, "พยาบาลวิชาชีพ");
      await h.addEligibility(cid, 1500, "2025-01-01");
      await h.addMovement(cid, "ENTRY", "2020-01-01");
      await h.addMovement(cid, "RESIGN", "2025-07-15");

      await h.addLeaveRecord(
        cid,
        "education",
        "2025-06-01",
        "2025-08-31",
        92,
        2568,
      );
      await h.addLicense(cid, "2025-07-01", "2025-07-10");
      await h.addLicense(cid, "2025-07-20", "2025-12-31");

      const res = await request(app)
        .post("/api/payroll/calculate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ year: 2025, month: 7, citizen_id: cid })
        .expect(200);

      const data = res.body.data[0];
      expect(data.netPayment).toBeGreaterThan(0);
      expect(data.netPayment).toBeLessThan(1500);
      expect(data.totalDeductionDays).toBeGreaterThan(0);
    });
  });
});
