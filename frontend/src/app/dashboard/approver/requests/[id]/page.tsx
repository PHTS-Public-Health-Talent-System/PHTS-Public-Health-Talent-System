"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, FileIcon } from "lucide-react"
import { toast } from "sonner"

import {
  useCheckSignature,
  useMySignature,
  useUploadSignatureBase64,
} from "@/features/signature/hooks"
import { useProcessAction, useRequestDetail } from "@/features/request/hooks"
import {
  formatRequesterName,
  isSignatureReadyForApproval,
} from "@/features/request/approver-utils"
import { StatusBadge } from "@/components/common/status-badge"
import { RequestTimeline } from "@/components/common/request-timeline"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import SignaturePad from "@/components/common/signature-pad"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApproverRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: request, isLoading } = useRequestDetail(id)
  const processAction = useProcessAction()
  const { data: signatureCheck } = useCheckSignature()
  const { data: signatureData } = useMySignature()
  const uploadSignature = useUploadSignatureBase64()
  const [comment, setComment] = useState("")
  const [signatureMode, setSignatureMode] = useState<"SAVED" | "NEW" | null>(null)
  const [signature, setSignature] = useState("")

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!request) {
    return <div className="text-center py-20 text-muted-foreground">ไม่พบคำขอ</div>
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
  const requesterName = formatRequesterName(request.requester)
  const canAct = request.status === "PENDING"
  const hasSavedSignature = !!signatureCheck?.has_signature
  const hasNewSignature = !!signature
  const effectiveSignatureMode =
    signatureMode ?? (hasSavedSignature ? "SAVED" : "NEW")
  const signatureReady = isSignatureReadyForApproval(
    effectiveSignatureMode,
    hasSavedSignature,
    hasNewSignature,
  )

  const handleAction = async (action: "APPROVE" | "RETURN" | "REJECT") => {
    if (action === "REJECT" && !comment.trim()) {
      toast.error("กรุณาระบุเหตุผลในการไม่อนุมัติ")
      return
    }

    if (action === "APPROVE" && !signatureReady) {
      toast.error("กรุณาเลือกลายเซ็นผู้อนุมัติ")
      return
    }

    try {
      if (action === "APPROVE" && effectiveSignatureMode === "NEW") {
        await uploadSignature.mutateAsync(signature)
      }

      processAction.mutate(
        { id, payload: { action, comment: comment || undefined } },
        {
          onSuccess: () => {
            toast.success("บันทึกการอนุมัติแล้ว")
            router.push("/dashboard/approver/requests")
          },
          onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : "ทำรายการไม่สำเร็จ"
            toast.error(msg)
          },
        },
      )
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "บันทึกลายเซ็นไม่สำเร็จ"
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {request.request_no ?? `#${request.request_id}`}
            <StatusBadge status={request.status} />
          </h2>
          <p className="text-sm text-muted-foreground">
            ผู้ยื่น: {requesterName} ({request.citizen_id})
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <RequestTimeline currentStep={request.current_step} status={request.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ข้อมูลคำขอ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">สังกัด</p>
            <p className="font-medium">{request.current_department ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">เลขที่ตำแหน่ง</p>
            <p className="font-medium">{request.current_position_number ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ภารกิจหลัก</p>
            <p className="font-medium">{request.main_duty ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">วันที่มีผล</p>
            <p className="font-medium">
              {new Date(request.effective_date).toLocaleDateString("th-TH")}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground">จำนวนเงินที่ขอเบิก</p>
            <p className="text-2xl font-bold text-primary">
              {request.requested_amount.toLocaleString()} บาท
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เอกสารแนบ</CardTitle>
        </CardHeader>
        <CardContent>
          {request.attachments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">ไม่มีเอกสารแนบ</p>
          ) : (
            <div className="space-y-3">
              {request.attachments.map((att) => (
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
                    <a href={`${apiBase}/${att.file_path}`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ความเห็นผู้อนุมัติ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ระบุความเห็น (ถ้ามี)"
          />
          <div className="flex flex-wrap gap-2">
            <ConfirmDialog
              trigger={
                <Button
                  disabled={
                    !canAct ||
                    processAction.isPending ||
                    (effectiveSignatureMode === "SAVED" && !hasSavedSignature) ||
                    (effectiveSignatureMode === "NEW" && !hasNewSignature)
                  }
                >
                  อนุมัติ
                </Button>
              }
              title="ยืนยันการอนุมัติ"
              description="ต้องการอนุมัติคำขอนี้หรือไม่?"
              confirmLabel="อนุมัติ"
              onConfirm={() => handleAction("APPROVE")}
            />
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  disabled={!canAct || processAction.isPending}
                >
                  ส่งกลับแก้ไข
                </Button>
              }
              title="ส่งกลับแก้ไข"
              description="ต้องการส่งกลับคำขอเพื่อแก้ไขหรือไม่?"
              confirmLabel="ส่งกลับ"
              onConfirm={() => handleAction("RETURN")}
            />
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  disabled={!canAct || processAction.isPending}
                >
                  ไม่อนุมัติ
                </Button>
              }
              title="ไม่อนุมัติคำขอ"
              description="ยืนยันการไม่อนุมัติคำขอนี้?"
              confirmLabel="ไม่อนุมัติ"
              onConfirm={() => handleAction("REJECT")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ลายเซ็นผู้อนุมัติ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="signature-mode"
                value="SAVED"
                checked={effectiveSignatureMode === "SAVED"}
                onChange={() => setSignatureMode("SAVED")}
                disabled={!hasSavedSignature}
              />
              ใช้ลายเซ็นที่บันทึกไว้
              {!hasSavedSignature && " (ยังไม่มีลายเซ็นในระบบ)"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="signature-mode"
                value="NEW"
                checked={effectiveSignatureMode === "NEW"}
                onChange={() => setSignatureMode("NEW")}
              />
              ลงลายเซ็นใหม่
            </label>
          </div>

          {effectiveSignatureMode === "SAVED" ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {hasSavedSignature
                ? "จะใช้ลายเซ็นที่บันทึกไว้"
                : "ยังไม่มีลายเซ็นในระบบ"}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-muted-foreground/20 overflow-hidden">
              <CardContent className="p-0">
                <SignaturePad
                  onSave={(data) => setSignature(data)}
                  clearLabel="ล้างลายเซ็น"
                  placeholder="เซ็นชื่อในช่องนี้"
                />
              </CardContent>
            </Card>
          )}

          {effectiveSignatureMode === "SAVED" && signatureData?.data_url && (
            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              ลายเซ็นที่บันทึกไว้พร้อมใช้งาน
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard/approver/requests" className="underline">
          กลับไปยังรายการคำขอ
        </Link>
      </div>
    </div>
  )
}
