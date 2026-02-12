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
  ChevronRight,
  Briefcase,
  Building2,
  type LucideIcon,
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
import { buildAttachmentUrl, isPreviewableFile } from '../../request-detail-attachments';

// --- Utility Components for cleaner UI ---
const InfoItem = ({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
      {label}
    </dt>
    <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: LucideIcon }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <h3 className="font-semibold text-base text-foreground">{title}</h3>
  </div>
);
// ------------------------------------------

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

const getSubmissionString = (
  submission: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = submission[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'PAID':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'RETURNED':
      return 'bg-orange-50 text-orange-600 border-orange-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500 border-slate-200';
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

const PERSONNEL_TYPE_LABELS: Record<string, string> = {
  CIVIL_SERVANT: 'ข้าราชการ',
  GOV_EMPLOYEE: 'พนักงานราชการ',
  PH_EMPLOYEE: 'พนักงานกระทรวงสาธารณสุข',
  TEMP_EMPLOYEE: 'ลูกจ้างชั่วคราว',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_ENTRY: 'ขอรับ พ.ต.ส. ครั้งแรก',
  EDIT_INFO_SAME_RATE: 'แก้ไขข้อมูล (อัตราเดิม)',
  EDIT_INFO_NEW_RATE: 'แก้ไขข้อมูล (อัตราใหม่)',
};

const WORK_ATTRIBUTE_LABELS: Record<string, string> = {
  operation: 'ปฏิบัติการ',
  planning: 'วางแผน',
  coordination: 'ประสานงาน',
  service: 'บริการ',
};

const formatThaiDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: request, isLoading } = useRequestDetail(id);
  const { data: rateHierarchy } = useRateHierarchy();
  const cancelRequest = useCancelRequest();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');

  const submission = useMemo(
    () => parseSubmission(request?.submission_data) as Record<string, unknown>,
    [request?.submission_data],
  );
  const submissionTitle = getSubmissionString(submission, ['title']);
  const submissionFirstName = getSubmissionString(submission, ['first_name', 'firstName']);
  const submissionLastName = getSubmissionString(submission, ['last_name', 'lastName']);
  const submissionPositionName = getSubmissionString(submission, ['position_name', 'positionName']);
  const submissionDepartment = getSubmissionString(submission, ['department']);
  const submissionSubDepartment = getSubmissionString(submission, [
    'sub_department',
    'subDepartment',
  ]);
  const submissionPositionNumber = getSubmissionString(submission, [
    'position_number',
    'positionNumber',
  ]);
  const requesterName = useMemo(() => {
    const title = submissionTitle;
    const firstName = submissionFirstName ?? request?.requester?.first_name;
    const lastName = submissionLastName ?? request?.requester?.last_name;
    return [title, firstName, lastName].filter(Boolean).join(' ').trim() || '-';
  }, [request?.requester, submissionFirstName, submissionLastName, submissionTitle]);
  const positionName = submissionPositionName ?? request?.requester?.position ?? '-';
  const department = submissionDepartment ?? request?.current_department ?? '-';
  const subDepartment = submissionSubDepartment ?? '-';
  const displayId = request
    ? (request.request_no ?? toRequestDisplayId(request.request_id, request.created_at))
    : id;
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
        month: 'long', // Changed to long for better readability
        year: 'numeric',
      })
    : null;
  const isRateMappingEmpty = useMemo(() => isEmptyRateMapping(rateMapping), [rateMapping]);
  const attachments = request?.attachments ?? [];
  const personnelTypeLabel = request?.personnel_type
    ? PERSONNEL_TYPE_LABELS[request.personnel_type] || request.personnel_type
    : '-';
  const requestTypeLabel = request?.request_type
    ? REQUEST_TYPE_LABELS[request.request_type] || request.request_type
    : '-';
  const mainDuty = request?.main_duty || '-';
  const workAttributes = request?.work_attributes
    ? Object.entries(request.work_attributes)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => WORK_ATTRIBUTE_LABELS[key] || key)
    : [];

  const handlePreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewOpen(true);
  };

  const getAttachmentLabel = (fileName: string, fileType?: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF Document';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
      return 'Image File';
    return fileType || 'File';
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

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="flex justify-between items-center">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
            <div className="h-48 w-full bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-96 w-full bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- Not Found State ---
  if (!request) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">ไม่พบข้อมูลคำขอ</h2>
        <p className="text-muted-foreground mb-6">
          คำขอที่คุณต้องการตรวจสอบอาจถูกลบหรือไม่มีอยู่ในระบบ
        </p>
        <Link href="/user/my-requests">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปรายการคำขอ
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* --- Header Section --- */}
      <div className="mb-8">
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
          <Link
            href="/user/my-requests"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            รายการคำขอ
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
          <span className="text-foreground font-medium">รายละเอียด</span>
        </nav>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{displayId}</h1>
              <Badge
                variant="outline"
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusColor(request.status)}`}
              >
                {getStatusLabel(request.status, request.current_step)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              สร้างเมื่อ {formatThaiDateTime(request.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/user/my-requests/${request.request_id}/edit`}>
                <Button variant="outline" className="h-9">
                  <Edit className="mr-2 h-4 w-4" />
                  แก้ไขข้อมูล
                </Button>
              </Link>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="h-9" disabled={cancelRequest.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    ยกเลิกคำขอ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการยกเลิกคำขอ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      การดำเนินการนี้ไม่สามารถเรียกคืนได้
                      คำขอนี้จะถูกยกเลิกและนำออกจากกระบวนการพิจารณา
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ปิด</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive hover:bg-destructive/90"
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

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* --- Main Content (Left Column) --- */}
        <div className="space-y-8 lg:col-span-8">
          {/* Card 1: ข้อมูลทั่วไป + พนักงาน */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title="ข้อมูลพนักงาน" icon={User} />
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                <InfoItem
                  label="ชื่อ-นามสกุล"
                  value={requesterName}
                  icon={User}
                  className="sm:col-span-2"
                />
                <InfoItem label="เลขบัตรประชาชน" value={request.citizen_id ?? '-'} />

                <div className="col-span-full border-t border-border/50 my-2"></div>

                <InfoItem
                  label="ตำแหน่ง"
                  value={positionName}
                  icon={Briefcase}
                  className="sm:col-span-2"
                />
                <InfoItem
                  label="เลขที่ตำแหน่ง"
                  value={submissionPositionNumber || request.current_position_number || '-'}
                />

                <InfoItem label="หน่วยงาน" value={subDepartment} icon={Building2} />
                <InfoItem label="กลุ่มงาน" value={department} />
              </dl>
            </CardContent>
          </Card>

          {/* Card 2: รายละเอียดคำขอ */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title="รายละเอียดการขอเบิก" icon={CreditCard} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <InfoItem label="ประเภทคำขอ" value={requestTypeLabel} className="sm:col-span-2" />
                <InfoItem label="ประเภทบุคลากร" value={personnelTypeLabel} />
                <InfoItem label="วันที่มีผล" value={effectiveDateLabel || '-'} />
                <InfoItem label="ได้รับมอบหมายให้ปฏิบัติงาน" value={mainDuty} className="sm:col-span-2" />
                <InfoItem
                  label="ลักษณะงาน"
                  value={workAttributes.length > 0 ? workAttributes.join(', ') : '-'}
                  className="sm:col-span-2"
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-5 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  ข้อมูลการคำนวณสิทธิ
                </h4>

                {isRateMappingEmpty ? (
                  <div className="text-sm text-muted-foreground text-center py-4 italic">
                    ยังไม่มีข้อมูลการประเมินจากเจ้าหน้าที่
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <InfoItem label="วิชาชีพ" value={rateDisplay?.professionLabel || '-'} />
                    <InfoItem label="กลุ่มเป้าหมาย" value={rateDisplay?.groupLabel || '-'} />
                    <InfoItem
                      label="เงื่อนไขหลัก"
                      value={rateDisplay?.criteriaLabel || '-'}
                      className="sm:col-span-2"
                    />
                    <InfoItem
                      label="เงื่อนไขย่อย"
                      value={rateDisplay?.subCriteriaLabel || '-'}
                      className="sm:col-span-2"
                    />

                    <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/50 flex justify-between items-center">
                      <span className="text-sm font-medium">ยอดเงินสุทธิ</span>
                      <span className="text-lg font-bold text-primary">
                        {rateAmount !== null && rateAmount !== undefined
                          ? Number(rateAmount).toLocaleString()
                          : '-'}
                        <span className="text-sm font-normal text-muted-foreground ml-1">บาท</span>
                      </span>
                    </div>
                  </dl>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Attachments */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title={`ไฟล์แนบ (${attachments.length})`} icon={FileText} />

              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <FileText className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">ไม่มีไฟล์เอกสารแนบ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((file) => {
                    const fileUrl = buildAttachmentUrl(file.file_path);
                    const previewable = isPreviewableFile(file.file_name);
                    return (
                      <div
                        key={file.attachment_id}
                        className="group relative flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-200"
                      >
                        <div className="h-10 w-10 shrink-0 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-foreground truncate pr-6"
                            title={file.file_name}
                          >
                            {file.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getAttachmentLabel(file.file_name, file.file_type)}
                          </p>

                          <div className="flex items-center gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            {previewable && (
                              <button
                                onClick={() => handlePreview(fileUrl, file.file_name)}
                                className="text-xs flex items-center hover:text-primary transition-colors hover:underline"
                              >
                                <Eye className="w-3 h-3 mr-1" /> ดูตัวอย่าง
                              </button>
                            )}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs flex items-center hover:text-primary transition-colors hover:underline"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" /> เปิดไฟล์
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Sidebar (Right Column) --- */}
        <div className="space-y-6 lg:col-span-4 sticky top-6">
          {/* Summary Widget */}
          <Card className="shadow-sm border-primary/20 bg-primary/5 overflow-hidden">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-primary/80 mb-1">ยอดเงินเบิกจ่าย</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">
                  {request.requested_amount?.toLocaleString() || '0'}
                </span>
                <span className="text-sm text-primary/80">บาท</span>
              </div>
              <Separator className="my-4 bg-primary/10" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เลขที่คำขอ</span>
                  <span className="font-mono text-foreground">{displayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วันที่ยื่นเรื่อง</span>
                  <span className="text-foreground">
                    {submitAction?.action_date
                      ? new Date(submitAction.action_date).toLocaleDateString('th-TH')
                      : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Timeline Widget */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                สถานะการดำเนินการ
              </CardTitle>
              <CardDescription>
                ขั้นตอนปัจจุบัน: {request.current_step ?? '-'}/{APPROVAL_STEPS.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {/* Vertical Line Connector */}
              <div
                className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-border/50"
                aria-hidden="true"
              ></div>

              <div className="space-y-0">
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

                  const isLast = index === APPROVAL_STEPS.length - 1;

                  return (
                    <div
                      key={step.step}
                      className={`relative flex gap-4 pb-8 ${isLast ? 'pb-0' : ''}`}
                    >
                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          status === 'approved'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : status === 'pending'
                              ? 'bg-white border-primary text-primary animate-pulse'
                              : status === 'rejected'
                                ? 'bg-red-500 border-red-500 text-white'
                                : status === 'returned'
                                  ? 'bg-orange-500 border-orange-500 text-white'
                                  : 'bg-white border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {status === 'approved' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : status === 'rejected' ? (
                          <XCircle className="h-4 w-4" />
                        ) : status === 'returned' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : status === 'pending' ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : (
                          <span className="text-[10px]">{step.step}</span>
                        )}
                      </div>

                      <div className="flex-1 pt-0.5">
                        <p
                          className={`text-sm font-semibold ${status === 'waiting' ? 'text-muted-foreground' : 'text-foreground'}`}
                        >
                          {step.role}
                        </p>

                        {(action?.actor || status === 'pending') && (
                          <div className="mt-1 flex flex-col gap-1">
                            {action?.actor && (
                              <span className="text-xs text-foreground/80">
                                โดย: {action.actor.first_name} {action.actor.last_name}
                              </span>
                            )}
                            {action?.action_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(action.action_date).toLocaleString('th-TH')}
                              </span>
                            )}
                            {status === 'pending' && request.step_started_at && (
                              <span className="text-xs text-muted-foreground">
                                เริ่มเมื่อ: {formatThaiDateTime(request.step_started_at)}
                              </span>
                            )}
                          </div>
                        )}

                        {action?.comment && (
                          <div className="mt-2 text-xs bg-muted/50 p-2 rounded border border-border/50 text-muted-foreground italic">
                            &quot;{action.comment}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
