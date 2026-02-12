"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Eye,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePendingApprovals, useProcessAction } from "@/features/request/hooks"
import { usePendingWithSla } from "@/features/sla/hooks"
import { mapRequestToFormData } from "@/components/request/hooks/request-form-mapper"
import type { RequestWithDetails } from "@/types/request.types"
import { normalizeRateMapping, resolveRateMappingDisplay } from "@/app/(user)/user/request-detail-rate-mapping"
import { useRateHierarchy } from "@/features/master-data/hooks"

function getSlaStatusBadge(status: string, remaining: number) {
  switch (status) {
    case "normal":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5 text-xs font-medium text-[hsl(var(--success))]">
          {remaining} วัน
        </span>
      )
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))]/10 px-2 py-0.5 text-xs font-medium text-[hsl(var(--warning))]">
          {remaining} วัน
        </span>
      )
    case "danger":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          เกิน {Math.abs(remaining)} วัน
        </span>
      )
    default:
      return null
  }
}

type SlaInfo = {
  request_id: number
  is_approaching_sla: boolean
  is_overdue: boolean
  days_until_sla: number
  days_overdue: number
}

type RequestRow = {
  id: number
  requestNo: string
  name: string
  position: string
  department: string
  groupId: string
  rateItem: string
  amount: number
  submittedDate: string
  slaStatus: "normal" | "warning" | "danger" | "unknown"
  slaRemaining: number | null
  raw: RequestWithDetails
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function HeadHRRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "return" | null>(null)
  const [comment, setComment] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [slaFilter, setSlaFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [actionError, setActionError] = useState<string | null>(null)

  const pendingQuery = usePendingApprovals()
  const slaQuery = usePendingWithSla()
  const rateHierarchyQuery = useRateHierarchy()
  const actionMutation = useProcessAction()

  const slaMap = useMemo(() => {
    const map = new Map<number, SlaInfo>()
    const data = (slaQuery.data as SlaInfo[] | undefined) ?? []
    for (const row of data) {
      map.set(row.request_id, row)
    }
    return map
  }, [slaQuery.data])

  const rows = useMemo<RequestRow[]>(() => {
    const pending = (pendingQuery.data ?? []) as RequestWithDetails[]
    return pending.map((request) => {
      const formData = mapRequestToFormData(request)
      const rateMapping = normalizeRateMapping(request.submission_data ?? null)
      const rateDisplay = rateMapping
        ? resolveRateMappingDisplay(rateMapping, rateHierarchyQuery.data)
        : null
      const groupLabel = rateDisplay?.groupLabel
      const criteriaLabel = rateDisplay?.criteriaLabel
      const name = [formData.title, formData.firstName, formData.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || request.citizen_id
      const position =
        formData.positionName ||
        (request as { position_name?: string }).position_name ||
        "-"
      const department =
        formData.subDepartment || formData.department || request.current_department || "-"
      const groupId = formData.rateMapping?.groupId ?? ""
      const rateItem = formData.rateMapping?.itemId ?? ""
      const amount = formData.rateMapping?.amount ?? request.requested_amount ?? 0
      const displayGroup = groupLabel || (groupId ? `กลุ่มที่ ${groupId}` : "")
      const displayRateItem = criteriaLabel || (rateItem === "__NONE__" ? "" : rateItem)
      const requestNo = request.request_no ?? String(request.request_id)
      const sla = slaMap.get(request.request_id)
      let slaStatus: RequestRow["slaStatus"] = "unknown"
      let slaRemaining: number | null = null
      if (sla) {
        if (sla.is_overdue) {
          slaStatus = "danger"
          slaRemaining = -Math.abs(sla.days_overdue)
        } else if (sla.is_approaching_sla) {
          slaStatus = "warning"
          slaRemaining = sla.days_until_sla
        } else {
          slaStatus = "normal"
          slaRemaining = sla.days_until_sla
        }
      }
      return {
        id: request.request_id,
        requestNo,
        name,
        position,
        department,
        groupId: displayGroup,
        rateItem: displayRateItem,
        amount,
        submittedDate: formatDate(request.created_at),
        slaStatus,
        slaRemaining,
        raw: request,
      }
    })
  }, [pendingQuery.data, slaMap, rateHierarchyQuery.data])

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !keyword ||
        row.requestNo.toLowerCase().includes(keyword) ||
        row.name.toLowerCase().includes(keyword)
      const matchesSla =
        slaFilter === "all" ||
        (slaFilter === "normal" && row.slaStatus === "normal") ||
        (slaFilter === "warning" && row.slaStatus === "warning") ||
        (slaFilter === "danger" && row.slaStatus === "danger")
      const matchesGroup =
        groupFilter === "all" ||
        (row.groupId && row.groupId === groupFilter)
      return matchesSearch && matchesSla && matchesGroup
    })
  }, [rows, searchTerm, slaFilter, groupFilter])

  const summaryCounts = useMemo(() => {
    const base = { total: rows.length, normal: 0, warning: 0, danger: 0 }
    return rows.reduce((acc, row) => {
      if (row.slaStatus === "normal") acc.normal += 1
      if (row.slaStatus === "warning") acc.warning += 1
      if (row.slaStatus === "danger") acc.danger += 1
      return acc
    }, base)
  }, [rows])

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return
    const trimmed = comment.trim()
    const isCommentRequired = actionType !== "approve"
    if (isCommentRequired && !trimmed) {
      setActionError("กรุณาระบุเหตุผลก่อนดำเนินการ")
      return
    }
    setActionError(null)
    const actionMap = {
      approve: "APPROVE",
      reject: "REJECT",
      return: "RETURN",
    } as const
    try {
      await actionMutation.mutateAsync({
        id: selectedRequest.id,
        payload: { action: actionMap[actionType], comment: trimmed || undefined },
      })
      setSelectedRequest(null)
      setActionType(null)
      setComment("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้"
      setActionError(message)
    }
  }

  const isLoading = pendingQuery.isLoading || slaQuery.isLoading
  const isError = pendingQuery.isError
  const errorMessage =
    pendingQuery.error instanceof Error
      ? pendingQuery.error.message
      : "ไม่สามารถโหลดรายการคำขอได้"

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">คำขอรออนุมัติ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตรวจสอบและอนุมัติคำขอ พ.ต.ส. ที่ผ่านการตรวจสอบจากเจ้าหน้าที่แล้ว
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, รหัสคำขอ..."
                className="pl-10 bg-background"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="สถานะ SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="normal">ปกติ</SelectItem>
                <SelectItem value="warning">ใกล้ครบกำหนด</SelectItem>
                <SelectItem value="danger">เกินกำหนด</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="กลุ่มตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="1">กลุ่มที่ 1</SelectItem>
                <SelectItem value="2">กลุ่มที่ 2</SelectItem>
                <SelectItem value="3">กลุ่มที่ 3</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              ตัวกรองเพิ่มเติม
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground">{summaryCounts.total}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ปกติ</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{summaryCounts.normal}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ใกล้ครบกำหนด</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{summaryCounts.warning}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-3">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">เกินกำหนด</p>
                <p className="text-2xl font-bold text-destructive">{summaryCounts.danger}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">รายการคำขอ</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
              กำลังโหลดรายการคำขอ...
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสคำขอ</TableHead>
                <TableHead>ชื่อ-สกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>กลุ่มงาน</TableHead>
                <TableHead>กลุ่ม</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">{request.requestNo}</TableCell>
                  <TableCell className="font-medium">{request.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{request.position || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{request.department || "-"}</TableCell>
                  <TableCell className="text-sm">
                    <div>{request.groupId || "-"}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {request.amount.toLocaleString()} บาท
                  </TableCell>
                  <TableCell>
                    {request.slaStatus === "unknown" || request.slaRemaining === null
                      ? "-"
                      : getSlaStatusBadge(request.slaStatus, request.slaRemaining)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/head-hr/requests/${request.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))]/80 hover:bg-[hsl(var(--success))]/10"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType("approve")
                          setActionError(null)
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[hsl(var(--warning))] hover:text-[hsl(var(--warning))]/80 hover:bg-[hsl(var(--warning))]/10"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType("return")
                          setActionError(null)
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType("reject")
                          setActionError(null)
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          {!isLoading && !isError && filteredRows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบรายการคำขอ
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null)
        setActionType(null)
        setComment("")
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "อนุมัติคำขอ"}
              {actionType === "reject" && "ไม่อนุมัติคำขอ"}
              {actionType === "return" && "ส่งกลับแก้ไข"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  คำขอ {selectedRequest.id} - {selectedRequest.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ตำแหน่ง:</span>
                    <p className="font-medium">{selectedRequest.position || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">กลุ่มงาน:</span>
                    <p className="font-medium">{selectedRequest.department || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">กลุ่ม/อัตรา:</span>
                    <p className="font-medium">
                      {selectedRequest.groupId || "-"}
                      {selectedRequest.rateItem ? ` - ข้อ ${selectedRequest.rateItem}` : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">จำนวนเงิน:</span>
                    <p className="font-medium">{selectedRequest.amount.toLocaleString()} บาท</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">
                {actionType === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผล"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    : actionType === "reject"
                    ? "ระบุเหตุผลที่ไม่อนุมัติ"
                    : "ระบุสิ่งที่ต้องแก้ไข"
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2"
              />
              {actionError && (
                <p className="mt-2 text-sm text-destructive">{actionError}</p>
              )}
            </div>
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
              disabled={actionMutation.isPending}
              className={
                actionType === "approve"
                  ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
                  : actionType === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-foreground"
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
