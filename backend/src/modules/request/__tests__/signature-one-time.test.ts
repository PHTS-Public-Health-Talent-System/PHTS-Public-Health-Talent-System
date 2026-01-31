import { Pool } from "mysql2/promise";
import path from "path";
import { createTestPool, setupSchema, cleanTables, DB_NAME } from "./utils.ts";
import { PersonnelType, RequestType } from "../request.types.js";

let pool: Pool;

beforeAll(async () => {
  process.env.DB_NAME = DB_NAME;
  pool = await createTestPool();
  await setupSchema(pool);
  await cleanTables(pool);

  jest.doMock("../../../config/database.js", () => ({
    __esModule: true,
    default: pool,
    query: async (sql: string, params?: any[]) => { const [results] = await pool.execute(sql, params); return results; },
    execute: pool.execute.bind(pool),
    getConnection: pool.getConnection.bind(pool),
  }));

  const appPath = path.join(process.cwd(), "src/index.ts");
  const imported = await import(appPath);
  void imported.default;
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Request signature one-time usage", () => {
  it("stores applicant signature as attachment when save_signature is false", async () => {
    const [userResult]: any = await pool.query(
      `INSERT INTO users (citizen_id, role, password_hash) VALUES ('SIG_USER_1', 'USER', 'test-hash')`,
    );
    const userId = userResult.insertId;

    const { requestCommandService } = await import("../services/command.service.js");
    const createRequest = requestCommandService.createRequest.bind(requestCommandService);

    const signatureFile = {
      fieldname: "applicant_signature",
      originalname: "sig.png",
      path: "/tmp/sig-one-time.png",
    } as Express.Multer.File;

    const request = await createRequest(
      userId,
      {
        personnel_type: PersonnelType.CIVIL_SERVANT,
        request_type: RequestType.NEW_ENTRY,
        effective_date: "2024-01-01",
        requested_amount: 0,
      },
      [],
      signatureFile,
      { saveSignature: false },
    );

    expect(request.applicant_signature_id).toBeNull();

    const [sigRows] = await pool.query(
      "SELECT 1 FROM sig_images WHERE user_id = ?",
      [userId],
    );
    expect((sigRows as any[]).length).toBe(0);

    const [attachments] = await pool.query(
      "SELECT file_type, file_path FROM req_attachments WHERE request_id = ?",
      [request.request_id],
    );

    expect((attachments as any[]).length).toBe(1);
    expect((attachments as any[])[0].file_type).toBe("SIGNATURE");
  });
});
