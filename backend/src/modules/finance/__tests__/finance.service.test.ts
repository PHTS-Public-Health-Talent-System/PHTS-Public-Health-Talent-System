import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  seedBaseData,
  cleanTables,
  resetTestData,
  TestHelper,
} from "../../payroll/__tests__/utils.js";

let pool: Pool;
let financeService: any;
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

  // Dynamic import to pick up test DB env
  financeService = await import("../services/finance.service.js");
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Finance Service: Batch Operations", () => {
  test("batchMarkAsPaid should update status for multiple valid payouts", async () => {
    // Setup 3 payouts
    const cid1 = "U1";
    const cid2 = "U2";
    const cid3 = "U3";

    await h.createEmployee(cid1);
    await h.createEmployee(cid2);
    await h.createEmployee(cid3);

    const periodId = await h.createPeriod(2024, 1, "CLOSED");

    // Add payouts using helper
    await h.addPayout(periodId, cid1, 1000);
    await h.addPayout(periodId, cid2, 2000);
    await h.addPayout(periodId, cid3, 3000);

    // Manually set status to PENDING (Helper sets to PAID by default? Let's check helper)
    // Helper: INSERT ... payment_status = 'PAID'
    // I need to update them to PENDING first to test "Mark as Paid".
    await pool.query(`UPDATE pay_results SET payment_status = 'PENDING'`);

    // Get Payout IDs
    const [rows]: any[] = await pool.query(
      `SELECT payout_id FROM pay_results ORDER BY citizen_id`,
    );
    const ids = rows.map((r: any) => r.payout_id);

    // Action
    const result = await financeService.batchMarkAsPaid(ids, 99); // 99 = Admin ID

    // Verify
    expect(result.success.length).toBe(3);
    expect(result.failed.length).toBe(0);

    const [updated]: any[] = await pool.query(
      `SELECT payment_status, paid_by FROM pay_results`,
    );
    for (const row of updated) {
      expect(row.payment_status).toBe("PAID");
      expect(row.paid_by).toBe(99);
    }
  });

  test("batchMarkAsPaid should handle mixed success/failure", async () => {
    const cid1 = "U1";
    await h.createEmployee(cid1);
    const periodId = await h.createPeriod(2024, 1, "CLOSED");
    await h.addPayout(periodId, cid1, 1000); // Defaults to PAID

    const [rows]: any[] = await pool.query(`SELECT payout_id FROM pay_results`);
    const id = rows[0].payout_id;

    // Try to pay an already PAID payout (Should fail)

    const result = await financeService.batchMarkAsPaid([id], 99);

    expect(result.success.length).toBe(0);
    expect(result.failed.length).toBe(1);
    expect(result.failed[0].reason).toMatch(/already paid/i);
  });
});
