"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Megaphone,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react"

// TODO: add icon when announcement statuses include rejection: XCircle

const mockAnnouncements = [
  {
    id: 1,
    title: "ประกาศวันหยุดสงกรานต์ 2568",
    content: "วันที่ 13-16 เมษายน 2568 เป็นวันหยุดราชการ กรุณาส่งคำขอ พ.ต.ส. ก่อนวันที่ 10 เมษายน 2568",
    startDate: "1 เม.ย. 2568",
    endDate: "16 เม.ย. 2568",
    status: "active",
    priority: "high",
    createdBy: "ผู้ดูแลระบบ",
    createdAt: "28 มี.ค. 2568",
  },
  {
    id: 2,
    title: "แจ้งปรับปรุงระบบ",
    content: "ระบบจะปิดปรับปรุงในวันเสาร์ที่ 15 ก.พ. 2568 เวลา 22:00 - 06:00 น.",
    startDate: "10 ก.พ. 2568",
    endDate: "16 ก.พ. 2568",
    status: "active",
    priority: "normal",
    createdBy: "ผู้ดูแลระบบ",
    createdAt: "8 ก.พ. 2568",
  },
  {
    id: 3,
    title: "รอบจ่ายเงิน พ.ต.ส. ประจำเดือน ม.ค. 2568",
    content: "รอบจ่ายเงิน พ.ต.ส. ประจำเดือน ม.ค. 2568 อนุมัติเรียบร้อยแล้ว คาดว่าจะโอนเข้าบัญชีวันที่ 5 ก.พ. 2568",
    startDate: "1 ก.พ. 2568",
    endDate: "10 ก.พ. 2568",
    status: "active",
    priority: "normal",
    createdBy: "ผู้ดูแลระบบ",
    createdAt: "1 ก.พ. 2568",
  },
  {
    id: 4,
    title: "ประกาศวันหยุดปีใหม่ 2568",
    content: "วันที่ 30 ธ.ค. 2567 - 2 ม.ค. 2568 เป็นวันหยุดราชการ",
    startDate: "25 ธ.ค. 2567",
    endDate: "3 ม.ค. 2568",
    status: "inactive",
    priority: "high",
    createdBy: "ผู้ดูแลระบบ",
    createdAt: "20 ธ.ค. 2567",
  },
]

export default function AnnouncementsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    startDate: "",
    endDate: "",
    priority: "normal",
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการประกาศ</h1>
          <p className="text-muted-foreground">
            สร้างและจัดการประกาศที่แสดงให้ผู้ใช้เห็น
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างประกาศใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">3</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-muted-foreground">1</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ใกล้หมดอายุ</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">1</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">รายการประกาศ</CardTitle>
          <CardDescription>ประกาศทั้งหมดในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>ช่วงเวลาแสดง</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>สร้างโดย</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAnnouncements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {announcement.startDate} - {announcement.endDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    {announcement.priority === "high" ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        สำคัญ
                      </Badge>
                    ) : (
                      <Badge variant="outline">ปกติ</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {announcement.status === "active" ? (
                      <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                        <Eye className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>
                      <p>{announcement.createdBy}</p>
                      <p className="text-xs">{announcement.createdAt}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          แก้ไข
                        </DropdownMenuItem>
                        {announcement.status === "active" ? (
                          <DropdownMenuItem>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>สร้างประกาศใหม่</DialogTitle>
            <DialogDescription>
              ประกาศจะแสดงให้ผู้ใช้ทุกคนเห็นตามช่วงเวลาที่กำหนด
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>หัวข้อประกาศ</Label>
              <Input
                placeholder="เช่น ประกาศวันหยุดสงกรานต์"
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>เนื้อหา</Label>
              <Textarea
                placeholder="รายละเอียดของประกาศ..."
                rows={4}
                value={newAnnouncement.content}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่เริ่มแสดง</Label>
                <Input
                  type="date"
                  value={newAnnouncement.startDate}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่สิ้นสุด</Label>
                <Input
                  type="date"
                  value={newAnnouncement.endDate}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ความสำคัญ</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={newAnnouncement.priority === "normal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: "normal" })}
                >
                  ปกติ
                </Button>
                <Button
                  type="button"
                  variant={newAnnouncement.priority === "high" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: "high" })}
                >
                  สำคัญ
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => setIsCreateOpen(false)}>
              สร้างประกาศ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
