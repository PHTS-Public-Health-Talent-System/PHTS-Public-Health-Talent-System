"use client"
export const dynamic = 'force-dynamic'


import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Users,
  DollarSign,
  BarChart3,
  Building2,
} from "lucide-react"
import { YearPicker } from "@/components/month-year-picker"
import { useFinanceYearlySummary } from "@/features/finance/hooks"

type YearlyMonthlyRow = {
  month: string
  amount: number
  payouts: number
  avgAmount: number
}

type YearlyProfessionRow = {
  profession: string
  amount: number
  payouts: number
  percentage: number
}

type YearlyDepartmentRow = {
  department: string
  amount: number
  payouts: number
  percentage: number
}

type YearComparisonRow = {
  year: number
  amount: number
  payouts: number
}

type YearlySummaryData = {
  year: number
  totalAmount: number
  totalPayouts: number
  totalEmployees: number
  growthRate: number
  monthlyBreakdown: YearlyMonthlyRow[]
  byProfession: YearlyProfessionRow[]
  byDepartment: YearlyDepartmentRow[]
  yearComparison: YearComparisonRow[]
}

type YearlySummaryApi = {
  year?: number
  total_amount?: number | string
  total_payouts?: number | string
  total_employees?: number | string
  growth_rate?: number | string
  monthly_breakdown?: YearlyMonthlyRow[]
  by_profession?: YearlyProfessionRow[]
  by_department?: YearlyDepartmentRow[]
  year_comparison?: YearComparisonRow[]
}

// Fallback data
const defaultYearlyData: YearlySummaryData = {
  year: 2568,
  totalAmount: 18500000,
  totalPayouts: 1856,
  totalEmployees: 165,
  growthRate: 8.2,
  
  monthlyBreakdown: [
    { month: "มกราคม", amount: 1850000, payouts: 142, avgAmount: 13028 },
    { month: "กุมภาพันธ์", amount: 1920000, payouts: 148, avgAmount: 12973 },
    { month: "มีนาคม", amount: 2100000, payouts: 155, avgAmount: 13548 },
    { month: "เมษายน", amount: 1780000, payouts: 138, avgAmount: 12899 },
    { month: "พฤษภาคม", amount: 2050000, payouts: 152, avgAmount: 13487 },
    { month: "มิถุนายน", amount: 2200000, payouts: 160, avgAmount: 13750 },
    { month: "กรกฎาคม", amount: 2350000, payouts: 165, avgAmount: 14242 },
    { month: "สิงหาคม", amount: 2450000, payouts: 156, avgAmount: 15705 },
    { month: "กันยายน", amount: 1800000, payouts: 140, avgAmount: 12857 },
    { month: "ตุลาคม", amount: 0, payouts: 0, avgAmount: 0 },
    { month: "พฤศจิกายน", amount: 0, payouts: 0, avgAmount: 0 },
    { month: "ธันวาคม", amount: 0, payouts: 0, avgAmount: 0 },
  ],
  
  byProfession: [
    { profession: "พยาบาลวิชาชีพ", amount: 7500000, payouts: 750, percentage: 40.5 },
    { profession: "แพทย์", amount: 4200000, payouts: 350, percentage: 22.7 },
    { profession: "เภสัชกร", amount: 2100000, payouts: 210, percentage: 11.4 },
    { profession: "นักเทคนิคการแพทย์", amount: 1800000, payouts: 180, percentage: 9.7 },
    { profession: "นักกายภาพบำบัด", amount: 1500000, payouts: 150, percentage: 8.1 },
    { profession: "รังสีเทคนิค", amount: 1400000, payouts: 216, percentage: 7.6 },
  ],
  
  byDepartment: [
    { department: "อายุรกรรม", amount: 3200000, payouts: 280, percentage: 17.3 },
    { department: "ศัลยกรรม", amount: 2800000, payouts: 245, percentage: 15.1 },
    { department: "กุมารเวชกรรม", amount: 2400000, payouts: 210, percentage: 13.0 },
    { department: "สูติ-นรีเวช", amount: 2200000, payouts: 195, percentage: 11.9 },
    { department: "ห้องผ่าตัด", amount: 1900000, payouts: 165, percentage: 10.3 },
    { department: "ฉุกเฉิน", amount: 1800000, payouts: 160, percentage: 9.7 },
    { department: "อื่นๆ", amount: 4200000, payouts: 601, percentage: 22.7 },
  ],
  
  yearComparison: [
    { year: 2565, amount: 14200000, payouts: 1450 },
    { year: 2566, amount: 15800000, payouts: 1580 },
    { year: 2567, amount: 17100000, payouts: 1720 },
    { year: 2568, amount: 18500000, payouts: 1856 },
  ],
}

