'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Info, Clock } from 'lucide-react';
import type { PayoutDetail } from '@/features/payroll/api';
import { formatThaiDate, formatThaiDateTime, formatThaiNumber } from '@/shared/utils/thai-locale';
import type { PayrollRow } from '../model/detail.types';
import { ChecksCalculationSection } from './ChecksCalculationSection';
import { ChecksIssuesSection } from './ChecksIssuesSection';
import { localizePayrollText } from './checks.helpers';

export function PayrollChecksPanel({
  payoutDetail,
  fallbackRow,
}: {
  payoutDetail: PayoutDetail | undefined;
  fallbackRow: PayrollRow | null;
}) {
  const pathname = usePathname();
  const payout = payoutDetail?.payout;
  const checksRaw = payoutDetail?.checks;
  const checks = useMemo(() => checksRaw ?? [], [checksRaw]);

  const month = Number(payout?.period_month ?? 0);
  const rawYear = Number(payout?.period_year ?? 0);
  const yearAd = rawYear > 2400 ? rawYear - 543 : rawYear;
  const daysInMonth = month > 0 && yearAd > 0 ? new Date(yearAd, month, 0).getDate() : 0;

  const baseRate = Number(payout?.pts_rate_snapshot ?? fallbackRow?.baseRate ?? 0);
  const eligibleDays = Number(payout?.eligible_days ?? fallbackRow?.workDays ?? 0);
  const deductedDays = Number(payout?.deducted_days ?? fallbackRow?.leaveDays ?? 0);
  const calculatedAmount = Number(payout?.calculated_amount ?? 0);
  const retro = Number(payout?.retroactive_amount ?? fallbackRow?.retroactiveAmount ?? 0);
  const totalPayable = Number(payout?.total_payable ?? 0);

  // Logic Fix: ป้องกันปัญหา Floating-point precision ของ JavaScript
  const dailyRate = daysInMonth > 0 ? baseRate / daysInMonth : 0;
  const deductedAmount = dailyRate > 0 ? dailyRate * deductedDays : 0;
  const otherLossRaw = Number((baseRate - calculatedAmount - deductedAmount).toFixed(2));
  const otherLoss = otherLossRaw > 0 ? otherLossRaw : 0;

  const roleRoot = useMemo(() => {
    const segment = pathname?.split('/').filter(Boolean)[0];
    return segment ? `/${segment}` : '';
  }, [pathname]);
  const isPtsOfficer = roleRoot === '/pts-officer';
  const periodId = payout?.period_id ? String(payout.period_id) : null;
  const canNavigateLeaves = isPtsOfficer && !!periodId;
  const leaveStudyHref = canNavigateLeaves
    ? `${roleRoot}/payroll/${periodId}/leaves?tab=study`
    : null;

  const topImpactCheck = [...checks].sort(
    (a, b) => Math.abs(Number(b.impact_amount ?? 0)) - Math.abs(Number(a.impact_amount ?? 0)),
  )[0];
  const summaryReason = localizePayrollText(
    topImpactCheck?.title ?? 'มีรายการวันที่ไม่มีสิทธิรับเงิน',
  );

  const latestUpdatedAt = [...checks.map((item) => item.created_at)]
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);
  const payoutUpdatedAt = payout?.updated_at ?? null;

  const checksMayBeStale =
    Boolean(payoutUpdatedAt) &&
    (!latestUpdatedAt ||
      new Date(String(payoutUpdatedAt)).getTime() > new Date(String(latestUpdatedAt)).getTime());

  const baseCheckImpactAmount = Number(topImpactCheck?.impact_amount ?? 0);
  const baseCheckImpactDays = Number(topImpactCheck?.impact_days ?? 0);
  const hasUpdatedByOfficer = Number(payout?.updated_by ?? 0) > 0;
  const hasTopImpact = baseCheckImpactAmount > 0 || baseCheckImpactDays > 0;

  // Prefer check impact for the top summary to keep reason + amount/day consistent.
  const summaryDeductedAmount = hasTopImpact ? baseCheckImpactAmount : deductedAmount + otherLoss;
  const summaryDeductedDays = hasTopImpact ? baseCheckImpactDays : deductedDays;
  const hasDeductionImpact = summaryDeductedAmount > 0.01 || summaryDeductedDays > 0.01;

  const conditionDeductedDays =
    dailyRate > 0 && otherLoss > 0 ? Number((otherLoss / dailyRate).toFixed(2)) : 0;

  // Show manual override card only when payout was explicitly edited by a user.
  // Avoid using stale-check heuristics here because they can produce false positives.
  const hasManualOverrideSignal = hasUpdatedByOfficer;

  // Date Range Logic
  const eligibleDateRangesLabel = useMemo(() => {
    if (!month || !yearAd || eligibleDays <= 0) return null;
    const monthStart = new Date(yearAd, month - 1, 1);
    const monthEnd = new Date(yearAd, month, 0);
    const deductionRanges = checks
      .filter((check) => Number(check.impact_amount ?? 0) > 0 && check.start_date && check.end_date)
      .map((check) => {
        const start = new Date(String(check.start_date));
        const end = new Date(String(check.end_date));
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        const rangeStart = start < monthStart ? monthStart : start;
        const rangeEnd = end > monthEnd ? monthEnd : end;
        if (rangeStart > rangeEnd) return null;
        return { start: rangeStart, end: rangeEnd };
      })
      .filter((item): item is { start: Date; end: Date } => item !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (deductionRanges.length === 0) return null;

    const merged: Array<{ start: Date; end: Date }> = [];
    for (const range of deductionRanges) {
      const last = merged[merged.length - 1];
      if (!last) {
        merged.push({ ...range });
        continue;
      }
      const dayAfterLast = new Date(last.end);
      dayAfterLast.setDate(dayAfterLast.getDate() + 1);
      if (range.start <= dayAfterLast) {
        if (range.end > last.end) last.end = range.end;
      } else {
        merged.push({ ...range });
      }
    }

    const eligibleRanges: Array<{ start: Date; end: Date }> = [];
    let cursor = new Date(monthStart);
    for (const blocked of merged) {
      if (cursor < blocked.start) {
        const end = new Date(blocked.start);
        end.setDate(end.getDate() - 1);
        if (cursor <= end) eligibleRanges.push({ start: new Date(cursor), end });
      }
      cursor = new Date(blocked.end);
      cursor.setDate(cursor.getDate() + 1);
    }
    if (cursor <= monthEnd) {
      eligibleRanges.push({ start: new Date(cursor), end: new Date(monthEnd) });
    }

    const eligibleCountByRange = eligibleRanges.reduce((sum, range) => {
      const diff =
        Math.floor((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + Math.max(0, diff);
    }, 0);
    if (eligibleCountByRange !== eligibleDays) return null;

    return eligibleRanges
      .map((range) => {
        const startLabel = formatThaiDate(range.start);
        const endLabel = formatThaiDate(range.end);
        return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
      })
      .join(', ');
  }, [checks, eligibleDays, month, yearAd]);

  return (
    <div className="flex flex-col gap-6 w-full pb-8 pt-2">
      {/* 0. Smart Alerts Section - จัดกลุ่มกล่องแจ้งเตือนทั้งหมดไว้ด้วยกัน */}
      <div className="flex flex-col gap-3">
        {/* Warning Alert: สรุปยอดหัก */}
        {hasDeductionImpact && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200/60 text-orange-800 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold leading-tight mb-1">
                งวดนี้ถูกหัก {formatThaiNumber(summaryDeductedAmount, { maximumFractionDigits: 2 })}{' '}
                บาท ({formatThaiNumber(summaryDeductedDays)} วัน) เพราะ{summaryReason}
              </h4>
              {latestUpdatedAt && (
                <p className="text-xs text-orange-600/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ข้อมูลล่าสุด: {formatThaiDateTime(latestUpdatedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Alert: การแก้ไขโดยเจ้าหน้าที่ */}
        {hasManualOverrideSignal && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900 shadow-sm">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-3">
              <div>
                <p className="font-semibold text-blue-800">
                  รายการนี้มีการแก้ไขเพิ่มเติมโดยเจ้าหน้าที่
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  เหตุผลที่ระบุ: {(payout?.remark ?? '').trim() || 'ไม่ได้ระบุเหตุผล'}
                </p>
                {payoutUpdatedAt && (
                  <p className="text-xs text-blue-600/80 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> แก้ไขล่าสุด: {formatThaiDateTime(payoutUpdatedAt)}
                  </p>
                )}
              </div>

              {/* ปรับการแสดงผลก่อน-หลังแก้ไข ให้อ่านง่ายขึ้นคล้ายๆ ตาราง */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white/60 p-3 rounded-lg border border-blue-100/50">
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">ก่อนแก้ไข (ตรวจสอบเดิม):</span>
                  <span className="font-medium text-slate-700">
                    หักประมาณ{' '}
                    {formatThaiNumber(baseCheckImpactAmount, { maximumFractionDigits: 2 })} บาท (
                    {formatThaiNumber(baseCheckImpactDays)} วัน)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">หลังแก้ไข (ค่าปัจจุบัน):</span>
                  <span className="font-semibold text-blue-700">
                    หัก {formatThaiNumber(deductedAmount, { maximumFractionDigits: 2 })} บาท (
                    {formatThaiNumber(deductedDays)} วัน)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Alert: ข้อมูลอาจไม่อัปเดต */}
        {checksMayBeStale && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
            <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <p>
              มีการแก้ไขข้อมูลการเบิกจ่ายล่าสุดเมื่อ{' '}
              <span className="font-medium">{formatThaiDateTime(payoutUpdatedAt)}</span> ส่วน
              &quot;ประเด็นที่ตรวจพบ&quot; อาจยังไม่อัปเดตตามยอดที่แก้ไขล่าสุด
            </p>
          </div>
        )}
      </div>

      <hr className="border-slate-100 my-2" />

      {/* 1. รายการแจ้งเตือน / ข้อควรระวัง (ต้องไปแก้ UI ใน ChecksIssuesSection เพิ่มเติม) */}
      <ChecksIssuesSection
        checks={checks}
        fallbackIssues={fallbackRow?.issues ?? []}
        overQuotaHref={leaveStudyHref}
        canManageLeaves={isPtsOfficer}
      />

      {/* 2. สรุปตัวเลขคำนวณเงิน (ต้องไปแก้ UI ใน ChecksCalculationSection เพิ่มเติม) */}
      <ChecksCalculationSection
        baseRate={baseRate}
        daysInMonth={daysInMonth}
        dailyRate={dailyRate}
        eligibleDays={eligibleDays}
        eligibleDateRangesLabel={eligibleDateRangesLabel}
        deductedDays={deductedDays}
        conditionDeductedDays={conditionDeductedDays}
        calculatedAmount={calculatedAmount}
        deductedAmount={deductedAmount}
        otherLoss={otherLoss}
        retro={retro}
        totalPayable={totalPayable}
      />
    </div>
  );
}
