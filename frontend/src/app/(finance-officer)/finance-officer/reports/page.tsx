"use client"
export const dynamic = 'force-dynamic'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Calendar,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Wallet,
} from "lucide-react"

const reportTypes = [
  {
    id: "payment-detail",
    title: "รายงานการจ่ายเงินรายบุคคล",
    description: "รายละเอียดการจ่ายเงินแยกตามบุคคล รวมข้อมูลบัญชีและยอดจ่าย",
    icon: Users,
    formats: ["PDF", "Excel"],
    lastGenerated: "10 ก.ย. 2568",
  },
  {
    id: "payment-summary",
    title: "รายงานสรุปการจ่ายเงินรายเดือน",
    description: "สรุปยอดจ่ายเงินรายเดือนแยกตามวิชาชีพและหน่วยงาน",
    icon: TrendingUp,
    formats: ["PDF", "Excel"],
    lastGenerated: "10 ก.ย. 2568",
  },
  {
    id: "bank-transfer",
    title: "รายงานโอนเงินเข้าบัญชี",
    description: "รายการโอนเงินสำหรับส่งธนาคาร พร้อมเลขบัญชีและยอดเงิน",
    icon: Wallet,
    formats: ["Excel", "CSV"],
    lastGenerated: "10 ก.ย. 2568",
  },
  {
    id: "yearly-summary",
    title: "รายงานสรุปประจำปี",
    description: "สรุปยอดจ่ายเงินทั้งปี เปรียบเทียบรายเดือนและวิเคราะห์แนวโน้ม",
    icon: Calendar,
    formats: ["PDF", "Excel"],
    lastGenerated: "1 ก.ย. 2568",
  },
  {
    id: "department-report",
    title: "รายงานตามหน่วยงาน",
    description: "สรุปการจ่ายเงินแยกตามหน่วยงานและกลุ่มงาน",
    icon: Building2,
    formats: ["PDF", "Excel"],
    lastGenerated: "10 ก.ย. 2568",
  },
  {
    id: "tax-report",
    title: "รายงานภาษี/50 ทวิ",
    description: "รายงานสำหรับการหักภาษี ณ ที่จ่าย และใบรับรองการหักภาษี",
    icon: FileSpreadsheet,
    formats: ["PDF", "Excel"],
    lastGenerated: "5 ก.ย. 2568",
  },
]

const recentDownloads = [
  {
    name: "payment-detail-aug-2568.xlsx",
    type: "รายงานการจ่ายเงินรายบุคคล",
    date: "10 ก.ย. 2568",
    size: "2.4 MB",
    downloadedBy: "สมศักดิ์ การเงิน",
  },
  {
    name: "bank-transfer-aug-2568.csv",
    type: "รายงานโอนเงินเข้าบัญชี",
    date: "10 ก.ย. 2568",
    size: "856 KB",
    downloadedBy: "สมศักดิ์ การเงิน",
  },
  {
    name: "payment-summary-aug-2568.pdf",
    type: "รายงานสรุปการจ่ายเงินรายเดือน",
    date: "9 ก.ย. 2568",
    size: "1.2 MB",
    downloadedBy: "สมศักดิ์ การเงิน",
  },
]

export default function ReportsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">รายงาน</h1>
        <p className="mt-2 text-muted-foreground">
          ดาวน์โหลดรายงานการจ่ายเงิน พ.ต.ส. ในรูปแบบต่างๆ
        </p>
      </div>

      {/* Report Types */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">เลือกประเภทรายงาน</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <report.icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex gap-1">
                    {report.formats.map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardTitle className="text-base mt-3">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Select defaultValue="2568-08">
                      <SelectTrigger className="h-9">
                        <Calendar className="mr-2 h-3 w-3" />
                        <SelectValue placeholder="เลือกเดือน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2568-09">ก.ย. 2568</SelectItem>
                        <SelectItem value="2568-08">ส.ค. 2568</SelectItem>
                        <SelectItem value="2568-07">ก.ค. 2568</SelectItem>
                        <SelectItem value="2568-06">มิ.ย. 2568</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue={report.formats[0].toLowerCase()}>
                      <SelectTrigger className="h-9">
                        <FileText className="mr-2 h-3 w-3" />
                        <SelectValue placeholder="รูปแบบ" />
                      </SelectTrigger>
                      <SelectContent>
                        {report.formats.map((format) => (
                          <SelectItem key={format} value={format.toLowerCase()}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    สร้างล่าสุด: {report.lastGenerated}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            รายงานที่ดาวน์โหลดล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDownloads.map((download, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{download.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {download.type} | {download.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm">{download.date}</p>
                    <p className="text-xs text-muted-foreground">โดย {download.downloadedBy}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
