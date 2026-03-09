'use client';

import Link from 'next/link';
import { AlertTriangle, Info, XCircle, ArrowRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PayoutDetail } from '@/features/payroll/api';
import { issueBadgeClass } from '../model/detail.helpers';
import type { PayrollRow } from '../model/detail.types';
import { EvidenceBlock, SummaryWithBoldMoney } from './ChecksEvidence';
import { localizePayrollText } from './checks.helpers';

type ChecksIssuesSectionProps = {
  checks: PayoutDetail['checks'];
  fallbackIssues: PayrollRow['issues'];
  overQuotaHref?: string | null;
  canManageLeaves?: boolean;
};

const MAX_EVIDENCE_PREVIEW = 6;

function getActionHref(
  code: string | undefined,
  overQuotaHref: string | null | undefined,
): string | null {
  const normalized = String(code ?? '').toUpperCase();
  if (normalized.includes('OVER_QUOTA')) return overQuotaHref ?? null;
  return null;
}

function getActionLabel(code: string | undefined): string {
  const normalized = String(code ?? '').toUpperCase();
  if (normalized.includes('OVER_QUOTA')) return 'ไปตรวจสอบสิทธิลา';
  return 'ไปจัดการประเด็นนี้'; // ปรับคำให้ดูเป็น Action ที่ครอบคลุมขึ้น
}

function isPendingReturnIssue(code: string | undefined): boolean {
  return String(code ?? '')
    .toUpperCase()
    .includes('PENDING_RETURN');
}

