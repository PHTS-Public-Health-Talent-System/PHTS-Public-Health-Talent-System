"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Download,
  FileText,
  FileSpreadsheet,
  Users,
  Calculator,
  ClipboardList,
  Calendar,
} from "lucide-react"

const reports = [
  {
    id: "detail",
    title: "รายงานรายละเอียด พ.ต.ส.",
    description: "รายชื่อผู้มีสิทธิ์รับเงินพร้อมรายละเอียดตำแหน่ง กลุ่ม อัตรา และจำนวนเงิน",
    icon: FileText,
    formats: ["PDF", "Excel"],
    lastGenerated: "4 ก.พ. 2569",
  },
  {
    id: "summary",
    title: "รายงานสรุปยอด พ.ต.ส.",
    description: "สรุปยอดเงินแยกตามกลุ่มตำแหน่ง หน่วยงาน และประเภทวิชาชีพ",
    icon: Calculator,
    formats: ["PDF", "Excel"],
    lastGenerated: "4 ก.พ. 2569",
  },
  {
    id: "profession",
    title: "รายงานตามวิชาชีพ",
    description: "รายละเอียดผู้มีสิทธิ์แยกตามประเภทวิชาชีพ เช่น พยาบาล เภสัชกร",
    icon: Users,
    formats: ["PDF", "Excel"],
    lastGenerated: "3 ก.พ. 2569",
  },
  {
    id: "payroll",
    title: "รายงานรอบจ่ายเงิน",
    description: "สรุปรอบจ่ายเงินพร้อมสถานะการอนุมัติและยอดรวม",
    icon: FileSpreadsheet,
    formats: ["PDF", "Excel"],
    lastGenerated: "3 ก.พ. 2569",
  },
  {
    id: "sla",
    title: "รายงาน SLA",
    description: "สรุปประสิทธิภาพการดำเนินงานตามเวลาที่กำหนดแยกตามขั้นตอน",
    icon: ClipboardList,
    formats: ["PDF", "Excel"],
    lastGenerated: "2 ก.พ. 2569",
  },
  {
    id: "history",
    title: "รายงานประวัติการอนุมัติ",
    description: "ประวัติการอนุมัติคำขอทั้งหมดพร้อมผู้อนุมัติและวันที่",
    icon: Calendar,
    formats: ["PDF", "Excel"],
    lastGenerated: "1 ก.พ. 2569",
  },
]

export default function HeadHRReportsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ดาวน์โหลดรายงาน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            เลือกรายงานและรูปแบบไฟล์ที่ต้องการดาวน์โหลด
          </p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="aug-2568">
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="เลือกเดือน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aug-2568">สิงหาคม 2568</SelectItem>
              <SelectItem value="sep-2568">กันยายน 2568</SelectItem>
              <SelectItem value="oct-2568">ตุลาคม 2568</SelectItem>
              <SelectItem value="nov-2568">พฤศจิกายน 2568</SelectItem>
              <SelectItem value="dec-2568">ธันวาคม 2568</SelectItem>
              <SelectItem value="jan-2569">มกราคม 2569</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="bg-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-3">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">{report.title}</CardTitle>
              <CardDescription className="text-sm">{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">
                สร้างล่าสุด: {report.lastGenerated}
              </div>
              <div className="flex gap-2">
                {report.formats.map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {format}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Report Section */}
      <Card className="mt-8 bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">สร้างรายงานแบบกำหนดเอง</CardTitle>
          <CardDescription>
            เลือกข้อมูลและช่วงเวลาที่ต้องการสร้างรายงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">ประเภทรายงาน</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detail">รายละเอียด</SelectItem>
                  <SelectItem value="summary">สรุปยอด</SelectItem>
                  <SelectItem value="sla">SLA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">วิชาชีพ</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="nurse">พยาบาลวิชาชีพ</SelectItem>
                  <SelectItem value="pharmacist">เภสัชกร</SelectItem>
                  <SelectItem value="technician">เทคนิคการแพทย์</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">ช่วงเวลา</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">รายเดือน</SelectItem>
                  <SelectItem value="quarter">รายไตรมาส</SelectItem>
                  <SelectItem value="year">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">รูปแบบไฟล์</label>
              <Select defaultValue="excel">
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="เลือกรูปแบบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              สร้างและดาวน์โหลดรายงาน
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
