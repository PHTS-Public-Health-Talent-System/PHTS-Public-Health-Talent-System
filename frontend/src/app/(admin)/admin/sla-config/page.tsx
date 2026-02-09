"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import {
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Settings,
  RefreshCw,
} from "lucide-react"

// TODO: add icon when SLA calendar view is implemented: Calendar

const slaConfig = [
  {
    step: 1,
    name: "หัวหน้าหอผู้ป่วย (HEAD_WARD)",
    role: "HEAD_WARD",
    slaHours: 48,
    warningHours: 36,
    enabled: true,
  },
  {
    step: 2,
    name: "หัวหน้ากลุ่มงาน (HEAD_DEPT)",
    role: "HEAD_DEPT",
    slaHours: 48,
    warningHours: 36,
    enabled: true,
  },
  {
    step: 3,
    name: "เจ้าหน้าที่ พ.ต.ส. (PTS_OFFICER)",
    role: "PTS_OFFICER",
    slaHours: 72,
    warningHours: 48,
    enabled: true,
  },
  {
    step: 4,
    name: "หัวหน้างานบุคคล (HEAD_HR)",
    role: "HEAD_HR",
    slaHours: 48,
    warningHours: 36,
    enabled: true,
  },
  {
    step: 5,
    name: "หัวหน้าการเงิน (HEAD_FINANCE)",
    role: "HEAD_FINANCE",
    slaHours: 48,
    warningHours: 36,
    enabled: true,
  },
  {
    step: 6,
    name: "ผู้อำนวยการ (DIRECTOR)",
    role: "DIRECTOR",
    slaHours: 72,
    warningHours: 48,
    enabled: true,
  },
]

const slaPendingItems = [
  {
    id: 1,
    requestId: "REQ-2568-0120",
    requester: "สมชาย ใจดี",
    currentStep: 3,
    currentApprover: "PTS_OFFICER",
    waitingHours: 78,
    slaHours: 72,
    status: "overdue",
  },
  {
    id: 2,
    requestId: "REQ-2568-0122",
    requester: "สุภาพร ดีงาม",
    currentStep: 1,
    currentApprover: "HEAD_WARD",
    waitingHours: 52,
    slaHours: 48,
    status: "overdue",
  },
  {
    id: 3,
    requestId: "REQ-2568-0124",
    requester: "วิชัย สมบูรณ์",
    currentStep: 4,
    currentApprover: "HEAD_HR",
    waitingHours: 40,
    slaHours: 48,
    status: "warning",
  },
]

export default function SLAConfigPage() {
  const [config, setConfig] = useState(slaConfig)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<typeof slaConfig[0] | null>(null)
  const [reminderEnabled, setReminderEnabled] = useState(true)

  const handleEdit = (step: typeof slaConfig[0]) => {
    setEditingStep({ ...step })
    setIsEditOpen(true)
  }

  const handleSave = () => {
    if (editingStep) {
      setConfig(config.map((c) => (c.step === editingStep.step ? editingStep : c)))
      setIsEditOpen(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ตั้งค่า SLA</h1>
          <p className="text-muted-foreground">
            กำหนดเวลาที่ต้องดำเนินการในแต่ละขั้นตอน
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            ส่ง Reminder ทั้งหมด
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">เกิน SLA</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ใกล้เกิน SLA</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">1</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">อัตราทัน SLA (30 วัน)</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">94.2%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SLA Configuration */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ตั้งค่า SLA ตามขั้นตอน
            </CardTitle>
            <CardDescription>กำหนดเวลา SLA และเวลาเตือนสำหรับแต่ละขั้นตอน</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ขั้นตอน</TableHead>
                  <TableHead>SLA (ชม.)</TableHead>
                  <TableHead>เตือน (ชม.)</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.map((step) => (
                  <TableRow key={step.step}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">Step {step.step}</p>
                        <p className="text-xs text-muted-foreground">{step.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{step.slaHours} ชม.</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        {step.warningHours} ชม.
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {step.enabled ? (
                        <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="outline">ปิด</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(step)}>
                        แก้ไข
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              ตั้งค่าการแจ้งเตือน
            </CardTitle>
            <CardDescription>กำหนดการแจ้งเตือนอัตโนมัติเมื่อใกล้หรือเกิน SLA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>เปิดการแจ้งเตือนอัตโนมัติ</Label>
                <p className="text-sm text-muted-foreground">
                  ส่งการแจ้งเตือนเมื่อใกล้หรือเกิน SLA
                </p>
              </div>
              <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">แจ้งเตือนครั้งแรก</p>
                  <p className="text-xs text-muted-foreground">เมื่อถึงเวลาเตือน</p>
                </div>
                <Badge variant="outline">In-App + Email</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">แจ้งเตือนครั้งที่ 2</p>
                  <p className="text-xs text-muted-foreground">2 ชม. ก่อนเกิน SLA</p>
                </div>
                <Badge variant="outline">In-App + Email + SMS</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">แจ้งเตือนเกิน SLA</p>
                  <p className="text-xs text-muted-foreground">เมื่อเกินเวลา SLA</p>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                  In-App + Email + SMS + หัวหน้า
                </Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              ตรวจสอบและส่ง Reminder ที่ค้าง
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">คำขอที่เกิน/ใกล้เกิน SLA</CardTitle>
          <CardDescription>รายการที่ต้องดำเนินการเร่งด่วน</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสคำขอ</TableHead>
                <TableHead>ผู้ขอ</TableHead>
                <TableHead>ขั้นตอนปัจจุบัน</TableHead>
                <TableHead>รอดำเนินการ</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaPendingItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">
                    {item.requestId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.requester}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Step {item.currentStep} - {item.currentApprover}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={item.status === "overdue" ? "text-destructive font-medium" : "text-[hsl(var(--warning))] font-medium"}>
                      {item.waitingHours} ชม.
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.slaHours} ชม.</TableCell>
                  <TableCell>
                    {item.status === "overdue" ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        เกิน SLA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        <Clock className="mr-1 h-3 w-3" />
                        ใกล้เกิน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      <Bell className="mr-1 h-4 w-4" />
                      ส่ง Reminder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขค่า SLA - Step {editingStep?.step}</DialogTitle>
            <DialogDescription>{editingStep?.name}</DialogDescription>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>เวลา SLA (ชั่วโมง)</Label>
                <Input
                  type="number"
                  value={editingStep.slaHours}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, slaHours: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  เวลาสูงสุดที่อนุญาตให้ดำเนินการในขั้นตอนนี้
                </p>
              </div>
              <div className="space-y-2">
                <Label>เวลาเตือน (ชั่วโมง)</Label>
                <Input
                  type="number"
                  value={editingStep.warningHours}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, warningHours: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  ระบบจะส่งการแจ้งเตือนเมื่อถึงเวลานี้
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>เปิดใช้งาน SLA</Label>
                  <p className="text-xs text-muted-foreground">
                    ติดตาม SLA สำหรับขั้นตอนนี้
                  </p>
                </div>
                <Switch
                  checked={editingStep.enabled}
                  onCheckedChange={(checked) =>
                    setEditingStep({ ...editingStep, enabled: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
