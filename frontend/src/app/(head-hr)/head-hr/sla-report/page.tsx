"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react"

const slaSteps = [
  {
    step: 1,
    name: "HEAD_WARD",
    label: "หัวหน้าตึก/หัวหน้างาน",
    targetDays: 3,
    avgDays: 1.8,
    onTime: 92,
    total: 156,
    pending: 5,
  },
  {
    step: 2,
    name: "HEAD_DEPT",
    label: "หัวหน้ากลุ่มงาน",
    targetDays: 3,
    avgDays: 2.1,
    onTime: 88,
    total: 151,
    pending: 8,
  },
  {
    step: 3,
    name: "PTS_OFFICER",
    label: "เจ้าหน้าที่ พ.ต.ส.",
    targetDays: 5,
    avgDays: 3.5,
    onTime: 85,
    total: 143,
    pending: 12,
  },
  {
    step: 4,
    name: "HEAD_HR",
    label: "หัวหน้ากลุ่มงานทรัพยากรบุคคล",
    targetDays: 3,
    avgDays: 2.2,
    onTime: 90,
    total: 131,
    pending: 8,
  },
  {
    step: 5,
    name: "HEAD_FINANCE",
    label: "หัวหน้าการเงิน",
    targetDays: 3,
    avgDays: 1.5,
    onTime: 95,
    total: 123,
    pending: 3,
  },
  {
    step: 6,
    name: "DIRECTOR",
    label: "ผู้อำนวยการ",
    targetDays: 5,
    avgDays: 2.8,
    onTime: 91,
    total: 120,
    pending: 2,
  },
]

const pendingItems = [
  {
    id: "REQ-2568-047",
    name: "นางสาว มณีรัตน์ ดวงใจ",
    step: "HEAD_HR",
    stepLabel: "รอ HR อนุมัติ",
    submittedDate: "28 ม.ค. 2569",
    daysInStep: 8,
    targetDays: 3,
    status: "danger",
  },
  {
    id: "REQ-2568-046",
    name: "นาย วิชัย สมบูรณ์",
    step: "HEAD_HR",
    stepLabel: "รอ HR อนุมัติ",
    submittedDate: "31 ม.ค. 2569",
    daysInStep: 5,
    targetDays: 3,
    status: "warning",
  },
  {
    id: "REQ-2568-039",
    name: "นางสาว กัญญา ใจเย็น",
    step: "PTS_OFFICER",
    stepLabel: "รอเจ้าหน้าที่ตรวจสอบ",
    submittedDate: "25 ม.ค. 2569",
    daysInStep: 11,
    targetDays: 5,
    status: "danger",
  },
  {
    id: "REQ-2568-041",
    name: "นาย สมชาย มีสุข",
    step: "PTS_OFFICER",
    stepLabel: "รอเจ้าหน้าที่ตรวจสอบ",
    submittedDate: "30 ม.ค. 2569",
    daysInStep: 6,
    targetDays: 5,
    status: "warning",
  },
]

function getStatusColor(onTime: number) {
  if (onTime >= 90) return "text-[hsl(var(--success))]"
  if (onTime >= 80) return "text-[hsl(var(--warning))]"
  return "text-destructive"
}

function getProgressColor(onTime: number) {
  if (onTime >= 90) return "bg-[hsl(var(--success))]"
  if (onTime >= 80) return "bg-[hsl(var(--warning))]"
  return "bg-destructive"
}

export default function HeadHRSLAReportPage() {
  const overallOnTime = Math.round(
    slaSteps.reduce((sum, step) => sum + step.onTime, 0) / slaSteps.length
  )
  const totalPending = slaSteps.reduce((sum, step) => sum + step.pending, 0)
  const overdueCount = pendingItems.filter(item => item.status === "danger").length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">รายงาน SLA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ติดตามประสิทธิภาพการดำเนินงานตามเวลาที่กำหนด
          </p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="current">
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">เดือนปัจจุบัน</SelectItem>
              <SelectItem value="last30">30 วันล่าสุด</SelectItem>
              <SelectItem value="last90">90 วันล่าสุด</SelectItem>
              <SelectItem value="year">ทั้งปี</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลด
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA เฉลี่ยรวม</p>
                <p className={`text-2xl font-bold ${getStatusColor(overallOnTime)}`}>{overallOnTime}%</p>
              </div>
              <div className={`rounded-lg p-3 ${overallOnTime >= 90 ? "bg-[hsl(var(--success))]/10" : overallOnTime >= 80 ? "bg-[hsl(var(--warning))]/10" : "bg-destructive/10"}`}>
                <BarChart3 className={`h-5 w-5 ${getStatusColor(overallOnTime)}`} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-[hsl(var(--success))]">
              <TrendingUp className="mr-1 h-3 w-3" />
              +2.3% จากเดือนก่อน
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-foreground">{totalPending}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-3">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ใน 6 ขั้นตอน
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">เกินกำหนด</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-destructive">
              <TrendingDown className="mr-1 h-3 w-3" />
              ต้องเร่งดำเนินการ
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ดำเนินการแล้ว</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">120</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              เดือนนี้
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA by Step */}
      <Card className="mb-6 bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">SLA แยกตามขั้นตอน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {slaSteps.map((step) => (
              <div key={step.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                      {step.step}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{step.label}</p>
                      <p className="text-xs text-muted-foreground">เป้าหมาย: {step.targetDays} วัน | เฉลี่ย: {step.avgDays} วัน</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getStatusColor(step.onTime)}`}>
                        {step.onTime}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.total} รายการ | รอ {step.pending}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={step.onTime} className="h-2" />
                  <div 
                    className={`absolute top-0 h-2 rounded-full ${getProgressColor(step.onTime)}`}
                    style={{ width: `${step.onTime}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Items */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">รายการที่เกินหรือใกล้เกินกำหนด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสคำขอ</TableHead>
                <TableHead>ชื่อ-สกุล</TableHead>
                <TableHead>ขั้นตอนปัจจุบัน</TableHead>
                <TableHead>วันที่เข้าขั้นตอน</TableHead>
                <TableHead className="text-center">จำนวนวัน</TableHead>
                <TableHead className="text-center">เป้าหมาย</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{item.step}</p>
                      <p className="text-xs text-muted-foreground">{item.stepLabel}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.submittedDate}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${item.status === "danger" ? "text-destructive" : "text-[hsl(var(--warning))]"}`}>
                      {item.daysInStep} วัน
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {item.targetDays} วัน
                  </TableCell>
                  <TableCell className="text-center">
                    {item.status === "danger" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        <XCircle className="h-3 w-3" />
                        เกินกำหนด
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))]/10 px-2.5 py-1 text-xs font-medium text-[hsl(var(--warning))]">
                        <AlertTriangle className="h-3 w-3" />
                        ใกล้เกิน
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
