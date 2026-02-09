"use client"
export const dynamic = 'force-dynamic'

import React, { useMemo } from "react"
import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  History,
  Banknote,
  GraduationCap,
  Award,
  CalendarDays,
} from "lucide-react"
import { useState } from "react"
import { OCRDocumentVerification } from "@/components/ocr-document-verification"
import { toast } from "sonner"
import { useProcessAction, useRequestDetail } from "@/features/request/hooks"
import type { RequestWithDetails } from "@/types/request.types"
import { STEP_LABELS } from "@/types/request.types"

// TODO: add icons when request details expand: Briefcase, Building2, AlertCircle, Scan

type RequestStatus = "pending" | "approved" | "rejected" | "returned"

interface LeaveRecord {
  id: string
  type: string
  typeName: string
  startDate: string
  endDate: string
  days: number
  status: "approved" | "pending" | "rejected"
  requireReport: boolean
  reportDate?: string
  studyInfo?: {
    institution: string
    program: string
    field: string
    startDate: string
  }
  documentStartDate?: string
  documentEndDate?: string
}

interface RequestDetail {
  id: number
  requestNo: string
  name: string
  prefix: string
  firstName: string
  lastName: string
  citizenId: string
  position: string
  positionLevel: string
  department: string
  unit: string
  profession: string
  status: RequestStatus
  rateGroup: string
  rateGroupName: string
  rateItem: string
  rateItemName: string
  amount: number
  submitDate: string
  licenseNumber: string
  licenseExpiry: string
  licenseIssueDate: string
  education: string
  specialization?: string
  workStartDate: string
  email: string
  phone: string
  attachments: { id: string; name: string; type: "license" | "certificate" | "approval" | "education" | "other"; typeName: string; uploadDate: string; fileUrl?: string }[]
  approvalHistory: { step: number; stepName: string; status: string; approver?: string; date?: string; comment?: string }[]
  leaveRecords: LeaveRecord[]
}

function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function mapStatus(status: string): RequestStatus {
  if (status === "APPROVED") return "approved"
  if (status === "REJECTED") return "rejected"
  if (status === "RETURNED") return "returned"
  if (status.startsWith("PENDING")) return "pending"
  return "pending"
}

function parseSubmissionData(data: RequestWithDetails["submission_data"]) {
  if (!data) return null
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return data as Record<string, unknown>
}

function resolveAttachmentType(fileName: string): { type: "license" | "certificate" | "approval" | "education" | "other"; typeName: string } {
  const lower = fileName.toLowerCase()
  if (lower.includes("ใบอนุญาต") || lower.includes("license")) {
    return { type: "license", typeName: "ใบอนุญาตประกอบวิชาชีพ" }
  }
  if (lower.includes("วุฒิบัตร") || lower.includes("certificate")) {
    return { type: "certificate", typeName: "วุฒิบัตรเฉพาะทาง" }
  }
  if (lower.includes("อนุมัติ") || lower.includes("approval")) {
    return { type: "approval", typeName: "หนังสืออนุมัติ/รับรอง" }
  }
  if (lower.includes("การศึกษา") || lower.includes("education")) {
    return { type: "education", typeName: "เอกสารการศึกษา" }
  }
  return { type: "other", typeName: "เอกสารอื่นๆ" }
}

