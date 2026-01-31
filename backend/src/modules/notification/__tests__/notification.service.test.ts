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
let notificationService: any;
let h: TestHelper;

beforeAll(async () => {
  pool = await createTestPool();
  await setupSchema(pool);
  await cleanTables(pool);
  await seedBaseData(pool);
  h = new TestHelper(pool);

  notificationService = await import("../services/notification.service.js");
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Notification Service: Transaction Safety", () => {
  test("Phantom Notification: Notification persists after rollback (Bug Reproduction)", async () => {
    // 1. Start a transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // 2. Insert notification using the transaction connection
    await notificationService.NotificationService.notifyUser(
      99,
      "Phantom",
      "Message",
      "#",
      "INFO",
      conn,
    );

    // 3. Rollback
    await conn.rollback();
    conn.release();

    // 4. Check if notification exists
    const [rows]: any[] = await pool.query(
      'SELECT * FROM ntf_messages WHERE title = "Phantom"',
    );

    // FIX VERIFICATION: It should NOT exist anymore
    expect(rows.length).toBe(0);
  });
});
