"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Users,
  Banknote,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import {
  useApproveByHR,
  useDownloadPeriodReport,
  usePeriodDetail,
  usePeriodPayouts,
  useRejectPeriod,
} from "@/features/payroll/hooks"
import type { PeriodPayoutRow, PeriodDetail } from "@/features/payroll/api"

type PeriodStatus = "OPEN" | "WAITING_HR" | "WAITING_HEAD_FINANCE" | "WAITING_DIRECTOR" | "CLOSED"

const professionCards = [
  {
    code: "NURSE",
    label: "พยาบาลวิชาชีพ",
    description: "ผู้ประกอบวิชาชีพการพยาบาลและการผดุงครรภ์",
    rates: [1000, 1500, 2000],
  },
  {
    code: "PHYSICIAN",
    label: "แพทย์",
    description: "แพทย์/ผู้อำนวยการโรงพยาบาล",
    rates: [5000, 10000, 15000],
  },
  {
    code: "MED_TECH",
    label: "นักเทคนิคการแพทย์",
    description: "ผู้ประกอบวิชาชีพเทคนิคการแพทย์",
    rates: [1000],
  },
  {
    code: "PHYSICAL_THERAPY",
    label: "นักกายภาพบำบัด",
    description: "ผู้ประกอบวิชาชีพกายภาพบำบัด",
    rates: [1000],
  },
  {
    code: "OCCUPATIONAL_THERAPY",
    label: "นักกิจกรรมบำบัด",
    description: "ผู้ประกอบวิชาชีพกิจกรรมบำบัด",
    rates: [1000],
  },
  {
    code: "RADIOLOGIST",
    label: "นักรังสีการแพทย์",
    description: "ผู้ประกอบวิชาชีพรังสีการแพทย์",
    rates: [1000],
  },
  {
    code: "PHARMACIST",
    label: "เภสัชกร",
    description: "ผู้ประกอบวิชาชีพเภสัชกรรม",
    rates: [1500, 3000],
  },
  {
    code: "DENTIST",
    label: "ทันตแพทย์",
    description: "ผู้ประกอบวิชาชีพทันตกรรม",
    rates: [5000, 7500, 10000],
  },
  {
    code: "CLINICAL_PSYCHOLOGIST",
    label: "นักจิตวิทยาคลินิก",
    description: "ผู้ประกอบวิชาชีพจิตวิทยาคลินิก",
    rates: [1000],
  },
  {
    code: "CARDIO_THORACIC_TECH",
    label: "นักเทคโนโลยีหัวใจและทรวงอก",
    description: "ผู้ประกอบวิชาชีพเทคโนโลยีหัวใจและทรวงอก",
    rates: [1000],
  },
]

const professionGroups: Record<string, { group: number; rate: number }[]> = {
  PHYSICIAN: [
    { group: 1, rate: 5000 },
    { group: 2, rate: 10000 },
    { group: 3, rate: 15000 },
  ],
  DENTIST: [
    { group: 1, rate: 5000 },
    { group: 2, rate: 7500 },
    { group: 3, rate: 10000 },
  ],
  PHARMACIST: [
    { group: 1, rate: 1500 },
    { group: 2, rate: 3000 },
  ],
  NURSE: [
    { group: 1, rate: 1000 },
    { group: 2, rate: 1500 },
    { group: 3, rate: 2000 },
  ],
  MED_TECH: [{ group: 5, rate: 1000 }],
  RADIOLOGIST: [{ group: 5, rate: 1000 }],
  PHYSICAL_THERAPY: [{ group: 5, rate: 1000 }],
  OCCUPATIONAL_THERAPY: [{ group: 5, rate: 1000 }],
  CLINICAL_PSYCHOLOGIST: [{ group: 5, rate: 1000 }],
  CARDIO_THORACIC_TECH: [{ group: 5, rate: 1000 }],
}

type PayrollRow = {
  id: number
  citizenId: string
  name: string
  position: string
  department: string
  professionCode: string
  rateGroup: string
  baseRate: number
  workDays: number
  leaveDays: number
  actualRate: number
  note?: string
}

