"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Download, FileIcon, Pencil } from "lucide-react";

import { useRequestDetail } from "@/features/request/hooks";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PERSONNEL_TYPE_LABELS,
  REQUEST_TYPE_LABELS,
  STEP_LABELS,
  WORK_ATTRIBUTE_LABELS,
  type WorkAttributes,
} from "@/types/request.types";

export default function UserRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: request, isLoading } = useRequestDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-muted-foreground">
        <div className="bg-muted/30 p-4 rounded-full mb-4">
          <FileIcon className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">ไม่พบคำขอที่ระบุ</p>
        <Button variant="link" onClick={() => router.back()}>
          กลับไปหน้ารายการ
        </Button>
      </div>
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const canEdit = request.status === "DRAFT" || request.status === "RETURNED";
  const workAttributes =
    request.work_attributes ??
    ({
      operation: false,
      planning: false,
      coordination: false,
      service: false,
    } as WorkAttributes);
  const activeAttrs = Object.entries(workAttributes)
    .filter(([, value]) => value)
    .map(
      ([key]) => WORK_ATTRIBUTE_LABELS[key as keyof typeof WORK_ATTRIBUTE_LABELS],
    );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {request.request_no ?? `#${request.request_id}`}
            </h2>
            <StatusBadge status={request.status} currentStep={request.current_step} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ประเภทคำขอ:{" "}
            <span className="font-medium text-foreground">
              {REQUEST_TYPE_LABELS[request.request_type] ?? request.request_type}
            </span>
          </p>
        </div>
        {canEdit && (
          <Link href={`/dashboard/user/requests/${request.request_id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              แก้ไขคำขอ
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList variant="line" className="gap-2 border-b">
          <TabsTrigger value="details">รายละเอียดคำขอ</TabsTrigger>
          <TabsTrigger value="attachments">
            เอกสารแนบ ({request.attachments?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history">ประวัติการดำเนินการ</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">ประเภทบุคลากร</p>
                <p className="font-medium">
                  {PERSONNEL_TYPE_LABELS[request.personnel_type] ??
                    request.personnel_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เลขที่ตำแหน่ง</p>
                <p className="font-medium">
                  {request.current_position_number ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สังกัด</p>
                <p className="font-medium">{request.current_department ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ภารกิจหลัก</p>
                <p className="font-medium">{request.main_duty ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ลักษณะงาน</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeAttrs.length > 0
                    ? activeAttrs.map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))
                    : "-"}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันที่มีผล</p>
                <p className="font-medium">
                  {request.effective_date
                    ? new Date(request.effective_date).toLocaleDateString("th-TH")
                    : "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">จำนวนเงินที่ขอเบิก</p>
                <p className="text-2xl font-bold text-primary">
                  {request.requested_amount.toLocaleString()} บาท
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {(request.attachments ?? []).length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  ไม่มีเอกสารแนบ
                </p>
              ) : (
                <div className="space-y-3">
                  {(request.attachments ?? []).map((att) => (
                    <div
                      key={att.attachment_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{att.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(att.file_size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`${apiBase}/${att.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {(request.actions ?? []).length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  ยังไม่มีประวัติการดำเนินการ
                </p>
              ) : (
                <div className="space-y-4">
                  {(request.actions ?? []).map((action, i) => (
                    <div key={`${action.action_date}-${i}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        {i < (request.actions ?? []).length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">
                          {action.action}
                          {action.step_no != null && (
                            <span className="text-muted-foreground ml-1">
                              —{" "}
                              {STEP_LABELS[action.step_no] ??
                                `ขั้นตอน ${action.step_no}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {action.actor
                            ? `${action.actor.first_name} ${action.actor.last_name}`
                            : "ระบบ"}{" "}
                          &middot;{" "}
                          {new Date(action.action_date).toLocaleString("th-TH")}
                        </p>
                        {action.comment && (
                          <p className="text-sm mt-1 bg-muted p-2 rounded">
                            {action.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
