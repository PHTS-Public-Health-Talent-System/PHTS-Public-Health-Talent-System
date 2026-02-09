'use client';

import { use, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRequestDetail, useCancelRequest } from '@/features/request/hooks';
import { useRateHierarchy } from '@/features/master-data/hooks';
import type { RequestWithDetails } from '@/types/request.types';
import { toRequestDisplayId } from '@/shared/utils/public-id';
import {
  isEmptyRateMapping,
  normalizeRateMapping,
  resolveRateMappingDisplay,
} from '../../request-detail-rate-mapping';
import { AttachmentPreviewDialog } from '@/components/common/attachment-preview-dialog';
import {
  buildAttachmentUrl,
  isPreviewableFile,
} from '../../request-detail-attachments';

const parseSubmission = (value: RequestWithDetails['submission_data']) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted text-muted-foreground';
    case 'PENDING':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'APPROVED':
      return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20';
    case 'PAID':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'REJECTED':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'RETURNED':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'CANCELLED':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPendingStepLabel = (step?: number | null) => {
  switch (step) {
    case 1:
      return 'รอหัวหน้าตึก/หัวหน้างาน';
    case 2:
      return 'รอหัวหน้ากลุ่มงาน';
    case 3:
      return 'รอเจ้าหน้าที่ พ.ต.ส.';
    case 4:
      return 'รอหัวหน้ากลุ่มงานทรัพยากรบุคคล';
    case 5:
      return 'รอหัวหน้าการเงิน';
    case 6:
      return 'รอผู้อำนวยการ';
    default:
      return 'รอดำเนินการ';
  }
};

const getStatusLabel = (status: string, step?: number | null) => {
  switch (status) {
    case 'DRAFT':
      return 'แบบร่าง';
    case 'PENDING':
      return getPendingStepLabel(step);
    case 'APPROVED':
      return 'อนุมัติแล้ว';
    case 'REJECTED':
      return 'ไม่อนุมัติ';
    case 'RETURNED':
      return 'ถูกส่งกลับ';
    case 'CANCELLED':
      return 'ยกเลิก';
    default:
      return status;
  }
};

