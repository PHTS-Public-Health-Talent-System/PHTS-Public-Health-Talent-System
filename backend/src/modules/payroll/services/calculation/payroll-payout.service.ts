import { PoolConnection } from "mysql2/promise";
import { Decimal } from "decimal.js";
import { PeriodStatus } from "@/modules/payroll/entities/payroll.entity.js";
import { PayrollRepository } from "@/modules/payroll/repositories/payroll.repository.js";

type PayoutEditPayload = {
  eligible_days?: number;
  deducted_days?: number;
  retroactive_amount?: number;
  remark?: string | null;
};

type ResolvedPayoutValues = {
  eligibleDays: number;
  deductedDays: number;
  retroactiveAmount: number;
  remark: string | null;
};

export class PayrollPayoutService {
  static async searchPayouts(params: {
    q: string;
    periodYear?: number;
    periodMonth?: number;
  }) {
    return PayrollRepository.searchPayouts(params);
  }

  static async getPeriodPayouts(periodId: number) {
    return PayrollRepository.findPayoutsByPeriod(periodId);
  }

  static async getPayoutDetail(payoutId: number) {
    const payout = await PayrollRepository.findPayoutDetailById(payoutId);
    if (!payout) throw new Error("Payout not found");
    const items = await PayrollRepository.findPayoutItemsByPayoutId(payoutId);
    const checksRaw =
      await PayrollRepository.findPayoutChecksByPayoutId(payoutId);
    const checks = checksRaw.map((row: any) => {
      const evidenceRaw = row.evidence_json;
      let evidence: unknown[] = [];
      if (Array.isArray(evidenceRaw)) {
        evidence = evidenceRaw;
      } else if (typeof evidenceRaw === "string" && evidenceRaw.trim()) {
        try {
          evidence = JSON.parse(evidenceRaw);
        } catch {
          evidence = [];
        }
      }
      const { evidence_json: _ignore, ...rest } = row;
      return { ...rest, evidence };
    });
    return { payout, items, checks };
  }

