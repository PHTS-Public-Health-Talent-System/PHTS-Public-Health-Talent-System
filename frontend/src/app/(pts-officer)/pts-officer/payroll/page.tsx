"use client"
export const dynamic = 'force-dynamic'

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calculator,
  Plus,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Calendar,
  Users,
  Banknote,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

// TODO: add icon when rejected periods are shown: XCircle
import { YearPicker } from "@/components/month-year-picker"
import { toast } from "sonner"
import {
  useCalculatePeriod,
  useCreatePeriod,
  useDownloadPeriodReport,
  usePeriodPayouts,
  usePeriods,
  useSubmitToHR,
} from "@/features/payroll/hooks"
import type { PayPeriod, PeriodPayoutRow } from "@/features/payroll/api"

type PeriodStatus = "draft" | "calculating" | "pending_hr" | "approved_hr" | "approved_director" | "paid"

interface PayrollPeriod {
  id: string
  month: string
  year: string
  status: PeriodStatus
  totalPersons: number
  totalAmount: number
  createdAt: string
  submittedAt?: string
}

interface PayrollItem {
  id: string
  name: string
  position: string
  rateGroup: string
  rateItem: string
  baseAmount: number
  leaveDays: number
  deduction: number
  netAmount: number
}

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr) return "-"
  const [year, month, day] = dateStr.split("T")[0].split("-")
  const yearNum = parseInt(year)
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`
}

function mapStatus(status?: string | null): PeriodStatus {
  switch (status) {
    case "OPEN":
      return "draft"
    case "WAITING_HR":
      return "pending_hr"
    case "WAITING_HEAD_FINANCE":
      return "approved_hr"
    case "WAITING_DIRECTOR":
      return "approved_director"
    case "CLOSED":
      return "paid"
    default:
      return "draft"
  }
}

function mapPeriod(period: PayPeriod): PayrollPeriod {
  const monthName = thaiMonths[(period.period_month ?? 1) - 1] ?? "-"
  const yearNum = period.period_year ?? 0
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return {
    id: String(period.period_id),
    month: monthName,
    year: String(thaiYear),
    status: mapStatus(period.status),
    totalPersons: period.total_headcount ?? 0,
    totalAmount: period.total_amount ?? 0,
    createdAt: formatThaiDate(period.created_at ?? undefined),
    submittedAt: formatThaiDate(period.updated_at ?? undefined),
  }
}

function mapPayout(row: PeriodPayoutRow): PayrollItem {
  return {
    id: String(row.payout_id),
    name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
    position: row.position_name ?? "-",
    rateGroup: "-",
    rateItem: "-",
    baseAmount: Number(row.rate ?? 0),
    leaveDays: Number(row.deducted_days ?? 0),
    deduction: 0,
    netAmount: Number(row.total_payable ?? 0),
  }
}

function getStatusBadge(status: PeriodStatus) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          <FileText className="h-3 w-3" />
          แบบร่าง
        </span>
      )
    case "calculating":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Calculator className="h-3 w-3" />
          กำลังคำนวณ
        </span>
      )
    case "pending_hr":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--warning))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--warning))]">
          <Clock className="h-3 w-3" />
          รอ HR อนุมัติ
        </span>
      )
    case "approved_hr":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--success))]">
          <CheckCircle2 className="h-3 w-3" />
          HR อนุมัติแล้ว
        </span>
      )
    case "approved_director":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--success))]">
          <CheckCircle2 className="h-3 w-3" />
          ผอ.อนุมัติแล้ว
        </span>
      )
    case "paid":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--success))]">
          <Banknote className="h-3 w-3" />
          จ่ายเงินแล้ว
        </span>
      )
  }
}

export default function PayrollPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createMonth, setCreateMonth] = useState("01")
  const [createYear, setCreateYear] = useState(2568)

  const { data: periodsData } = usePeriods()
  const createPeriod = useCreatePeriod()
  const calculatePeriod = useCalculatePeriod()
  const submitToHR = useSubmitToHR()
  const downloadReport = useDownloadPeriodReport()

  const periods = useMemo<PayrollPeriod[]>(() => {
    if (!Array.isArray(periodsData)) return []
    return [...periodsData]
      .sort((a, b) => {
        const yearDiff = (b.period_year ?? 0) - (a.period_year ?? 0)
        if (yearDiff !== 0) return yearDiff
        return (b.period_month ?? 0) - (a.period_month ?? 0)
      })
      .map((period) => mapPeriod(period))
  }, [periodsData])

  const currentPeriod = useMemo(() => {
    if (periods.length === 0) return null
    return periods[0]
  }, [periods])

  const { data: payoutsData } = usePeriodPayouts(currentPeriod?.id)
  const payouts = useMemo<PayrollItem[]>(() => {
    if (!Array.isArray(payoutsData)) return []
    return payoutsData.map((row) => mapPayout(row))
  }, [payoutsData])

  const handleCreatePeriod = async () => {
    const year = createYear > 2400 ? createYear - 543 : createYear
    const month = parseInt(createMonth)
    try {
      await createPeriod.mutateAsync({ year, month })
      toast.success("สร้างรอบจ่ายเงินเรียบร้อย")
      setIsCreateDialogOpen(false)
    } catch {
      toast.error("ไม่สามารถสร้างรอบจ่ายเงินได้")
    }
  }

  const handleCalculate = async () => {
    if (!currentPeriod) return
    try {
      await calculatePeriod.mutateAsync(currentPeriod.id)
      toast.success("เริ่มคำนวณรอบเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถคำนวณรอบได้")
    }
  }

  const handleSubmit = async () => {
    if (!currentPeriod) return
    try {
      await submitToHR.mutateAsync(currentPeriod.id)
      toast.success("ส่งให้ HR อนุมัติเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถส่งให้ HR อนุมัติได้")
    }
  }

  const handleDownload = async () => {
    if (!currentPeriod) return
    try {
      const blob = await downloadReport.mutateAsync(currentPeriod.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `payroll-period-${currentPeriod.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("ไม่สามารถดาวน์โหลดรายงานได้")
    }
  }

  const displayPeriod = currentPeriod ?? {
    month: "-",
    year: "-",
    totalPersons: 0,
    totalAmount: 0,
    status: "draft" as PeriodStatus,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">รอบจ่ายเงิน (Payroll)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการรอบคำนวณเงิน พ.ต.ส. รายเดือน
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              สร้างรอบใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างรอบจ่ายเงินใหม่</DialogTitle>
              <DialogDescription>
                เลือกเดือนและปีสำหรับสร้างรอบจ่ายเงินใหม่
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">เดือน</label>
                <Select value={createMonth} onValueChange={setCreateMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเดือน" />
                  </SelectTrigger>
                  <SelectContent>
                    {thaiMonths.map((month, index) => (
                      <SelectItem key={month} value={`${index + 1}`.padStart(2, "0")}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
<div className="grid gap-2">
  <label className="text-sm font-medium">ปี พ.ศ.</label>
  <YearPicker
    value={createYear}
    onChange={setCreateYear}
    minYear={2550}
    maxYear={2600}
  />
  </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreatePeriod}>
                สร้างรอบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอบปัจจุบัน</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayPeriod.month} {displayPeriod.year}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนผู้รับเงิน</p>
                <p className="text-2xl font-bold text-primary">{displayPeriod.totalPersons} คน</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวม</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {displayPeriod.totalAmount.toLocaleString()} บาท
                </p>
              </div>
              <Banknote className="h-8 w-8 text-[hsl(var(--success))]/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">สถานะ</p>
                <div className="mt-1">{getStatusBadge(displayPeriod.status)}</div>
              </div>
              <AlertCircle className="h-8 w-8 text-[hsl(var(--warning))]/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="current">รอบปัจจุบัน</TabsTrigger>
          <TabsTrigger value="history">ประวัติรอบจ่าย</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Actions */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() => toast.error("ยังไม่รองรับการเพิ่มรายการผ่านหน้านี้")}
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มรายการ
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent" onClick={handleCalculate}>
                  <Calculator className="h-4 w-4" />
                  คำนวณใหม่
                </Button>
                <Button className="gap-2 bg-primary" onClick={handleSubmit}>
                  <Send className="h-4 w-4" />
                  ส่งให้ HR อนุมัติ
                </Button>
                <Button variant="outline" className="gap-2 ml-auto bg-transparent" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  ดาวน์โหลดรายงาน
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Items */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                รายการเบิกจ่าย - {displayPeriod.month} {displayPeriod.year}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                แสดง {payouts.length} รายการ
              </span>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-semibold w-[50px]">ลำดับ</TableHead>
                      <TableHead className="font-semibold">ชื่อ-สกุล</TableHead>
                      <TableHead className="font-semibold">ตำแหน่ง</TableHead>
                      <TableHead className="font-semibold text-center">กลุ่ม/ข้อ</TableHead>
                      <TableHead className="font-semibold text-right">อัตรา (บาท)</TableHead>
                      <TableHead className="font-semibold text-center">วันลา</TableHead>
                      <TableHead className="font-semibold text-right">หักลา (บาท)</TableHead>
                      <TableHead className="font-semibold text-right">สุทธิ (บาท)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-secondary/20">
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.position}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded bg-secondary px-2 py-1 text-xs font-medium">
                            {item.rateGroup}/{item.rateItem}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.baseAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.leaveDays > 0 ? (
                            <span className="text-[hsl(var(--warning))]">{item.leaveDays}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.deduction > 0 ? (
                            <span className="text-destructive">-{item.deduction.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[hsl(var(--success))]">
                          {item.netAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 flex justify-end">
                <div className="w-80 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">จำนวนผู้รับเงิน</span>
                    <span className="font-medium">{payouts.length} คน</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">ยอดรวมก่อนหัก</span>
                    <span className="font-medium">
                      {payouts.reduce((sum, i) => sum + i.baseAmount, 0).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">หักลารวม</span>
                    <span className="font-medium text-destructive">
                      -{payouts.reduce((sum, i) => sum + i.deduction, 0).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm">
                    <span className="font-semibold">ยอดสุทธิ</span>
                    <span className="font-bold text-[hsl(var(--success))]">
                      {payouts.reduce((sum, i) => sum + i.netAmount, 0).toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">ประวัติรอบจ่ายเงิน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-semibold">รหัสรอบ</TableHead>
                      <TableHead className="font-semibold">เดือน/ปี</TableHead>
                      <TableHead className="font-semibold text-center">จำนวนคน</TableHead>
                      <TableHead className="font-semibold text-right">ยอดรวม (บาท)</TableHead>
                      <TableHead className="font-semibold">สถานะ</TableHead>
                      <TableHead className="font-semibold">วันที่สร้าง</TableHead>
                      <TableHead className="font-semibold text-center">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id} className="hover:bg-secondary/20">
                        <TableCell className="font-mono text-sm">{period.id}</TableCell>
                        <TableCell className="font-medium">
                          {period.month} {period.year}
                        </TableCell>
                        <TableCell className="text-center">{period.totalPersons}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {period.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(period.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{period.createdAt}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/pts-officer/payroll/${period.id}`}>
                              ดูรายละเอียด
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
