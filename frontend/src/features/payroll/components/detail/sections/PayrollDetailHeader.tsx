'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  XCircle,
  Loader2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmActionDialog } from '@/components/common';
import { formatDate, formatPeriodLabel } from '../model/detail.helpers';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PayrollDetailHeaderProps = {
  backHref: string;
  period:
    | {
        period_month?: number | null;
        period_year?: number | null;
        created_by_name?: string | null;
        created_at?: string | null;
        status?: string;
        snapshot_status?: string | null;
      }
    | undefined;
  activeProfessionLabel: string;
  statusLabel: string;
  statusClassName: string;
  allowApprovalActions: boolean;
  approvalStatus: string;
  approvalLabel: string;
  canRejectPeriod: boolean;
  periodStatus?: string;
  currentProfessionReviewed: boolean;
  canSubmitReview: boolean;
  isSubmittingForReview: boolean;
  onApproveClick: () => void;
  onRejectClick: () => void;
  onToggleReviewed?: () => void;
  onSubmitForReview?: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  isPdfPending: boolean;
  isPdfReady: boolean;
  pdfDisabledReason?: string;
  snapshotStatusLabel: string;
  snapshotStatusClassName: string;
};

export function PayrollDetailHeader({
  backHref,
  period,
  activeProfessionLabel,
  statusLabel,
  statusClassName,
  allowApprovalActions,
  approvalStatus,
  approvalLabel,
  canRejectPeriod,
  periodStatus,
  currentProfessionReviewed,
  canSubmitReview,
  isSubmittingForReview,
  onApproveClick,
  onRejectClick,
  onToggleReviewed,
  onSubmitForReview,
  onExportPdf,
  isPdfPending,
  isPdfReady,
  pdfDisabledReason,
  snapshotStatusLabel,
  snapshotStatusClassName,
}: PayrollDetailHeaderProps) {
  return (
    <div className="sticky top-0 z-20 w-full border-b border-border bg-background/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Section: Info & Navigation */}
          <div className="flex items-start gap-3 md:items-center">
            <Link href={backHref}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  รอบจ่าย{' '}
                  {formatPeriodLabel(period?.period_month ?? null, period?.period_year ?? null)}
                  {activeProfessionLabel && (
                    <span className="ml-1.5 font-medium text-muted-foreground/80">
                      / {activeProfessionLabel}
                    </span>
                  )}
                </h1>

                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn('px-2 py-0 shadow-sm font-medium', statusClassName)}
                  >
                    {statusLabel}
                  </Badge>
                  {/* UX Fix: Make Snapshot badge less prominent than main status */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-2 py-0 border-dashed text-[10px] opacity-80',
                      snapshotStatusClassName,
                    )}
                  >
                    {snapshotStatusLabel}
                  </Badge>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-foreground/70">
                  โดย {period?.created_by_name ?? '-'}
                </span>
                <span className="opacity-40">•</span>
                <span>{formatDate(period?.created_at ?? null)}</span>
              </p>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* 1. Approval/Review Workflow Actions */}
            <div className="flex items-center gap-2">
              {allowApprovalActions && period?.status === approvalStatus ? (
                <>
                  <Button
                    variant="success"
                    size="action"
                    onClick={onApproveClick}
                    className="font-semibold shadow-sm active:scale-95"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    อนุมัติ{approvalLabel}
                  </Button>

                  {canRejectPeriod && (
                    <Button
                      variant="destructive"
                      onClick={onRejectClick}
                      className="h-9 px-4 font-semibold shadow-sm active:scale-95"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      ปฏิเสธ
                    </Button>
                  )}
                </>
              ) : (
                !allowApprovalActions &&
                onToggleReviewed && (
                  <div className="flex items-center gap-2">
                    {periodStatus !== 'OPEN' ? (
                      <Button
                        variant="outline"
                        className="h-9 border-muted bg-muted/20 text-muted-foreground"
                        disabled
                      >
                        ยืนยันการตรวจแล้ว
                      </Button>
                    ) : (
                      <ConfirmActionDialog
                        trigger={
                          <Button
                            variant={currentProfessionReviewed ? 'outline' : 'default'}
                            className={cn(
                              'h-9 font-semibold transition-all',
                              currentProfessionReviewed
                                ? 'border-emerald-500/50 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700',
                            )}
                          >
                            {currentProfessionReviewed ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> ตรวจแล้ว
                              </>
                            ) : (
                              'ยืนยันการตรวจ'
                            )}
                          </Button>
                        }
                        title={
                          currentProfessionReviewed
                            ? 'ยกเลิกสถานะตรวจแล้ว?'
                            : 'ยืนยันการตรวจวิชาชีพ?'
                        }
                        description="เมื่อยืนยันแล้ว ระบบจะบันทึกสถานะว่าวิชาชีพนี้ผ่านการตรวจสอบเบื้องต้นแล้ว"
                        confirmText={currentProfessionReviewed ? 'ยืนยันยกเลิก' : 'ยืนยันการตรวจ'}
                        variant={currentProfessionReviewed ? 'destructive' : 'default'}
                        onConfirm={onToggleReviewed}
                      />
                    )}

                    {onSubmitForReview && (
                      <ConfirmActionDialog
                        trigger={
                          <Button
                            variant="secondary"
                            className="h-9 gap-2 font-semibold shadow-sm"
                            disabled={!canSubmitReview || isSubmittingForReview}
                          >
                            {isSubmittingForReview ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            ส่ง HR
                          </Button>
                        }
                        title="ยืนยันส่งข้อมูลให้ HR"
                        description="ข้อมูลการตรวจสอบของทุกวิชาชีพจะถูกล็อกและส่งให้ฝ่ายบุคคลตรวจสอบต่อ"
                        confirmText="ยืนยันส่งข้อมูล"
                        onConfirm={onSubmitForReview}
                      />
                    )}
                  </div>
                )
              )}
            </div>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-border/60 lg:block" />

            {/* 2. Export Actions */}
            <TooltipProvider>
              <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ConfirmActionDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8',
                              isPdfReady
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-muted-foreground/40',
                            )}
                            disabled={isPdfPending || !isPdfReady}
                          >
                            {isPdfPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </Button>
                        }
                        title="ดาวน์โหลดรายงานผลการจ่ายเงิน (PDF)"
                        description={
                          pdfDisabledReason ||
                          'ระบบจะสร้างรายงานสรุปผลการเบิกจ่ายประจำรอบในรูปแบบ PDF'
                        }
                        confirmText="ดาวน์โหลด PDF"
                        onConfirm={onExportPdf}
                      />
                    </div>
                  </TooltipTrigger>
                  {!isPdfReady && (
                    <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                      {pdfDisabledReason || 'ข้อมูลรายงานยังไม่พร้อม'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