  static async updatePayout(
    payoutId: number,
    payload: PayoutEditPayload,
    meta?: { actorId?: number | null },
  ) {
    const conn = await PayrollRepository.getConnection();
    try {
      await conn.beginTransaction();

      const ctx = await PayrollRepository.findPayoutEditContextByIdForUpdate(
        payoutId,
        conn,
      );
      if (!ctx) throw new Error("Payout not found");

      const periodStatus = String((ctx as any).period_status ?? "");
      const isLocked = Boolean((ctx as any).is_locked);
      if (periodStatus !== PeriodStatus.OPEN || isLocked) {
        throw new Error("สามารถแก้ไขได้เฉพาะรอบที่ยังเปิดอยู่");
      }

      const periodId = Number((ctx as any).period_id ?? 0);
      const month = Number((ctx as any).period_month ?? 0);
      const rawYear = Number((ctx as any).period_year ?? 0);
      const year = rawYear > 2400 ? rawYear - 543 : rawYear;
      const daysInMonth = new Date(year, month, 0).getDate();
      if (!Number.isFinite(daysInMonth) || daysInMonth <= 0) {
        throw new Error("ข้อมูลเดือน/ปีของรอบไม่ถูกต้อง");
      }

      const nextValues = resolvePayoutValues(ctx, payload, daysInMonth);

      const baseRate = Number((ctx as any).pts_rate_snapshot ?? 0);
      const calculatedAmount = new Decimal(baseRate)
        .div(daysInMonth)
        .mul(nextValues.eligibleDays)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber();
      const totalPayable = new Decimal(calculatedAmount)
        .plus(nextValues.retroactiveAmount)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber();

      await conn.execute(
        `
        UPDATE pay_results
        SET eligible_days = ?,
            deducted_days = ?,
            retroactive_amount = ?,
            calculated_amount = ?,
            total_payable = ?,
            remark = ?
        WHERE payout_id = ?
        `,
        [
          nextValues.eligibleDays,
          nextValues.deductedDays,
          nextValues.retroactiveAmount,
          calculatedAmount,
          totalPayable,
          nextValues.remark,
          payoutId,
        ],
      );

      await syncPayoutItems(conn, {
        payoutId,
        month,
        rawYear,
        calculatedAmount,
        retroactiveAmount: nextValues.retroactiveAmount,
      });

      const totals = await PayrollRepository.sumPayResultsByPeriod(
        periodId,
        conn,
      );
      await PayrollRepository.updatePeriodTotals(
        periodId,
        totals.totalAmount,
        totals.headCount,
        conn,
      );

      await conn.commit();

      return {
        payout_id: payoutId,
        period_id: periodId,
        eligible_days: nextValues.eligibleDays,
        deducted_days: nextValues.deductedDays,
        calculated_amount: calculatedAmount,
        retroactive_amount: nextValues.retroactiveAmount,
        total_payable: totalPayable,
        remark: nextValues.remark,
        updated_by: meta?.actorId ?? null,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async getPeriodSummaryByProfession(periodId: number) {
    const period = await PayrollRepository.findPeriodById(periodId);
    if (!period) throw new Error("Period not found");

    const total = await PayrollRepository.findPayResultCountByPeriod(periodId);
    if (total === 0) throw new Error("Period not calculated");

    return PayrollRepository.findProfessionSummaryByPeriod(periodId);
  }
}

function resolvePayoutValues(
  ctx: any,
  payload: PayoutEditPayload,
  daysInMonth: number,
): ResolvedPayoutValues {
  const eligibleDays =
    payload.eligible_days !== undefined
      ? Number(payload.eligible_days)
      : Number(ctx.eligible_days ?? 0);
  const deductedDays =
    payload.deducted_days !== undefined
      ? Number(payload.deducted_days)
      : Number(ctx.deducted_days ?? 0);
  const retroactiveAmount =
    payload.retroactive_amount !== undefined
      ? Number(payload.retroactive_amount)
      : Number(ctx.retroactive_amount ?? 0);
  const remark =
    payload.remark !== undefined ? payload.remark : (ctx.remark ?? null);

  if (!Number.isFinite(eligibleDays) || eligibleDays < 0) {
    throw new Error("eligible_days ต้องเป็นตัวเลขและต้องมากกว่าหรือเท่ากับ 0");
  }
  if (!Number.isFinite(deductedDays) || deductedDays < 0) {
    throw new Error("deducted_days ต้องเป็นตัวเลขและต้องมากกว่าหรือเท่ากับ 0");
  }
  if (eligibleDays > daysInMonth) {
    throw new Error(`eligible_days ต้องไม่เกินจำนวนวันในเดือน (${daysInMonth})`);
  }
  if (deductedDays > daysInMonth) {
    throw new Error(`deducted_days ต้องไม่เกินจำนวนวันในเดือน (${daysInMonth})`);
  }
  if (eligibleDays + deductedDays > daysInMonth) {
    throw new Error(
      `eligible_days + deducted_days ต้องไม่เกินจำนวนวันในเดือน (${daysInMonth})`,
    );
  }
  if (!Number.isFinite(retroactiveAmount)) {
    throw new Error("retroactive_amount ต้องเป็นตัวเลข");
  }

  return {
    eligibleDays,
    deductedDays,
    retroactiveAmount,
    remark,
  };
}

async function syncPayoutItems(
  conn: PoolConnection,
  params: {
    payoutId: number;
    month: number;
    rawYear: number;
    calculatedAmount: number;
    retroactiveAmount: number;
  },
): Promise<void> {
  const { payoutId, month, rawYear, calculatedAmount, retroactiveAmount } = params;
  const manualDesc = "ตกเบิก (แก้ไขด้วยมือ)";

  const [currentRows] = await conn.query<any[]>(
    `
    SELECT item_id
    FROM pay_result_items
    WHERE payout_id = ? AND item_type = 'CURRENT'
    ORDER BY item_id ASC
    LIMIT 1
    `,
    [payoutId],
  );
  const currentItemId = currentRows?.[0]?.item_id
    ? Number(currentRows[0].item_id)
    : null;
  if (currentItemId) {
    await conn.execute(
      `UPDATE pay_result_items SET amount = ? WHERE item_id = ?`,
      [calculatedAmount, currentItemId],
    );
  } else if (Math.abs(calculatedAmount) > 0.005) {
    await conn.execute(
      `
      INSERT INTO pay_result_items
        (payout_id, reference_month, reference_year, item_type, amount, description)
      VALUES (?, ?, ?, 'CURRENT', ?, 'ค่าตอบแทนงวดปัจจุบัน')
      `,
      [payoutId, month, rawYear, calculatedAmount],
    );
  }

  const [retroRows] = await conn.query<any[]>(
    `
    SELECT item_id, item_type, amount, reference_month, reference_year, description
    FROM pay_result_items
    WHERE payout_id = ?
      AND item_type IN ('RETROACTIVE_ADD', 'RETROACTIVE_DEDUCT')
    ORDER BY item_id ASC
    `,
    [payoutId],
  );

  const retroSumExcludingManual = (retroRows ?? []).reduce((sum, row) => {
    const isManual =
      Number(row.reference_month ?? 0) === 0 &&
      Number(row.reference_year ?? 0) === 0 &&
      String(row.description ?? "") === manualDesc;
    if (isManual) return sum;
    const amt = Number(row.amount ?? 0);
    const sign = String(row.item_type) === "RETROACTIVE_DEDUCT" ? -1 : 1;
    return sum + sign * (Number.isFinite(amt) ? amt : 0);
  }, 0);

  await conn.execute(
    `
    DELETE FROM pay_result_items
    WHERE payout_id = ?
      AND reference_month = 0
      AND reference_year = 0
      AND description = ?
      AND item_type IN ('RETROACTIVE_ADD', 'RETROACTIVE_DEDUCT')
    `,
    [payoutId, manualDesc],
  );

  const retroDelta = new Decimal(retroactiveAmount)
    .minus(retroSumExcludingManual)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();

  if (Math.abs(retroDelta) <= 0.01) {
    return;
  }
  const itemType = retroDelta > 0 ? "RETROACTIVE_ADD" : "RETROACTIVE_DEDUCT";
  await conn.execute(
    `
    INSERT INTO pay_result_items
      (payout_id, reference_month, reference_year, item_type, amount, description)
    VALUES (?, 0, 0, ?, ?, ?)
    `,
    [payoutId, itemType, Math.abs(retroDelta), manualDesc],
  );
}
