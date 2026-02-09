"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Users,
  Banknote,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const payrollPeriods = [
  {
    id: "PAY-2568-08",
    month: "สิงหาคม",
    year: "2568",
    totalPersons: 156,
    totalAmount: 1245800,
    status: "pending_director",
    submittedAt: "28 ม.ค. 68",
    hrApprovedAt: "27 ม.ค. 68",
    headFinanceApprovedAt: "27 ม.ค. 68",
    hrApprovedBy: "นางสุดา บริหาร",
    headFinanceApprovedBy: "นายการเงิน ดูแล",
  },
  {
    id: "PAY-2568-07",
    month: "กรกฎาคม",
    year: "2568",
    totalPersons: 152,
    totalAmount: 1198500,
    status: "pending_director",
    submittedAt: "25 ม.ค. 68",
    hrApprovedAt: "24 ม.ค. 68",
    headFinanceApprovedAt: "25 ม.ค. 68",
    hrApprovedBy: "นางสุดา บริหาร",
    headFinanceApprovedBy: "นายการเงิน ดูแล",
  },
  {
    id: "PAY-2568-06",
    month: "มิถุนายน",
    year: "2568",
    totalPersons: 148,
    totalAmount: 1156200,
    status: "approved",
    submittedAt: "20 ม.ค. 68",
    hrApprovedAt: "19 ม.ค. 68",
    headFinanceApprovedAt: "19 ม.ค. 68",
    directorApprovedAt: "20 ม.ค. 68",
    hrApprovedBy: "นางสุดา บริหาร",
    headFinanceApprovedBy: "นายการเงิน ดูแล",
    directorApprovedBy: "นพ.สมศักดิ์ รักษาดี",
  },
  {
    id: "PAY-2568-05",
    month: "พฤษภาคม",
    year: "2568",
    totalPersons: 145,
    totalAmount: 1089000,
    status: "approved",
    submittedAt: "15 ม.ค. 68",
    hrApprovedAt: "14 ม.ค. 68",
    headFinanceApprovedAt: "14 ม.ค. 68",
    directorApprovedAt: "15 ม.ค. 68",
    hrApprovedBy: "นางสุดา บริหาร",
    headFinanceApprovedBy: "นายการเงิน ดูแล",
    directorApprovedBy: "นพ.สมศักดิ์ รักษาดี",
  },
]

export default function DirectorPayrollPage() {
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const pendingPayrolls = payrollPeriods.filter((p) => p.status === "pending_director")
  const approvedPayrolls = payrollPeriods.filter((p) => p.status === "approved")

  const totalPendingAmount = pendingPayrolls.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPendingPersons = pendingPayrolls.reduce((sum, p) => sum + p.totalPersons, 0)

  const handleApprove = () => {
    // Implement approve logic
    setShowApproveDialog(false)
    setSelectedPayroll(null)
  }

  const handleReject = () => {
    // Implement reject logic
    setShowRejectDialog(false)
    setSelectedPayroll(null)
    setRejectReason("")
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">รอบจ่ายเงิน</h1>
        <p className="mt-1 text-muted-foreground">
          ตรวจสอบและอนุมัติรอบจ่ายเงิน พ.ต.ส.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">รอบรออนุมัติ</div>
                <div className="text-2xl font-bold">{pendingPayrolls.length}</div>
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
                <div className="text-sm text-muted-foreground">ผู้มีสิทธิ์รอจ่าย</div>
                <div className="text-2xl font-bold">{totalPendingPersons}</div>
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
                <div className="text-sm text-muted-foreground">ยอดรวมรออนุมัติ</div>
                <div className="text-2xl font-bold">{(totalPendingAmount / 1000000).toFixed(2)}M</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">อนุมัติแล้วปีนี้</div>
                <div className="text-2xl font-bold">{approvedPayrolls.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payrolls */}
      {pendingPayrolls.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              รอบจ่ายเงินรออนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รอบจ่าย</TableHead>
                  <TableHead>เดือน/ปี</TableHead>
                  <TableHead className="text-right">จำนวนคน</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>ผู้อนุมัติก่อนหน้า</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-mono">{payroll.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{payroll.month}</div>
                      <div className="text-sm text-muted-foreground">{payroll.year}</div>
                    </TableCell>
                    <TableCell className="text-right">{payroll.totalPersons} คน</TableCell>
                    <TableCell className="text-right font-semibold">
                      {payroll.totalAmount.toLocaleString()} บาท
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>HR: {payroll.hrApprovedBy}</div>
                        <div>Finance: {payroll.headFinanceApprovedBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>{payroll.submittedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/director/payroll/${payroll.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => {
                            setSelectedPayroll(payroll.id)
                            setShowApproveDialog(true)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedPayroll(payroll.id)
                            setShowRejectDialog(true)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Payrolls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            รอบจ่ายเงินที่อนุมัติแล้ว
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รอบจ่าย</TableHead>
                <TableHead>เดือน/ปี</TableHead>
                <TableHead className="text-right">จำนวนคน</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่อนุมัติ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedPayrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell className="font-mono">{payroll.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{payroll.month}</div>
                    <div className="text-sm text-muted-foreground">{payroll.year}</div>
                  </TableCell>
                  <TableCell className="text-right">{payroll.totalPersons} คน</TableCell>
                  <TableCell className="text-right font-semibold">
                    {payroll.totalAmount.toLocaleString()} บาท
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      อนุมัติแล้ว
                    </Badge>
                  </TableCell>
                  <TableCell>{payroll.directorApprovedAt}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/director/payroll/${payroll.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติรอบจ่าย</DialogTitle>
            <DialogDescription>
              คุณต้องการอนุมัติรอบจ่าย {selectedPayroll} หรือไม่?
              <br />
              <br />
              {selectedPayroll && (
                <span className="font-medium">
                  ยอดรวม:{" "}
                  {pendingPayrolls
                    .find((p) => p.id === selectedPayroll)
                    ?.totalAmount.toLocaleString()}{" "}
                  บาท (
                  {pendingPayrolls.find((p) => p.id === selectedPayroll)?.totalPersons}{" "}
                  คน)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
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
              กรุณาระบุเหตุผลในการปฏิเสธรอบจ่าย {selectedPayroll}
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
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={!rejectReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              ยืนยันปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
