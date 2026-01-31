/**
 * request/__tests__/e2e/full-workflow.e2e.test.ts
 */
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "mysql2/promise";
import { createTestPool, setupSchema, cleanTables, DB_NAME } from "../utils.js"; // Adjusted import
import { errorHandler } from "../../../../middlewares/errorHandler.js";
import { PersonnelType, RequestStatus, RequestType } from "../../request.types.js";

// Mocks
const mockProcessAttachmentOcr = jest.fn();

jest.setTimeout(20000);

jest.mock("../../../../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  protect: (req: Request, res: Response, next: NextFunction) => {
    const userId = req.header("x-user-id");
    const role = req.header("x-role");
    const citizenId = req.header("x-citizen-id");
    if (!userId || !role || !citizenId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    req.user = {
      userId: Number(userId),
      role,
      citizenId,
    };
    next();
  },
  restrictTo: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

jest.mock("../../ocr/ocr.service.js", () => ({
  __esModule: true,
  isOcrEnabled: jest.fn(() => true),
  processAttachmentOcr: (...args: any[]) => mockProcessAttachmentOcr(...args),
  getOcrTextForRequest: jest.fn(async () => "วุฒิบัตร"),
}));

let app: express.Express;
let pool: Pool;
async function insertUser(citizenId: string, role: string): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO users (citizen_id, role, password_hash) VALUES (?, ?, 'test-hash')`,
    [citizenId, role],
  );
  return result.insertId as number;
}

async function insertProfile(params: {
  citizenId: string;
  positionName?: string | null;
  department?: string | null;
  subDepartment?: string | null;
  specialPosition?: string | null;
}) {
  await pool.query(
    `INSERT IGNORE INTO emp_profiles (citizen_id, position_name, department, sub_department, special_position)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.citizenId,
      params.positionName ?? null,
      params.department ?? null,
      params.subDepartment ?? null,
      params.specialPosition ?? null,
    ],
  );
}

async function insertSignature(userId: number) {
  await pool.query(
    `INSERT INTO sig_images (user_id, signature_image) VALUES (?, ?)`,
    [userId, Buffer.from("sig")],
  );
}

async function hasColumn(table: string, column: string): Promise<boolean> {
  const [rows]: any = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [
    column,
  ]);
  return rows.length > 0;
}

