/**
 * request/__tests__/integration/approval-flow.test.ts
 */
import { Pool } from "mysql2/promise";
import { createTestPool, setupSchema, cleanTables, DB_NAME } from "../utils.js";
import { RequestStatus } from "../../request.types.js";

let pool: Pool;
let requestApprovalService: typeof import("../../services/approval.service.js").requestApprovalService;
let reassignRequest: typeof import("../../reassign/reassign.service.js").reassignRequest;
let requestRepository: typeof import("../../repositories/request.repository.js").requestRepository;

// Helpers to setup state (simplified version of E2E helpers)
async function insertUser(citizenId: string, role: string, dept: string = "Dept1", subDept: string = "Sub1", specialPos: string | null = null): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO users (citizen_id, role, password_hash) VALUES (?, ?, 'test-hash')`,
    [citizenId, role],
  );
  await pool.query(
    `INSERT INTO emp_profiles (citizen_id, title, first_name, last_name, position_name, department, sub_department, special_position)
     VALUES (?, 'Mr', 'Test', 'User', 'Officer', ?, ?, ?)`,
    [citizenId, dept, subDept, specialPos]
  );
  return result.insertId as number;
}

async function createRequest(userId: number, citizenId: string, status: string = RequestStatus.PENDING, step: number = 2): Promise<number> {
    const connection = await pool.getConnection();
    try {
        const requestId = await requestRepository.create({
            user_id: userId,
            citizen_id: citizenId,
            personnel_type: 'ข้าราชการ',
            request_type: 'NEW_ENTRY',
            effective_date: new Date(),
            status: status as RequestStatus,
            current_step: step,
            requested_amount: 5000,
            submission_data: {},
            work_attributes: {},
            applicant_signature_id: 1, // Dummy
            current_position_number: "Pos1",
            current_department: "Dept1"
        }, connection);
        return requestId;
    } finally {
        connection.release();
    }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

beforeAll(async () => {
    process.env.DB_NAME = DB_NAME;
    pool = await createTestPool();
    await setupSchema(pool);

    // Mock database connection
    jest.doMock("../../../../config/database.js", () => ({
      __esModule: true,
      default: pool,
      query: async (sql: string, params?: any[]) => { const [results] = await pool.execute(sql, params); return results; },
      execute: pool.execute.bind(pool),
      getConnection: pool.getConnection.bind(pool),
    }));

    // Dynamic imports to ensure correct DB connection
    requestApprovalService = (await import("../../services/approval.service.js")).requestApprovalService;
    reassignRequest = (await import("../../reassign/reassign.service.js")).reassignRequest;
    requestRepository = (await import("../../repositories/request.repository.js")).requestRepository;
});

beforeEach(async () => {
    await cleanTables(pool);
});

afterAll(async () => {
    if (pool) await pool.end();
});

describe('Approval Logic Integration', () => {
  it('Should handle "Return" correctly (Back to RETURNED status)', async () => {
    const userId = await insertUser("U1", "USER", "Dept1", "งานSub1");
    // Head Ward needs special_position matching sub_department
    const wardId = await insertUser("W1", "HEAD_WARD", "Dept1", "งานSub1", "งานSub1");
    const requestId = await createRequest(userId, "U1", RequestStatus.PENDING, 1);

    // Head Ward Returns
    await requestApprovalService.returnRequest(requestId, wardId, 'HEAD_WARD', 'Fix typo');

    // Check DB
    const req = await requestRepository.findById(requestId);
    expect(req?.status).toBe(RequestStatus.RETURNED);

    // Check Status History/Logs if needed (omitted for brevity)
  });

  it('Should allow Officer to Reassign', async () => {
    const userId = await insertUser("U2", "USER");
    const officer1Id = await insertUser("OFF1", "PTS_OFFICER");
    const officer2Id = await insertUser("OFF2", "PTS_OFFICER");

    const requestId = await createRequest(userId, "U2", RequestStatus.PENDING, 3); // Step 3 = Officer

    // Assign to Officer 1 manually first (simulate assignment)
    await requestRepository.updateAssignedOfficer(requestId, officer1Id);

    // Reassign
    await reassignRequest(requestId, officer1Id, { targetOfficerId: officer2Id, reason: 'Busy' });

    // Check DB
    const req = await requestRepository.findById(requestId);
    expect(req?.assigned_officer_id).toBe(officer2Id);
  });
});
