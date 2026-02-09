"use client"

import { useState } from "react"
import { use } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  Users,
  Banknote,
  CheckCircle2,
  XCircle,
  Download,
  Clock,
  FileText,
} from "lucide-react"
import Link from "next/link"

const mockPayroll = {
  id: "PAY-2568-08",
  month: "สิงหาคม",
  year: "2568",
  status: "pending_director",
  totalPersons: 156,
  totalAmount: 1245800,
  createdAt: "20 ม.ค. 68",
  submittedAt: "25 ม.ค. 68",
  hrApprovedAt: "26 ม.ค. 68",
  headFinanceApprovedAt: "27 ม.ค. 68",
  hrApprovedBy: "นางสุดา บริหาร",
  headFinanceApprovedBy: "นายการเงิน ดูแล",

  summary: {
    byProfession: [
      { name: "พยาบาลวิชาชีพ", count: 120, amount: 984000 },
      { name: "เภสัชกร", count: 15, amount: 127500 },
      { name: "นักเทคนิคการแพทย์", count: 12, amount: 81600 },
      { name: "นักรังสีการแพทย์", count: 9, amount: 52700 },
    ],
    byDepartment: [
      { name: "ICU", count: 25, amount: 205000 },
      { name: "ER", count: 20, amount: 164000 },
      { name: "OPD", count: 18, amount: 147600 },
      { name: "Ward ต่างๆ", count: 93, amount: 729200 },
    ],
  },

  items: [
    {
      id: 1,
      name: "นางสาวสมหญิง ใจดี",
      position: "พยาบาลวิชาชีพชำนาญการ",
      department: "ICU",
      amount: 12000,
    },
    {
      id: 2,
      name: "นายสมชาย รักงาน",
      position: "พยาบาลวิชาชีพชำนาญการพิเศษ",
      department: "ER",
      amount: 15000,
    },
    {
      id: 3,
      name: "นางมาลี รักษ์พยาบาล",
      position: "พยาบาลวิชาชีพชำนาญการ",
      department: "OPD",
      amount: 11500,
    },
    {
      id: 4,
      name: "นายวิชัย มั่นคง",
      position: "เภสัชกรชำนาญการ",
      department: "เภสัชกรรม",
      amount: 8500,
    },
    {
      id: 5,
      name: "นางสาวพิมพ์ใจ ดีเสมอ",
      position: "นักเทคนิคการแพทย์ปฏิบัติการ",
      department: "ห้องปฏิบัติการ",
      amount: 6800,
    },
  ],

  approvalHistory: [
    {
      step: "สร้างรอบจ่าย",
      by: "นายสมศักดิ์ ตรวจสอบ",
      role: "PTS Officer",
      date: "20 ม.ค. 68 10:00",
    },
    {
      step: "ส่งให้ HR",
      by: "นายสมศักดิ์ ตรวจสอบ",
      role: "PTS Officer",
      date: "25 ม.ค. 68 14:30",
    },
    {
      step: "HR อนุมัติ",
      by: "นางสุดา บริหาร",
      role: "Head HR",
      date: "26 ม.ค. 68 09:15",
    },
    {
      step: "หัวหน้าการเงินอนุมัติ",
      by: "นายการเงิน ดูแล",
      role: "Head Finance",
      date: "27 ม.ค. 68 11:00",
    },
    {
      step: "รอ Director อนุมัติ",
      by: "-",
      role: "Director",
      date: "รอดำเนินการ",
    },
  ],
}

export default function DirectorPayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const payroll = mockPayroll

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/director/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{resolvedParams.id}</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                รอ Director อนุมัติ
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              รอบจ่ายเงิน {payroll.month} {payroll.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดรายงาน
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            ปฏิเสธ
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowApproveDialog(true)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            อนุมัติ
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">เดือน/ปี</div>
                <div className="font-bold">{payroll.month} {payroll.year}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">จำนวนคน</div>
                <div className="font-bold">{payroll.totalPersons} คน</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ยอดรวม</div>
                <div className="font-bold">{payroll.totalAmount.toLocaleString()} บาท</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">สถานะ</div>
                <div className="font-bold text-purple-600">รออนุมัติ</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary by Profession */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปตามประเภทวิชาชีพ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วิชาชีพ</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ยอดเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.summary.byProfession.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.count} คน</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString()} บาท
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">รวมทั้งหมด</TableCell>
                    <TableCell className="text-right font-bold">{payroll.totalPersons} คน</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {payroll.totalAmount.toLocaleString()} บาท
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary by Department */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปตามหน่วยงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หน่วยงาน</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ยอดเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.summary.byDepartment.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.count} คน</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString()} บาท
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sample Items */}
          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่างรายการ (5 รายการแรก)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-สกุล</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>หน่วยงาน</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.position}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString()} บาท
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  ดูรายการทั้งหมด ({payroll.totalPersons} รายการ)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payroll.approvalHistory.map((history, index) => (
                  <div
                    key={index}
                    className={`relative pl-6 pb-4 ${
                      index < payroll.approvalHistory.length - 1 ? "border-l-2 border-border" : ""
                    }`}
                  >
                    <div
                      className={`absolute -left-2 top-0 h-4 w-4 rounded-full ${
                        history.date === "รอดำเนินการ"
                          ? "bg-purple-500 animate-pulse"
                          : "bg-green-500"
                      }`}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{history.step}</p>
                      <p className="text-sm text-muted-foreground">{history.by}</p>
                      <p className="text-xs text-muted-foreground">{history.role}</p>
                      <p className="text-xs text-muted-foreground">{history.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Approval Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลการอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">HR อนุมัติ</label>
                <p className="font-medium">{payroll.hrApprovedBy}</p>
                <p className="text-xs text-muted-foreground">{payroll.hrApprovedAt}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm text-muted-foreground">หัวหน้าการเงินอนุมัติ</label>
                <p className="font-medium">{payroll.headFinanceApprovedBy}</p>
                <p className="text-xs text-muted-foreground">{payroll.headFinanceApprovedAt}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm text-muted-foreground">Director</label>
                <Badge variant="secondary" className="ml-2">รอดำเนินการ</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
            <DialogDescription>
              คุณต้องการอนุมัติรอบจ่ายเงิน {payroll.month} {payroll.year} หรือไม่?
              <br /><br />
              <span className="font-medium">
                ยอดรวม: {payroll.totalAmount.toLocaleString()} บาท ({payroll.totalPersons} คน)
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ยกเลิก
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              ยืนยันอนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธรอบจ่าย</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผลในการปฏิเสธ
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="ระบุเหตุผล..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" disabled={!rejectReason.trim()}>
              <XCircle className="mr-2 h-4 w-4" />
              ยืนยันปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