export function ChecksIssuesSection({
  checks,
  fallbackIssues,
  overQuotaHref,
  canManageLeaves = false,
}: ChecksIssuesSectionProps) {
  const visibleChecks = checks.filter((check) => !isPendingReturnIssue(check.code));

  if (visibleChecks.length === 0 && fallbackIssues.length === 0) return null;

  const byImpactDesc = (a: PayoutDetail['checks'][number], b: PayoutDetail['checks'][number]) =>
    Math.abs(Number(b.impact_amount ?? 0)) - Math.abs(Number(a.impact_amount ?? 0));
  const blockers = visibleChecks.filter((check) => check.severity === 'BLOCKER').sort(byImpactDesc);
  const warnings = visibleChecks.filter((check) => check.severity !== 'BLOCKER').sort(byImpactDesc);

  return (
    <section className="space-y-4 mt-2">
      {/* Header ปรับให้มี Animation ดึงดูดสายตาถ้ามีเรื่องต้องทำ */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-2 w-2 rounded-full ${blockers.length > 0 ? 'bg-destructive animate-pulse' : 'bg-amber-500'}`}
        />
        <h3 className="text-base font-bold text-slate-800 tracking-tight">
          {canManageLeaves ? 'สิ่งที่ต้องดำเนินการ' : 'ประเด็นที่ตรวจพบ'}
          <span className="text-muted-foreground ml-1 font-medium">
            ({visibleChecks.length || fallbackIssues.length})
          </span>
        </h3>
      </div>

      {visibleChecks.length > 0 ? (
        <div className="grid gap-5">
          {/* --- BLOCKERS SECTION --- */}
          {blockers.map((check) => (
            <div
              key={check.check_id}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md group"
            >
              {/* Left Accent Border สำหรับ Blocker (สีแดง) */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />

              <div className="p-5 pl-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h4 className="text-sm font-bold text-foreground">
                      {localizePayrollText(check.title)}
                    </h4>
                    <Badge
                      variant="destructive"
                      className="h-5 px-2 text-[10px] uppercase tracking-wider bg-destructive/10 text-destructive border-none shadow-none hover:bg-destructive/20"
                    >
                      ระงับการจ่าย
                    </Badge>
                  </div>
                  {check.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                      <SummaryWithBoldMoney summary={localizePayrollText(check.summary)} />
                    </p>
                  )}
                </div>

                {/* ย้ายปุ่ม Action มาไว้ขวาบนให้เด่นชัด (Common Sense UI) */}
                {canManageLeaves && getActionHref(check.code, overQuotaHref) && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Link
                      href={getActionHref(check.code, overQuotaHref) as string}
                      className="flex items-center gap-1.5"
                    >
                      {getActionLabel(check.code)}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Evidence Section - ปรับให้คลีน ไร้ขอบซ้อนขอบ */}
              {Array.isArray(check.evidence) && check.evidence.length > 0 && (
                <div className="bg-destructive/5 border-t border-destructive/10 p-4 pl-6">
                  <p className="text-xs font-semibold text-destructive/80 mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> รายละเอียดหลักฐาน ({check.evidence.length}{' '}
                    รายการ)
                  </p>
                  <div className="space-y-2">
                    {check.evidence.slice(0, MAX_EVIDENCE_PREVIEW).map((ev, idx) => (
                      <EvidenceBlock key={idx} evidence={ev} variant="danger" />
                    ))}
                  </div>
                  {check.evidence.length > MAX_EVIDENCE_PREVIEW && (
                    <div className="mt-3 pt-3 border-t border-destructive/10 text-xs font-medium text-destructive/70 text-center">
                      + ยังมีอีก {check.evidence.length - MAX_EVIDENCE_PREVIEW} รายการ (แสดงผลสูงสุด{' '}
                      {MAX_EVIDENCE_PREVIEW} รายการ)
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* --- WARNINGS SECTION --- */}
          {warnings.map((check) => (
            <div
              key={check.check_id}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md group"
            >
              {/* Left Accent Border สำหรับ Warning (สีเหลือง/ส้ม) */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />

              <div className="p-5 pl-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-foreground">
                      {localizePayrollText(check.title)}
                    </h4>
                    <Badge
                      variant="secondary"
                      className="h-5 px-2 text-[10px] uppercase tracking-wider bg-amber-100/50 text-amber-700 border-amber-200/50 hover:bg-amber-100"
                    >
                      ตรวจสอบ
                    </Badge>
                  </div>
                  {check.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                      <SummaryWithBoldMoney summary={localizePayrollText(check.summary)} />
                    </p>
                  )}
                </div>

                {canManageLeaves && getActionHref(check.code, overQuotaHref) && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-amber-700 border-amber-300/50 hover:bg-amber-50"
                  >
                    <Link
                      href={getActionHref(check.code, overQuotaHref) as string}
                      className="flex items-center gap-1.5"
                    >
                      {getActionLabel(check.code)}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Evidence Section (Warning) */}
              {Array.isArray(check.evidence) && check.evidence.length > 0 && (
                <div className="bg-amber-50/50 border-t border-amber-100/50 p-4 pl-6">
                  <p className="text-xs font-semibold text-amber-700/80 mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> รายละเอียดหลักฐาน ({check.evidence.length}{' '}
                    รายการ)
                  </p>
                  <div className="space-y-2">
                    {check.evidence.slice(0, MAX_EVIDENCE_PREVIEW).map((ev, idx) => (
                      <EvidenceBlock key={idx} evidence={ev} variant="warning" />
                    ))}
                  </div>
                  {check.evidence.length > MAX_EVIDENCE_PREVIEW && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50 text-xs font-medium text-amber-700/70 text-center">
                      + ยังมีอีก {check.evidence.length - MAX_EVIDENCE_PREVIEW} รายการ
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* --- FALLBACK & EMPTY STATE --- */
        <div className="grid gap-3">
          {fallbackIssues.map((issue) => (
            <div
              key={issue.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{issue.label}</span>
              </div>
              <Badge variant="outline" className={issueBadgeClass(issue.key)}>
                {issue.level}
              </Badge>
            </div>
          ))}
          <div className="flex items-start gap-3 mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <p className="leading-relaxed">
              ยังไม่มีรายละเอียดเชิงลึกของรายการนี้ในระบบเวอร์ชันปัจจุบัน
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