const statusConfig: Record<RequestStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "รอพิจารณา", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  approved: { label: "อนุมัติ", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "ไม่อนุมัติ", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  returned: { label: "ส่งกลับแก้ไข", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: RotateCcw },
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comment, setComment] = useState("")
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "return" | null>(null)
  const [activeTab, setActiveTab] = useState("info")

  const { data: requestData } = useRequestDetail(id)
  const processAction = useProcessAction()
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

  const request = useMemo<RequestDetail | null>(() => {
    if (!requestData) return null
    const submission = parseSubmissionData(requestData.submission_data)
    const requesterName =
      requestData.requester?.first_name || requestData.requester?.last_name
        ? `${requestData.requester?.first_name ?? ""} ${requestData.requester?.last_name ?? ""}`.trim()
        : undefined
    const fullName =
      requesterName ||
      (submission?.firstName || submission?.lastName
        ? `${submission?.firstName ?? ""} ${submission?.lastName ?? ""}`.trim()
        : undefined) ||
      (submission?.fullName as string | undefined) ||
      "-"

    const rateMapping = submission?.rateMapping as
      | { groupId?: string; itemId?: string; subItemId?: string; amount?: number }
      | undefined

    const attachments = (requestData.attachments ?? []).map((att) => {
      const typeInfo = resolveAttachmentType(att.file_name)
      return {
        id: String(att.attachment_id),
        name: att.file_name,
        type: typeInfo.type,
        typeName: typeInfo.typeName,
        uploadDate: formatThaiDate(requestData.created_at),
        fileUrl: `${apiBase}/${att.file_path}`,
      }
    })

    const actions = requestData.actions ?? []
    const actionMap = new Map(actions.map((action) => [action.step_no ?? -1, action]))
    const approvalHistory = Object.entries(STEP_LABELS).map(([stepKey, stepName]) => {
      const step = Number(stepKey)
      const action = actionMap.get(step)
      const status =
        action?.action === "APPROVE" || action?.action === "SUBMIT"
          ? "completed"
          : requestData.current_step === step
            ? "pending"
            : step > requestData.current_step
              ? "waiting"
              : "completed"
      return {
        step,
        stepName,
        status,
        approver: action?.actor ? `${action.actor.first_name} ${action.actor.last_name}`.trim() : undefined,
        date: action?.action_date ? formatThaiDate(action.action_date) : undefined,
        comment: action?.comment ?? undefined,
      }
    })

    return {
      id: requestData.request_id,
      requestNo: requestData.request_no ?? `REQ-${requestData.request_id}`,
      name: fullName,
      prefix: (submission?.title as string | undefined) ?? "-",
      firstName: (submission?.firstName as string | undefined) ?? "-",
      lastName: (submission?.lastName as string | undefined) ?? "-",
      citizenId: (submission?.citizenId as string | undefined) ?? requestData.citizen_id ?? "-",
      position: (submission?.positionName as string | undefined) ?? requestData.requester?.position ?? "-",
      positionLevel: (submission?.positionLevel as string | undefined) ?? "-",
      department: (submission?.department as string | undefined) ?? "-",
      unit: (submission?.subDepartment as string | undefined) ?? "-",
      profession: (submission?.professionCode as string | undefined) ?? "-",
      status: mapStatus(requestData.status),
      rateGroup: rateMapping?.groupId ?? "-",
      rateGroupName: (submission?.rateGroupName as string | undefined) ?? "-",
      rateItem: rateMapping?.itemId ?? rateMapping?.subItemId ?? "-",
      rateItemName: (submission?.rateItemName as string | undefined) ?? "-",
      amount: requestData.requested_amount ?? 0,
      submitDate: formatThaiDate(requestData.created_at),
      licenseNumber: (submission?.licenseNumber as string | undefined) ?? "-",
      licenseExpiry: (submission?.licenseExpiry as string | undefined) ?? "-",
      licenseIssueDate: (submission?.licenseIssueDate as string | undefined) ?? "-",
      education: (submission?.education as string | undefined) ?? "-",
      specialization: (submission?.specialization as string | undefined) ?? undefined,
      workStartDate: (submission?.workStartDate as string | undefined) ?? "-",
      email: (submission?.email as string | undefined) ?? "-",
      phone: (submission?.phone as string | undefined) ?? "-",
      attachments,
      approvalHistory,
      leaveRecords: [],
    }
  }, [apiBase, requestData])

  if (!request) {
    return <div className="p-6 text-muted-foreground">กำลังโหลดข้อมูล...</div>
  }

  const statusInfo = statusConfig[request.status]
  const StatusIcon = statusInfo.icon

  const handleAction = async (action: "approve" | "reject" | "return") => {
    try {
      const payload = {
        action: action === "approve" ? "APPROVE" : action === "reject" ? "REJECT" : "RETURN",
        comment: comment.trim(),
      } as const
      await processAction.mutateAsync({ id: request.id, payload })
      toast.success("ดำเนินการคำขอเรียบร้อย")
      setActionDialog(null)
      setComment("")
    } catch {
      toast.error("ไม่สามารถดำเนินการคำขอได้")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pts-officer/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">คำขอ {request.requestNo}</h1>
              <Badge variant="outline" className={statusInfo.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">ยื่นเมื่อ {request.submitDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดเอกสาร
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="info">ข้อมูลคำขอ</TabsTrigger>
          <TabsTrigger value="ocr">ตรวจสอบเอกสาร OCR</TabsTrigger>
          <TabsTrigger value="leave">ประวัติวันลา</TabsTrigger>
        </TabsList>

        {/* Tab: Info */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    ข้อมูลผู้ยื่นคำขอ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                      <p className="font-medium">{request.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">เลขประจำตัวประชาชน</p>
                      <p className="font-medium">{request.citizenId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                      <p className="font-medium">{request.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ระดับ</p>
                      <p className="font-medium">{request.positionLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วิชาชีพ</p>
                      <p className="font-medium">{request.profession}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">หน่วยงาน</p>
                      <p className="font-medium">{request.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">อีเมล</p>
                      <p className="font-medium">{request.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">โทรศัพท์</p>
                      <p className="font-medium">{request.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* License Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    ข้อมูลใบอนุญาตประกอบวิชาชีพ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">เลขที่ใบอนุญาต</p>
                      <p className="font-medium">{request.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันที่ออกใบอนุญาต</p>
                      <p className="font-medium">{request.licenseIssueDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันหมดอายุ</p>
                      <p className="font-medium text-amber-400">{request.licenseExpiry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันเริ่มปฏิบัติงาน</p>
                      <p className="font-medium">{request.workStartDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Education Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    ข้อมูลการศึกษา/ความเชี่ยวชาญ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">วุฒิการศึกษา</p>
                      <p className="font-medium">{request.education}</p>
                    </div>
                    {request.specialization && (
                      <div>
                        <p className="text-sm text-muted-foreground">ความเชี่ยวชาญเฉพาะทาง</p>
                        <p className="font-medium">{request.specialization}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rate Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    ข้อมูลอัตราเงิน พ.ต.ส.
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">กลุ่มที่ {request.rateGroup}</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          ข้อ {request.rateItem}
                        </Badge>
                      </div>
                      <p className="font-medium mb-3">{request.rateGroupName}</p>
                      <p className="text-sm text-muted-foreground">{request.rateItemName}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-muted-foreground">อัตราเงินเพิ่ม</span>
                      <span className="text-2xl font-bold text-emerald-400">{request.amount.toLocaleString()} บาท/เดือน</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    เอกสารแนบ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {request.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">อัปโหลดเมื่อ {file.uploadDate}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (file.fileUrl) {
                              window.open(file.fileUrl, "_blank")
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              {request.status === "pending" && (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">ดำเนินการ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog open={actionDialog === "approve"} onOpenChange={(open) => setActionDialog(open ? "approve" : null)}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          อนุมัติ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
                          <DialogDescription>
                            คุณต้องการอนุมัติคำขอ {request.requestNo} ของ {request.name} ใช่หรือไม่?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">หมายเหตุ (ถ้ามี)</label>
                          <Textarea
                            placeholder="ระบุหมายเหตุ..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setActionDialog(null)}>
                            ยกเลิก
                          </Button>
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("approve")}>
                            ยืนยันอนุมัติ
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={actionDialog === "return"} onOpenChange={(open) => setActionDialog(open ? "return" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full bg-transparent">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          ส่งกลับแก้ไข
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>ส่งกลับแก้ไข</DialogTitle>
                          <DialogDescription>
                            ระบุเหตุผลที่ต้องส่งกลับแก้ไข
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">เหตุผล <span className="text-red-400">*</span></label>
                          <Textarea
                            placeholder="ระบุเหตุผลที่ต้องแก้ไข..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-secondary border-border"
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setActionDialog(null)}>
                            ยกเลิก
                          </Button>
                          <Button onClick={() => handleAction("return")}>
                            ส่งกลับแก้ไข
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={actionDialog === "reject"} onOpenChange={(open) => setActionDialog(open ? "reject" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-transparent">
                          <XCircle className="mr-2 h-4 w-4" />
                          ไม่อนุมัติ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>ยืนยันการไม่อนุมัติ</DialogTitle>
                          <DialogDescription>
                            คุณต้องการไม่อนุมัติคำขอนี้ ใช่หรือไม่?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">เหตุผล <span className="text-red-400">*</span></label>
                          <Textarea
                            placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-secondary border-border"
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setActionDialog(null)}>
                            ยกเลิก
                          </Button>
                          <Button variant="destructive" onClick={() => handleAction("reject")}>
                            ยืนยันไม่อนุมัติ
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}

              {/* Approval History */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    ประวัติการอนุมัติ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request.approvalHistory.map((step, index) => (
                      <div key={index} className="relative">
                        {index < request.approvalHistory.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                        )}
                        <div className="flex gap-3">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                            ${step.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : 
                              step.status === "pending" ? "bg-amber-500/20 text-amber-400" : 
                              "bg-secondary text-muted-foreground"}
                          `}>
                            {step.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : step.status === "pending" ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <span className="text-xs">{step.step}</span>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-sm">{step.stepName}</p>
                            {step.approver && (
                              <p className="text-xs text-muted-foreground mt-1">{step.approver}</p>
                            )}
                            {step.date && (
                              <p className="text-xs text-muted-foreground">{step.date}</p>
                            )}
                            {step.comment && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                &quot;{step.comment}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Leave Summary */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    สรุปวันลา (เดือนนี้)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const sickDays = request.leaveRecords
                      .filter((leave) => leave.type === "sick")
                      .reduce((sum, leave) => sum + leave.days, 0)
                    const personalDays = request.leaveRecords
                      .filter((leave) => leave.type === "personal")
                      .reduce((sum, leave) => sum + leave.days, 0)
                    const totalDays = sickDays + personalDays
                    return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ลาป่วย</span>
                      <span className="font-medium">{sickDays} วัน</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ลากิจ</span>
                      <span className="font-medium">{personalDays} วัน</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">รวม</span>
                      <span className="font-medium text-amber-400">{totalDays} วัน</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab("leave")}>
                      ดูรายละเอียดวันลา
                    </Button>
                  </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: OCR */}
        <TabsContent value="ocr">
          <OCRDocumentVerification
            documents={request.attachments.map(att => ({
              id: att.id,
              name: att.name,
              type: att.type,
              typeName: att.typeName,
              fileUrl: att.fileUrl,
            }))}
            personData={{
              name: request.name,
              licenseNumber: request.licenseNumber,
              licenseExpiry: request.licenseExpiry,
              licenseIssueDate: request.licenseIssueDate,
              position: request.position,
              education: request.education,
              citizenId: request.citizenId,
            }}
          />
        </TabsContent>

        {/* Tab: Leave Records */}
        <TabsContent value="leave">
          <LeaveRecordsSection 
            leaveRecords={request.leaveRecords} 
            personName={request.name}
            personId={String(request.id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Leave Records Section Component
function LeaveRecordsSection({ 
  leaveRecords, 
  personName,
  personId 
}: { 
  leaveRecords: LeaveRecord[]
  personName: string
  personId: string
}) {
  void personId
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null)
  void showEditDialog
  void selectedLeave

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              ประวัติวันลา - {personName}
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  เพิ่มรายการวันลา
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-card border-border">
                <DialogHeader>
                  <DialogTitle>เพิ่มรายการวันลา</DialogTitle>
                  <DialogDescription>
                    เพิ่มรายการวันลาตามเอกสารทางราชการ
                  </DialogDescription>
                </DialogHeader>
                <AddLeaveForm onClose={() => setShowAddDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่มีประวัติวันลา
              </div>
            ) : (
              leaveRecords.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={
                        leave.type === "sick" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        leave.type === "personal" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        leave.type === "study" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                        "bg-secondary text-muted-foreground border-border"
                      }>
                        {leave.typeName}
                      </Badge>
                      <Badge variant="outline" className={
                        leave.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        leave.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {leave.status === "approved" ? "อนุมัติแล้ว" : leave.status === "pending" ? "รอดำเนินการ" : "ไม่อนุมัติ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedLeave(leave)
                        setShowEditDialog(true)
                      }}>
                        แก้ไข
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">วันที่ลา (ตาม USER)</p>
                      <p className="font-medium">{leave.startDate} - {leave.endDate}</p>
                    </div>
                    {leave.documentStartDate && (
                      <div>
                        <p className="text-muted-foreground">วันที่ลา (ตามเอกสาร)</p>
                        <p className="font-medium text-amber-400">{leave.documentStartDate} - {leave.documentEndDate}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">จำนวนวัน</p>
                      <p className="font-medium">{leave.days} วัน</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ต้องรายงานตัว</p>
                      <p className="font-medium">{leave.requireReport ? "ใช่" : "ไม่"}</p>
                    </div>
                    {leave.requireReport && (
                      <div>
                        <p className="text-muted-foreground">วันที่รายงานตัว</p>
                        <p className="font-medium">{leave.reportDate || "-"}</p>
                      </div>
                    )}
                  </div>
                  {leave.studyInfo && (
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-sm font-medium text-purple-400 mb-2">ข้อมูลการลาศึกษาต่อ</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">สถานศึกษา</p>
                          <p className="font-medium">{leave.studyInfo.institution}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">หลักสูตร</p>
                          <p className="font-medium">{leave.studyInfo.program}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">สาขาวิชา</p>
                          <p className="font-medium">{leave.studyInfo.field}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">วันที่เริ่มศึกษา</p>
                          <p className="font-medium">{leave.studyInfo.startDate}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add Leave Form Component
function AddLeaveForm({ onClose }: { onClose: () => void }) {
  const [leaveType, setLeaveType] = useState("")
  const [requireReport, setRequireReport] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">ประเภทการลา</label>
        <select 
          className="w-full p-2 rounded-lg bg-secondary border border-border"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
        >
          <option value="">เลือกประเภท</option>
          <option value="sick">ลาป่วย</option>
          <option value="personal">ลากิจ</option>
          <option value="vacation">ลาพักผ่อน</option>
          <option value="maternity">ลาคลอด</option>
          <option value="study">ลาศึกษาต่อ</option>
          <option value="training">ลาฝึกอบรม</option>
          <option value="ordination">ลาอุปสมบท</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">วันที่เริ่ม (ตาม USER)</label>
          <input type="date" className="w-full p-2 rounded-lg bg-secondary border border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">วันที่สิ้นสุด (ตาม USER)</label>
          <input type="date" className="w-full p-2 rounded-lg bg-secondary border border-border" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">วันที่เริ่ม (ตามเอกสาร)</label>
          <input type="date" className="w-full p-2 rounded-lg bg-secondary border border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">วันที่สิ้นสุด (ตามเอกสาร)</label>
          <input type="date" className="w-full p-2 rounded-lg bg-secondary border border-border" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="requireReport" 
          checked={requireReport}
          onChange={(e) => setRequireReport(e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="requireReport" className="text-sm">ต้องรายงานตัวหลังกลับ</label>
      </div>

      {requireReport && (
        <div className="space-y-2">
          <label className="text-sm font-medium">วันที่รายงานตัว</label>
          <input type="date" className="w-full p-2 rounded-lg bg-secondary border border-border" />
        </div>
      )}

      {leaveType === "study" && (
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-4">
          <p className="text-sm font-medium text-purple-400">ข้อมูลการลาศึกษาต่อ</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">สถานศึกษา</label>
            <input type="text" className="w-full p-2 rounded-lg bg-secondary border border-border" placeholder="ระบุสถานศึกษา" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">หลักสูตร</label>
            <input type="text" className="w-full p-2 rounded-lg bg-secondary border border-border" placeholder="ระบุหลักสูตร" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">สาขาวิชา</label>
            <input type="text" className="w-full p-2 rounded-lg bg-secondary border border-border" placeholder="ระบุสาขาวิชา" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">หมายเหตุ</label>
        <Textarea placeholder="ระบุหมายเหตุ (ถ้ามี)" className="bg-secondary border-border" />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={onClose}>บันทึก</Button>
      </DialogFooter>
    </div>
  )
}
