"use client"
export const dynamic = 'force-dynamic'

import { use, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  User,
  Award,
  GraduationCap,
  Banknote,
  Phone,
  Mail,
  Download,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit,
  Printer,
} from "lucide-react"
import { useSearchPayouts } from "@/features/payroll/hooks"
import type { PayoutSearchRow } from "@/features/payroll/api"

// TODO: add icons when person detail sections are expanded: Briefcase, Building2, Calendar, FileText

interface PersonDetail {
  id: number
  prefix: string
  firstName: string
  lastName: string
  citizenId: string
  position: string
  positionLevel: string
  department: string
  unit: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  licenseIssueDate: string
  licenseStatus: "active" | "expiring" | "expired"
  education: string
  specialization?: string
  workStartDate: string
  retirementDate: string
  rateGroup: string
  rateGroupName: string
  rateItem: string
  rateItemName: string
  baseRate: number
  currentStatus: "active" | "suspended" | "resigned"
  note?: string
}

interface PaymentHistory {
  id: string
  month: string
  year: string
  workDays: number
  leaveDays: number
  actualRate: number
  status: "paid" | "pending"
  paidDate?: string
  note?: string
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

function formatPeriod(row: PayoutSearchRow) {
  const monthName = thaiMonths[(row.period_month ?? 1) - 1] ?? "-"
  const yearNum = row.period_year ?? 0
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return { month: monthName, year: String(thaiYear) }
}

const licenseStatusConfig = {
  active: { label: "ใช้งานได้", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  expiring: { label: "ใกล้หมดอายุ", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  expired: { label: "หมดอายุ", color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

const currentStatusConfig = {
  active: { label: "ปฏิบัติงาน", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  suspended: { label: "ระงับชั่วคราว", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  resigned: { label: "ลาออก", color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: payoutsData } = useSearchPayouts({ q: id })
  const payouts = useMemo(() => (Array.isArray(payoutsData) ? payoutsData : []), [payoutsData])

  const person = useMemo<PersonDetail>(() => {
    const first = payouts[0]
    if (!first) {
      return {
        id: Number(id),
        prefix: "",
        firstName: "-",
        lastName: "",
        citizenId: id,
        position: "-",
        positionLevel: "-",
        department: "-",
        unit: "-",
        email: "-",
        phone: "-",
        licenseNumber: "-",
        licenseExpiry: "-",
        licenseIssueDate: "-",
        licenseStatus: "active",
        education: "-",
        workStartDate: "-",
        retirementDate: "-",
        rateGroup: "-",
        rateGroupName: "-",
        rateItem: "-",
        rateItemName: "-",
        baseRate: 0,
        currentStatus: "active",
      }
    }
    return {
      id: first.payout_id,
      prefix: "",
      firstName: first.first_name ?? "-",
      lastName: first.last_name ?? "",
      citizenId: first.citizen_id,
      position: first.position_name ?? "-",
      positionLevel: "-",
      department: "-",
      unit: "-",
      email: "-",
      phone: "-",
      licenseNumber: "-",
      licenseExpiry: "-",
      licenseIssueDate: "-",
      licenseStatus: "active",
      education: "-",
      workStartDate: "-",
      retirementDate: "-",
      rateGroup: "-",
      rateGroupName: "-",
      rateItem: "-",
      rateItemName: "-",
      baseRate: first.pts_rate_snapshot ?? 0,
      currentStatus: "active",
    }
  }, [id, payouts])
  const licenseStatus = licenseStatusConfig[person.licenseStatus]
  const currentStatus = currentStatusConfig[person.currentStatus]

  const paymentHistory: PaymentHistory[] = payouts.map((row) => {
    const period = formatPeriod(row)
    return {
      id: String(row.period_id),
      month: period.month,
      year: period.year,
      workDays: 0,
      leaveDays: 0,
      actualRate: row.total_payable ?? 0,
      status: "paid",
      note: row.retroactive_amount ? `ปรับย้อนหลัง ${row.retroactive_amount}` : undefined,
    }
  })

  const totalPaid = paymentHistory
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.actualRate, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pts-officer/allowance-list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {person.prefix}{person.firstName} {person.lastName}
              </h1>
              <Badge variant="outline" className={currentStatus.color}>
                {currentStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{person.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            ส่งออก
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Edit className="mr-2 h-4 w-4" />
            แก้ไขข้อมูล
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                ข้อมูลส่วนตัว
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                  <p className="font-medium">{person.prefix}{person.firstName} {person.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">เลขประจำตัวประชาชน</p>
                  <p className="font-medium">{person.citizenId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                  <p className="font-medium">{person.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ระดับ</p>
                  <p className="font-medium">{person.positionLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สังกัด</p>
                  <p className="font-medium">{person.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หน่วยงาน</p>
                  <p className="font-medium">{person.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">อีเมล</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {person.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">โทรศัพท์</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {person.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Info */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  ข้อมูลใบอนุญาตประกอบวิชาชีพ
                </CardTitle>
                <Badge variant="outline" className={licenseStatus.color}>
                  {licenseStatus.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">เลขที่ใบอนุญาต</p>
                  <p className="font-medium">{person.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันที่ออกใบอนุญาต</p>
                  <p className="font-medium">{person.licenseIssueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันหมดอายุ</p>
                  <p className="font-medium">{person.licenseExpiry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันเกษียณอายุ</p>
                  <p className="font-medium">{person.retirementDate}</p>
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
                  <p className="font-medium">{person.education}</p>
                </div>
                {person.specialization && (
                  <div>
                    <p className="text-sm text-muted-foreground">ความเชี่ยวชาญเฉพาะทาง</p>
                    <p className="font-medium">{person.specialization}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">วันเริ่มปฏิบัติงาน</p>
                  <p className="font-medium">{person.workStartDate}</p>
                </div>
                {person.note && (
                  <div>
                    <p className="text-sm text-muted-foreground">หมายเหตุ</p>
                    <p className="font-medium text-primary">{person.note}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  ประวัติการรับเงิน พ.ต.ส.
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground">เดือน</TableHead>
                      <TableHead className="text-muted-foreground text-center">วันทำงาน</TableHead>
                      <TableHead className="text-muted-foreground text-center">วันลา</TableHead>
                      <TableHead className="text-muted-foreground text-right">จำนวนเงิน</TableHead>
                      <TableHead className="text-muted-foreground text-center">สถานะ</TableHead>
                      <TableHead className="text-muted-foreground">หมายเหตุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-secondary/30">
                        <TableCell className="font-medium">{payment.month} {payment.year}</TableCell>
                        <TableCell className="text-center">{payment.workDays}</TableCell>
                        <TableCell className="text-center">
                          {payment.leaveDays > 0 ? (
                            <span className="text-amber-400">{payment.leaveDays}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">
                          {payment.actualRate.toLocaleString()} บาท
                        </TableCell>
                        <TableCell className="text-center">
                          {payment.status === "paid" ? (
                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              จ่ายแล้ว
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Clock className="mr-1 h-3 w-3" />
                              รอจ่าย
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.note || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rate Info Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                อัตราเงิน พ.ต.ส.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">กลุ่มที่ {person.rateGroup}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    ข้อ {person.rateItem}
                  </Badge>
                </div>
                <p className="font-medium text-sm mb-2">{person.rateGroupName}</p>
                <p className="text-xs text-muted-foreground">{person.rateItemName}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-muted-foreground mb-1">อัตราเงินเพิ่ม</p>
                <p className="text-3xl font-bold text-emerald-400">{person.baseRate.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">บาท/เดือน</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">สรุปการรับเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ปี 2568</span>
                <span className="font-semibold">{paymentHistory.length} เดือน</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">จ่ายแล้ว</span>
                <span className="font-semibold text-emerald-400">
                  {paymentHistory.filter((p) => p.status === "paid").length} เดือน
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">รอจ่าย</span>
                <span className="font-semibold text-amber-400">
                  {paymentHistory.filter((p) => p.status === "pending").length} เดือน
                </span>
              </div>
              <Separator />
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">ยอดรวมที่จ่ายแล้ว</p>
                <p className="text-2xl font-bold text-primary">{totalPaid.toLocaleString()} บาท</p>
              </div>
            </CardContent>
          </Card>

          {/* Alert Card */}
          {person.licenseStatus === "expiring" && (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-400">ใบอนุญาตใกล้หมดอายุ</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ใบอนุญาตจะหมดอายุในวันที่ {person.licenseExpiry} กรุณาติดต่อเพื่อต่ออายุ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
