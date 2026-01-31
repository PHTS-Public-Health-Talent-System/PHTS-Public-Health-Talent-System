import request from "supertest";
import path from "path";
import jwt from "jsonwebtoken";
import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  cleanTables,
  seedBaseData,
  resetTestData,
  JWT_SECRET,
  TestHelper,
} from "../../payroll/__tests__/utils.js";

let pool: Pool;
let app: any;
let h: TestHelper;

const signOfficerToken = (userId: number, citizenId: string) =>
  jwt.sign({ userId, citizenId, role: "PTS_OFFICER" }, JWT_SECRET, {
    expiresIn: "1h",
  });

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

describe("License alerts (PTS_OFFICER)", () => {
  const toYmd = (date: Date) => date.toISOString().slice(0, 10);
  const addDays = (base: Date, days: number) =>
    new Date(base.getTime() + days * 86400000);

  test("summary buckets for target professions", async () => {
    console.log("DEBUG: Starting summary buckets test");
    try {
      const officerId = 9001;
      await pool.query(
        `INSERT INTO users (id, citizen_id, role, password_hash) VALUES (?, 'OFFICER_1', 'PTS_OFFICER', 'test-hash')`,
        [officerId],
      );

    await h.createEmployee("NURSE_EXPIRED", "พยาบาลวิชาชีพ");
    await h.createEmployee("NURSE_NO_LICENSE", "พยาบาลวิชาชีพ");
    await h.createEmployee("MEDTECH_30", "นักเทคนิคการแพทย์");
    await h.createEmployee("MEDTECH_60", "นักเทคนิคการแพทย์");
    await h.createEmployee("MEDTECH_90", "นักเทคนิคการแพทย์");
    await h.createEmployee("MEDTECH_120", "นักเทคนิคการแพทย์");
    await h.createEmployee("DOC_OTHER", "นายแพทย์ปฏิบัติการ");

    const today = new Date();
    const expired = toYmd(addDays(today, -10));
    const exp30 = toYmd(addDays(today, 20));
    const exp60 = toYmd(addDays(today, 45));
    const exp90 = toYmd(addDays(today, 80));
    const exp120 = toYmd(addDays(today, 120));

    await pool.query(
      `INSERT INTO emp_licenses (citizen_id, valid_from, valid_until, status) VALUES
        ('NURSE_EXPIRED', '2019-01-01', ?, 'ACTIVE'),
        ('MEDTECH_30', '2020-01-01', ?, 'ACTIVE'),
        ('MEDTECH_60', '2020-01-01', ?, 'ACTIVE'),
        ('MEDTECH_90', '2020-01-01', ?, 'ACTIVE'),
        ('MEDTECH_120', '2020-01-01', ?, 'ACTIVE')`,
      [expired, exp30, exp60, exp90, exp120],
    );

    const token = signOfficerToken(officerId, "OFFICER_1");

    const res = await request(app)
      .get("/api/license-alerts/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      expired: 2,
      expiring_30: 1,
      expiring_60: 1,
      expiring_90: 1,
      total: 5,
    });
    } catch (e) {
      console.error("DEBUG: CAUGHT ERROR", e);
      throw e;
    }
  });

  test("list expired bucket excludes non-target professions", async () => {
    const officerId = 9002;
    await pool.query(
      `INSERT INTO users (id, citizen_id, role, password_hash) VALUES (?, 'OFFICER_2', 'PTS_OFFICER', 'test-hash')`,
      [officerId],
    );

    await h.createEmployee("NURSE_EXPIRED", "พยาบาลวิชาชีพ");
    await h.createEmployee("DOC_OTHER", "นายแพทย์ปฏิบัติการ");

    const expired = toYmd(addDays(new Date(), -10));
    await pool.query(
      `INSERT INTO emp_licenses (citizen_id, valid_from, valid_until, status) VALUES
        ('NURSE_EXPIRED', '2019-01-01', ?, 'ACTIVE'),
        ('DOC_OTHER', '2019-01-01', ?, 'ACTIVE')`,
      [expired, expired],
    );

    const token = signOfficerToken(officerId, "OFFICER_2");

    const res = await request(app)
      .get("/api/license-alerts/list?bucket=expired")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const ids = res.body.data.map((row: any) => row.citizen_id);
    expect(ids).toEqual(["NURSE_EXPIRED"]);
  });
});
