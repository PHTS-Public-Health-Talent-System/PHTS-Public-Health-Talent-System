/**
 * PHTS System - Payment Rate Service
 *
 * Manages position allowance rates (P.T.S. rates).
 */

import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query } from '@config/database.js';
import { emitAuditEvent, AuditEventType } from '@/modules/audit/services/audit.service.js';

type CreateMasterRatePayload = {
  profession_code: string;
  group_no: number;
  item_no: string | null;
  sub_item_no: string | null;
  amount: number;
  condition_desc: string;
  detailed_desc: string;
  is_active: number;
  actorId?: number;
};

export const getMasterRates = async (): Promise<any[]> => {
  const rates = await query<RowDataPacket[]>(
    `SELECT
       r.*,
       COALESCE(ec.eligible_count, 0) AS eligible_count
     FROM cfg_payment_rates r
     LEFT JOIN (
       SELECT master_rate_id, COUNT(*) AS eligible_count
       FROM req_eligibility
       WHERE is_active = 1
       GROUP BY master_rate_id
     ) ec ON ec.master_rate_id = r.rate_id
     ORDER BY r.profession_code, r.group_no, r.item_no`,
  );
  return rates;
};

export const updateMasterRate = async (
  rateId: number,
  payload: {
    profession_code: string;
    group_no: number;
    item_no: string | null;
    sub_item_no: string | null;
    amount: number;
    condition_desc: string;
    detailed_desc: string;
    is_active: boolean;
  },
  actorId?: number,
): Promise<void> => {
  await query<ResultSetHeader>(
    `UPDATE cfg_payment_rates
     SET profession_code = ?,
         group_no = ?,
         item_no = ?,
         sub_item_no = ?,
         amount = ?,
         condition_desc = ?,
         detailed_desc = ?,
         is_active = ?
     WHERE rate_id = ?`,
    [
      payload.profession_code,
      payload.group_no,
      payload.item_no,
      payload.sub_item_no,
      payload.amount,
      payload.condition_desc,
      payload.detailed_desc,
      payload.is_active ? 1 : 0,
      rateId,
    ],
  );

  await emitAuditEvent({
    eventType: AuditEventType.MASTER_RATE_UPDATE,
    entityType: "payment_rate",
    entityId: rateId,
    actorId: actorId ?? null,
    actorRole: null,
    actionDetail: {
      action: "update",
      ...payload,
    },
  });
};

export const deleteMasterRate = async (
  rateId: number,
  actorId?: number,
): Promise<void> => {
  await query<ResultSetHeader>(
    "UPDATE cfg_payment_rates SET is_active = ? WHERE rate_id = ?",
    [0, rateId],
  );

  await emitAuditEvent({
    eventType: AuditEventType.MASTER_RATE_UPDATE,
    entityType: "payment_rate",
    entityId: rateId,
    actorId: actorId ?? null,
    actorRole: null,
    actionDetail: {
      action: "delete",
    },
  });
};

export const createMasterRate = async ({
  profession_code,
  group_no,
  item_no,
  sub_item_no,
  amount,
  condition_desc,
  detailed_desc,
  is_active,
  actorId,
}: CreateMasterRatePayload): Promise<number> => {
  const result = await query<ResultSetHeader>(
    "INSERT INTO cfg_payment_rates (profession_code, group_no, item_no, sub_item_no, amount, condition_desc, detailed_desc, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [profession_code, group_no, item_no, sub_item_no, amount, condition_desc, detailed_desc, is_active],
  );

  const rateId = result.insertId;

  await emitAuditEvent({
    eventType: AuditEventType.MASTER_RATE_UPDATE,
    entityType: "payment_rate",
    entityId: rateId,
    actorId: actorId ?? null,
    actorRole: null,
    actionDetail: {
      action: "create",
      profession_code,
      group_no,
      amount,
    },
  });

  return rateId;
};

export const getMasterRateById = async (rateId: number): Promise<any | null> => {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM cfg_payment_rates WHERE rate_id = ?",
    [rateId],
  );
  return (rows[0] as any) ?? null;
};

/**
 * Get payment rates filtered by profession code.
 * This is used for the simplified dropdown in the request wizard.
 */
