import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  cleanTables,
  seedBaseData,
  resetTestData,
  TestHelper,
} from "../../payroll/__tests__/utils.js";
let pool: Pool;
let h: TestHelper;
let sendLicenseAlertDigest: (options?: { now?: Date }) => Promise<any>;

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

  const digestModule = await import("../services/license-alerts.digest.service.js");
  sendLicenseAlertDigest = digestModule.sendLicenseAlertDigest;
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("License alerts digest", () => {
  const addOfficer = async (id: number, citizenId: string) => {
    await pool.query(
      `INSERT INTO users (id, citizen_id, role, password_hash) VALUES (?, ?, 'PTS_OFFICER', 'test-hash')`,
      [id, citizenId],
    );
  };

  test("daily digest when expiring within 30 days", async () => {
    await addOfficer(9101, "OFFICER_DAILY");
    await h.createEmployee("NURSE_30", "พยาบาลวิชาชีพ");
    await pool.query(
      `INSERT INTO emp_licenses (citizen_id, valid_from, valid_until, status)
       VALUES ('NURSE_30', '2020-01-01', '2024-02-10', 'ACTIVE')`,
    );

    const result = await sendLicenseAlertDigest({
      now: new Date("2024-02-01T00:00:00Z"),
    });
    expect(result.sent).toBe(1);

    const [rows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM ntf_messages WHERE user_id = 9101`,
    );
    expect(rows[0].count).toBe(1);
  });

  test("weekly digest when only expiring within 90 days (no <=30)", async () => {
    await addOfficer(9102, "OFFICER_WEEKLY");
    await h.createEmployee("MEDTECH_90", "นักเทคนิคการแพทย์");
    await pool.query(
      `INSERT INTO emp_licenses (citizen_id, valid_from, valid_until, status)
       VALUES ('MEDTECH_90', '2020-01-01', '2024-04-20', 'ACTIVE')`,
    );

    // 2024-02-05 is Monday
    const result = await sendLicenseAlertDigest({
      now: new Date("2024-02-05T00:00:00Z"),
    });
    expect(result.sent).toBe(1);

    const [rows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM ntf_messages WHERE user_id = 9102`,
    );
    expect(rows[0].count).toBe(1);
  });
});
