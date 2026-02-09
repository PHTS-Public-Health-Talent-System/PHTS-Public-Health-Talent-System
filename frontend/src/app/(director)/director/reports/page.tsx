"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  Banknote,
  TrendingUp,
  Clock,
} from "lucide-react"

const reportTypes = [
  {
    id: "detail",
    title: "รายงานละเอียดรายบุคคล",
    description: "รายละเอียดการจ่ายเงิน พ.ต.ส. แยกรายบุคคล",
    icon: FileText,
    formats: ["PDF", "Excel"],
  },
  {
    id: "summary",
    title: "รายงานสรุปรายเดือน",
    description: "สรุปยอดจ่ายเงิน พ.ต.ส. ประจำเดือน",
    icon: FileSpreadsheet,
    formats: ["PDF", "Excel"],
  },
  {
    id: "yearly",
    title: "รายงานสรุปรายปี",
    description: "สรุปยอดจ่ายเงิน พ.ต.ส. ประจำปีงบประมาณ",
    icon: TrendingUp,
    formats: ["PDF", "Excel"],
  },
  {
    id: "sla",
    title: "รายงาน SLA",
    description: "รายงานประสิทธิภาพการดำเนินการตาม SLA",
    icon: Clock,
    formats: ["PDF", "Excel"],
  },
]

const months = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
]

const years = ["2568", "2567", "2566", "2565"]

const recentDownloads = [
  {
    id: 1,
    name: "รายงานสรุป_สิงหาคม_2568.pdf",
    type: "summary",
    date: "28 ม.ค. 68 10:30",
    size: "245 KB",
  },
  {
    id: 2,
    name: "รายงานละเอียด_กรกฎาคม_2568.xlsx",
    type: "detail",
    date: "25 ม.ค. 68 14:15",
    size: "1.2 MB",
  },
  {
    id: 3,
    name: "รายงาน_SLA_Q3_2568.pdf",
    type: "sla",
    date: "20 ม.ค. 68 09:00",
    size: "180 KB",
  },
]

const summaryStats = {
  totalPaid: "12,456,800",
  totalPersons: 1856,
  avgPerPerson: "6,713",
  payrollPeriods: 8,
}

export default function DirectorReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("08")
  const [selectedYear, setSelectedYear] = useState("2568")

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">ดาวน์โหลดรายงาน</h1>
        <p className="mt-1 text-muted-foreground">
          ดาวน์โหลดรายงานต่างๆ เกี่ยวกับการจ่ายเงิน พ.ต.ส.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ยอดจ่ายปีนี้</div>
                <div className="text-xl font-bold">{summaryStats.totalPaid}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ผู้รับเงินสะสม</div>
                <div className="text-xl font-bold">{summaryStats.totalPersons} คน</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">เฉลี่ยต่อคน</div>
                <div className="text-xl font-bold">{summaryStats.avgPerPerson} บาท</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">รอบจ่ายปีนี้</div>
                <div className="text-xl font-bold">{summaryStats.payrollPeriods} รอบ</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>เลือกช่วงเวลา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>เดือน</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="เลือกเดือน" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ปี</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="เลือกปี" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Types */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report) => (
              <Card key={report.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <report.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {report.formats.map((format) => (
                      <Button key={format} variant="outline" size="sm" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Downloads */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>ดาวน์โหลดล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{download.name}</p>
                      <p className="text-xs text-muted-foreground">{download.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{download.size}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
