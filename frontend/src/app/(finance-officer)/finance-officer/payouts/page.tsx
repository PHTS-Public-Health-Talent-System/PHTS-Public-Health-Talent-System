"use client"
export const dynamic = 'force-dynamic'


import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Wallet,
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const payouts = [
  {
    id: "PAY-2568-001",
    employeeId: "EMP001",
    employeeName: "นางสาวสมหญิง ดีมาก",
    citizenId: "1-1001-00001-XX-X",
    profession: "พยาบาลวิชาชีพ",
    department: "อายุรกรรม",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 15000,
    bankAccount: "xxx-x-xxxxx-1",
    bankName: "กรุงไทย",
    status: "pending",
    approvedDate: "5 ก.ย. 2568",
  },
  {
    id: "PAY-2568-002",
    employeeId: "EMP002",
    employeeName: "นายสมชาย รักดี",
    citizenId: "1-1001-00002-XX-X",
    profession: "เภสัชกร",
    department: "เภสัชกรรม",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 12500,
    bankAccount: "xxx-x-xxxxx-2",
    bankName: "กสิกร",
    status: "pending",
    approvedDate: "5 ก.ย. 2568",
  },
  {
    id: "PAY-2568-003",
    employeeId: "EMP003",
    employeeName: "นางสาวมะลิ หอมจัง",
    citizenId: "1-1001-00003-XX-X",
    profession: "แพทย์",
    department: "ศัลยกรรม",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 18000,
    bankAccount: "xxx-x-xxxxx-3",
    bankName: "กรุงไทย",
    status: "pending",
    approvedDate: "6 ก.ย. 2568",
  },
  {
    id: "PAY-2568-004",
    employeeId: "EMP004",
    employeeName: "นายวิชัย เก่งมาก",
    citizenId: "1-1001-00004-XX-X",
    profession: "นักเทคนิคการแพทย์",
    department: "พยาธิวิทยา",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 14000,
    bankAccount: "xxx-x-xxxxx-4",
    bankName: "ไทยพาณิชย์",
    status: "pending",
    approvedDate: "6 ก.ย. 2568",
  },
  {
    id: "PAY-2568-005",
    employeeId: "EMP005",
    employeeName: "นางสาวกัลยา สุขใจ",
    citizenId: "1-1001-00005-XX-X",
    profession: "พยาบาลวิชาชีพ",
    department: "กุมารเวชกรรม",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 16500,
    bankAccount: "xxx-x-xxxxx-5",
    bankName: "กรุงไทย",
    status: "paid",
    approvedDate: "5 ก.ย. 2568",
    paidDate: "10 ก.ย. 2568",
    paidBy: "สมศักดิ์ การเงิน",
  },
  {
    id: "PAY-2568-006",
    employeeId: "EMP006",
    employeeName: "นายประสิทธิ์ ดีเด่น",
    citizenId: "1-1001-00006-XX-X",
    profession: "รังสีเทคนิค",
    department: "รังสีวิทยา",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 13000,
    bankAccount: "xxx-x-xxxxx-6",
    bankName: "กรุงเทพ",
    status: "paid",
    approvedDate: "5 ก.ย. 2568",
    paidDate: "10 ก.ย. 2568",
    paidBy: "สมศักดิ์ การเงิน",
  },
  {
    id: "PAY-2568-007",
    employeeId: "EMP007",
    employeeName: "นางวันดี รุ่งเรือง",
    citizenId: "1-1001-00007-XX-X",
    profession: "นักกายภาพบำบัด",
    department: "เวชศาสตร์ฟื้นฟู",
    period: "ส.ค. 2568",
    periodId: "PERIOD-2568-08",
    amount: 17500,
    bankAccount: "xxx-x-xxxxx-7",
    bankName: "กสิกร",
    status: "cancelled",
    approvedDate: "4 ก.ย. 2568",
    cancelledDate: "8 ก.ย. 2568",
    cancelledBy: "สมศักดิ์ การเงิน",
    cancelReason: "บัญชีธนาคารไม่ถูกต้อง",
  },
]

