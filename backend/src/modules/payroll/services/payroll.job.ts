import { PayrollService } from "../payroll.service.js";

export async function ensureMonthlyPeriod(): Promise<void> {
  await PayrollService.ensureCurrentPeriod();
}
