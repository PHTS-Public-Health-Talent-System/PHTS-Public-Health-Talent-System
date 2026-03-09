'use client';

import Link from 'next/link';
import { CalendarDays, ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnReportStatusBadge } from '@/components/common';
import type { PayoutDetail } from '@/features/payroll/api';
import { formatThaiNumber } from '@/shared/utils/thai-locale';
import { cn } from '@/lib/utils';
import {
  formatThaiShortDate,
  leaveTypeLabel,
  normalizeReturnReportStatus,
  quotaUnitLabel,
} from './checks.helpers';

type LeaveImpactSummary = NonNullable<PayoutDetail['leaveImpactSummary']>;

const formatQuotaDisplay = (value: number | null, unitLabel = 'วัน') =>
  value === null ? '-' : `${formatThaiNumber(value)} ${unitLabel}`;

export function LeaveImpactSummarySection({
  summary,
  citizenId,
}: {
  summary: LeaveImpactSummary | undefined;
  citizenId?: string | null;
}) {
  if (!summary) return null;

  const baseLeaveManagementHref = citizenId
    ? `/pts-officer/leave-management?search=${encodeURIComponent(citizenId)}`
    : '/pts-officer/leave-management';
  const leaveTypesInPeriod = new Set(summary.leavesInPeriod.map((leave) => leave.leaveType));

  const relevantQuota = summary.quotaByType.filter(
    (quota) =>
      leaveTypesInPeriod.has(quota.leaveType) &&
      (quota.usedInPeriod > 0 ||
        quota.overQuota ||
        (quota.tracksBalance &&
          quota.remainingAfterPeriod !== null &&
          quota.remainingAfterPeriod <= 0)),
  );

  return (
    <Card className="border-border/60 bg-muted/5 shadow-sm overflow-hidden">
      <CardHeader className="space-y-4 border-b bg-background/50 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              สรุปวันลาที่กระทบงวดนี้
            </CardTitle>
            <p className="text-xs text-muted-foreground">แสดงเฉพาะรายการที่มีผลกับยอดจ่ายในงวดนี้</p>
          </div>

          <div className="flex flex-col gap-3 md:min-w-[280px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/80 bg-background px-3 py-2 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  วันถูกหักรวม
                </div>
                <div
                  className={cn(
                    'text-sm font-bold tabular-nums mt-0.5',
                    summary.deductedDays > 0 ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {formatThaiNumber(summary.deductedDays)}{' '}
                  <span className="text-[10px] font-normal text-muted-foreground">วัน</span>
                </div>
              </div>
              <div className="rounded-xl border border-border/80 bg-background px-3 py-2 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ยอดหักรวม
                </div>
                <div
                  className={cn(
                    'text-sm font-bold tabular-nums mt-0.5',
                    summary.deductedAmount > 0 ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {formatThaiNumber(summary.deductedAmount)}{' '}
                  <span className="text-[10px] font-normal text-muted-foreground">บาท</span>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full justify-between shadow-sm bg-background">
              <Link href={baseLeaveManagementHref}>
                <span>ไปจัดการวันลา</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section className="space-y-3">
          <div className="text-xs font-bold tracking-wider text-primary flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> วันลาที่มีผลในงวดนี้
          </div>

          {summary.leavesInPeriod.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
              ไม่มีประวัติการลาที่กระทบงวดนี้
            </div>
          ) : (
            <div className="space-y-3">
              {summary.leavesInPeriod.map((leave) => (
                <div
                  key={`${leave.leaveRecordId ?? 'no-id'}-${leave.overlapStartDate}-${leave.overlapEndDate}`}
                  className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold text-foreground text-sm">{leaveTypeLabel(leave.leaveType)}</div>
                        {leave.overQuota && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] border-orange-300 bg-orange-50 text-orange-700"
                          >
                            เกินสิทธิ
                          </Badge>
                        )}
                        {leave.returnReportStatus && (
                          <ReturnReportStatusBadge
                            status={normalizeReturnReportStatus(leave.returnReportStatus) ?? undefined}
                            tone="soft"
                          />
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="w-24">ช่วงที่ลา:</span>
                          <span className="font-mono text-foreground">
                            {formatThaiShortDate(leave.startDate)} - {formatThaiShortDate(leave.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-24">กระทบงวด:</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatThaiShortDate(leave.overlapStartDate)} -{' '}
                            {formatThaiShortDate(leave.overlapEndDate)}
                          </span>
                        </div>
                      </div>

                      {leave.overQuota && leave.exceedDate && (
                        <div className="text-[11px] font-semibold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                          เกินสิทธิตั้งแต่ {formatThaiShortDate(leave.exceedDate)}
                        </div>
                      )}
                    </div>

                    <div className="grid min-w-[280px] grid-cols-2 gap-2 text-sm shrink-0 mt-2 lg:mt-0">
                      <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                        <div className="text-[10px] tracking-wider text-muted-foreground font-medium">วันในงวดนี้</div>
                        <div className="font-bold tabular-nums text-foreground mt-0.5">
                          {formatThaiNumber(leave.daysInPeriod)}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground">วัน</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                        <div className="text-[10px] tracking-wider text-muted-foreground font-medium">วันถูกหัก</div>
                        <div className="font-bold tabular-nums text-destructive mt-0.5">
                          {formatThaiNumber(leave.deductedDays)}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground">วัน</span>
                        </div>
                      </div>
                      <div className="col-span-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                        <div className="text-[10px] tracking-wider text-muted-foreground font-medium">ยอดหักจากรายการนี้</div>
                        <div className="font-bold tabular-nums text-destructive mt-0.5">
                          {formatThaiNumber(leave.deductedAmount)} บาท
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {relevantQuota.length > 0 ? (
          <section className="space-y-3">
            <div className="text-xs font-bold tracking-wider text-primary">สรุปสิทธิที่ควรเฝ้าระวัง</div>
            <div className="grid gap-3 lg:grid-cols-2">
              {relevantQuota.map((quota) => (
                <div key={quota.leaveType} className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between border-b border-border/50 pb-2 gap-2">
                      <div className="font-bold text-foreground text-sm">{leaveTypeLabel(quota.leaveType)}</div>
                      <div className="text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        สิทธิ {formatQuotaDisplay(quota.quotaLimit, quotaUnitLabel(quota.quotaUnit ?? ''))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                      <div className="space-y-0.5">
                        <div className="text-[10px] tracking-wider text-muted-foreground">ใช้ก่อนงวด</div>
                        <div className="font-semibold tabular-nums text-sm">
                          {formatThaiNumber(quota.usedBeforePeriod)} วัน
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] tracking-wider text-primary font-semibold">ใช้ในงวดนี้</div>
                        <div className="font-bold tabular-nums text-sm text-primary">
                          +{formatThaiNumber(quota.usedInPeriod)} วัน
                        </div>
                      </div>

                      {quota.tracksBalance ? (
                        <div className="col-span-2 space-y-0.5 pt-2 border-t border-border/40">
                          <div className="text-[10px] tracking-wider text-muted-foreground">คงเหลือปัจจุบัน</div>
                          <div
                            className={cn(
                              'font-bold tabular-nums text-xs',
                              quota.remainingAfterPeriod !== null && quota.remainingAfterPeriod <= 0
                                ? 'text-destructive'
                                : 'text-emerald-600',
                            )}
                          >
                            {formatQuotaDisplay(quota.remainingAfterPeriod)}
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2 space-y-0.5 pt-2 border-t border-border/40">
                          <div className="text-[10px] tracking-wider text-muted-foreground">รูปแบบสิทธิ</div>
                          <div className="font-medium text-xs text-muted-foreground">นับโควตาต่อรายการลา</div>
                        </div>
                      )}
                    </div>

                    {quota.overQuota && quota.exceedDate && (
                      <div className="text-[11px] font-semibold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                        เกินสิทธิตั้งแต่ {formatThaiShortDate(quota.exceedDate)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
