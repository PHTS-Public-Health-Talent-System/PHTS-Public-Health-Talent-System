import { Pool } from "mysql2/promise";
import { createTestPool, setupSchema, cleanTables, DB_NAME } from "./utils.ts";

let pool: Pool;
let getPendingForApprover: (
  userRole: string,
  userId?: number,
  selectedScope?: string,
) => Promise<any[]>;
let clearScopeCache: (userId?: number) => void;

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

async function insertSupportProfile(params: {
  citizenId: string;
  specialPosition?: string | null;
}) {
  await pool.query(
    `INSERT INTO emp_support_staff (citizen_id, special_position)
     VALUES (?, ?)`,
    [params.citizenId, params.specialPosition ?? null],
  );
}

async function insertRequest(params: {
  userId: number;
  citizenId: string;
  step: number;
  status?: string;
  assignedOfficerId?: number | null;
}) {
  const [result]: any = await pool.query(
    `INSERT INTO req_submissions
     (user_id, citizen_id, request_type, status, current_step, requested_amount, effective_date, assigned_officer_id)
     VALUES (?, ?, 'NEW_ENTRY', ?, ?, 1500, '2024-01-01', ?)`,
    [
      params.userId,
      params.citizenId,
      params.status ?? "PENDING",
      params.step,
      params.assignedOfficerId ?? null,
    ],
  );
  return result.insertId as number;
}

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

  const { requestQueryService } = await import("../services/query.service.js");
  const scopeModule = await import("../scope/scope.service.js");
  getPendingForApprover = requestQueryService.getPendingForApprover.bind(requestQueryService);
  clearScopeCache = scopeModule.clearScopeCache;
});