async function ensureColumn(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const exists = await hasColumn(table, column);
  if (exists) return;
  await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function insertRuleAndRate() {
    // Ensure Schema matches what services expect if not fully up to date in utils
  await ensureColumn(
    "cfg_classification_rules",
    "target_sub_item_no",
    "VARCHAR(20) DEFAULT NULL",
  );
  await ensureColumn(
    "cfg_payment_rates",
    "sub_item_no",
    "VARCHAR(20) DEFAULT NULL",
  );

  const hasTargetSubItem = await hasColumn(
    "cfg_classification_rules",
    "target_sub_item_no",
  );
  await pool.query(
    `INSERT INTO cfg_classification_rules
     (profession, priority, rule_condition, target_group_no, target_item_no${
       hasTargetSubItem ? ", target_sub_item_no" : ""
     }, is_active)
     VALUES ('DOCTOR', 1, ?, 2, '2.1'${hasTargetSubItem ? ", '2'" : ""}, 1)`,
    [JSON.stringify({ operator: "true" })],
  );

  const hasSubItemNo = await hasColumn("cfg_payment_rates", "sub_item_no");
  await pool.query(
    `INSERT INTO cfg_payment_rates
     (profession_code, group_no, item_no${hasSubItemNo ? ", sub_item_no" : ""}, amount, is_active)
     VALUES ('DOCTOR', 2, '2.1'${hasSubItemNo ? ", '2'" : ""}, 10000, 1)`,
  );
}

function writeTempFile(filename: string, contents: Buffer): string {
  const filePath = path.join("/tmp", filename);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

async function cleanupUploads(requestId: number) {
  const [rows]: any = await pool.query(
    "SELECT file_path FROM req_attachments WHERE request_id = ?",
    [requestId],
  );
  const dirs = new Set<string>();
  for (const row of rows) {
    const filePath = row.file_path as string;
    if (filePath) {
      try {
        fs.rmSync(filePath, { force: true });
      } catch {
        // ignore
      }
      dirs.add(path.dirname(filePath));
    }
  }
  for (const dir of dirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

// Lifecycle
beforeAll(async () => {
    process.env.DB_NAME = DB_NAME;
    pool = await createTestPool();
    await setupSchema(pool);
    await cleanTables(pool);
    await insertRuleAndRate();

    jest.doMock("../../../../config/database.js", () => ({
      __esModule: true,
      default: pool,
      query: async (sql: string, params?: any[]) => { const [results] = await pool.execute(sql, params); return results; },
      execute: pool.execute.bind(pool),
      getConnection: pool.getConnection.bind(pool),
    }));

    app = express();
    app.use(express.json());
    // Use dynamic import for routes
    const requestRoutes = (await import("../../request.routes.js")).default;
    app.use("/api/requests", requestRoutes);
    app.use(errorHandler);
});

beforeEach(async () => {
    await cleanTables(pool);
    await insertRuleAndRate();
});

afterAll(async () => {
    if (pool) await pool.end();
});

describe('End-to-End Request Workflow', () => {
  let requesterId: number;
  let headWardId: number;
  let headDeptId: number;
  let officerId: number;
  let headHrId: number;
  let headFinanceId: number;
  let directorId: number;

  // IDs for user
  const REQ_CITIZEN = "REQ_E2E";
  const WARD_CITIZEN = "WARD_E2E";
  const DEPT_CITIZEN = "DEPT_E2E";
  const OFF_CITIZEN = "OFFICER_E2E";
  const HR_CITIZEN = "HR_E2E";
  const FIN_CITIZEN = "FIN_E2E";
  const DIR_CITIZEN = "DIR_E2E";

  let requestId: number;

  beforeEach(async () => {
    // Setup Users for each test run (since we clean tables)
    requesterId = await insertUser(REQ_CITIZEN, "USER");
    await insertProfile({
      citizenId: REQ_CITIZEN,
      positionName: "นายแพทย์",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });

    headWardId = await insertUser(WARD_CITIZEN, "HEAD_WARD");
    await insertProfile({
      citizenId: WARD_CITIZEN,
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม",
      department: "กลุ่มงานเภสัชกรรม",
    });

    headDeptId = await insertUser(DEPT_CITIZEN, "HEAD_DEPT");
    await insertProfile({
      citizenId: DEPT_CITIZEN,
      specialPosition: "หัวหน้ากลุ่มงาน-กลุ่มงานเภสัชกรรม",
      department: "กลุ่มงานเภสัชกรรม",
    });

    officerId = await insertUser(OFF_CITIZEN, "PTS_OFFICER");
    headHrId = await insertUser(HR_CITIZEN, "HEAD_HR");
    headFinanceId = await insertUser(FIN_CITIZEN, "HEAD_FINANCE");
    directorId = await insertUser(DIR_CITIZEN, "DIRECTOR");

    // Insert Signatures
    for (const uid of [requesterId, headWardId, headDeptId, officerId, headHrId, headFinanceId, directorId]) {
        await insertSignature(uid);
    }
  });

  it('Full Flow: Create -> Submit -> Approve Chain -> Finalize', async () => {
    const pdfPath = writeTempFile("e2e_doc.pdf", Buffer.from("%PDF-1.4\n%EOF\n"));

    // 1. Create Request
    const createRes = await request(app)
      .post("/api/requests")
      .set("x-user-id", String(requesterId))
      .set("x-role", "USER")
      .set("x-citizen-id", REQ_CITIZEN)
      .field("personnel_type", PersonnelType.CIVIL_SERVANT)
      .field("request_type", RequestType.NEW_ENTRY)
      .field("effective_date", "2024-01-01")
      .field("requested_amount", 10000)
      .field("work_attributes", JSON.stringify({
          operation: true,
          planning: false,
          coordination: false,
          service: false
      }))
      .attach("files", pdfPath, { contentType: "application/pdf" });

    if (createRes.status !== 201) {
        console.log("Create Request Status:", createRes.status);
        console.log("Create Request Body:", JSON.stringify(createRes.body, null, 2));
    }

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('DRAFT');
    requestId = createRes.body.data.request_id;

    const [attachments]: any = await pool.query(
      `SELECT attachment_id FROM req_attachments WHERE request_id = ?`,
      [requestId],
    );
    for (const row of attachments) {
      await pool.query(
        `INSERT INTO req_ocr_results
         (attachment_id, provider, status, confidence, processed_at)
         VALUES (?, 'TYPHOON', 'COMPLETED', 99.9, NOW())`,
        [row.attachment_id],
      );
    }

    // 2. Submit
    const submitRes = await request(app)
      .post(`/api/requests/${requestId}/submit`)
      .set("x-user-id", String(requesterId))
      .set("x-role", "USER")
      .set("x-citizen-id", REQ_CITIZEN)
      .send({ confirmed: true });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('PENDING');
    expect(submitRes.body.data.current_step).toBe(1); // HEAD_WARD (Step 1)

    // 3. Head Ward Approve
    const wardApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(headWardId))
      .set("x-role", "HEAD_WARD")
      .set("x-citizen-id", WARD_CITIZEN)
      .send({ action: "APPROVE", comment: "Ward Approved" });
    expect(wardApprove.status).toBe(200);
    expect(wardApprove.body.data.current_step).toBe(2); // HEAD_DEPT

    // 4. Head Dept Approve
    const deptApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(headDeptId))
      .set("x-role", "HEAD_DEPT")
      .set("x-citizen-id", DEPT_CITIZEN)
      .send({ action: "APPROVE", comment: "Dept Approved" });
    expect(deptApprove.status).toBe(200);
    expect(deptApprove.body.data.current_step).toBe(3); // OFFICER

    // 5. Officer Verify & Approve
    // Update verification first
    await request(app)
        .patch(`/api/requests/${requestId}/verification`)
        .set("x-user-id", String(officerId))
        .set("x-role", "PTS_OFFICER")
        .set("x-citizen-id", OFF_CITIZEN)
        .send({ checks: { qualification_check: { status: 'PASS' } } });

    const officerApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(officerId))
      .set("x-role", "PTS_OFFICER")
      .set("x-citizen-id", OFF_CITIZEN)
      .send({ action: "APPROVE", comment: "Officer Verified" });
    expect(officerApprove.status).toBe(200);
    expect(officerApprove.body.data.current_step).toBe(4); // HEAD_HR

    // 6. Head HR Approve
    const hrApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(headHrId))
      .set("x-role", "HEAD_HR")
      .set("x-citizen-id", HR_CITIZEN)
      .send({ action: "APPROVE", comment: "HR Approved" });
    expect(hrApprove.status).toBe(200);
    expect(hrApprove.body.data.current_step).toBe(5); // HEAD_FINANCE

    // 7. Head Finance Approve
    const financeApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(headFinanceId))
      .set("x-role", "HEAD_FINANCE")
      .set("x-citizen-id", FIN_CITIZEN)
      .send({ action: "APPROVE", comment: "Finance Approved" });
    expect(financeApprove.status).toBe(200);
    expect(financeApprove.body.data.current_step).toBe(6); // DIRECTOR

    // 8. Director Approve (Final)
    const directorApprove = await request(app)
      .post(`/api/requests/${requestId}/action`)
      .set("x-user-id", String(directorId))
      .set("x-role", "DIRECTOR")
      .set("x-citizen-id", DIR_CITIZEN)
      .send({ action: "APPROVE", comment: "Director Approved" });

    expect(directorApprove.status).toBe(200);
    expect(directorApprove.body.data.status).toBe('APPROVED');

    // Check Eligibility logic
    const [eligRows]: any = await pool.query(
        "SELECT request_id FROM req_eligibility WHERE request_id = ?",
        [requestId],
    );
    expect(eligRows.length).toBe(1);

    // Cleanup
    fs.rmSync(pdfPath, { force: true });
    await cleanupUploads(requestId);
  });
});
