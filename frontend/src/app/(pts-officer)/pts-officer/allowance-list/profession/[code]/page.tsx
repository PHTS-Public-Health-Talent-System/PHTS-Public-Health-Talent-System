"use client"
export const dynamic = 'force-dynamic'

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Filter,
  FileSpreadsheet,
  Eye,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useEligibilityList } from "@/features/request/hooks"
import { getRateGroupBadgeClass, mapEligibility } from "../../utils"

export default function AllowanceListByProfessionPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [rateGroupFilter, setRateGroupFilter] = useState<string>("all")

  const { data: eligibilityData } = useEligibilityList(true)

  const allowanceList = useMemo(() => {
    if (!Array.isArray(eligibilityData)) return []
    return eligibilityData.map((row) => mapEligibility(row))
  }, [eligibilityData])

  const professionSummaries = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number; amount: number }>()
    allowanceList.forEach((person) => {
      const current = grouped.get(person.professionCode) ?? {
        label: person.professionLabel,
        count: 0,
        amount: 0,
      }
      current.count += 1
      current.amount += person.actualRate
      grouped.set(person.professionCode, current)
    })

    return Array.from(grouped.entries())
      .map(([professionCode, value]) => ({
        code: professionCode,
        label: value.label,
        count: value.count,
        amount: value.amount,
      }))
      .sort((a, b) => b.count - a.count)
  }, [allowanceList])

  const normalizedCode = code === "all" ? "all" : code.toUpperCase()

  const selectedProfessionLabel = useMemo(() => {
    if (normalizedCode === "all") return "ทุกวิชาชีพ"
    return professionSummaries.find((item) => item.code === normalizedCode)?.label ?? normalizedCode
  }, [normalizedCode, professionSummaries])

  const filteredList = useMemo(() => {
    return allowanceList.filter((person) => {
      const fullName = `${person.prefix} ${person.firstName} ${person.lastName}`.trim()
      const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRateGroup = rateGroupFilter === "all" || person.rateGroup === rateGroupFilter
      const matchesProfession = normalizedCode === "all" || person.professionCode === normalizedCode
      return matchesSearch && matchesRateGroup && matchesProfession
    })
  }, [allowanceList, normalizedCode, rateGroupFilter, searchQuery])

  const rateGroupOptions = useMemo(() => {
    return Array.from(new Set(filteredList.map((person) => person.rateGroup)))
      .filter((value) => value && value !== "-")
      .sort((a, b) => Number(a) - Number(b))
  }, [filteredList])

  const totalAmount = filteredList.reduce((sum, person) => sum + person.actualRate, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Link href="/pts-officer/allowance-list" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            กลับหน้าเลือกวิชาชีพ
          </Link>
          <h1 className="text-2xl font-bold text-foreground">รายชื่อผู้มีสิทธิ์: {selectedProfessionLabel}</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              value={normalizedCode}
              onValueChange={(value) => {
                router.push(`/pts-officer/allowance-list/profession/${value}`)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกวิชาชีพ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกวิชาชีพ</SelectItem>
                {professionSummaries.map((profession) => (
                  <SelectItem key={profession.code} value={profession.code}>
                    {profession.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ-สกุล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <Select value={rateGroupFilter} onValueChange={setRateGroupFilter}>
              <SelectTrigger className="md:col-start-1">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="กลุ่มอัตรา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกกลุ่ม</SelectItem>
                {rateGroupOptions.map((group) => (
                  <SelectItem key={group} value={group}>
                    กลุ่มที่ {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="h-5 w-5" />
            ตารางรายชื่อผู้มีสิทธิ์
          </CardTitle>
          <span className="text-sm text-muted-foreground">{filteredList.length} คน</span>
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
                  <TableHead className="font-semibold">วิชาชีพ</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary">{person.professionLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{person.position}</TableCell>
                    <TableCell className="text-center text-sm">{person.licenseExpiry}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${getRateGroupBadgeClass(person.rateGroup)}`}
                      >
                        {person.rateGroup}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{person.rateItem}</TableCell>
                    <TableCell className="text-right font-medium">{person.baseRate.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-[hsl(var(--success))]">
                      {person.actualRate.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {person.note ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                        <Link href={`/pts-officer/allowance-list/${person.id}?profession=${normalizedCode}`}>
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
            <div className="py-12 text-center text-muted-foreground">ไม่พบรายการที่ค้นหา</div>
          )}

          <div className="mt-4 flex justify-end">
            <div className="w-96 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-sm font-semibold text-foreground mb-3">สรุปยอด</div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>รวมทั้งสิ้น</span>
                <span className="text-[hsl(var(--success))]">
                  {filteredList.length} คน = {totalAmount.toLocaleString()} บาท
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
