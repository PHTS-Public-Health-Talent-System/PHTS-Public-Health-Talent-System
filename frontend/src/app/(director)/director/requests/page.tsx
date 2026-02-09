"use client"

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
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  CheckCheck,
} from "lucide-react"
import Link from "next/link"

const requests = [
  {
    id: "REQ-2568-001234",
    name: "นางสาวสมหญิง ใจดี",
    position: "พยาบาลวิชาชีพชำนาญการ",
    department: "ICU",
    amount: 12500,
    submittedAt: "28 ม.ค. 68",
    currentStep: 6,
    slaStatus: "normal",
    daysInQueue: 1,
    approvedBy: "หัวหน้าการเงิน",
  },
  {
    id: "REQ-2568-001235",
    name: "นายสมชาย รักงาน",
    position: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    department: "ER",
    amount: 15800,
    submittedAt: "27 ม.ค. 68",
    currentStep: 6,
    slaStatus: "warning",
    daysInQueue: 2,
    approvedBy: "หัวหน้าการเงิน",
  },
  {
    id: "REQ-2568-001236",
    name: "นางมาลี รักษ์พยาบาล",
    position: "พยาบาลวิชาชีพชำนาญการ",
    department: "OPD",
    amount: 11200,
    submittedAt: "25 ม.ค. 68",
    currentStep: 6,
    slaStatus: "overdue",
    daysInQueue: 4,
    approvedBy: "หัวหน้าการเงิน",
  },
  {
    id: "REQ-2568-001237",
    name: "นางสาวพิมพ์ใจ ดีเสมอ",
    position: "พยาบาลวิชาชีพปฏิบัติการ",
    department: "Ward 5",
    amount: 9800,
    submittedAt: "26 ม.ค. 68",
    currentStep: 6,
    slaStatus: "normal",
    daysInQueue: 3,
    approvedBy: "หัวหน้าการเงิน",
  },
  {
    id: "REQ-2568-001238",
    name: "นายวิชัย มั่นคง",
    position: "พยาบาลวิชาชีพชำนาญการ",
    department: "OR",
    amount: 13500,
    submittedAt: "24 ม.ค. 68",
    currentStep: 6,
    slaStatus: "warning",
    daysInQueue: 5,
    approvedBy: "หัวหน้าการเงิน",
  },
]

export default function DirectorRequestsPage() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSLA, setFilterSLA] = useState("all")
  const [showBatchApproveDialog, setShowBatchApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [returnReason, setReturnReason] = useState("")

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSLA = filterSLA === "all" || request.slaStatus === filterSLA
    return matchesSearch && matchesSLA
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map((r) => r.id))
    } else {
      setSelectedRequests([])
    }
  }

  const handleSelectRequest = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, id])
    } else {
      setSelectedRequests(selectedRequests.filter((r) => r !== id))
    }
  }

  const handleBatchApprove = () => {
    // Implement batch approve logic
    setShowBatchApproveDialog(false)
    setSelectedRequests([])
  }

  const handleReject = () => {
    // Implement reject logic
    setShowRejectDialog(false)
    setSelectedRequest(null)
    setRejectReason("")
  }

  const handleReturn = () => {
    // Implement return logic
    setShowReturnDialog(false)
    setSelectedRequest(null)
    setReturnReason("")
  }

  const totalAmount = selectedRequests.reduce((sum, id) => {
    const request = requests.find((r) => r.id === id)
    return sum + (request?.amount || 0)
  }, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">คำขอรออนุมัติ</h1>
        <p className="mt-1 text-muted-foreground">
          คำขอที่ผ่านการอนุมัติจากหัวหน้าการเงินแล้ว รอ Director อนุมัติ (Step 6 - ขั้นสุดท้าย)
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">รอดำเนินการ</div>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">เกิน SLA</div>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter((r) => r.slaStatus === "overdue").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">ใกล้ครบกำหนด</div>
            <div className="text-2xl font-bold text-amber-600">
              {requests.filter((r) => r.slaStatus === "warning").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">เลือกแล้ว</div>
            <div className="text-2xl font-bold text-primary">
              {selectedRequests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, เลขคำขอ, แผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterSLA} onValueChange={setFilterSLA}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="สถานะ SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="normal">ปกติ</SelectItem>
                  <SelectItem value="warning">ใกล้ครบกำหนด</SelectItem>
                  <SelectItem value="overdue">เกิน SLA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  เลือก {selectedRequests.length} รายการ (รวม {totalAmount.toLocaleString()} บาท)
                </span>
                <Button
                  onClick={() => setShowBatchApproveDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  อนุมัติทั้งหมด
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>เลขคำขอ</TableHead>
                <TableHead>ผู้ขอ</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ SLA</TableHead>
                <TableHead>รออยู่</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRequests.includes(request.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRequest(request.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{request.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-muted-foreground">{request.position}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {request.amount.toLocaleString()} บาท
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.slaStatus === "overdue"
                          ? "destructive"
                          : request.slaStatus === "warning"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {request.slaStatus === "overdue"
                        ? "เกิน SLA"
                        : request.slaStatus === "warning"
                        ? "ใกล้ครบ"
                        : "ปกติ"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {request.daysInQueue} วัน
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/director/requests/${request.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          setSelectedRequest(request.id)
                          setShowBatchApproveDialog(true)
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => {
                          setSelectedRequest(request.id)
                          setShowReturnDialog(true)
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedRequest(request.id)
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

      {/* Batch Approve Dialog */}
      <Dialog open={showBatchApproveDialog} onOpenChange={setShowBatchApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
            <DialogDescription>
              {selectedRequest
                ? "คุณต้องการอนุมัติคำขอนี้หรือไม่?"
                : `คุณต้องการอนุมัติคำขอทั้ง ${selectedRequests.length} รายการ รวม ${totalAmount.toLocaleString()} บาท หรือไม่?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchApproveDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleBatchApprove} className="bg-green-600 hover:bg-green-700">
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
              กรุณาระบุเหตุผลในการไม่อนุมัติคำขอนี้
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
              กรุณาระบุเหตุผลในการส่งคำขอกลับให้แก้ไข
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
              onClick={handleReturn}
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
