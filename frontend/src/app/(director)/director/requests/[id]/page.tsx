"use client"

import { useState } from "react"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Building,
  Calendar,
  FileText,
  Award,
  Banknote,
} from "lucide-react"
import Link from "next/link"

const mockRequest = {
  id: "REQ-2568-001234",
  status: "pending_director",
  createdAt: "20 ม.ค. 68",
  submittedAt: "21 ม.ค. 68",
  currentStep: 6,
  
  // ข้อมูลผู้ขอ
  requester: {
    name: "นางสาวสมหญิง ใจดี",
    citizenId: "1-1234-56789-01-2",
    position: "พยาบาลวิชาชีพชำนาญการ",
    level: "ชำนาญการ",
    department: "หอผู้ป่วยหนัก (ICU)",
    division: "กลุ่มการพยาบาล",
  },

  // ข้อมูลใบอนุญาต
  license: {
    number: "พ.ว. 123456",
    type: "ใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์ชั้นหนึ่ง",
    issueDate: "15 มี.ค. 65",
    expiryDate: "14 มี.ค. 70",
  },

  // ข้อมูลคำขอ
  period: {
    month: "สิงหาคม",
    year: "2568",
    workDays: 22,
    leaveDays: 2,
    effectiveDays: 20,
  },

  // การคำนวณเงิน
  calculation: {
    baseRate: 600,
    dailyAmount: 600,
    workDays: 20,
    totalAmount: 12000,
    deductions: 0,
    netAmount: 12000,
  },

  // ข้อมูลบัญชี
  bankAccount: {
    bank: "ธนาคารกรุงไทย",
    accountNumber: "123-4-56789-0",
    accountName: "นางสาวสมหญิง ใจดี",
  },

  // ประวัติการอนุมัติ
  approvalHistory: [
    {
      step: 1,
      role: "หัวหน้าหอผู้ป่วย",
      name: "นางสาววิภา รักษาการ",
      action: "อนุมัติ",
      date: "22 ม.ค. 68 09:30",
      comment: "",
    },
    {
      step: 2,
      role: "หัวหน้ากลุ่มการพยาบาล",
      name: "นางมณี ผู้จัดการ",
      action: "อนุมัติ",
      date: "23 ม.ค. 68 11:15",
      comment: "",
    },
    {
      step: 3,
      role: "เจ้าหน้าที่ พ.ต.ส.",
      name: "นายสมศักดิ์ ตรวจสอบ",
      action: "อนุมัติ",
      date: "24 ม.ค. 68 14:20",
      comment: "ตรวจสอบข้อมูลถูกต้อง",
    },
    {
      step: 4,
      role: "หัวหน้างาน HR",
      name: "นางสุดา บริหาร",
      action: "อนุมัติ",
      date: "25 ม.ค. 68 10:45",
      comment: "",
    },
    {
      step: 5,
      role: "หัวหน้าการเงิน",
      name: "นายการเงิน ดูแล",
      action: "อนุมัติ",
      date: "27 ม.ค. 68 09:00",
      comment: "ตรวจสอบงบประมาณแล้ว",
    },
    {
      step: 6,
      role: "ผู้อำนวยการ",
      name: "รอการอนุมัติ",
      action: "pending",
      date: "",
      comment: "",
    },
  ],
}

