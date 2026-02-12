"use client"
export const dynamic = 'force-dynamic'

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Check,
  X,
  RotateCcw,
  UserPlus,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { AxiosError } from "axios"
import {
  useAvailableOfficers,
  usePendingApprovals,
  useProcessAction,
  useReassignRequest,
  useRequestDetail,
} from "@/features/request/hooks"
import type { RequestWithDetails } from "@/types/request.types"
import { toRequestDisplayId } from "@/shared/utils/public-id"

type RequestStatus = "pending" | "approved" | "rejected" | "returned"

interface Request {
  id: number
  requestNo: string
  name: string
  position: string
  department: string
  status: RequestStatus
  rateGroup: string
  rateItem: string
  amount: number
  hasVerificationSnapshot: boolean
}

function formatThaiDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

function pickSubmissionValue(
  submission: Record<string, unknown> | null,
  ...keys: string[]
) {
  if (!submission) return undefined
  for (const key of keys) {
    const value = submission[key]
    if (value !== undefined && value !== null && value !== "") {
      return value
    }
  }
  return undefined
}

function mapStatus(status: string): RequestStatus {
  if (status === "APPROVED") return "approved"
  if (status === "REJECTED") return "rejected"
  if (status === "RETURNED") return "returned"
  if (status.startsWith("PENDING")) return "pending"
  return "pending"
}

function getStatusBadge(status: RequestStatus) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Clock className="h-3 w-3" />
          รออนุมัติ
        </span>
      )
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--success))]">
          <CheckCircle2 className="h-3 w-3" />
          อนุมัติแล้ว
        </span>
      )
    case "returned":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--warning))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--warning))]">
          <RefreshCw className="h-3 w-3" />
          ส่งกลับแก้ไข
        </span>
      )
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
          <XCircle className="h-3 w-3" />
          ไม่อนุมัติ
        </span>
      )
  }
}

