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
let slaService: any;
let h: TestHelper;

beforeAll(async () => {
  // 1. Setup DB Environment FIRST
  pool = await createTestPool();

  // 2. Setup Schema & Data
  await setupSchema(pool);
  await cleanTables(pool);
  await seedBaseData(pool);
  h = new TestHelper(pool);

  // 3. Dynamically import Service to ensure it uses the overridden DB config (if possible)
  // Note: database.ts might have already initialized if imported by utils.ts?
  // utils.ts imports mysql directly, not database.ts.
  // So likely database.ts is fresh.
  slaService = await import("../services/sla.service.js");
});

afterEach(async () => {
  await resetTestData(pool);
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe("SLA Service: N+1 Hazard", () => {
  test("calculateBusinessDays should return correct days respecting holidays", async () => {
    // Setup
    await h.addHoliday("2024-01-01", "New Year"); // Monday
    // 2024-01-01 (Mon) - Holiday
    // 2024-01-02 (Tue) - Work
    // 2024-01-03 (Wed) - Work
    // 2024-01-04 (Thu) - Work
    // 2024-01-05 (Fri) - Work
    // 2024-01-06 (Sat) - Weekend
    // 2024-01-07 (Sun) - Weekend
    // 2024-01-08 (Mon) - Work

    const start = new Date("2024-01-01");
    const end = new Date("2024-01-08");

    // Logic (inclusive): 02, 03, 04, 05, 08 = 5 days.

    const days = await slaService.calculateBusinessDays(start, end);
    expect(days).toBe(5);
  });

  test("N+1 Reproduction: Verify logic works across large range", async () => {
    // This test ensures that even bad logic produces correct results.
    const start = new Date("2024-01-01");
    const end = new Date("2024-02-01"); // 31 days
    // Count weekends:
    // Jan 6,7 (2)
    // Jan 13,14 (2)
    // Jan 20,21 (2)
    // Jan 27,28 (2)
    // Holidays: Jan 1 (1)
    // Total days: 31
    // Deduct: 1 (Hol) + 8 (Weekend) = 9
    // Business Days: 31 - 9 = 22, then inclusive end adds 1 day => 23.

    await h.addHoliday("2024-01-01", "New Year");

    const days = await slaService.calculateBusinessDays(start, end);
    expect(days).toBe(23);
  });
});