export default function DirectorRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [returnReason, setReturnReason] = useState("")

  const request = mockRequest

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/director/requests">
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
              ขั้นตอนที่ 6 - การอนุมัติขั้นสุดท้าย
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-amber-600 border-amber-600 hover:bg-amber-50"
            onClick={() => setShowReturnDialog(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            ส่งกลับแก้ไข
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            ไม่อนุมัติ
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลผู้ขอ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">ชื่อ-นามสกุล</label>
                  <p className="font-medium">{request.requester.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">เลขประจำตัวประชาชน</label>
                  <p className="font-medium">{request.requester.citizenId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">ตำแหน่ง</label>
                  <p className="font-medium">{request.requester.position}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">ระดับ</label>
                  <p className="font-medium">{request.requester.level}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">หน่วยงาน</label>
                  <p className="font-medium">{request.requester.department}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">กลุ่มงาน</label>
                  <p className="font-medium">{request.requester.division}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                ข้อมูลใบอนุญาต
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">เลขใบอนุญาต</label>
                  <p className="font-medium">{request.license.number}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">ประเภท</label>
                  <p className="font-medium">{request.license.type}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">วันที่ออก</label>
                  <p className="font-medium">{request.license.issueDate}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">วันหมดอายุ</label>
                  <p className="font-medium">{request.license.expiryDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                รายละเอียดการคำนวณ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-muted-foreground">เดือนที่ขอ</label>
                    <p className="font-medium">{request.period.month} {request.period.year}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">วันทำงาน</label>
                    <p className="font-medium">{request.period.workDays} วัน</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">วันลา</label>
                    <p className="font-medium">{request.period.leaveDays} วัน</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">อัตราเงินต่อวัน</span>
                    <span>{request.calculation.dailyAmount.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันที่มีสิทธิ์</span>
                    <span>{request.period.effectiveDays} วัน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รวมก่อนหักลดหย่อน</span>
                    <span>{request.calculation.totalAmount.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">หักลดหย่อน</span>
                    <span>-{request.calculation.deductions.toLocaleString()} บาท</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดสุทธิ</span>
                    <span className="text-green-600">
                      {request.calculation.netAmount.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                ข้อมูลบัญชีธนาคาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm text-muted-foreground">ธนาคาร</label>
                  <p className="font-medium">{request.bankAccount.bank}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">เลขบัญชี</label>
                  <p className="font-medium font-mono">{request.bankAccount.accountNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">ชื่อบัญชี</label>
                  <p className="font-medium">{request.bankAccount.accountName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval History Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ประวัติการอนุมัติ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.approvalHistory.map((history, index) => (
                  <div
                    key={index}
                    className={`relative pl-6 pb-4 ${
                      index < request.approvalHistory.length - 1 ? "border-l-2 border-border" : ""
                    }`}
                  >
                    <div
                      className={`absolute -left-2 top-0 h-4 w-4 rounded-full ${
                        history.action === "อนุมัติ"
                          ? "bg-green-500"
                          : history.action === "pending"
                          ? "bg-purple-500 animate-pulse"
                          : "bg-gray-300"
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Step {history.step}
                        </span>
                        {history.action === "อนุมัติ" && (
                          <Badge variant="outline" className="text-green-600 text-xs">
                            อนุมัติแล้ว
                          </Badge>
                        )}
                        {history.action === "pending" && (
                          <Badge variant="secondary" className="text-purple-600 text-xs">
                            รอดำเนินการ
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{history.role}</p>
                      <p className="text-sm text-muted-foreground">{history.name}</p>
                      {history.date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {history.date}
                        </div>
                      )}
                      {history.comment && (
                        <p className="text-xs text-muted-foreground italic">
                          &quot;{history.comment}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request Timeline */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ไทม์ไลน์
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สร้างคำขอ</span>
                  <span>{request.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ส่งคำขอ</span>
                  <span>{request.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ถึง Director</span>
                  <span>28 ม.ค. 68</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>รอดำเนินการ</span>
                  <span className="text-purple-600">1 วัน</span>
                </div>
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
              คุณต้องการอนุมัติคำขอเลขที่ {resolvedParams.id} จำนวน{" "}
              {request.calculation.netAmount.toLocaleString()} บาท หรือไม่?
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
            <DialogTitle>ไม่อนุมัติคำขอ</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผลในการไม่อนุมัติคำขอ
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
              ยืนยันไม่อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ส่งกลับแก้ไข</DialogTitle>
            <DialogDescription>
              กรุณาระบุสิ่งที่ต้องแก้ไข
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="ระบุสิ่งที่ต้องแก้ไข..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!returnReason.trim()}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              ส่งกลับแก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