export default function RequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "return" | null>(null)
  const [comment, setComment] = useState("")
  const [historyRequest, setHistoryRequest] = useState<Request | null>(null)
  const [reassignTargetRequest, setReassignTargetRequest] = useState<Request | null>(null)
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null)
  const [reassignRemark, setReassignRemark] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all")

  const { data: requestsData } = usePendingApprovals()
  const processAction = useProcessAction()
  const { data: availableOfficers = [], isLoading: isLoadingOfficers } = useAvailableOfficers()
  const reassignMutation = useReassignRequest()
  const { data: historyRequestDetail, isLoading: isLoadingHistory } = useRequestDetail(
    historyRequest?.id,
  )

  const requests = useMemo<Request[]>(() => {
    if (!Array.isArray(requestsData)) return []
    return (requestsData as RequestWithDetails[]).map((req) => {
      const submission = parseSubmissionData(req.submission_data)
      const requesterName =
        req.requester?.first_name || req.requester?.last_name
          ? `${req.requester?.first_name ?? ""} ${req.requester?.last_name ?? ""}`.trim()
          : undefined
      const name =
        requesterName ||
        (pickSubmissionValue(submission, "first_name", "firstName") ||
        pickSubmissionValue(submission, "last_name", "lastName")
          ? `${String(pickSubmissionValue(submission, "first_name", "firstName") ?? "")} ${String(
              pickSubmissionValue(submission, "last_name", "lastName") ?? "",
            )}`.trim()
          : undefined) ||
        (submission?.fullName as string | undefined) ||
        "ไม่ระบุ"

      const rateMapping = (
        pickSubmissionValue(submission, "rate_mapping", "rateMapping") ?? {}
      ) as
        | {
            groupId?: string
            itemId?: string
            subItemId?: string
            group_no?: number
            item_no?: string
            sub_item_no?: string
          }
        | undefined

      return {
        id: req.request_id,
        requestNo: req.request_no ?? toRequestDisplayId(req.request_id, req.created_at),
        name,
        position:
          (pickSubmissionValue(submission, "position_name", "positionName") as string | undefined) ||
          req.requester?.position ||
          "-",
        department:
          req.current_department ||
          (pickSubmissionValue(submission, "department") as string | undefined) ||
          "-",
        status: mapStatus(req.status),
        rateGroup: String(rateMapping?.group_no ?? rateMapping?.groupId ?? "-"),
        rateItem: String(
          rateMapping?.item_no ?? rateMapping?.itemId ?? rateMapping?.sub_item_no ?? rateMapping?.subItemId ?? "-",
        ),
        amount: Number(req.requested_amount ?? 0),
        hasVerificationSnapshot: Boolean(req.has_verification_snapshot),
      }
    })
  }, [requestsData])

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || request.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return

    try {
      const action = actionType === "approve" ? "APPROVE" : actionType === "reject" ? "REJECT" : "RETURN"
      await processAction.mutateAsync({ id: selectedRequest.id, payload: { action, comment: comment.trim() } })
      toast.success("ดำเนินการคำขอเรียบร้อย")
      setSelectedRequest(null)
      setActionType(null)
      setComment("")
    } catch {
      toast.error("ไม่สามารถดำเนินการคำขอได้")
    }
  }

  const openActionDialog = (request: Request, action: "approve" | "reject" | "return") => {
    setSelectedRequest(request)
    setActionType(action)
  }

  const openReassignDialog = (request: Request) => {
    setReassignTargetRequest(request)
    setSelectedOfficerId(null)
    setReassignRemark("")
  }

  const openHistoryDialog = (request: Request) => {
    setHistoryRequest(request)
  }

  const handleReassign = async () => {
    if (!reassignTargetRequest) return
    if (!selectedOfficerId) {
      toast.error("กรุณาเลือกเจ้าหน้าที่ปลายทาง")
      return
    }
    if (!reassignRemark.trim()) {
      toast.error("กรุณาระบุเหตุผลการโยกงาน")
      return
    }

    try {
      await reassignMutation.mutateAsync({
        id: reassignTargetRequest.id,
        payload: {
          target_officer_id: selectedOfficerId,
          remark: reassignRemark.trim(),
        },
      })
      toast.success("โยกงานสำเร็จ")
      setReassignTargetRequest(null)
      setSelectedOfficerId(null)
      setReassignRemark("")
    } catch (error: unknown) {
      const apiError = error as AxiosError<{ error?: string; message?: string }>
      const apiMessage = apiError.response?.data?.error || apiError.response?.data?.message
      toast.error(apiMessage || "ไม่สามารถโยกงานได้")
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const verifiedCount = requests.filter((r) => r.hasVerificationSnapshot).length
  const pendingVerificationCount = requests.filter((r) => !r.hasVerificationSnapshot).length
  const totalAmount = requests.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">คำขอรออนุมัติ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตรวจสอบและอนุมัติคำขอรับเงิน พ.ต.ส. 
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-primary">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">มี Snapshot ตรวจสอบแล้ว</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{verifiedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยังไม่สร้าง Snapshot</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{pendingVerificationCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-[hsl(var(--warning))]/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดเงินรวมที่รอ</p>
                <p className="text-2xl font-bold text-destructive">{totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ หรือเลขที่คำขอ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  {filterStatus === "all" ? "ทั้งหมด" : getStatusBadge(filterStatus)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  ทั้งหมด
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                  รออนุมัติ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("approved")}>
                  อนุมัติแล้ว
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("returned")}>
                  ส่งกลับแก้ไข
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("rejected")}>
                  ไม่อนุมัติ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">รายการคำขอ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="font-semibold">เลขที่คำขอ</TableHead>
                  <TableHead className="font-semibold">ชื่อ-สกุล</TableHead>
                  <TableHead className="font-semibold">ตำแหน่ง</TableHead>
                  <TableHead className="font-semibold">หน่วยงาน</TableHead>
                  <TableHead className="font-semibold text-center">กลุ่ม/ข้อ</TableHead>
                  <TableHead className="font-semibold text-right">อัตรา (บาท)</TableHead>
                  <TableHead className="font-semibold">สถานะ</TableHead>
                  <TableHead className="font-semibold text-center">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-secondary/20">
                    <TableCell className="font-mono text-sm">{request.requestNo}</TableCell>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.position}
                    </TableCell>
                    <TableCell className="text-sm">{request.department}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded bg-secondary px-2 py-1 text-xs font-medium">
                        {request.rateGroup}/{request.rateItem}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {request.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" asChild>
                            <Link href={`/pts-officer/requests/${request.id}`}>
                              <Eye className="h-4 w-4" />
                              ดูรายละเอียด
                            </Link>
                          </DropdownMenuItem>
                          {request.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                className="gap-2 text-[hsl(var(--success))]"
                                onClick={() => openActionDialog(request, "approve")}
                              >
                                <Check className="h-4 w-4" />
                                อนุมัติ
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-[hsl(var(--warning))]"
                                onClick={() => openActionDialog(request, "return")}
                              >
                                <RotateCcw className="h-4 w-4" />
                                ส่งกลับแก้ไข
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => openActionDialog(request, "reject")}
                              >
                                <X className="h-4 w-4" />
                                ไม่อนุมัติ
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" asChild>
                                <button type="button" onClick={() => openReassignDialog(request)}>
                                  <UserPlus className="h-4 w-4" />
                                  โยกงาน (Reassign)
                                </button>
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="gap-2" asChild>
                            <button type="button" onClick={() => openHistoryDialog(request)}>
                              <FileText className="h-4 w-4" />
                              ดูประวัติ
                            </button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredRequests.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              ไม่พบรายการที่ค้นหา
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null)
          setActionType(null)
          setComment("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "ยืนยันการอนุมัติ"}
              {actionType === "reject" && "ยืนยันการไม่อนุมัติ"}
              {actionType === "return" && "ยืนยันการส่งกลับแก้ไข"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span className="block mt-2">
                  คำขอ: <span className="font-mono">{selectedRequest.requestNo}</span>
                  <br />
                  ผู้ยื่น: {selectedRequest.name}
                  <br />
                  จำนวนเงิน: {selectedRequest.amount.toLocaleString()} บาท/เดือน
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground">
              หมายเหตุ {actionType !== "approve" && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder={
                actionType === "approve"
                  ? "หมายเหตุ (ถ้ามี)"
                  : "ระบุเหตุผล..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
                setComment("")
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionType !== "approve" && !comment.trim()}
              className={
                actionType === "approve"
                  ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))]"
                  : actionType === "reject"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-[hsl(var(--warning-foreground))]"
              }
            >
              {actionType === "approve" && "อนุมัติ"}
              {actionType === "reject" && "ไม่อนุมัติ"}
              {actionType === "return" && "ส่งกลับแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyRequest}
        onOpenChange={(open) => {
          if (!open) setHistoryRequest(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ประวัติการอนุมัติ</DialogTitle>
            <DialogDescription>
              {historyRequest ? (
                <span>
                  คำขอ: <span className="font-mono">{historyRequest.requestNo}</span>
                </span>
              ) : (
                "รายละเอียดผู้ดำเนินการในแต่ละขั้นตอน"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[420px] overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <p className="text-sm text-muted-foreground">กำลังโหลดประวัติ...</p>
            ) : (historyRequestDetail?.actions?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่พบประวัติการดำเนินการ</p>
            ) : (
              <div className="space-y-2">
                {(historyRequestDetail?.actions ?? []).map((action, index) => (
                  <div
                    key={`${action.action}-${action.step_no}-${index}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {action.action} (Step {action.step_no ?? "-"})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatThaiDateTime(action.action_date ?? null)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ผู้ดำเนินการ:{" "}
                      {action.actor
                        ? `${action.actor.first_name ?? ""} ${action.actor.last_name ?? ""}`.trim() || "-"
                        : "-"}
                    </p>
                    {action.comment && (
                      <p className="mt-2 rounded bg-secondary/40 px-2 py-1 text-xs text-foreground">
                        หมายเหตุ: {action.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reassignTargetRequest}
        onOpenChange={(open) => {
          if (!open) {
            setReassignTargetRequest(null)
            setSelectedOfficerId(null)
            setReassignRemark("")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>โยกงาน (Reassign)</DialogTitle>
            <DialogDescription>
              {reassignTargetRequest ? (
                <span>
                  คำขอ: <span className="font-mono">{reassignTargetRequest.requestNo}</span>
                </span>
              ) : (
                "เลือกเจ้าหน้าที่ปลายทาง"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">เงื่อนไขการโยกงาน</p>
              <p>1. คำขอต้องมีสถานะ `PENDING` และอยู่ขั้น `PTS_OFFICER` (step 3)</p>
              <p>2. ระบบต้องมีเจ้าหน้าที่ `PTS_OFFICER` ที่ active อย่างน้อย 2 คน</p>
              <p>3. ห้ามโยกงานให้ตัวเอง</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">เลือกเจ้าหน้าที่ปลายทาง</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={selectedOfficerId ?? ""}
                onChange={(e) => setSelectedOfficerId(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoadingOfficers || reassignMutation.isPending}
              >
                <option value="">-- เลือกเจ้าหน้าที่ --</option>
                {availableOfficers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} (ภาระงาน: {officer.workload})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                เหตุผลการโยกงาน <span className="text-destructive">*</span>
              </label>
              <Textarea
                rows={3}
                className="mt-1"
                placeholder="ระบุเหตุผล เช่น ภาระงานสูง/มอบหมายใหม่"
                value={reassignRemark}
                onChange={(e) => setReassignRemark(e.target.value)}
                disabled={reassignMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReassignTargetRequest(null)
                setSelectedOfficerId(null)
                setReassignRemark("")
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleReassign} disabled={reassignMutation.isPending}>
              ยืนยันโยกงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
