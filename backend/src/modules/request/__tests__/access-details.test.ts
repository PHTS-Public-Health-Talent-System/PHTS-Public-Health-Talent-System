import { Pool } from "mysql2/promise";
import { createTestPool, setupSchema, cleanTables, DB_NAME } from "./utils.ts";

let pool: Pool;
let getRequestById: (
  requestId: number,
  userId: number,
  userRole: string,
) => Promise<any>;

jest.setTimeout(20000);

async function insertUser(citizenId: string, role: string): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO users (citizen_id, role, password_hash) VALUES (?, ?, 'test-hash')`,
    [citizenId, role],
  );
  return result.insertId as number;
}

async function insertProfile(params: {
  citizenId: string;
  department?: string | null;
  subDepartment?: string | null;
  specialPosition?: string | null;
}) {
  await pool.query(
    `INSERT INTO emp_profiles (citizen_id, department, sub_department, special_position)
     VALUES (?, ?, ?, ?)`,
    [
      params.citizenId,
      params.department ?? null,
      params.subDepartment ?? null,
      params.specialPosition ?? null,
    ],
  );
}

async function insertRequest(params: {
  userId: number;
  citizenId: string;
  step: number;
  department?: string | null;
  subDepartment?: string | null;
}) {
  await insertProfile({
    citizenId: params.citizenId,
    department: params.department ?? null,
    subDepartment: params.subDepartment ?? null,
  });

  const [result]: any = await pool.query(
    `INSERT INTO req_submissions
     (user_id, citizen_id, request_type, status, current_step, requested_amount, effective_date)
     VALUES (?, ?, 'NEW_ENTRY', 'PENDING', ?, 1500, '2024-01-01')`,
    [params.userId, params.citizenId, params.step],
  );

  return result.insertId as number;
}

async function insertAttachment(requestId: number) {
  await pool.query(
    `INSERT INTO req_attachments (request_id, file_name, file_path, file_type)
     VALUES (?, 'evidence.pdf', '/tmp/evidence.pdf', 'OTHER')`,
    [requestId],
  );
}

beforeAll(async () => {
  process.env.DB_NAME = DB_NAME;
  pool = await createTestPool();
  await setupSchema(pool);
  await cleanTables(pool);

  // Mock database.js to use the test pool
  jest.doMock("../../../config/database.js", () => ({
    __esModule: true,
    default: pool, // The pool instance
    query: async (sql: string, params?: any[]) => { const [results] = await pool.execute(sql, params); return results; },
    execute: pool.execute.bind(pool),
    getConnection: pool.getConnection.bind(pool),
  }));

  const { requestQueryService } = await import("../services/query.service.js");
  getRequestById = requestQueryService.getRequestById.bind(requestQueryService);
});

beforeEach(async () => {
  await cleanTables(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Request details access", () => {
  test("HEAD_WARD can view details and attachments for scoped request", async () => {
    const wardHeadId = await insertUser("WARD_HEAD_VIEW", "HEAD_WARD");
    await insertProfile({
      citizenId: "WARD_HEAD_VIEW",
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม",
    });

    const requesterId = await insertUser("REQ_VIEW_1", "USER");
    const requestId = await insertRequest({
      userId: requesterId,
      citizenId: "REQ_VIEW_1",
      step: 1,
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });
    await insertAttachment(requestId);

    const details = await getRequestById(requestId, wardHeadId, "HEAD_WARD");
    expect(details.request_id).toBe(requestId);
    expect(details.attachments).toHaveLength(1);
    expect(details.attachments[0].file_name).toBe("evidence.pdf");
  });

  test("HEAD_DEPT can view details and attachments for scoped request", async () => {
    const deptHeadId = await insertUser("DEPT_HEAD_VIEW", "HEAD_DEPT");
    await insertProfile({
      citizenId: "DEPT_HEAD_VIEW",
      specialPosition: "หัวหน้ากลุ่มงาน-กลุ่มงานเภสัชกรรม",
    });

    const requesterId = await insertUser("REQ_VIEW_2", "USER");
    const requestId = await insertRequest({
      userId: requesterId,
      citizenId: "REQ_VIEW_2",
      step: 2,
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานหอผู้ป่วย",
    });
    await insertAttachment(requestId);

    const details = await getRequestById(requestId, deptHeadId, "HEAD_DEPT");
    expect(details.request_id).toBe(requestId);
    expect(details.attachments).toHaveLength(1);
    expect(details.attachments[0].file_name).toBe("evidence.pdf");
  });

  test("HEAD_WARD cannot view details when out of scope", async () => {
    const wardHeadId = await insertUser("WARD_HEAD_OUT", "HEAD_WARD");
    await insertProfile({
      citizenId: "WARD_HEAD_OUT",
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม",
    });

    const requesterId = await insertUser("REQ_VIEW_3", "USER");
    const requestId = await insertRequest({
      userId: requesterId,
      citizenId: "REQ_VIEW_3",
      step: 1,
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานหอผู้ป่วย",
    });
    await insertAttachment(requestId);

    await expect(
      getRequestById(requestId, wardHeadId, "HEAD_WARD"),
    ).rejects.toThrow("You do not have permission to view this request");
  });

  test("HEAD_DEPT cannot view details when out of scope", async () => {
    const deptHeadId = await insertUser("DEPT_HEAD_OUT", "HEAD_DEPT");
    await insertProfile({
      citizenId: "DEPT_HEAD_OUT",
      specialPosition: "หัวหน้ากลุ่มงาน-กลุ่มงานเวชกรรม",
    });

    const requesterId = await insertUser("REQ_VIEW_4", "USER");
    const requestId = await insertRequest({
      userId: requesterId,
      citizenId: "REQ_VIEW_4",
      step: 2,
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานหอผู้ป่วย",
    });
    await insertAttachment(requestId);

    await expect(
      getRequestById(requestId, deptHeadId, "HEAD_DEPT"),
    ).rejects.toThrow("You do not have permission to view this request");
  });
});
