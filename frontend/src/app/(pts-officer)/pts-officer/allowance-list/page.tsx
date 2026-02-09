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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Download,
  Filter,
  Users,
  Banknote,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { usePeriodPayouts, usePeriods } from "@/features/payroll/hooks"
import type { PayPeriod, PeriodPayoutRow } from "@/features/payroll/api"

interface AllowancePerson {
  id: number
  prefix: string
  firstName: string
  lastName: string
  position: string
  licenseExpiry: string
  rateGroup: string
  rateItem: string
  baseRate: number
  actualRate: number
  note?: string
}

function mapPayout(row: PeriodPayoutRow): AllowancePerson {
  const rateValue = Number(row.rate ?? 0)
  const rateGroup = rateValue >= 2000 ? "3" : rateValue >= 1500 ? "2" : "1"
  return {
    id: row.payout_id,
    prefix: "",
    firstName: row.first_name ?? "-",
    lastName: row.last_name ?? "",
    position: row.position_name ?? "-",
    licenseExpiry: "-",
    rateGroup,
    rateItem: "-",
    baseRate: rateValue,
    actualRate: Number(row.total_payable ?? 0),
    note: row.remark ?? undefined,
  }
}

function getLatestPeriodId(periods: PayPeriod[]): number | null {
  if (periods.length === 0) return null
  const sorted = [...periods].sort((a, b) => {
    const yearDiff = (b.period_year ?? 0) - (a.period_year ?? 0)
    if (yearDiff !== 0) return yearDiff
    return (b.period_month ?? 0) - (a.period_month ?? 0)
  })
  return sorted[0].period_id
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

function formatPeriodLabel(period: PayPeriod | null): string {
  if (!period) return "-"
  const monthName = thaiMonths[(period.period_month ?? 1) - 1] ?? "-"
  const yearNum = period.period_year ?? 0
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return `${monthName} ${thaiYear}`
}

export default function AllowanceListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [rateGroupFilter, setRateGroupFilter] = useState<string>("all")
  const [selectedPerson, setSelectedPerson] = useState<AllowancePerson | null>(null)
  void selectedPerson

  const { data: periodsData } = usePeriods()
  const latestPeriod = useMemo(() => {
    if (!Array.isArray(periodsData) || periodsData.length === 0) return null
    const sorted = [...periodsData].sort((a, b) => {
      const yearDiff = (b.period_year ?? 0) - (a.period_year ?? 0)
      if (yearDiff !== 0) return yearDiff
      return (b.period_month ?? 0) - (a.period_month ?? 0)
    })
    return sorted[0]
  }, [periodsData])
  const latestPeriodId = useMemo(
    () => (Array.isArray(periodsData) ? getLatestPeriodId(periodsData) : null),
    [periodsData],
  )
  const { data: payoutsData } = usePeriodPayouts(latestPeriodId ?? undefined)

  const allowanceList = useMemo(() => {
    if (!Array.isArray(payoutsData)) return []
    return payoutsData.map((row) => mapPayout(row))
  }, [payoutsData])

  const filteredList = allowanceList.filter((person) => {
    const fullName = `${person.prefix} ${person.firstName} ${person.lastName}`
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRateGroup = rateGroupFilter === "all" || person.rateGroup === rateGroupFilter
    return matchesSearch && matchesRateGroup
  })

  const totalAmount = filteredList.reduce((sum, person) => sum + person.actualRate, 0)
  const group1Count = filteredList.filter((p) => p.rateGroup === "1").length
  const group2Count = filteredList.filter((p) => p.rateGroup === "2").length
  const group3Count = filteredList.filter((p) => p.rateGroup === "3").length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            บัญชีรายชื่อผู้มีสิทธิ์ได้รับเงิน พ.ต.ส.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ตำแหน่งพยาบาลวิชาชีพ ประจำเดือน {formatPeriodLabel(latestPeriod)}
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          ส่งออก Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รวมทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground">{filteredList.length} คน</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">กลุ่ม 1 (1,000 บาท)</p>
                <p className="text-2xl font-bold text-primary">{group1Count} คน</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">กลุ่ม 2 (1,500 บาท)</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{group2Count} คน</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--warning))]/10 text-xs font-bold text-[hsl(var(--warning))]">
                2
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">กลุ่ม 3 (2,000 บาท)</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{group3Count} คน</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--success))]/10 text-xs font-bold text-[hsl(var(--success))]">
                3
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวม/เดือน</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">
                  {totalAmount.toLocaleString()}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-[hsl(var(--success))]/50" />
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
                placeholder="ค้นหาชื่อ-สกุล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select value={rateGroupFilter} onValueChange={setRateGroupFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="กลุ่มตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกกลุ่ม</SelectItem>
                <SelectItem value="1">กลุ่มที่ 1 (1,000 บาท)</SelectItem>
                <SelectItem value="2">กลุ่มที่ 2 (1,500 บาท)</SelectItem>
                <SelectItem value="3">กลุ่มที่ 3 (2,000 บาท)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Allowance List Table */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="h-5 w-5" />
            บัญชีรายชื่อข้าราชการที่มีสิทธิ์ได้รับเงินเพิ่ม พ.ต.ส.
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            ประกาศ ก.พ. เรื่อง กำหนดตำแหน่งและเงินเพิ่มฯ (ฉบับที่ 3) พ.ศ. 2560 | ส.ค.-68
          </span>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="font-semibold w-[60px] text-center">ลำดับ</TableHead>
                  <TableHead className="font-semibold w-[80px]">คำนำหน้า</TableHead>
                  <TableHead className="font-semibold">ชื่อ</TableHead>
                  <TableHead className="font-semibold">สกุล</TableHead>
                  <TableHead className="font-semibold">ตำแหน่ง</TableHead>
                  <TableHead className="font-semibold text-center">วันหมดอายุ</TableHead>
                  <TableHead className="font-semibold text-center">กลุ่ม</TableHead>
                  <TableHead className="font-semibold text-center">ข้อ</TableHead>
                  <TableHead className="font-semibold text-right">อัตรา (บาท/เดือน)</TableHead>
                  <TableHead className="font-semibold text-right">ที่ได้รับ (บาท)</TableHead>
                  <TableHead className="font-semibold text-center w-[80px]">หมายเหตุ</TableHead>
                  <TableHead className="font-semibold text-center w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((person, index) => (
                  <TableRow key={person.id} className="hover:bg-secondary/20">
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell>{person.prefix}</TableCell>
                    <TableCell className="font-medium">{person.firstName}</TableCell>
                    <TableCell>{person.lastName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {person.position}
                    </TableCell>
                    <TableCell className="text-center text-sm">{person.licenseExpiry}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          person.rateGroup === "1"
                            ? "bg-primary/10 text-primary"
                            : person.rateGroup === "2"
                              ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
                              : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                        }`}
                      >
                        {person.rateGroup}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{person.rateItem}</TableCell>
                    <TableCell className="text-right font-medium">
                      {person.baseRate.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[hsl(var(--success))]">
                      {person.actualRate.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {person.note ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedPerson(person)}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                หมายเหตุ - {person.prefix} {person.firstName} {person.lastName}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground">{person.note}</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/pts-officer/allowance-list/${person.id}`}>
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredList.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              ไม่พบรายการที่ค้นหา
            </div>
          )}

          {/* Summary Footer */}
          <div className="mt-4 flex justify-end">
            <div className="w-96 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-sm font-semibold text-foreground mb-3">สรุปยอด</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">กลุ่ม 1 (1,000 บาท)</span>
                  <span>
                    {group1Count} คน = {(group1Count * 1000).toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">กลุ่ม 2 (1,500 บาท)</span>
                  <span>
                    {group2Count} คน = {(group2Count * 1500).toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">กลุ่ม 3 (2,000 บาท)</span>
                  <span>
                    {group3Count} คน = {(group3Count * 2000).toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>รวมทั้งสิ้น</span>
                  <span className="text-[hsl(var(--success))]">
                    {filteredList.length} คน = {totalAmount.toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6 bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
              <span className="text-muted-foreground">
                กลุ่มที่ 1: ข้าราชการระดับปฏิบัติการ/ชำนาญการ ที่ยังไม่ผ่านการอบรมเฉพาะทาง
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
              <span className="text-muted-foreground">
                กลุ่มที่ 2: ข้าราชการที่ผ่านการอบรมหลักสูตรพื้นฐาน
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--success))]" />
              <span className="text-muted-foreground">
                กลุ่มที่ 3: ข้าราชการที่ผ่านการอบรมหลักสูตรเฉพาะทางที่สภาการพยาบาลรับรอง
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
