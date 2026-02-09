"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Calculator,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Users,
  Banknote,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  useApproveByHR,
  useDownloadPeriodReport,
  usePeriods,
  usePeriodSummaryByProfession,
  useRejectPeriod,
} from "@/features/payroll/hooks"
import type { PayPeriod, PeriodSummaryRow } from "@/features/payroll/api"

const formatPeriodLabel = (month: number, year: number) => {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" })
}

const toPeriodCode = (month: number, year: number) => {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

type PayrollRow = {
  periodId: number
  periodLabel: string
  periodCode: string
  totalAmount: number
  totalRecords: number
  submittedBy: string
  submittedDate: string
  status: string
  statusLabel: string
}

function getStatusBadge(status: string, label: string) {
  switch (status) {
    case "OPEN":
      return (
        <Badge variant="outline" className="border-muted-foreground/30 bg-muted/30 text-muted-foreground">
          {label}
        </Badge>
      )
    case "WAITING_HR":
      return (
        <Badge variant="outline" className="border-[hsl(var(--warning))]/50 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]">
          <Clock className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case "WAITING_HEAD_FINANCE":
      return (
        <Badge variant="outline" className="border-[hsl(var(--success))]/50 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case "WAITING_DIRECTOR":
      return (
        <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case "CLOSED":
      return (
        <Badge variant="outline" className="border-[hsl(var(--success))]/50 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    default:
      return null
  }
}

export default function HeadHRPayrollPage() {
  const periodsQuery = usePeriods()
  const approveByHR = useApproveByHR()
  const rejectPeriod = useRejectPeriod()
  const downloadReport = useDownloadPeriodReport()
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRow | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedPeriodId = selectedPayroll?.periodId
  const summaryQuery = usePeriodSummaryByProfession(selectedPeriodId)

  const rows = useMemo<PayrollRow[]>(() => {
    const periods = (periodsQuery.data ?? []) as PayPeriod[]
    return periods.map((period) => {
      const statusLabelMap: Record<string, string> = {
        OPEN: "เปิดรอบ",
        WAITING_HR: "รอ HR อนุมัติ",
        WAITING_HEAD_FINANCE: "รอหัวหน้าการเงิน",
        WAITING_DIRECTOR: "รอผู้อำนวยการ",
        CLOSED: "ปิดงวดแล้ว",
      }
      const label = statusLabelMap[period.status] ?? period.status
      return {
        periodId: period.period_id,
        periodLabel: formatPeriodLabel(period.period_month, period.period_year),
        periodCode: toPeriodCode(period.period_month, period.period_year),
        totalAmount: Number(period.total_amount ?? 0),
        totalRecords: Number(period.total_headcount ?? 0),
        submittedBy: period.created_by_name ?? "-",
        submittedDate: formatDate(period.created_at ?? null),
        status: period.status,
        statusLabel: label,
      }
    })
  }, [periodsQuery.data])

  const latestPeriodId = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.periodId - a.periodId)
    return sorted[0]?.periodId
  }, [rows])

  const handleAction = async () => {
    if (!selectedPayroll || !actionType) return
    const trimmed = comment.trim()
    if (actionType === "reject" && !trimmed) {
      setActionError("กรุณาระบุเหตุผลก่อนปฏิเสธ")
      return
    }
    setActionError(null)
    try {
      if (actionType === "approve") {
        await approveByHR.mutateAsync(selectedPayroll.periodId)
        toast.success("อนุมัติรอบจ่ายเงินแล้ว")
      } else {
        await rejectPeriod.mutateAsync({ periodId: selectedPayroll.periodId, payload: { reason: trimmed } })
        toast.success("ปฏิเสธรอบจ่ายเงินแล้ว")
      }
      periodsQuery.refetch()
      setSelectedPayroll(null)
      setActionType(null)
      setComment("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
      setActionError(message)
    }
  }

  const pendingCount = rows.filter(p => p.status === "WAITING_HR").length
  const approvedCount = rows.filter(p => p.status === "CLOSED" || p.status === "WAITING_DIRECTOR" || p.status === "WAITING_HEAD_FINANCE").length
  const pendingTotalAmount = rows
    .filter(p => p.status === "WAITING_HR")
    .reduce((sum, p) => sum + p.totalAmount, 0)
  const isLoading = periodsQuery.isLoading

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">รอบจ่ายเงิน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ตรวจสอบและอนุมัติรอบจ่ายเงิน พ.ต.ส. ที่ส่งมาจากเจ้าหน้าที่
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-transparent"
            disabled={!latestPeriodId}
            onClick={async () => {
              if (!latestPeriodId) return
              const blob = await downloadReport.mutateAsync(latestPeriodId)
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.href = url
              link.download = `payroll_${latestPeriodId}.pdf`
              link.click()
              window.URL.revokeObjectURL(url)
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดรายงาน
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอบทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <Calculator className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รออนุมัติ</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{pendingCount}</p>
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
                <p className="text-sm text-muted-foreground">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{approvedCount}</p>
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
                <p className="text-sm text-muted-foreground">ยอดรวมรออนุมัติ</p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingTotalAmount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">รายการรอบจ่ายเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          {periodsQuery.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              ไม่สามารถโหลดรายการรอบจ่ายเงินได้
            </div>
          )}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
              กำลังโหลดรายการรอบจ่ายเงิน...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสรอบ</TableHead>
                  <TableHead>เดือน</TableHead>
                  <TableHead className="text-right">จำนวนคน</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ส่งโดย</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((payroll) => (
                  <TableRow key={payroll.periodId}>
                    <TableCell className="font-mono text-sm">{`PAY-${payroll.periodCode}`}</TableCell>
                    <TableCell className="font-medium">{payroll.periodLabel}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {payroll.totalRecords}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {payroll.totalAmount.toLocaleString()} บาท
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.status, payroll.statusLabel)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{payroll.submittedBy}</p>
                        <p className="text-xs text-muted-foreground">{payroll.submittedDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/head-hr/payroll/${payroll.periodId}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {payroll.status === "WAITING_HR" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))]/80 hover:bg-[hsl(var(--success))]/10"
                              onClick={() => {
                                setSelectedPayroll(payroll)
                                setActionType("approve")
                                setActionError(null)
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedPayroll(payroll)
                                setActionType("reject")
                                setActionError(null)
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const blob = await downloadReport.mutateAsync(payroll.periodId)
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement("a")
                            link.href = url
                            link.download = `payroll_${payroll.periodId}.pdf`
                            link.click()
                            window.URL.revokeObjectURL(url)
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบรายการรอบจ่ายเงิน
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedPayroll && !!actionType} onOpenChange={() => {
        setSelectedPayroll(null)
        setActionType(null)
        setComment("")
        setActionError(null)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "อนุมัติรอบจ่ายเงิน"}
              {actionType === "reject" && "ปฏิเสธรอบจ่ายเงิน"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayroll && (
                <span>
                  {selectedPayroll.periodCode} - {selectedPayroll.periodLabel}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayroll && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">จำนวนรายการ:</span>
                    <p className="font-medium">{selectedPayroll.totalRecords} คน</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ยอดรวม:</span>
                    <p className="font-medium">{selectedPayroll.totalAmount.toLocaleString()} บาท</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ส่งโดย:</span>
                    <p className="font-medium">{selectedPayroll.submittedBy}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันที่ส่ง:</span>
                    <p className="font-medium">{selectedPayroll.submittedDate}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">รายละเอียดตามประเภท:</p>
                  {summaryQuery.isLoading && (
                    <div className="text-sm text-muted-foreground">กำลังโหลดสรุปตามประเภท...</div>
                  )}
                  {!summaryQuery.isLoading && summaryQuery.data && summaryQuery.data.length > 0 && (
                    <div className="space-y-2">
                      {(summaryQuery.data as PeriodSummaryRow[]).map((row) => (
                        <div key={row.position_name} className="flex justify-between text-sm">
                          <span>{row.position_name}</span>
                          <span>{row.headcount} คน - {row.total_payable.toLocaleString()} บาท</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!summaryQuery.isLoading && (!summaryQuery.data || summaryQuery.data.length === 0) && (
                    <div className="text-sm text-muted-foreground">ไม่มีข้อมูลสรุปตามประเภท</div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">
                {actionType === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผลที่ปฏิเสธ"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    : "ระบุเหตุผลที่ปฏิเสธรอบจ่ายเงินนี้"
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
                setSelectedPayroll(null)
                setActionType(null)
                setComment("")
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAction}
              disabled={approveByHR.isPending || rejectPeriod.isPending}
              className={
                actionType === "approve"
                  ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {actionType === "approve" && "อนุมัติ"}
              {actionType === "reject" && "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
