"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react"

const slaStats = {
  totalRequests: 53,
  onTime: 45,
  warning: 5,
  overdue: 3,
  avgProcessingDays: 4.2,
}

const stepPerformance = [
  { step: 1, name: "หัวหน้าหอผู้ป่วย", sla: 2, avgDays: 1.2, onTime: 98 },
  { step: 2, name: "หัวหน้ากลุ่มงาน", sla: 2, avgDays: 1.5, onTime: 95 },
  { step: 3, name: "เจ้าหน้าที่ พ.ต.ส.", sla: 3, avgDays: 2.1, onTime: 92 },
  { step: 4, name: "หัวหน้างาน HR", sla: 2, avgDays: 1.3, onTime: 96 },
  { step: 5, name: "หัวหน้าการเงิน", sla: 2, avgDays: 1.1, onTime: 97 },
  { step: 6, name: "ผู้อำนวยการ", sla: 2, avgDays: 0.8, onTime: 99 },
]

const overdueRequests = [
  {
    id: "REQ-2568-001236",
    name: "นางมาลี รักษ์พยาบาล",
    currentStep: 6,
    stepName: "ผู้อำนวยการ",
    daysOverdue: 2,
    waitingDays: 4,
    slaLimit: 2,
  },
  {
    id: "REQ-2568-001220",
    name: "นายวิชัย มั่นคง",
    currentStep: 6,
    stepName: "ผู้อำนวยการ",
    daysOverdue: 1,
    waitingDays: 3,
    slaLimit: 2,
  },
  {
    id: "REQ-2568-001215",
    name: "นางสาวพิมพ์ใจ ดีเสมอ",
    currentStep: 6,
    stepName: "ผู้อำนวยการ",
    daysOverdue: 1,
    waitingDays: 3,
    slaLimit: 2,
  },
]

const warningRequests = [
  {
    id: "REQ-2568-001235",
    name: "นายสมชาย รักงาน",
    currentStep: 6,
    stepName: "ผู้อำนวยการ",
    waitingDays: 2,
    slaLimit: 2,
  },
  {
    id: "REQ-2568-001238",
    name: "นายวิชัย มั่นคง",
    currentStep: 6,
    stepName: "ผู้อำนวยการ",
    waitingDays: 2,
    slaLimit: 2,
  },
]

export default function DirectorSLAReportPage() {
  const onTimePercentage = Math.round((slaStats.onTime / slaStats.totalRequests) * 100)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">รายงาน SLA</h1>
        <p className="mt-1 text-muted-foreground">
          ตรวจสอบประสิทธิภาพการดำเนินการตาม Service Level Agreement
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">คำขอทั้งหมด</div>
                <div className="text-2xl font-bold">{slaStats.totalRequests}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ทันเวลา</div>
                <div className="text-2xl font-bold text-green-600">{slaStats.onTime}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ใกล้ครบกำหนด</div>
                <div className="text-2xl font-bold text-amber-600">{slaStats.warning}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">เกิน SLA</div>
                <div className="text-2xl font-bold text-red-600">{slaStats.overdue}</div>
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
                <div className="text-sm text-muted-foreground">ทันเวลา</div>
                <div className="text-2xl font-bold text-purple-600">{onTimePercentage}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              คำขอที่เกิน SLA ({overdueRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขคำขอ</TableHead>
                  <TableHead>ผู้ขอ</TableHead>
                  <TableHead className="text-right">เกิน SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-xs text-muted-foreground">
                        รอ {request.waitingDays} วัน (SLA: {request.slaLimit} วัน)
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">
                        +{request.daysOverdue} วัน
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Warning Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              คำขอใกล้ครบกำหนด ({warningRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขคำขอ</TableHead>
                  <TableHead>ผู้ขอ</TableHead>
                  <TableHead className="text-right">เหลือเวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warningRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-xs text-muted-foreground">
                        รอ {request.waitingDays} วัน (SLA: {request.slaLimit} วัน)
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        ใกล้ครบ
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Step Performance */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ประสิทธิภาพแต่ละขั้นตอน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ขั้นตอน</TableHead>
                <TableHead>ผู้รับผิดชอบ</TableHead>
                <TableHead className="text-center">SLA (วัน)</TableHead>
                <TableHead className="text-center">เฉลี่ย (วัน)</TableHead>
                <TableHead className="text-center">ทันเวลา (%)</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stepPerformance.map((step) => (
                <TableRow key={step.step} className={step.step === 6 ? "bg-purple-50" : ""}>
                  <TableCell>
                    <Badge variant="outline">Step {step.step}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{step.name}</TableCell>
                  <TableCell className="text-center">{step.sla}</TableCell>
                  <TableCell className="text-center">
                    <span className={step.avgDays <= step.sla ? "text-green-600" : "text-red-600"}>
                      {step.avgDays}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={step.onTime >= 95 ? "text-green-600" : step.onTime >= 90 ? "text-amber-600" : "text-red-600"}>
                      {step.onTime}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {step.onTime >= 95 ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ดีมาก
                      </Badge>
                    ) : step.onTime >= 90 ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        ปานกลาง
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        ต้องปรับปรุง
                      </Badge>
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
