"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Send,
  RefreshCw,
  Calendar,
  Users,
} from "lucide-react"

// TODO: add icon when access review actions are finalized: Shield

const mockCycles = [
  {
    id: 1,
    name: "Q2/2568",
    startDate: "1 เม.ย. 2568",
    endDate: "15 เม.ย. 2568",
    status: "active",
    totalItems: 45,
    reviewed: 17,
    pending: 28,
  },
  {
    id: 2,
    name: "Q1/2568",
    startDate: "1 ม.ค. 2568",
    endDate: "15 ม.ค. 2568",
    status: "completed",
    totalItems: 52,
    reviewed: 52,
    pending: 0,
  },
]

const mockReviewItems = [
  {
    id: 1,
    user: "สุภาพร ดีงาม",
    citizenId: "1-xxxx-xxxxx-02-0",
    department: "กลุ่มงานอายุรกรรม",
    role: "HEAD_WARD",
    lastActivity: "2 ชั่วโมงที่แล้ว",
    status: "pending",
    daysRemaining: 3,
  },
  {
    id: 2,
    user: "ประสิทธิ์ มั่นคง",
    citizenId: "1-xxxx-xxxxx-04-0",
    department: "กลุ่มงานทรัพยากรบุคคล",
    role: "PTS_OFFICER",
    lastActivity: "30 นาทีที่แล้ว",
    status: "pending",
    daysRemaining: 5,
  },
  {
    id: 3,
    user: "วิชัย สมบูรณ์",
    citizenId: "1-xxxx-xxxxx-03-0",
    department: "กลุ่มงานศัลยกรรม",
    role: "HEAD_DEPT",
    lastActivity: "1 วันที่แล้ว",
    status: "pending",
    daysRemaining: 5,
  },
  {
    id: 4,
    user: "พรทิพย์ สุขใจ",
    citizenId: "1-xxxx-xxxxx-05-0",
    department: "กลุ่มงานทรัพยากรบุคคล",
    role: "HEAD_HR",
    lastActivity: "15 นาทีที่แล้ว",
    status: "approved",
    daysRemaining: 0,
  },
  {
    id: 5,
    user: "สมหมาย หยุดงาน",
    citizenId: "1-xxxx-xxxxx-09-0",
    department: "กลุ่มงานอายุรกรรม",
    role: "HEAD_WARD",
    lastActivity: "45 วันที่แล้ว",
    status: "flagged",
    daysRemaining: 2,
  },
]

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-destructive/10 text-destructive border-destructive/30"
    case "DIRECTOR":
      return "bg-purple-500/10 text-purple-600 border-purple-500/30"
    case "HEAD_HR":
    case "HEAD_FINANCE":
      return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
    case "PTS_OFFICER":
    case "FINANCE_OFFICER":
      return "bg-primary/10 text-primary border-primary/30"
    case "HEAD_WARD":
    case "HEAD_DEPT":
      return "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function AccessReviewPage() {
  const [selectedCycle, setSelectedCycle] = useState("1")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false)

  const activeCycle = mockCycles.find((c) => c.id === parseInt(selectedCycle))
  const progress = activeCycle ? (activeCycle.reviewed / activeCycle.totalItems) * 100 : 0

  const filteredItems = mockReviewItems.filter((item) => {
    if (statusFilter === "all") return true
    return item.status === statusFilter
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ตรวจสอบสิทธิ์ (Access Review)</h1>
          <p className="text-muted-foreground">
            ตรวจสอบและยืนยันสิทธิ์การเข้าถึงของผู้ใช้ตามรอบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            ส่ง Reminder
          </Button>
          <Button size="sm" onClick={() => setIsCreateCycleOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            สร้าง Cycle ใหม่
          </Button>
        </div>
      </div>

      {/* Cycle Selector & Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Review Cycle</CardTitle>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name} {cycle.status === "active" && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeCycle && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {activeCycle.startDate} - {activeCycle.endDate}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      activeCycle.status === "active"
                        ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {activeCycle.status === "active" ? "Active" : "Completed"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ความคืบหน้า</span>
                    <span className="font-medium text-foreground">
                      {activeCycle.reviewed}/{activeCycle.totalItems} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{activeCycle.totalItems}</p>
                    <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-[hsl(var(--success))]">{activeCycle.reviewed}</p>
                    <p className="text-xs text-muted-foreground">ตรวจสอบแล้ว</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-[hsl(var(--warning))]">{activeCycle.pending}</p>
                    <p className="text-xs text-muted-foreground">รอตรวจสอบ</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg">สรุปสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[hsl(var(--warning))]" />
                <span className="text-sm text-muted-foreground">รอตรวจสอบ</span>
              </div>
              <span className="font-medium text-foreground">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[hsl(var(--success))]" />
                <span className="text-sm text-muted-foreground">อนุมัติแล้ว</span>
              </div>
              <span className="font-medium text-foreground">1</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">ต้องตรวจสอบ</span>
              </div>
              <span className="font-medium text-foreground">1</span>
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Auto-disable ผู้ไม่ใช้งาน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Items */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">รายการตรวจสอบ</CardTitle>
              <CardDescription>ผู้ใช้ที่มี Role พิเศษต้องได้รับการตรวจสอบ</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="flagged">ต้องตรวจสอบ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>หน่วยงาน</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ใช้งานล่าสุด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{item.user}</p>
                      <p className="text-xs text-muted-foreground">{item.citizenId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.department}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(item.role)}>
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.lastActivity}
                  </TableCell>
                  <TableCell>
                    {item.status === "pending" && (
                      <Badge variant="outline" className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        <Clock className="mr-1 h-3 w-3" />
                        รอตรวจสอบ
                      </Badge>
                    )}
                    {item.status === "approved" && (
                      <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        อนุมัติแล้ว
                      </Badge>
                    )}
                    {item.status === "flagged" && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        ต้องตรวจสอบ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status !== "approved" && (
                        <>
                          <Button size="sm" variant="outline" className="text-[hsl(var(--success))]">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            อนุมัติ
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive">
                            <XCircle className="mr-1 h-4 w-4" />
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Cycle Dialog */}
      <Dialog open={isCreateCycleOpen} onOpenChange={setIsCreateCycleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Review Cycle ใหม่</DialogTitle>
            <DialogDescription>
              สร้างรอบตรวจสอบสิทธิ์ใหม่สำหรับผู้ใช้ที่มี Role พิเศษ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              ระบบจะสร้างรายการตรวจสอบสำหรับผู้ใช้ทุกคนที่มี Role สูงกว่า USER โดยอัตโนมัติ
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">จะสร้างรายการตรวจสอบ:</span>
                <span className="font-medium text-foreground">48 รายการ</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCycleOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => setIsCreateCycleOpen(false)}>
              สร้าง Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
