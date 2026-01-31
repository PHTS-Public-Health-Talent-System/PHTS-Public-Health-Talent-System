/**
 * PHTS System - Payment Rate Service
 *
 * Manages position allowance rates (P.T.S. rates).
 */

import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query } from "../../../config/database.js";
import { logAuditEvent, AuditEventType } from "../../audit/services/audit.service.js";

export const getMasterRates = async (): Promise<any[]> => {
  const rates = await query<RowDataPacket[]>(
    "SELECT * FROM cfg_payment_rates ORDER BY profession_code, group_no, item_no",
  );
  return rates;
};

export const updateMasterRate = async (
  rateId: number,
  amount: number,
  condition_desc: string,
  is_active: number,
  actorId?: number,
): Promise<void> => {
  await query<ResultSetHeader>(
    "UPDATE cfg_payment_rates SET amount = ?, condition_desc = ?, is_active = ? WHERE rate_id = ?",
    [amount, condition_desc, is_active, rateId],
  );

  await logAuditEvent({
    eventType: AuditEventType.MASTER_RATE_UPDATE,
    entityType: "payment_rate",
    entityId: rateId,
    actorId: actorId ?? null,
    actorRole: null,
    actionDetail: {
      amount,
      condition_desc,
      is_active,
    },
  });
};
