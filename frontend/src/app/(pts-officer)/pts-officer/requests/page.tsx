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
import { usePendingApprovals, useProcessAction } from "@/features/request/hooks"
import type { RequestWithDetails } from "@/types/request.types"

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
  submitDate: string
  licenseExpiry: string
}

function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all")

  const { data: requestsData } = usePendingApprovals()
  const processAction = useProcessAction()

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
        (submission?.firstName || submission?.lastName
          ? `${submission?.firstName ?? ""} ${submission?.lastName ?? ""}`.trim()
          : undefined) ||
        (submission?.fullName as string | undefined) ||
        "ไม่ระบุ"

      const rateMapping = submission?.rateMapping as
        | { groupId?: string; itemId?: string; subItemId?: string }
        | undefined

      return {
        id: req.request_id,
        requestNo: req.request_no ?? `REQ-${req.request_id}`,
        name,
        position: (submission?.positionName as string | undefined) || req.requester?.position || "-",
        department: (submission?.department as string | undefined) || "-",
        status: mapStatus(req.status),
        rateGroup: rateMapping?.groupId ?? "-",
        rateItem: rateMapping?.itemId ?? rateMapping?.subItemId ?? "-",
        amount: req.requested_amount ?? 0,
        submitDate: formatThaiDate(req.created_at),
        licenseExpiry: "-",
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

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const approvedCount = requests.filter((r) => r.status === "approved").length
  const returnedCount = requests.filter((r) => r.status === "returned").length
  const rejectedCount = requests.filter((r) => r.status === "rejected").length

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
                <p className="text-sm text-muted-foreground">อนุมัติวันนี้</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ส่งกลับแก้ไข</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{returnedCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-[hsl(var(--warning))]/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ไม่อนุมัติ</p>
                <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
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
                              <DropdownMenuItem className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                โยกงาน (Reassign)
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="gap-2">
                            <FileText className="h-4 w-4" />
                            ดูประวัติ
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
    </div>
  )
}