const periods = [
  { id: "PERIOD-2568-08", name: "ส.ค. 2568" },
  { id: "PERIOD-2568-07", name: "ก.ค. 2568" },
  { id: "PERIOD-2568-06", name: "มิ.ย. 2568" },
]

export default function PayoutsPage() {
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<typeof payouts[0] | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount)
  }

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter
    const matchesPeriod = periodFilter === "all" || payout.periodId === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  const pendingPayouts = filteredPayouts.filter((p) => p.status === "pending")
  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayouts(pendingPayouts.map((p) => p.id))
    } else {
      setSelectedPayouts([])
    }
  }

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayouts([...selectedPayouts, payoutId])
    } else {
      setSelectedPayouts(selectedPayouts.filter((id) => id !== payoutId))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <Wallet className="mr-1 h-3 w-3" />
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
        <h1 className="text-3xl font-bold text-foreground">การจ่ายเงิน</h1>
        <p className="mt-2 text-muted-foreground">
          จัดการรายการจ่ายเงิน พ.ต.ส. ที่ผ่านการอนุมัติ
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอจ่ายเงิน</p>
                <p className="text-2xl font-bold text-amber-600">{pendingPayouts.length}</p>
              </div>
              <Wallet className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวมรอจ่าย</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalPendingAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">เลือกแล้ว</p>
                <p className="text-2xl font-bold">{selectedPayouts.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดที่เลือก</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    payouts
                      .filter((p) => selectedPayouts.includes(p.id))
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, รหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอจ่ายเงิน</SelectItem>
                  <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[160px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="รอบจ่าย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกรอบ</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              {selectedPayouts.length > 0 && (
                <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      จ่ายเงิน ({selectedPayouts.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ยืนยันการจ่ายเงิน</DialogTitle>
                      <DialogDescription>
                        คุณกำลังจะทำเครื่องหมายจ่ายเงินแล้ว {selectedPayouts.length} รายการ
                        <br />
                        ยอดรวม:{" "}
                        <span className="font-semibold text-green-600">
                          {formatCurrency(
                            payouts
                              .filter((p) => selectedPayouts.includes(p.id))
                              .reduce((sum, p) => sum + p.amount, 0)
                          )}{" "}
                          บาท
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
                        ยกเลิก
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setShowMarkPaidDialog(false)
                          setSelectedPayouts([])
                        }}
                      >
                        ยืนยันจ่ายเงิน
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            รายการจ่ายเงิน
            <Badge variant="secondary" className="ml-2">
              {filteredPayouts.length} รายการ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      pendingPayouts.length > 0 &&
                      pendingPayouts.every((p) => selectedPayouts.includes(p.id))
                    }
                    onCheckedChange={handleSelectAll}
                    disabled={pendingPayouts.length === 0}
                  />
                </TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ผู้รับเงิน</TableHead>
                <TableHead>ว���ชาชีพ/หน่วยงาน</TableHead>
                <TableHead>รอบจ่าย</TableHead>
                <TableHead>บัญชีธนาคาร</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-[100px]">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {payout.status === "pending" && (
                      <Checkbox
                        checked={selectedPayouts.includes(payout.id)}
                        onCheckedChange={(checked) =>
                          handleSelectPayout(payout.id, checked as boolean)
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/finance-officer/payouts/${payout.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {payout.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{payout.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{payout.profession}</p>
                      <p className="text-xs text-muted-foreground">{payout.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payout.period}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{payout.bankName}</p>
                      <p className="text-xs text-muted-foreground">{payout.bankAccount}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(payout.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell>
                    {payout.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedPayout(payout)
                            setShowMarkPaidDialog(true)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Dialog open={showCancelDialog && selectedPayout?.id === payout.id} onOpenChange={(open) => {
                          setShowCancelDialog(open)
                          if (!open) setSelectedPayout(null)
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setSelectedPayout(payout)}
                            >
                              <XCircle className="h-4 w-4" />
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
                              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                ปิด
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  setShowCancelDialog(false)
                                  setSelectedPayout(null)
                                }}
                              >
                                ยืนยันยกเลิก
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
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
