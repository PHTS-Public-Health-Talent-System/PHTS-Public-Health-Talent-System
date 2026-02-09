"use client"
export const dynamic = 'force-dynamic'


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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Wallet,
  AlertTriangle,
  Printer,
} from "lucide-react"
import Link from "next/link"

// TODO: add icon when department view is added: Building2

const payoutData = {
  id: "PAY-2568-001",
  employeeId: "EMP001",
  employeeName: "นางสาวสมหญิง ดีมาก",
  citizenId: "1-1001-00001-XX-X",
  position: "พยาบาลวิชาชีพชำนาญการ",
  profession: "พยาบาลวิชาชีพ",
  department: "อายุรกรรม",
  ward: "อายุรกรรมชาย 1",
  period: "ส.ค. 2568",
  periodId: "PERIOD-2568-08",
  amount: 15000,
  bankAccount: "123-4-56789-0",
  bankName: "ธนาคารกรุงไทย",
  bankBranch: "สาขาอุตรดิตถ์",
  status: "pending",
  requestId: "REQ-2568-00123",
  
  // Calculation details
  workingDays: 22,
  holidayDays: 2,
  leaveDays: 1,
  baseRate: 600,
  holidayRate: 1200,
  
  // Timeline
  timeline: [
    { step: "ส่งคำขอ", date: "1 ก.ย. 2568", by: "นางสาวสมหญิง ดีมาก", status: "completed" },
    { step: "หัวหน้าหอผู้ป่วยอนุมัติ", date: "2 ก.ย. 2568", by: "นางสาวพิมพ์ใจ รักงาน", status: "completed" },
    { step: "หัวหน้ากลุ่มงานอนุมัติ", date: "3 ก.ย. 2568", by: "นายสมศักดิ์ ดีใจ", status: "completed" },
    { step: "เจ้าหน้าที่ พ.ต.ส. ตรวจสอบ", date: "4 ก.ย. 2568", by: "นางสาวจิราภา คำนวณดี", status: "completed" },
    { step: "หัวหน้าบุคคลอนุมัติ", date: "5 ก.ย. 2568", by: "นางอรุณี บุคคลดี", status: "completed" },
    { step: "หัวหน้าการเงินอนุมัติ", date: "5 ก.ย. 2568", by: "นายวิชัย การเงินดี", status: "completed" },
    { step: "ผู้อำนวยการอนุมัติ", date: "6 ก.ย. 2568", by: "นพ.สมชาย รักษาดี", status: "completed" },
    { step: "รอจ่ายเงิน", date: "-", by: "-", status: "pending" },
  ],
  
  approvedDate: "6 ก.ย. 2568",
  approvedBy: "นพ.สมชาย รักษาดี",
}

export default function PayoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  void id
  const payout = payoutData

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <Clock className="mr-1 h-3 w-3" />
            รอจ่ายเงิน
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            จ่ายแล้ว
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            <XCircle className="mr-1 h-3 w-3" />
            ยกเลิก
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/finance-officer/payouts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการจ่ายเงิน
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{payout.id}</h1>
              {getStatusBadge(payout.status)}
            </div>
            <p className="mt-2 text-muted-foreground">
              รายละเอียดการจ่ายเงินและข้อมูลผู้รับ
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์เอกสาร
            </Button>
            {payout.status === "pending" && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      ยกเลิก
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        ยกเลิกการจ่ายเงิน
                      </DialogTitle>
                      <DialogDescription>
                        คุณกำลังจะยกเลิกการจ่ายเงินให้ {payout.employeeName}
                        <br />
                        จำนวนเงิน: {formatCurrency(payout.amount)} บาท
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium">เหตุผลในการยกเลิก</label>
                      <Input placeholder="กรุณาระบุเหตุผล..." className="mt-2" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline">ปิด</Button>
                      <Button variant="destructive">ยืนยันยกเลิก</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      จ่ายเงิน
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ยืนยันการจ่ายเงิน</DialogTitle>
                      <DialogDescription>
                        คุณกำลังจะทำเครื่องหมายจ่ายเงินแล้วให้ {payout.employeeName}
                        <br />
                        จำนวนเงิน:{" "}
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payout.amount)} บาท
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">ปิด</Button>
                      <Button className="bg-green-600 hover:bg-green-700">ยืนยันจ่ายเงิน</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนเงินที่ต้องจ่าย</p>
                  <p className="text-4xl font-bold text-green-600">
                    {formatCurrency(payout.amount)} <span className="text-lg">บาท</span>
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                ข้อมูลผู้รับเงิน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                  <p className="font-medium">{payout.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">รหัสพนักงาน</p>
                  <p className="font-medium">{payout.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">เลขบัตรประชาชน</p>
                  <p className="font-medium">{payout.citizenId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                  <p className="font-medium">{payout.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วิชาชีพ</p>
                  <p className="font-medium">{payout.profession}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หน่วยงาน</p>
                  <p className="font-medium">{payout.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                ข้อมูลบัญชีธนาคาร
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">ธนาคาร</p>
                  <p className="font-medium">{payout.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สาขา</p>
                  <p className="font-medium">{payout.bankBranch}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">เลขบัญชี</p>
                  <p className="font-medium font-mono">{payout.bankAccount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อบัญชี</p>
                  <p className="font-medium">{payout.employeeName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                รายละเอียดการคำนวณ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">วันทำงานปกติ</span>
                  <span className="font-medium">{payout.workingDays} วัน x {formatCurrency(payout.baseRate)} = {formatCurrency(payout.workingDays * payout.baseRate)} บาท</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">วันหยุดราชการ</span>
                  <span className="font-medium">{payout.holidayDays} วัน x {formatCurrency(payout.holidayRate)} = {formatCurrency(payout.holidayDays * payout.holidayRate)} บาท</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">วันลา (หักออก)</span>
                  <span className="font-medium text-red-600">-{payout.leaveDays} วัน x {formatCurrency(payout.baseRate)} = -{formatCurrency(payout.leaveDays * payout.baseRate)} บาท</span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="font-semibold">รวมสุทธิ</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(payout.amount)} บาท</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Period Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                ข้อมูลรอบจ่าย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">รอบจ่ายเงิน</p>
                <p className="font-medium">{payout.period}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รหัสรอบจ่าย</p>
                <p className="font-medium font-mono">{payout.periodId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">คำขอที่เกี่ยวข้อง</p>
                <Link href={`/finance-officer/payouts`} className="font-medium text-primary hover:underline">
                  {payout.requestId}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">อนุมัติโดย</p>
                <p className="font-medium">{payout.approvedBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันที่อนุมัติ</p>
                <p className="font-medium">{payout.approvedDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ประวัติการดำเนินการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payout.timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : item.status === "pending"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : item.status === "pending" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      {index < payout.timeline.length - 1 && (
                        <div className="h-full w-px bg-border my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">{item.step}</p>
                      {item.date !== "-" && (
                        <>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                          <p className="text-xs text-muted-foreground">{item.by}</p>
                        </>
                      )}
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