type PayrollDetailContentProps = {
  periodId: string
  selectedProfession: string
  basePath: string
  compactView?: boolean
  showTable?: boolean
  showSummary?: boolean
  showSelector?: boolean
  backHref?: string
}

const professionKeywordMap: Record<string, string[]> = {
  PHYSICIAN: ["แพทย์", "นายแพทย์", "ผอ.รพ.", "ผู้อำนวยการ"],
  DENTIST: ["ทันตแพทย์", "ทันต"],
  PHARMACIST: ["เภสัชกร", "เภสัช"],
  NURSE: ["พยาบาล"],
  MED_TECH: ["เทคนิคการแพทย์"],
  RADIOLOGIST: ["รังสีการแพทย์", "รังสี"],
  PHYSICAL_THERAPY: ["กายภาพบำบัด"],
  OCCUPATIONAL_THERAPY: ["กิจกรรมบำบัด"],
  CLINICAL_PSYCHOLOGIST: ["จิตวิทยาคลินิก", "จิตวิทยา"],
  CARDIO_THORACIC_TECH: ["หัวใจและทรวงอก", "เทคโนโลยีหัวใจ"],
}

const formatPeriodLabel = (month?: number | null, year?: number | null) => {
  if (!month || !year) return "-"
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" })
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}

const statusConfig: Record<PeriodStatus, { label: string; color: string }> = {
  OPEN: { label: "เปิดรอบ", color: "bg-muted/30 text-muted-foreground border-muted-foreground/30" },
  WAITING_HR: { label: "รอ HR อนุมัติ", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  WAITING_HEAD_FINANCE: { label: "รอหัวหน้าการเงิน", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  WAITING_DIRECTOR: { label: "รอผู้อำนวยการ", color: "bg-primary/20 text-primary border-primary/30" },
  CLOSED: { label: "ปิดงวดแล้ว", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
}

export function PayrollDetailContent({
  periodId,
  selectedProfession,
  basePath,
  compactView = false,
  showTable = true,
  showSummary = true,
  showSelector = true,
  backHref = "/head-hr/payroll",
}: PayrollDetailContentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [rateFilter, setRateFilter] = useState("all")
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")

  const periodDetailQuery = usePeriodDetail(periodId)
  const payoutsQuery = usePeriodPayouts(periodId)
  const approveByHR = useApproveByHR()
  const rejectPeriod = useRejectPeriod()
  const downloadReport = useDownloadPeriodReport()

  const periodDetail = periodDetailQuery.data as PeriodDetail | undefined
  const period = periodDetail?.period
  const statusInfo = statusConfig[(period?.status as PeriodStatus) ?? "OPEN"]

  const itemByCitizenId = useMemo(() => {
    const map = new Map<string, PeriodDetail["items"][number]>()
    periodDetail?.items?.forEach((item) => {
      const citizenId = item.citizen_id ?? ""
      if (citizenId) map.set(citizenId, item)
    })
    return map
  }, [periodDetail?.items])

  const enrichedPayouts = useMemo(() => {
    const rows = (payoutsQuery.data ?? []) as PeriodPayoutRow[]
    return rows.map((row) => {
      const citizenId = row.citizen_id ?? ""
      const item = citizenId ? itemByCitizenId.get(citizenId) : undefined
      const firstName = row.first_name ?? item?.first_name ?? ""
      const lastName = row.last_name ?? item?.last_name ?? ""
      const positionName = row.position_name ?? item?.position_name ?? "-"
      const department = item?.current_department ?? "-"
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "-"

      let professionCode = "UNKNOWN"
      for (const [code, keywords] of Object.entries(professionKeywordMap)) {
        if (keywords.some((keyword) => positionName.includes(keyword))) {
          professionCode = code
          break
        }
      }

      const baseRate = Number(row.rate ?? 0)
      const rateGroup =
        professionGroups[professionCode]?.find((group) => group.rate === baseRate)?.group?.toString() ?? "-"

      return {
        id: row.payout_id,
        citizenId,
        name: fullName,
        position: positionName,
        department,
        professionCode,
        rateGroup,
        baseRate,
        workDays: Number(row.eligible_days ?? 0),
        leaveDays: Number(row.deducted_days ?? 0),
        actualRate: Number(row.total_payable ?? 0),
        note: row.remark ?? undefined,
      } satisfies PayrollRow
    })
  }, [payoutsQuery.data, itemByCitizenId])

  const professionTotals = useMemo(() => {
    const totals = new Map<string, number>()
    professionCards.forEach((card) => totals.set(card.code, 0))
    enrichedPayouts.forEach((row) => {
      if (!totals.has(row.professionCode)) totals.set(row.professionCode, 0)
      totals.set(row.professionCode, (totals.get(row.professionCode) ?? 0) + row.actualRate)
    })
    return totals
  }, [enrichedPayouts])

  const filteredPersons = useMemo(() => {
    return enrichedPayouts.filter((person) => {
      const matchesSearch =
        person.name.includes(searchQuery) || person.department.includes(searchQuery)
      const matchesRate = rateFilter === "all" || person.rateGroup === rateFilter
      const matchesProfession = selectedProfession === "all" || person.professionCode === selectedProfession
      return matchesSearch && matchesRate && matchesProfession
    })
  }, [enrichedPayouts, rateFilter, searchQuery, selectedProfession])

  const handleAction = async () => {
    if (!actionType) return
    const trimmed = comment.trim()
    if (actionType === "reject" && !trimmed) {
      toast.error("กรุณาระบุเหตุผลก่อนปฏิเสธ")
      return
    }
    try {
      if (actionType === "approve") {
        await approveByHR.mutateAsync(periodId)
        toast.success("อนุมัติรอบจ่ายเงินแล้ว")
      } else {
        await rejectPeriod.mutateAsync({ periodId, payload: { reason: trimmed } })
        toast.success("ปฏิเสธรอบจ่ายเงินแล้ว")
      }
      periodDetailQuery.refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
      toast.error(message)
    } finally {
      setActionType(null)
      setComment("")
    }
  }

  const handleSelectProfession = (code: string) => {
    setSearchQuery("")
    setRateFilter("all")
    if (code === "all") {
      router.push(basePath)
      return
    }
    router.push(`${basePath}/profession/${code}`)
  }

  if (periodDetailQuery.isLoading || payoutsQuery.isLoading) {
    return (
      <div className="p-8">
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            กำลังโหลดข้อมูลรอบจ่ายเงิน...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (periodDetailQuery.isError || payoutsQuery.isError) {
    return (
      <div className="p-8">
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-destructive">
            โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                รอบจ่ายเงิน {formatPeriodLabel(period?.period_month ?? null, period?.period_year ?? null)}
              </h1>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ส่งโดย {period?.created_by_name ?? "-"} เมื่อ {formatDate(period?.created_at ?? null)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            ส่งออก Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const blob = await downloadReport.mutateAsync(periodId)
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.href = url
              link.download = `payroll_${periodId}.pdf`
              link.click()
              window.URL.revokeObjectURL(url)
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            ส่งออก PDF
          </Button>
          {period?.status === "WAITING_HR" && (
            <>
              <Button
                onClick={() => setActionType("approve")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                อนุมัติรอบจ่าย
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActionType("reject")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                ปฏิเสธ
              </Button>
            </>
          )}
        </div>
      </div>

      {!compactView && (
        <>
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
                    <p className="text-2xl font-bold">{Number(period?.total_headcount ?? 0)} คน</p>
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
                    <p className="text-2xl font-bold text-emerald-400">
                      {Number(period?.total_amount ?? 0).toLocaleString()} บาท
                    </p>
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
                    <p className="text-2xl font-bold">-</p>
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
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      )}

      {showSelector && (
        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">เลือกวิชาชีพก่อนดูตาราง</CardTitle>
            <p className="text-sm text-muted-foreground">
              เลือกวิชาชีพที่ต้องการเพื่อกรองรายการผู้รับเงินในรอบนี้
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {professionCards.map((profession) => {
                const isActive = selectedProfession === profession.code
                return (
                  <button
                    key={profession.code}
                    type="button"
                    onClick={() => handleSelectProfession(profession.code)}
                    className={`group w-full text-left rounded-xl border bg-background/80 p-4 transition-all hover:border-primary/40 hover:shadow-md ${
                      isActive ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{profession.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">รหัส: {profession.code}</p>
                      </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {Number(professionTotals.get(profession.code) ?? 0).toLocaleString()} บาท
                    </Badge>
                  </div>
                    <p className="mt-3 text-sm text-muted-foreground">{profession.description}</p>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">อัตราเงินที่ได้รับ:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profession.rates.length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          profession.rates.map((rate) => (
                            <span
                              key={`${profession.code}-${rate}`}
                              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            >
                              {rate.toLocaleString()} บาท
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedProfession !== "all" && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3 text-sm">
                <div className="text-muted-foreground">
                  กำลังกรอง:{" "}
                  <span className="font-medium text-foreground">
                    {professionCards.find((p) => p.code === selectedProfession)?.label ?? selectedProfession}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectProfession("all")}
                >
                  ล้างตัวกรอง
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showSummary && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">สรุปตามอัตราเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(selectedProfession === "all"
                ? Array.from(
                    new Map(
                      filteredPersons
                        .filter((row) => row.baseRate > 0)
                        .map((row) => [row.baseRate, row.baseRate]),
                    ).values(),
                  ).sort((a, b) => a - b)
                : (professionGroups[selectedProfession] ?? []).map(({ rate }) => rate)
              ).map((rate) => {
                const count = filteredPersons.filter((person) => person.baseRate === rate).length
                const amount = filteredPersons
                  .filter((person) => person.baseRate === rate)
                  .reduce((total, person) => total + person.actualRate, 0)
                const groupLabel =
                  selectedProfession === "all"
                    ? "อัตรา"
                    : `กลุ่มที่ ${
                        professionGroups[selectedProfession]?.find((group) => group.rate === rate)?.group ?? "-"
                      }`
                return (
                  <div key={`${selectedProfession}-${rate}`} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{groupLabel}</span>
                      <Badge variant="outline">{rate.toLocaleString()} บาท</Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">{count} คน</span>
                      <span className="text-emerald-400 font-semibold">{amount.toLocaleString()} บาท</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showTable && (
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
                    <TableHead className="text-muted-foreground">ตำแหน่ง</TableHead>
                    <TableHead className="text-muted-foreground">แผนก</TableHead>
                    <TableHead className="text-muted-foreground text-center">กลุ่ม</TableHead>
                    <TableHead className="text-muted-foreground text-right">อัตรา (บาท)</TableHead>
                    <TableHead className="text-muted-foreground text-center">วันทำงาน</TableHead>
                    <TableHead className="text-muted-foreground text-center">ลา</TableHead>
                    <TableHead className="text-muted-foreground text-right">รับจริง (บาท)</TableHead>
                    <TableHead className="text-muted-foreground">หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredPersons.map((person, index) => (
                  <TableRow key={person.id} className="hover:bg-secondary/30">
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-sm">{person.position}</TableCell>
                    <TableCell className="text-sm">{person.department}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-secondary">
                        {person.rateGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{person.baseRate.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{person.workDays || "-"}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>แสดง {filteredPersons.length} จาก {enrichedPayouts.length} รายการ</span>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => {
        setActionType(null)
        setComment("")
      }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "อนุมัติรอบจ่ายเงิน"}
              {actionType === "reject" && "ปฏิเสธรอบจ่ายเงิน"}
            </DialogTitle>
            <DialogDescription>
              รอบจ่ายเงิน {formatPeriodLabel(period?.period_month ?? null, period?.period_year ?? null)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">จำนวนรายการ:</span>
                  <p className="font-medium">{Number(period?.total_headcount ?? 0)} คน</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ยอดรวม:</span>
                  <p className="font-medium">{Number(period?.total_amount ?? 0).toLocaleString()} บาท</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                {actionType === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผลที่ปฏิเสธ"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    : "ระบุเหตุผลที่ปฏิเสธรอบจ่ายนี้"
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2 bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null)
                setComment("")
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAction}
              className={
                actionType === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
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
