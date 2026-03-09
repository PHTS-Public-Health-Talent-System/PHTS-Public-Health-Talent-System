'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { formatThaiNumber } from '@/shared/utils/thai-locale';
import { ReturnReportStatusBadge } from '@/components/common';
import {
  formatThaiShortDate,
  leaveTypeLabel,
  localizePayrollText,
  normalizeLicenseStatusLabel,
  normalizeReturnReportStatus,
  quotaUnitLabel,
  toNumber,
} from './checks.helpers';

export function SummaryWithBoldMoney({ summary }: { summary: string }) {
  const re = /([+-]?\d[\d,]*(?:\.\d+)?)(\s*บาท)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of summary.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(summary.slice(last, idx));
    const amount = match[1] ?? '';
    const unit = match[2] ?? ' บาท';
    parts.push(
      <span key={`${idx}-${amount}`} className="inline-flex items-baseline gap-1 mx-1">
        <span className="font-bold tabular-nums text-foreground">{amount}</span>
        <span className="text-[10px] font-semibold text-muted-foreground">{unit}</span>
      </span>,
    );
    last = idx + match[0].length;
  }
  if (last < summary.length) parts.push(summary.slice(last));
  return <>{parts.length ? parts : summary}</>;
}

export function EvidenceBlock({
  evidence,
  variant,
}: {
  evidence: unknown;
  variant: 'danger' | 'warning';
}) {
  return (
    <div
      className={cn(
        'py-3.5 text-muted-foreground transition-colors hover:bg-muted/30',
        variant === 'danger'
          ? 'border-l-4 border-l-destructive pl-4'
          : 'border-l-4 border-l-amber-500 pl-4',
      )}
    >
      <EvidenceLine evidence={evidence} />
    </div>
  );
}

type EvidenceGridItem = {
  label: string;
  value: React.ReactNode;
  align?: 'left' | 'right';
  colSpan?: 1 | 2;
};

function formatGenericEvidenceValue(key: string, value: unknown): React.ReactNode {
  return <span className="break-words">{String(value)}</span>;
}

