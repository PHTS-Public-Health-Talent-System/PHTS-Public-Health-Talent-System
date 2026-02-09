"use client"
export const dynamic = 'force-dynamic'

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  ArrowLeft,
  Send,
  Download,
  FileText,
  Users,
  Banknote,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  CalendarDays,
  User,
  Award,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import {
  useCalculatePeriod,
  useDownloadPeriodReport,
  usePeriodDetail,
  usePeriodPayouts,
  usePeriodSummaryByProfession,
  useSubmitToHR,
} from "@/features/payroll/hooks"
import type { PayPeriod, PeriodPayoutRow, PeriodSummaryRow } from "@/features/payroll/api"

// TODO: add icons when detail view expands: Calculator, AlertTriangle, Building2

type PeriodStatus = "draft" | "calculating" | "pending_hr" | "approved_hr" | "approved_director" | "paid"

interface LeaveDeduction {
  type: string
  typeName: string
  startDate: string
  endDate: string
  days: number
  deductionAmount: number
}

interface PayrollPerson {
  id: number
  name: string
  citizenId: string
  position: string
  positionLevel: string
  department: string
  unit: string
  profession: string
  rateGroup: string
  rateItem: string
  baseRate: number
  workDays: number
  leaveDays: number
  actualRate: number
  deductions: LeaveDeduction[]
  licenseNumber: string
  licenseExpiry: string
  bankAccount: string
  bankName: string
  note?: string
}

