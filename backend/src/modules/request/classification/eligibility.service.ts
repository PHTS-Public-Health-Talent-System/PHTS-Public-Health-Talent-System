import { PoolConnection } from "mysql2/promise";
import { requestRepository } from "../repositories/request.repository.js";

function toDateString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

/**
 * Update employee eligibility in the same transaction as the request.
 */
export async function createEligibility(
  connection: PoolConnection,
  citizenId: string,
  masterRateId: number,
  effectiveDate: string | Date,
  requestId: number,
): Promise<void> {
  const effectiveDateStr = toDateString(effectiveDate);

  await requestRepository.deactivateEligibility(
    citizenId,
    effectiveDateStr,
    connection,
  );

  await requestRepository.insertEligibility(
    citizenId,
    masterRateId,
    requestId,
    effectiveDateStr,
    connection,
  );
}
