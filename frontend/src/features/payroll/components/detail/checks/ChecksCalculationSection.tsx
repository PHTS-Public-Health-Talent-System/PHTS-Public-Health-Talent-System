'use client';

import type { ReactNode } from 'react';
import { Banknote, Calculator, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatThaiNumber } from '@/shared/utils/thai-locale';

type ChecksCalculationSectionProps = {
  baseRate: number;
  daysInMonth: number;
  dailyRate: number;
  eligibleDays: number;
  eligibleDateRangesLabel?: string | null;
  deductedDays: number;
  conditionDeductedDays?: number;
  calculatedAmount: number;
  deductedAmount: number;
  otherLoss: number;
  retro: number;
  totalPayable: number;
};

type CalcRowProps = {
  label: ReactNode;
  value: string | number;
  unit?: string;
  valueClass?: string;
  labelClass?: string;
};

function CalcRow({
  label,
  value,
  unit = 'บาท',
  valueClass = '',
  labelClass = 'text-muted-foreground',
}: CalcRowProps) {
  return (
    <div className="flex justify-between items-start text-sm py-1">
      <span className={labelClass}>{label}</span>
      <div className="flex items-baseline gap-2 text-right">
        <span className={cn('font-medium tabular-nums text-foreground', valueClass)}>{value}</span>
        <span className="text-xs text-muted-foreground w-6 text-left">{unit}</span>
      </div>
    </div>
  );
}

export function ChecksCalculationSection({
  baseRate,
  daysInMonth,
  dailyRate,
  eligibleDays,
  eligibleDateRangesLabel,
  deductedDays,
  conditionDeductedDays = 0,
  calculatedAmount,
  deductedAmount,
  otherLoss,
  retro,
  totalPayable,
}: ChecksCalculationSectionProps) {
  const calculatedByDailyRate = dailyRate * eligibleDays;
  const followsDailyFormula = Math.abs(calculatedByDailyRate - calculatedAmount) < 0.01;
  const monthlyBaseAmount = Number(
    Math.max(calculatedAmount + deductedAmount + otherLoss, baseRate).toFixed(2),
  );
  const totalDeductedDays = Number((deductedDays + conditionDeductedDays).toFixed(2));

  return (
    <section className="space-y-4 mt-2">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 tracking-tight">
        <Calculator className="h-4 w-4 text-primary" />
        สรุปการคำนวณ (แบบย่อ)
      </h3>

      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 items-start">
        {/* --- LEFT CARD: Base Variables --- */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-3 mb-3">
            <FileText className="h-3.5 w-3.5" /> ค่าหลักที่ใช้คำนวณ
          </h4>

          <div className="space-y-1.5">
            <CalcRow label="อัตราเงินเต็มเดือน" value={formatThaiNumber(baseRate)} />
            <CalcRow
              label="อัตราเฉลี่ยต่อวัน"
              value={formatThaiNumber(dailyRate, { maximumFractionDigits: 2 })}
            />
            <CalcRow label="วันมีสิทธิรับเงิน" value={formatThaiNumber(eligibleDays)} unit="วัน" />

            {eligibleDateRangesLabel && (
              <div className="flex flex-col py-1 space-y-1">
                <span className="text-sm text-muted-foreground">ช่วงวันที่มีสิทธิรับเงินจริง</span>
                <span className="text-sm font-medium text-foreground text-right pl-4 leading-snug">
                  {eligibleDateRangesLabel}
                </span>
              </div>
            )}

            <CalcRow
              label="วันถูกหักจากวันลา"
              value={formatThaiNumber(deductedDays)}
              unit="วัน"
              valueClass={
                deductedDays > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
              }
            />
            <CalcRow
              label="วันถูกหักจากเงื่อนไขสิทธิ"
              value={formatThaiNumber(conditionDeductedDays)}
              unit="วัน"
              valueClass={
                conditionDeductedDays > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
              }
            />
            <CalcRow
              label="วันที่ไม่ได้รับเงิน (รวม)"
              value={formatThaiNumber(totalDeductedDays)}
              unit="วัน"
              valueClass={
                totalDeductedDays > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
              }
            />
          </div>

          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-right">
              เดือนนี้มี {formatThaiNumber(daysInMonth)} วัน
            </p>
          </div>
        </div>

        {/* --- RIGHT CARD: Calculation Result (The Slip) --- */}
        <div className="flex flex-col rounded-xl border border-primary/20 bg-gradient-to-b from-card to-primary/[0.02] shadow-sm overflow-hidden">
          <div className="p-5 pb-0">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/10 pb-3 mb-3">
              <Banknote className="h-3.5 w-3.5" /> ผลลัพธ์งวดนี้
            </h4>

            <div className="space-y-1.5">
              <CalcRow
                label="ยอดฐานก่อนหัก"
                value={formatThaiNumber(monthlyBaseAmount, { maximumFractionDigits: 2 })}
              />
              <CalcRow
                label="ยอดหักตามวันที่ถูกหัก"
                value={`${deductedAmount > 0 ? '-' : ''}${formatThaiNumber(deductedAmount, { maximumFractionDigits: 2 })}`}
                valueClass={
                  deductedAmount > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }
              />
              <CalcRow
                label="ยอดหักจากเงื่อนไขอื่น"
                value={`${otherLoss > 0 ? '-' : ''}${formatThaiNumber(otherLoss, { maximumFractionDigits: 2 })}`}
                valueClass={
                  otherLoss > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }
              />

              {/* Math Divider Line */}
              <div className="border-t border-dashed border-border/60 my-2" />

              <CalcRow
                label={<span className="font-medium text-foreground">ยอดหลังหักเงื่อนไข</span>}
                value={formatThaiNumber(calculatedAmount)}
                valueClass="font-semibold"
              />
              <CalcRow
                label="ยอดตกเบิก"
                value={`${retro > 0 ? '+' : ''}${formatThaiNumber(retro)}`}
                valueClass={
                  retro > 0
                    ? 'text-emerald-600 font-semibold'
                    : retro < 0
                      ? 'text-destructive font-semibold'
                      : 'text-muted-foreground'
                }
              />
            </div>
          </div>

          {/* --- GRAND TOTAL AREA --- */}
          <div className="mt-4 bg-primary/5 p-5 border-t border-primary/10">
            <div className="flex items-end justify-between mb-1">
              <div>
                <span className="text-sm font-bold text-foreground block mb-0.5">รวมจ่ายสุทธิ</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">
                  {formatThaiNumber(totalPayable)}
                </span>
                <span className="text-sm font-bold text-emerald-600/80 w-6">บาท</span>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-muted-foreground mt-2">
              {followsDailyFormula
                ? `คำนวณจาก ${formatThaiNumber(dailyRate, { maximumFractionDigits: 2 })} บาท/วัน × ${formatThaiNumber(eligibleDays)} วันมีสิทธิ`
                : 'ยอดนี้เป็นผลลัพธ์หลังหักวันไม่มีสิทธิและเงื่อนไขของงวดนี้แล้ว'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