interface PayrollDetail {
  id: string
  month: string
  year: string
  status: PeriodStatus
  totalPersons: number
  totalAmount: number
  createdAt: string
  createdBy: string
  submittedAt?: string
  approvedHrAt?: string
  approvedHrBy?: string
  approvedDirectorAt?: string
  paidAt?: string
  workDays: number
  holidays: number
  summary: {
    rate1000: { count: number; amount: number }
    rate1500: { count: number; amount: number }
    rate2000: { count: number; amount: number }
  }
  professionSummary: {
    profession: string
    count: number
    amount: number
  }[]
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

function mapPeriod(period: PayPeriod, summaryRows: PeriodSummaryRow[]): PayrollDetail {
  const monthName = thaiMonths[(period.period_month ?? 1) - 1] ?? "-"
  const yearNum = period.period_year ?? 0
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543

  const summary = summaryRows.reduce(
    (acc, row) => {
      if (row.total_payable >= 2000) {
        acc.rate2000.count += row.headcount
        acc.rate2000.amount += row.total_payable
      } else if (row.total_payable >= 1500) {
        acc.rate1500.count += row.headcount
        acc.rate1500.amount += row.total_payable
      } else {
        acc.rate1000.count += row.headcount
        acc.rate1000.amount += row.total_payable
      }
      return acc
    },
    {
      rate1000: { count: 0, amount: 0 },
      rate1500: { count: 0, amount: 0 },
      rate2000: { count: 0, amount: 0 },
    },
  )

  return {
    id: String(period.period_id),
    month: monthName,
    year: String(thaiYear),
    status: mapStatus(period.status),
    totalPersons: period.total_headcount ?? 0,
    totalAmount: period.total_amount ?? 0,
    createdAt: formatThaiDate(period.created_at ?? undefined),
    createdBy: "-",
    submittedAt: formatThaiDate(period.updated_at ?? undefined),
    workDays: 0,
    holidays: 0,
    summary,
    professionSummary: summaryRows.map((row) => ({
      profession: row.position_name,
      count: row.headcount,
      amount: row.total_payable,
    })),
  }
}

function mapPayout(row: PeriodPayoutRow): PayrollPerson {
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-"
  const rateValue = Number(row.rate ?? 0)
  const rateGroup = rateValue >= 2000 ? "3" : rateValue >= 1500 ? "2" : "1"
  return {
    id: row.payout_id,
    name,
    citizenId: row.citizen_id,
    position: row.position_name ?? "-",
    positionLevel: "-",
    department: "-",
    unit: "-",
    profession: "-",
    rateGroup,
    rateItem: "-",
    baseRate: rateValue,
    workDays: Number(row.eligible_days ?? 0),
    leaveDays: Number(row.deducted_days ?? 0),
    actualRate: Number(row.total_payable ?? 0),
    deductions: [],
    licenseNumber: "-",
    licenseExpiry: "-",
    bankAccount: "-",
    bankName: "-",
  }
}
const statusConfig: Record<PeriodStatus, { label: string; color: string }> = {
  draft: { label: "แบบร่าง", color: "bg-secondary text-muted-foreground border-border" },
  calculating: { label: "กำลังคำนวณ", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  pending_hr: { label: "รอ HR ตรวจสอบ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  approved_hr: { label: "HR อนุมัติแล้ว", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  approved_director: { label: "ผอ. อนุมัติแล้ว", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  paid: { label: "จ่ายแล้ว", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
}

export default function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [searchQuery, setSearchQuery] = useState("")
  const [rateFilter, setRateFilter] = useState("all")
  const [professionFilter, setProfessionFilter] = useState("all")
  const [selectedPerson, setSelectedPerson] = useState<PayrollPerson | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { data: periodDetail } = usePeriodDetail(id)
  const { data: payoutsData } = usePeriodPayouts(id)
  const { data: summaryData } = usePeriodSummaryByProfession(id)
  const calculatePeriod = useCalculatePeriod()
  const submitToHR = useSubmitToHR()
  const downloadReport = useDownloadPeriodReport()

  const payrollPersons = useMemo<PayrollPerson[]>(() => {
    if (!Array.isArray(payoutsData)) return []
    return payoutsData.map((row) => mapPayout(row))
  }, [payoutsData])

  const payroll = useMemo<PayrollDetail>(() => {
    const period = periodDetail?.period
    if (!period) {
      return {
        id: id,
        month: "-",
        year: "-",
        status: "draft",
        totalPersons: 0,
        totalAmount: 0,
        createdAt: "-",
        createdBy: "-",
        workDays: 0,
        holidays: 0,
        summary: {
          rate1000: { count: 0, amount: 0 },
          rate1500: { count: 0, amount: 0 },
          rate2000: { count: 0, amount: 0 },
        },
        professionSummary: [],
      }
    }
    return mapPeriod(period, Array.isArray(summaryData) ? summaryData : [])
  }, [id, periodDetail, summaryData])
  const statusInfo = statusConfig[payroll.status]

  const filteredPersons = payrollPersons.filter((person) => {
    const matchesSearch = person.name.includes(searchQuery) || person.department.includes(searchQuery)
    const matchesRate = rateFilter === "all" || person.rateGroup === rateFilter
    const matchesProfession = professionFilter === "all" || person.profession === professionFilter
    return matchesSearch && matchesRate && matchesProfession
  })

  // Get unique professions
  const professions = [...new Set(payrollPersons.map(p => p.profession))]

  const handleEditPerson = (updatedPerson: PayrollPerson) => {
    setSelectedPerson(updatedPerson)
    setShowEditDialog(false)
  }

  const handleCalculate = async () => {
    try {
      await calculatePeriod.mutateAsync(id)
      toast.success("คำนวณรอบเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถคำนวณรอบได้")
    }
  }

  const handleSubmit = async () => {
    try {
      await submitToHR.mutateAsync(id)
      toast.success("ส่งให้ HR เรียบร้อย")
    } catch {
      toast.error("ไม่สามารถส่งให้ HR ได้")
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await downloadReport.mutateAsync(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `payroll-period-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("ไม่สามารถดาวน์โหลดรายงานได้")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pts-officer/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                รอบจ่ายเงิน {payroll.month} {payroll.year}
              </h1>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              สร้างเมื่อ {payroll.createdAt} โดย {payroll.createdBy}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.error("ยังไม่รองรับการส่งออก Excel")}>
            <Download className="mr-2 h-4 w-4" />
            ส่งออก Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <FileText className="mr-2 h-4 w-4" />
            ส่งออก PDF
          </Button>
          {payroll.status === "calculating" && (
            <>
              <Button variant="outline" size="sm" onClick={handleCalculate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                คำนวณใหม่
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
                <Send className="mr-2 h-4 w-4" />
                ส่งให้ HR
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวนผู้รับเงิน</p>
                <p className="text-2xl font-bold">{payroll.totalPersons} คน</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Banknote className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</p>
                <p className="text-2xl font-bold text-emerald-400">{payroll.totalAmount.toLocaleString()} บาท</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันทำการ</p>
                <p className="text-2xl font-bold">{payroll.workDays} วัน</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันหยุด</p>
                <p className="text-2xl font-bold">{payroll.holidays} วัน</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for summary views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">รายชื่อทั้งหมด</TabsTrigger>
          <TabsTrigger value="rate">สรุปตามอัตราเงิน</TabsTrigger>
          <TabsTrigger value="profession">สรุปตามวิชาชีพ</TabsTrigger>
        </TabsList>

        {/* Tab: Rate Summary */}
        <TabsContent value="rate">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">สรุปตามอัตราเงิน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">กลุ่มที่ 1</span>
                    <Badge variant="outline">1,000 บาท</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{payroll.summary.rate1000.count} คน</span>
                    <span className="text-emerald-400 font-semibold">{payroll.summary.rate1000.amount.toLocaleString()} บาท</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">กลุ่มที่ 2</span>
                    <Badge variant="outline">1,500 บาท</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{payroll.summary.rate1500.count} คน</span>
                    <span className="text-emerald-400 font-semibold">{payroll.summary.rate1500.amount.toLocaleString()} บาท</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">กลุ่มที่ 3</span>
                    <Badge variant="outline">2,000 บาท</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{payroll.summary.rate2000.count} คน</span>
                    <span className="text-emerald-400 font-semibold">{payroll.summary.rate2000.amount.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Profession Summary */}
        <TabsContent value="profession">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">สรุปตามวิชาชีพ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {payroll.professionSummary.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item.profession}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">{item.count} คน</span>
                      <span className="text-emerald-400 font-semibold">{item.amount.toLocaleString()} บาท</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => {
                        setProfessionFilter(item.profession)
                        setActiveTab("all")
                      }}
                    >
                      ดูรายชื่อ
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Person List */}
        <TabsContent value="all">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">รายชื่อผู้รับเงิน</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อ, แผนก..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-secondary border-border"
                    />
                  </div>
                  <Select value={professionFilter} onValueChange={setProfessionFilter}>
                    <SelectTrigger className="w-48 bg-secondary border-border">
                      <Award className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="วิชาชีพ" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกวิชาชีพ</SelectItem>
                      {professions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={rateFilter} onValueChange={setRateFilter}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="กรองตามกลุ่ม" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกกลุ่ม</SelectItem>
                      <SelectItem value="1">กลุ่มที่ 1 (1,000 บาท)</SelectItem>
                      <SelectItem value="2">กลุ่มที่ 2 (1,500 บาท)</SelectItem>
                      <SelectItem value="3">กลุ่มที่ 3 (2,000 บาท)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground">ลำดับ</TableHead>
                      <TableHead className="text-muted-foreground">ชื่อ-นามสกุล</TableHead>
                      <TableHead className="text-muted-foreground">วิชาชีพ</TableHead>
                      <TableHead className="text-muted-foreground">แผนก</TableHead>
                      <TableHead className="text-muted-foreground text-center">กลุ่ม</TableHead>
                      <TableHead className="text-muted-foreground text-right">อัตรา (บาท)</TableHead>
                      <TableHead className="text-muted-foreground text-center">วันทำงาน</TableHead>
                      <TableHead className="text-muted-foreground text-center">ลา</TableHead>
                      <TableHead className="text-muted-foreground text-right">รับจริง (บาท)</TableHead>
                      <TableHead className="text-muted-foreground">หมายเหตุ</TableHead>
                      <TableHead className="text-muted-foreground w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersons.map((person, index) => (
                      <TableRow key={person.id} className="hover:bg-secondary/30">
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            {person.profession}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{person.unit}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-secondary">
                            {person.rateGroup}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{person.baseRate.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{person.workDays}</TableCell>
                        <TableCell className="text-center">
                          {person.leaveDays > 0 ? (
                            <span className="text-amber-400">{person.leaveDays}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">
                          {person.actualRate.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {person.note || "-"}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPerson(person)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-primary" />
                                  รายละเอียดการคำนวณ
                                </DialogTitle>
                                <DialogDescription>
                                  {person.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Personal Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                                  <div>
                                    <p className="text-xs text-muted-foreground">เลขประจำตัวประชาชน</p>
                                    <p className="font-medium">{person.citizenId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">ตำแหน่ง</p>
                                    <p className="font-medium">{person.position}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">วิชาชีพ</p>
                                    <p className="font-medium">{person.profession}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">หน่วยงาน</p>
                                    <p className="font-medium">{person.unit}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">เลขที่ใบอนุญาต</p>
                                    <p className="font-medium">{person.licenseNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">วันหมดอายุใบอนุญาต</p>
                                    <p className="font-medium">{person.licenseExpiry}</p>
                                  </div>
                                </div>

                                {/* Rate Calculation */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">อัตราเงินเต็ม</p>
                                    <p className="font-medium">{person.baseRate.toLocaleString()} บาท</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">วันทำการทั้งหมด</p>
                                    <p className="font-medium">{payroll.workDays} วัน</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">วันทำงานจริง</p>
                                    <p className="font-medium">{person.workDays} วัน</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">วันลา</p>
                                    <p className="font-medium text-amber-400">{person.leaveDays} วัน</p>
                                  </div>
                                </div>

                                {/* Deductions */}
                                {person.deductions.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                      <CalendarDays className="h-4 w-4 text-primary" />
                                      รายละเอียด���ันลา / การหักเงิน
                                    </p>
                                    {person.deductions.map((deduction, idx) => (
                                      <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant="outline" className={
                                            deduction.type === "sick" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                            deduction.type === "personal" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                            "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                          }>
                                            {deduction.typeName}
                                          </Badge>
                                          <span className="text-sm text-amber-400">
                                            หัก {deduction.deductionAmount.toLocaleString()} บาท
                                          </span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-muted-foreground">วันที่: </span>
                                          <span>{deduction.startDate} - {deduction.endDate}</span>
                                          <span className="text-muted-foreground ml-2">({deduction.days} วัน)</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Calculation Formula */}
                                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                  <p className="text-sm text-muted-foreground mb-2">สูตรการคำนวณ</p>
                                  <p className="font-mono text-sm">
                                    ({person.baseRate} / {payroll.workDays}) x {person.workDays} = {person.actualRate.toLocaleString()} บาท
                                  </p>
                                </div>

                                {/* Bank Info */}
                                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-primary" />
                                    ข้อมูลบัญชีธนาคาร
                                  </p>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">ธนาคาร</p>
                                      <p className="font-medium">{person.bankName}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">เลขบัญชี</p>
                                      <p className="font-medium">{person.bankAccount}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" asChild>
                                  <Link href={`/pts-officer/allowance-list/${person.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    ดูข้อมูลเพิ่มเติม
                                  </Link>
                                </Button>
                                <Button variant="outline" onClick={() => {
                                  setSelectedPerson(person)
                                  setShowEditDialog(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  แก้ไขข้อมูล
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>แสดง {filteredPersons.length} จาก {payrollPersons.length} รายการ</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    ก่อนหน้า
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    ถัดไป
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Person Dialog */}
      {selectedPerson && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลการคำนวณ</DialogTitle>
              <DialogDescription>
                {selectedPerson.name}
              </DialogDescription>
            </DialogHeader>
            <EditPersonForm 
              person={selectedPerson} 
              workDays={payroll.workDays}
              onClose={() => setShowEditDialog(false)}
              onSave={handleEditPerson}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Edit Person Form Component
function EditPersonForm({ 
  person, 
  workDays,
  onClose, 
  onSave 
}: { 
  person: PayrollPerson
  workDays: number
  onClose: () => void
  onSave: (person: PayrollPerson) => void 
}) {
  const [rateGroup, setRateGroup] = useState(person.rateGroup)
  const [baseRate, setBaseRate] = useState(person.baseRate)
  const [actualWorkDays, setActualWorkDays] = useState(person.workDays)
  const [note, setNote] = useState(person.note || "")

  const rateOptions: Record<string, number> = {
    "1": 1000,
    "2": 1500,
    "3": 2000
  }

  const handleRateGroupChange = (value: string) => {
    setRateGroup(value)
    setBaseRate(rateOptions[value] || 1000)
  }

  const calculateActualRate = () => {
    return Math.round((baseRate / workDays) * actualWorkDays)
  }

  const handleSubmit = () => {
    const leaveDays = workDays - actualWorkDays
    const updatedPerson: PayrollPerson = {
      ...person,
      rateGroup,
      baseRate,
      workDays: actualWorkDays,
      leaveDays,
      actualRate: calculateActualRate(),
      note: note || undefined,
    }
    onSave(updatedPerson)
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm text-muted-foreground">บุคลากร</p>
        <p className="font-medium">{person.name}</p>
        <p className="text-sm text-muted-foreground">{person.position}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">กลุ่มอัตราเงิน</label>
        <Select value={rateGroup} onValueChange={handleRateGroupChange}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="1">กลุ่มที่ 1 (1,000 บาท)</SelectItem>
            <SelectItem value="2">กลุ่มที่ 2 (1,500 บาท)</SelectItem>
            <SelectItem value="3">กลุ่มที่ 3 (2,000 บาท)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">วันทำการในเดือน</label>
          <Input value={workDays} disabled className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">วันทำงานจริง</label>
          <Input 
            type="number" 
            value={actualWorkDays} 
            onChange={(e) => setActualWorkDays(parseInt(e.target.value) || 0)}
            min={0}
            max={workDays}
            className="bg-secondary border-border" 
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm text-muted-foreground mb-2">ตัวอย่างการคำนวณ</p>
        <p className="font-mono text-sm">
          ({baseRate} / {workDays}) x {actualWorkDays} = <span className="text-emerald-400 font-bold">{calculateActualRate().toLocaleString()} บาท</span>
        </p>
        {actualWorkDays < workDays && (
          <p className="text-sm text-amber-400 mt-2">
            หักเนื่องจากลา {workDays - actualWorkDays} วัน
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">หมายเหตุ</label>
        <Input 
          value={note} 
          onChange={(e) => setNote(e.target.value)}
          placeholder="ระบุหมายเหตุ (ถ้ามี)" 
          className="bg-secondary border-border" 
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSubmit}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          บันทึกการแก้ไข
        </Button>
      </DialogFooter>
    </div>
  )
}