function EvidenceGrid({ label, items }: { label: string; items: EvidenceGridItem[] }) {
  const filtered = items.filter(Boolean) as EvidenceGridItem[];
  if (!label && filtered.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {label ? (
        <div className="text-xs font-bold uppercase tracking-wider text-foreground/80">{label}</div>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {filtered.map((item, idx) => (
          <div
            key={`${label}-${idx}-${item.label}`}
            className={cn(
              'flex flex-col justify-center gap-0.5 rounded-lg border border-border/40 bg-muted/20 px-3 py-2',
              item.colSpan === 2 && 'col-span-2',
              item.align === 'right' ? 'items-end text-right' : 'items-start text-left',
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {item.label}
            </span>
            <span className="text-xs font-medium text-foreground leading-tight">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceLine({ evidence }: { evidence: unknown }) {
  if (!evidence || typeof evidence !== 'object') return <span>{String(evidence)}</span>;
  const ev = evidence as Record<string, unknown>;
  const type = String(ev.type ?? '');

  if (type === 'eligibility') {
    return (
      <EvidenceGrid
        label="ข้อมูลสิทธิ / อัตราตั้งต้น"
        items={[
          {
                  label: 'อัตราเงิน พ.ต.ส.',
            value: (
              <span className="tabular-nums font-bold text-primary">
                {formatThaiNumber(toNumber(ev.rate))}{' '}
                <span className="text-[10px] font-normal text-muted-foreground">บาท</span>
              </span>
            ),
            colSpan: 2,
          },
          {
            label: 'วันที่มีผล',
            value: <span className="tabular-nums">{formatThaiShortDate(ev.effective_date)}</span>,
          },
          ...(ev.expiry_date
            ? [
                {
                  label: 'วันหมดอายุ',
                  value: (
                    <span className="tabular-nums">{formatThaiShortDate(ev.expiry_date)}</span>
                  ),
                },
              ]
            : []),
        ]}
      />
    );
  }

  if (type === 'eligibility_gap') {
    const missing = Array.isArray(ev.missing_ranges)
      ? (ev.missing_ranges as Array<Record<string, unknown>>)
      : [];

    if (missing.length === 0) {
      return (
        <EvidenceGrid
          label="ช่องว่างของสิทธิ"
          items={[
            {
              label: 'ช่วงที่ปฏิบัติงาน',
              value: (
                <span className="tabular-nums">
                  {formatThaiShortDate(ev.work_start_date)} -{' '}
                  {formatThaiShortDate(ev.work_end_date)}
                </span>
              ),
              colSpan: 2,
            },
            {
              label: 'ช่วงที่สิทธิขาดหาย',
              value: <span className="text-muted-foreground">-</span>,
              colSpan: 2,
            },
          ]}
        />
      );
    }

    return (
      <div className="space-y-3">
        {missing.map((range, idx) => (
          <EvidenceGrid
            key={`gap-${idx}`}
            label={idx === 0 ? 'ตรวจพบช่องว่างของสิทธิ' : ''}
            items={[
              {
                label: 'ช่วงที่ปฏิบัติงาน',
                value: (
                  <span className="tabular-nums">
                    {formatThaiShortDate(ev.work_start_date)} -{' '}
                    {formatThaiShortDate(ev.work_end_date)}
                  </span>
                ),
                colSpan: 2,
              },
              {
                label: 'ช่วงที่สิทธิขาดหาย',
                value: (
                  <span className="tabular-nums font-bold text-destructive">
                    {formatThaiShortDate(range?.start)} - {formatThaiShortDate(range?.end)}
                  </span>
                ),
                colSpan: 2,
              },
            ]}
          />
        ))}
      </div>
    );
  }

  if (type === 'leave') {
    const quotaLimitRaw = ev.quota_limit;
    const quotaLimit =
      quotaLimitRaw === null || quotaLimitRaw === undefined ? null : Number(quotaLimitRaw);
    const leaveDurationRaw = ev.leave_duration;
    const leaveDuration =
      leaveDurationRaw === null || leaveDurationRaw === undefined ? null : Number(leaveDurationRaw);
    const unit = String(ev.quota_unit ?? '');
    const leaveType = String(ev.leave_type ?? '');
    const start = formatThaiShortDate(ev.start_date);
    const end = formatThaiShortDate(ev.end_date);
    const exceed = ev.exceed_date ? formatThaiShortDate(ev.exceed_date) : null;

    const overQuota = Boolean(ev.over_quota);
    const isNoPay = Boolean(ev.is_no_pay);
    const returnReportStatus = String(ev.return_report_status ?? '').trim();
    const returnReportBadge = normalizeReturnReportStatus(returnReportStatus);
    const hasReturnReportTracking = Object.prototype.hasOwnProperty.call(ev, 'return_report_status');
    const isPendingReturnReport = hasReturnReportTracking && returnReportBadge !== 'reported';

    return (
      <EvidenceGrid
        label={`รายการลา (${leaveTypeLabel(leaveType)})`}
        items={[
          {
            label: 'เลขที่อ้างอิง',
            value: <span className="font-mono">#{String(ev.leave_record_id ?? '-')}</span>,
          },
          {
            label: 'ช่วงวันที่ลา',
            value: (
              <span className="tabular-nums">
                {start} - {end}
              </span>
            ),
            colSpan: 2,
          },
          {
            label: 'สถานะรายการ',
            value: isNoPay ? (
              <span className="text-destructive font-bold">ไม่ได้รับเงิน พ.ต.ส.</span>
            ) : overQuota ? (
              <span className="text-orange-600 font-bold">ลาเกินโควตา</span>
            ) : isPendingReturnReport ? (
              <span className="text-amber-700 font-bold">ยังไม่รายงานตัวกลับ</span>
            ) : (
              'ลาปกติ'
            ),
          },
          ...(overQuota
            ? [
                {
                  label: 'เกินสิทธิตั้งแต่',
                  value: (
                    <span className="tabular-nums font-medium text-orange-600">
                      {exceed ?? '-'}
                    </span>
                  ),
                  colSpan: 2 as const,
                },
              ]
            : []),
          ...(overQuota && quotaLimit !== null && Number.isFinite(quotaLimit)
            ? [
                {
                  label: 'โควตาตั้งต้น',
                  value: (
                    <span className="tabular-nums">
                      {formatThaiNumber(quotaLimit)}{' '}
                      <span className="text-[10px] text-muted-foreground">
                        {quotaUnitLabel(unit)}
                      </span>
                    </span>
                  ),
                },
              ]
            : []),
          ...(overQuota && leaveDuration !== null && Number.isFinite(leaveDuration)
            ? [
                {
                  label: 'ลารอบนี้',
                  value: (
                    <span className="tabular-nums">
                      {formatThaiNumber(leaveDuration)}{' '}
                      <span className="text-[10px] text-muted-foreground">วัน</span>
                    </span>
                  ),
                },
              ]
            : []),
          ...(hasReturnReportTracking
            ? [
                {
                  label: 'สถานะรายงานตัว',
                  value: returnReportBadge ? (
                    <ReturnReportStatusBadge status={returnReportBadge} tone="soft" />
                  ) : (
                    'ยังไม่รายงานตัว'
                  ),
                  colSpan: 2 as const,
                },
              ]
            : []),
        ]}
      />
    );
  }

  if (type === 'license') {
    return (
      <EvidenceGrid
        label="ข้อมูลใบอนุญาตประกอบวิชาชีพ"
        items={[
          {
            label: 'สถานะใบอนุญาต',
            value: (
              <span className="font-semibold text-foreground">
                {normalizeLicenseStatusLabel(ev.status)}
              </span>
            ),
          },
          {
            label: 'วันที่มีผล',
            value: <span className="tabular-nums">{formatThaiShortDate(ev.valid_from)}</span>,
          },
          {
            label: 'วันหมดอายุ',
            value: (
              <span className="tabular-nums font-bold text-destructive">
                {formatThaiShortDate(ev.valid_until)}
              </span>
            ),
            colSpan: 2,
          },
        ]}
      />
    );
  }

  if (type === 'movement') {
    return (
      <EvidenceGrid
        label="ประวัติความเคลื่อนไหว (บุคลากร)"
        items={[
          {
            label: 'ประเภทรายการ',
            value: (
              <span className="font-semibold">
                {localizePayrollText(String(ev.movement_type ?? '-'))}
              </span>
            ),
            colSpan: 2,
          },
          {
            label: 'วันที่มีผล',
            value: <span className="tabular-nums">{formatThaiShortDate(ev.effective_date)}</span>,
            colSpan: 2,
          },
        ]}
      />
    );
  }

  if (type === 'retro') {
    const diff = Number(ev.diff ?? 0);
    const ref = `${String(ev.reference_month ?? '-').padStart(2, '0')}/${String(ev.reference_year ?? '-')}`;
    return (
      <EvidenceGrid
        label="รายละเอียดส่วนต่างตกเบิก"
        items={[
          {
            label: 'งวดที่อ้างอิง',
            value: <span className="tabular-nums bg-muted px-1.5 py-0.5 rounded">{ref}</span>,
          },
          {
            label: 'ส่วนต่างที่ต้องปรับ',
            value: (
              <span
                className={cn(
                  'tabular-nums font-bold',
                  diff < 0 ? 'text-destructive' : 'text-blue-600',
                )}
              >
                {diff >= 0 ? '+' : ''}
                {formatThaiNumber(diff)}{' '}
                <span className="text-[10px] font-normal opacity-70">บาท</span>
              </span>
            ),
            colSpan: 2,
          },
          ...(ev.remark
            ? [
                {
                  label: 'หมายเหตุระบบ',
                  value: <span className="text-muted-foreground italic">{String(ev.remark)}</span>,
                  colSpan: 2 as const,
                },
              ]
            : []),
        ]}
      />
    );
  }

  const genericEntries = Object.entries(ev).filter(
    ([key, value]) => key !== 'type' && value !== null && value !== undefined && value !== '',
  );

  if (genericEntries.length > 0) {
    const labelMap: Record<string, string> = {
      detail: 'รายละเอียด',
      source: 'แหล่งข้อมูล',
      remark: 'หมายเหตุ',
      message: 'ข้อความ',
      status: 'สถานะ',
    };

    return (
      <EvidenceGrid
        label="รายละเอียดเพิ่มเติม"
        items={genericEntries.map(([key, value]) => ({
          label: labelMap[key] ?? key,
          value: formatGenericEvidenceValue(key, value),
          colSpan: 2 as const,
        }))}
      />
    );
  }

  return (
    <div className="text-[11px] font-mono text-muted-foreground/50 p-2 bg-muted/20 rounded-md break-all">
      {JSON.stringify(ev)}
    </div>
  );
}