const APPROVAL_STEPS = [
  { step: 1, role: 'หัวหน้าตึก/หัวหน้างาน' },
  { step: 2, role: 'หัวหน้ากลุ่มงาน' },
  { step: 3, role: 'เจ้าหน้าที่ พ.ต.ส.' },
  { step: 4, role: 'หัวหน้ากลุ่มงานทรัพยากรบุคคล' },
  { step: 5, role: 'หัวหน้าการเงิน' },
  { step: 6, role: 'ผู้อำนวยการ' },
];

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: request, isLoading } = useRequestDetail(id);
  const { data: rateHierarchy } = useRateHierarchy();
  const cancelRequest = useCancelRequest();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');

  const submission = useMemo(() => parseSubmission(request?.submission_data), [request?.submission_data]);
  const requesterName = useMemo(() => {
    const title = (submission as { title?: string }).title;
    const firstName = (submission as { first_name?: string }).first_name ?? request?.requester?.first_name;
    const lastName = (submission as { last_name?: string }).last_name ?? request?.requester?.last_name;
    return [title, firstName, lastName].filter(Boolean).join(' ').trim() || '-';
  }, [request?.requester, submission]);
  const positionName =
    (submission as { position_name?: string }).position_name ??
    request?.requester?.position ??
    '-';
  const department = (submission as { department?: string }).department ?? '-';
  const subDepartment = (submission as { sub_department?: string }).sub_department ?? '-';
  const displayId = request ? toRequestDisplayId(request.request_id, request.created_at) : id;
  const canEdit = request?.status === 'DRAFT';
  const canCancel = request?.status === 'PENDING' || request?.status === 'RETURNED';
  const submitAction = (request?.actions ?? []).find((a) => a.action === 'SUBMIT');
  const approvalActions = request?.actions ?? [];
  const rateMapping = useMemo(
    () => normalizeRateMapping(request?.submission_data ?? null),
    [request?.submission_data],
  );
  const rateDisplay = useMemo(() => {
    if (!rateMapping) return null;
    return resolveRateMappingDisplay(rateMapping, rateHierarchy);
  }, [rateMapping, rateHierarchy]);
  const rateAmount = rateMapping?.amount ?? request?.requested_amount ?? null;
  const effectiveDateLabel = request?.effective_date
    ? new Date(request.effective_date).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const isRateMappingEmpty = useMemo(
    () => isEmptyRateMapping(rateMapping),
    [rateMapping],
  );
  const attachments = request?.attachments ?? [];

  const handlePreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewOpen(true);
  };

  const getAttachmentLabel = (fileName: string, fileType?: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'IMAGE';
    return fileType || 'FILE';
  };

  const handleCancel = () => {
    if (!request) return;
    cancelRequest.mutate(request.request_id, {
      onSuccess: () => {
        toast.success('ยกเลิกคำขอสำเร็จ');
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <div className="h-10 w-32 mb-4 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-6">
            <div className="h-96 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/user/my-requests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการคำขอ
        </Link>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
            <p className="mt-4 text-destructive">ไม่พบคำขอนี้</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/user/my-requests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการคำขอ
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{displayId}</h1>
              <Badge variant="outline" className={getStatusColor(request.status)}>
                {getStatusLabel(request.status, request.current_step)}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">คำขอเงิน พ.ต.ส.</p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/user/my-requests/${request.request_id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  แก้ไข
                </Button>
              </Link>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={cancelRequest.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    ยกเลิกคำขอ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการยกเลิกคำขอ</AlertDialogTitle>
                    <AlertDialogDescription>
                      เมื่อยกเลิกแล้ว จะไม่สามารถส่งคำขอนี้ต่อได้ ต้องการยืนยันหรือไม่?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      ยืนยันยกเลิก
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลพนักงาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">รหัสพนักงาน</p>
                  <p className="font-medium">{request.user_id ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                  <p className="font-medium">{requesterName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                  <p className="font-medium">{positionName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หอผู้ป่วย/หน่วยงาน</p>
                  <p className="font-medium">{subDepartment || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">แผนก</p>
                  <p className="font-medium">{department || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                รายละเอียดคำขอ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">ข้อมูลกลุ่ม/รายการเบิก</h3>
                {isRateMappingEmpty ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    ยังไม่มีข้อมูลการคำนวณจากขั้นตอนที่ 4
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-semibold text-foreground">สรุปจากแบบฟอร์ม</div>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">วิชาชีพ</p>
                          <p className="font-medium">{rateDisplay?.professionLabel || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">กลุ่ม</p>
                          <p className="font-medium">{rateDisplay?.groupLabel || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">เงื่อนไขอ้างอิง</p>
                          <p className="font-medium">{rateDisplay?.criteriaLabel || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">เงื่อนไขย่อย</p>
                          <p className="font-medium">{rateDisplay?.subCriteriaLabel || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">วันที่มีผล</p>
                          <p className="font-medium">{effectiveDateLabel || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ยอดเงินเพิ่มพิเศษสุทธิ</p>
                          <p className="font-semibold text-primary">
                            {rateAmount !== null && rateAmount !== undefined
                              ? Number(rateAmount).toLocaleString()
                              : '-'}{' '}
                            บาท
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">{request.requested_amount?.toLocaleString() || '-'} บาท</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ไฟล์ที่แนบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  ไม่มีไฟล์แนบ
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((file) => {
                    const fileUrl = buildAttachmentUrl(file.file_path);
                    const previewable = isPreviewableFile(file.file_name);
                    return (
                      <div
                        key={file.attachment_id}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getAttachmentLabel(file.file_name, file.file_type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
                          {previewable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(fileUrl, file.file_name)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              ดูตัวอย่าง
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="sm">
                            <a href={fileUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              เปิดในแท็บใหม่
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ไทม์ไลน์
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">สร้างคำขอ</p>
                    <p className="text-sm text-muted-foreground">
                      {request.created_at ? new Date(request.created_at).toLocaleString('th-TH') : '-'}
                    </p>
                  </div>
                </div>
                {submitAction?.action_date && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    </div>
                    <div>
                      <p className="font-medium">ส่งคำขอ</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submitAction.action_date).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Approval Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สถานะการอนุมัติ</CardTitle>
              <CardDescription>ขั้นตอนที่ {request.current_step ?? '-'} จาก 6</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {APPROVAL_STEPS.map((step, index) => {
                  const action = approvalActions
                    .filter(
                      (a) =>
                        a.step_no === step.step &&
                        (a.action === 'APPROVE' || a.action === 'REJECT' || a.action === 'RETURN'),
                    )
                    .sort((a, b) => (a.action_date || '').localeCompare(b.action_date || ''))
                    .pop();

                  const status = action
                    ? action.action === 'APPROVE'
                      ? 'approved'
                      : action.action === 'REJECT'
                        ? 'rejected'
                        : 'returned'
                    : request.current_step === step.step
                      ? 'pending'
                      : request.current_step && step.step < request.current_step
                        ? 'approved'
                        : 'waiting';

                  const approverName = action?.actor
                    ? `${action.actor.first_name ?? ''} ${action.actor.last_name ?? ''}`.trim()
                    : null;

                  return (
                    <div key={step.step} className="relative">
                      {index < APPROVAL_STEPS.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 h-full w-0.5 ${
                            status === 'approved' ? 'bg-[hsl(var(--success))]' : 'bg-border'
                          }`}
                        />
                      )}
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                            status === 'approved'
                              ? 'bg-[hsl(var(--success))]'
                              : status === 'pending'
                                ? 'bg-primary'
                                : status === 'rejected'
                                  ? 'bg-destructive'
                                  : status === 'returned'
                                    ? 'bg-orange-500'
                                    : 'bg-muted'
                          }`}
                        >
                          {status === 'approved' ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : status === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-white" />
                          ) : status === 'pending' ? (
                            <Clock className="h-4 w-4 text-white" />
                          ) : status === 'returned' ? (
                            <AlertCircle className="h-4 w-4 text-white" />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">{step.step}</span>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className={`font-medium ${status === 'waiting' ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {step.role}
                          </p>
                          {approverName && (
                            <p className="text-sm text-muted-foreground">{approverName}</p>
                          )}
                          {action?.action_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(action.action_date).toLocaleString('th-TH')}
                            </p>
                          )}
                          {action?.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">&quot;{action.comment}&quot;</p>
                          )}
                          {status === 'pending' && (
                            <Badge variant="outline" className="mt-2 bg-primary/10 text-primary">
                              รอดำเนินการ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>สรุป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">เลขที่คำขอ</span>
                <span className="font-medium">{displayId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">สถานะ</span>
                <Badge variant="outline" className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status, request.current_step)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">จำนวนเงิน</span>
                <span className="font-semibold text-primary">
                  {request.requested_amount?.toLocaleString() || '-'} บาท
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AttachmentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previewUrl={previewUrl}
        previewName={previewName}
      />
    </div>
  );
}