export default function YearlySummaryPage() {
  const [selectedYear, setSelectedYear] = useState(2568)
  const { data: apiData, isLoading } = useFinanceYearlySummary({ year: selectedYear })

  const yearlyData = useMemo<YearlySummaryData>(() => {
    if (!apiData || typeof apiData !== "object") return defaultYearlyData
    const data = apiData as YearlySummaryApi
    return {
      year: data.year ?? selectedYear,
      totalAmount: Number(data.total_amount) || 0,
      totalPayouts: Number(data.total_payouts) || 0,
      totalEmployees: Number(data.total_employees) || 0,
      growthRate: Number(data.growth_rate) || 0,
      monthlyBreakdown: Array.isArray(data.monthly_breakdown) ? data.monthly_breakdown : defaultYearlyData.monthlyBreakdown,
      byProfession: Array.isArray(data.by_profession) ? data.by_profession : defaultYearlyData.byProfession,
      byDepartment: Array.isArray(data.by_department) ? data.by_department : defaultYearlyData.byDepartment,
      yearComparison: Array.isArray(data.year_comparison) ? data.year_comparison : defaultYearlyData.yearComparison,
    }
  }, [apiData, selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">สรุปรายปี</h1>
          <p className="mt-2 text-muted-foreground">
            ภาพรวมการจ่ายเงิน พ.ต.ส. ประจำปี
          </p>
        </div>
        <div className="flex gap-3">
          <YearPicker
            value={selectedYear}
            onChange={setSelectedYear}
            minYear={2550}
            maxYear={2600}
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export รายงาน
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดจ่ายรวมทั้งปี</p>
                <p className="text-2xl font-bold text-green-600">
                  {(yearlyData.totalAmount / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(yearlyData.totalAmount)} บาท
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนรายการจ่าย</p>
                <p className="text-2xl font-bold">{formatCurrency(yearlyData.totalPayouts)}</p>
                <p className="text-xs text-muted-foreground mt-1">รายการ</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนผู้รับเงิน</p>
                <p className="text-2xl font-bold">{yearlyData.totalEmployees}</p>
                <p className="text-xs text-muted-foreground mt-1">คน</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">อัตราเติบโต</p>
                <p className="text-2xl font-bold text-green-600">+{yearlyData.growthRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">เทียบปีก่อน</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              สรุปรายเดือน ปี {yearlyData.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เดือน</TableHead>
                  <TableHead className="text-right">ยอดจ่าย</TableHead>
                  <TableHead className="text-right">จำนวนราย</TableHead>
                  <TableHead className="text-right">เฉลี่ย/ราย</TableHead>
                  <TableHead className="text-right">สัดส่วน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyData.monthlyBreakdown.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">
                      {month.amount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(month.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {month.payouts > 0 ? month.payouts : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {month.avgAmount > 0 ? formatCurrency(month.avgAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {month.amount > 0 ? (
                        <Badge variant="outline">
                          {((month.amount / yearlyData.totalAmount) * 100).toFixed(1)}%
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>รวมทั้งปี</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(yearlyData.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">{yearlyData.totalPayouts}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.round(yearlyData.totalAmount / yearlyData.totalPayouts))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge>100%</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* By Profession */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              สรุปตามวิชาชีพ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {yearlyData.byProfession.map((item) => (
                <div key={item.profession} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.profession}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.payouts} ราย
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right text-green-600">
                      {(item.amount / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              สรุปตามหน่วยงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {yearlyData.byDepartment.map((item) => (
                <div key={item.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.department}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.payouts} ราย
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right text-green-600">
                      {(item.amount / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Year Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              เปรียบเทียบรายปี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {yearlyData.yearComparison.map((year, index) => {
                const prevYear = yearlyData.yearComparison[index - 1]
                const growth = prevYear
                  ? ((year.amount - prevYear.amount) / prevYear.amount) * 100
                  : 0

                return (
                  <Card
                    key={year.year}
                    className={year.year === yearlyData.year ? "border-primary" : ""}
                  >
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">ปี {year.year}</p>
                        <p className="text-2xl font-bold mt-1">
                          {(year.amount / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(year.payouts)} รายการ
                        </p>
                        {growth !== 0 && (
                          <div
                            className={`flex items-center justify-center gap-1 mt-2 text-sm ${
                              growth > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {growth > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{growth > 0 ? "+" : ""}{growth.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