export const getRatesByProfession = async (
  professionCode: string,
): Promise<any[]> => {
  const rates = await query<RowDataPacket[]>(
    `SELECT rate_id, profession_code, group_no, item_no, sub_item_no, amount, condition_desc
     FROM cfg_payment_rates
     WHERE profession_code = ? AND is_active = 1
     ORDER BY group_no, item_no, sub_item_no`,
    [professionCode],
  );
  return rates;
};

/**
 * Get distinct profession codes that have active rates.
 */
export const getProfessions = async (): Promise<string[]> => {
  const rows = await query<RowDataPacket[]>(
    `SELECT DISTINCT profession_code FROM cfg_payment_rates WHERE is_active = 1 ORDER BY profession_code`,
  );
  return rows.map((r) => r.profession_code);
};

// Types for the hierarchy response
export interface CriterionNode {
  id: string;
  label: string;
  description?: string;
  subCriteria?: CriterionNode[];
}

export interface GroupNode {
  id: string;
  name: string;
  rate: number;
  criteria: CriterionNode[];
}

export interface ProfessionNode {
  id: string;
  name: string;
  groups: GroupNode[];
}

export const getRateHierarchy = async (): Promise<ProfessionNode[]> => {
  // Fetch active rates sorted by hierarchy
  const rows = await query<RowDataPacket[]>(
    `SELECT
       rate_id, profession_code, group_no, item_no, sub_item_no, amount, condition_desc, detailed_desc
     FROM cfg_payment_rates
     WHERE is_active = 1
     ORDER BY
       CASE
         WHEN profession_code = 'DOCTOR' THEN 1
         WHEN profession_code = 'DENTIST' THEN 2
         WHEN profession_code = 'PHARMACIST' THEN 3
         WHEN profession_code = 'NURSE' THEN 4
         ELSE 5
       END,
       profession_code, group_no, item_no, sub_item_no`
  );

  const profNameMap: Record<string, string> = {
    DOCTOR: "กลุ่มแพทย์",
    DENTIST: "กลุ่มทันตแพทย์",
    PHARMACIST: "กลุ่มเภสัชกร",
    NURSE: "กลุ่มพยาบาลวิชาชีพ",
    ALLIED: "กลุ่มสหวิชาชีพ",
    SPECIAL_EDU: "กลุ่มการศึกษาพิเศษ",
  };
  const hierarchy: ProfessionNode[] = [];
  const professionMap = new Map<string, ProfessionNode>();

  const getOrCreateProfession = (professionCode: string): ProfessionNode => {
    const existing = professionMap.get(professionCode);
    if (existing) return existing;
    const next: ProfessionNode = {
      id: professionCode,
      name: profNameMap[professionCode] ?? professionCode,
      groups: [],
    };
    professionMap.set(professionCode, next);
    hierarchy.push(next);
    return next;
  };

  const getOrCreateGroup = (
    profession: ProfessionNode,
    groupNo: number,
    amount: number,
  ): GroupNode => {
    const groupId = String(groupNo);
    const existing = profession.groups.find((group) => group.id === groupId);
    if (existing) return existing;
    const next: GroupNode = {
      id: groupId,
      name: `กลุ่มที่ ${groupNo}`,
      rate: Number(amount),
      criteria: [],
    };
    profession.groups.push(next);
    return next;
  };

  const getOrCreateCriterion = (
    group: GroupNode,
    itemNo: string,
    label: string,
    description: string,
  ): CriterionNode => {
    const existing = group.criteria.find((criterion) => criterion.id === itemNo);
    if (existing) return existing;
    const next: CriterionNode = {
      id: itemNo,
      label,
      description,
      subCriteria: [],
    };
    group.criteria.push(next);
    return next;
  };

  for (const row of rows) {
    const profession = getOrCreateProfession(String(row.profession_code));
    const group = getOrCreateGroup(profession, Number(row.group_no), Number(row.amount));

    const itemNo = row.item_no ? String(row.item_no) : "";
    const subItemNo = row.sub_item_no ? String(row.sub_item_no) : "";
    const label = row.condition_desc || "";
    const description = row.detailed_desc || label;

    if (!itemNo) {
      if (label) {
        group.criteria.push({
          id: "",
          label,
          description,
        });
      }
      continue;
    }

    const criterion = getOrCreateCriterion(group, itemNo, label, description);
    if (!subItemNo) {
      criterion.label = label;
      criterion.description = description;
      continue;
    }
    criterion.subCriteria?.push({
      id: subItemNo,
      label,
      description,
    });
  }

  return hierarchy;
};