beforeEach(async () => {
  await cleanTables(pool);
  clearScopeCache?.();
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("Request Scope Filters", () => {
  test("HEAD_WARD and HEAD_DEPT scope filtering", async () => {
    const wardHeadId = await insertUser("WARD_HEAD", "HEAD_WARD");
    const deptHeadId = await insertUser("DEPT_HEAD", "HEAD_DEPT");

    await insertProfile({
      citizenId: "WARD_HEAD",
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม; หออภิบาลผู้ป่วยวิกฤต",
    });
    await insertProfile({
      citizenId: "DEPT_HEAD",
      specialPosition: "หัวหน้ากลุ่มงาน-กลุ่มงานเภสัชกรรม",
    });

    const reqUser1 = await insertUser("REQ_1", "USER");
    const reqUser2 = await insertUser("REQ_2", "USER");
    const reqUser3 = await insertUser("REQ_3", "USER");
    const reqUser4 = await insertUser("REQ_4", "USER");

    await insertProfile({
      citizenId: "REQ_1",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });
    await insertProfile({
      citizenId: "REQ_2",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานหอผู้ป่วย",
    });
    await insertProfile({
      citizenId: "REQ_3",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });
    await insertProfile({
      citizenId: "REQ_4",
      department: "กลุ่มงานเวชกรรม",
      subDepartment: "งานไตเทียม",
    });

    const req1 = await insertRequest({
      userId: reqUser1,
      citizenId: "REQ_1",
      step: 1,
    });
    await insertRequest({ userId: reqUser2, citizenId: "REQ_2", step: 1 });
    const req3 = await insertRequest({
      userId: reqUser3,
      citizenId: "REQ_3",
      step: 2,
    });
    await insertRequest({ userId: reqUser4, citizenId: "REQ_4", step: 2 });

    const wardPending = await getPendingForApprover("HEAD_WARD", wardHeadId);
    expect(wardPending.map((r) => r.request_id)).toEqual([req1]);

    const deptPending = await getPendingForApprover("HEAD_DEPT", deptHeadId);
    expect(deptPending.map((r) => r.request_id)).toEqual([req3]);
  });

  test("selected scope narrows pending results", async () => {
    const wardHeadId = await insertUser("WARD_HEAD", "HEAD_WARD");
    await insertProfile({
      citizenId: "WARD_HEAD",
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม; หออภิบาลผู้ป่วยวิกฤต",
    });

    const reqUser1 = await insertUser("REQ_1", "USER");
    const reqUser2 = await insertUser("REQ_2", "USER");

    await insertProfile({
      citizenId: "REQ_1",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });
    await insertProfile({
      citizenId: "REQ_2",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "หออภิบาลผู้ป่วยวิกฤต",
    });

    await insertRequest({ userId: reqUser1, citizenId: "REQ_1", step: 1 });
    const req2 = await insertRequest({
      userId: reqUser2,
      citizenId: "REQ_2",
      step: 1,
    });

    const wardPending = await getPendingForApprover(
      "HEAD_WARD",
      wardHeadId,
      "หออภิบาลผู้ป่วยวิกฤต",
    );

    expect(wardPending.map((r) => r.request_id)).toEqual([req2]);
  });

  test("HEAD_WARD scopes do not fall back to emp_support_staff", async () => {
    const wardHeadId = await insertUser("WARD_HEAD_SUPPORT", "HEAD_WARD");
    await insertSupportProfile({
      citizenId: "WARD_HEAD_SUPPORT",
      specialPosition: "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม",
    });

    const reqUser = await insertUser("REQ_SUPPORT", "USER");
    await insertProfile({
      citizenId: "REQ_SUPPORT",
      department: "กลุ่มงานเภสัชกรรม",
      subDepartment: "งานไตเทียม",
    });

    await insertRequest({ userId: reqUser, citizenId: "REQ_SUPPORT", step: 1 });

    const wardPending = await getPendingForApprover("HEAD_WARD", wardHeadId);
    expect(wardPending.map((r) => r.request_id)).toEqual([]);
  });

  test("HEAD_WARD sees own request even without scope", async () => {
    const wardHeadId = await insertUser("WARD_HEAD_SELF", "HEAD_WARD");
    const reqId = await insertRequest({
      userId: wardHeadId,
      citizenId: "WARD_HEAD_SELF",
      step: 1,
    });

    const wardPending = await getPendingForApprover("HEAD_WARD", wardHeadId);
    expect(wardPending.map((r) => r.request_id)).toEqual([reqId]);
  });

  test("HEAD_DEPT sees own request even without scope", async () => {
    const deptHeadId = await insertUser("DEPT_HEAD_SELF", "HEAD_DEPT");
    const reqId = await insertRequest({
      userId: deptHeadId,
      citizenId: "DEPT_HEAD_SELF",
      step: 2,
    });

    const deptPending = await getPendingForApprover("HEAD_DEPT", deptHeadId);
    expect(deptPending.map((r) => r.request_id)).toEqual([reqId]);
  });

  test("PTS_OFFICER sees assigned or unassigned requests only", async () => {
    const officerA = await insertUser("OFFICER_A", "PTS_OFFICER");
    const officerB = await insertUser("OFFICER_B", "PTS_OFFICER");
    const reqUser1 = await insertUser("REQ_A", "USER");
    const reqUser2 = await insertUser("REQ_B", "USER");
    const reqUser3 = await insertUser("REQ_C", "USER");

    const assignedToA = await insertRequest({
      userId: reqUser1,
      citizenId: "REQ_A",
      step: 3,
      assignedOfficerId: officerA,
    });

    await insertRequest({
      userId: reqUser2,
      citizenId: "REQ_B",
      step: 3,
      assignedOfficerId: officerB,
    });

    const unassigned = await insertRequest({
      userId: reqUser3,
      citizenId: "REQ_C",
      step: 3,
      assignedOfficerId: null,
    });

    const officerPending = await getPendingForApprover("PTS_OFFICER", officerA);
    expect(officerPending.map((r) => r.request_id).sort()).toEqual(
      [assignedToA, unassigned].sort(),
    );
  });
});
