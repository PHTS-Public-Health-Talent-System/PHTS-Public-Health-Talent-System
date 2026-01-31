import request from "supertest";
import path from "path";
import { Pool } from "mysql2/promise";
import {
  createTestPool,
  setupSchema,
  cleanTables,
  DB_NAME,
  signToken,
} from "../utils.js";

let pool: Pool;
let app: any;

jest.setTimeout(15000);

beforeAll(async () => {
  process.env.DB_NAME = DB_NAME;
  pool = await createTestPool();
  await setupSchema(pool);
  await cleanTables(pool);

  jest.doMock("../../../../config/database.js", () => ({
    __esModule: true,
    default: pool,
    query: async (sql: string, params?: any[]) => {
      const [results] = await pool.execute(sql, params);
      return results;
    },
    execute: pool.execute.bind(pool),
    getConnection: pool.getConnection.bind(pool),
  }));

  const appPath = path.join(process.cwd(), "src/index.ts");
  const imported = await import(appPath);
  app = imported.default;
});

beforeEach(async () => {
  await cleanTables(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Request Verification Snapshot", () => {
  test("creates snapshot for request", async () => {
    const [userRow]: any = await pool.query(
      `INSERT INTO users (citizen_id, role, password_hash) VALUES ('OFF01', 'PTS_OFFICER', 'test-hash')`,
    );
    const officerId = userRow.insertId as number;

    await pool.query(
      `INSERT INTO emp_profiles (citizen_id, first_name, last_name) VALUES ('CID001', 'A', 'B')`,
    );

    const [reqRow]: any = await pool.query(
      `INSERT INTO req_submissions
       (user_id, citizen_id, request_no, request_type, status, current_step, requested_amount, effective_date)
       VALUES (?, 'CID001', 'REQ-001', 'NEW_ENTRY', 'PENDING', 3, 2000, '2024-01-01')`,
      [officerId],
    );
    const requestId = reqRow.insertId as number;

    const token = signToken({
      userId: officerId,
      role: "PTS_OFFICER",
      citizenId: "OFF01",
    });

    const res = await request(app)
      .post(`/api/requests/${requestId}/verification-snapshot`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        master_rate_id: 1,
        effective_date: "2024-01-01",
        snapshot_data: { group_no: 3, item_no: "3.1" },
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.request_id).toBe(requestId);
    expect(res.body.data.master_rate_id).toBe(1);
  });
});
