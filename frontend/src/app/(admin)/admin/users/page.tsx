"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCog,
  RefreshCw,
  Shield,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import Link from "next/link"

const roleOptions = [
  { value: "USER", label: "USER" },
  { value: "HEAD_WARD", label: "HEAD_WARD" },
  { value: "HEAD_DEPT", label: "HEAD_DEPT" },
  { value: "PTS_OFFICER", label: "PTS_OFFICER" },
  { value: "HEAD_HR", label: "HEAD_HR" },
  { value: "HEAD_FINANCE", label: "HEAD_FINANCE" },
  { value: "FINANCE_OFFICER", label: "FINANCE_OFFICER" },
  { value: "DIRECTOR", label: "DIRECTOR" },
  { value: "ADMIN", label: "ADMIN" },
]

const mockUsers = [
  {
    id: 1,
    citizenId: "1-xxxx-xxxxx-01-0",
    fullName: "สมชาย ใจดี",
    department: "กลุ่มงานอายุรกรรม",
    position: "พยาบาลวิชาชีพชำนาญการ",
    role: "USER",
    status: "active",
    lastLogin: "5 นาทีที่แล้ว",
  },
  {
    id: 2,
    citizenId: "1-xxxx-xxxxx-02-0",
    fullName: "สุภาพร ดีงาม",
    department: "กลุ่มงานอายุรกรรม",
    position: "หัวหน้าหอผู้ป่วย",
    role: "HEAD_WARD",
    status: "active",
    lastLogin: "1 ชั่วโมงที่แล้ว",
  },
  {
    id: 3,
    citizenId: "1-xxxx-xxxxx-03-0",
    fullName: "วิชัย สมบูรณ์",
    department: "กลุ่มงานศัลยกรรม",
    position: "หัวหน้ากลุ่มงาน",
    role: "HEAD_DEPT",
    status: "active",
    lastLogin: "2 ชั่วโมงที่แล้ว",
  },
  {
    id: 4,
    citizenId: "1-xxxx-xxxxx-04-0",
    fullName: "ประสิทธิ์ มั่นคง",
    department: "กลุ่มงานทรัพยากรบุคคล",
    position: "นักทรัพยากรบุคคลชำนาญการ",
    role: "PTS_OFFICER",
    status: "active",
    lastLogin: "30 นาทีที่แล้ว",
  },
  {
    id: 5,
    citizenId: "1-xxxx-xxxxx-05-0",
    fullName: "พรทิพย์ สุขใจ",
    department: "กลุ่มงานทรัพยากรบุคคล",
    position: "หัวหน้ากลุ่มงานบริหารทรัพยากรบุคคล",
    role: "HEAD_HR",
    status: "active",
    lastLogin: "15 นาทีที่แล้ว",
  },
  {
    id: 6,
    citizenId: "1-xxxx-xxxxx-06-0",
    fullName: "อนันต์ รุ่งเรือง",
    department: "กลุ่มงานการเงิน",
    position: "หัวหน้ากลุ่มงานการเงิน",
    role: "HEAD_FINANCE",
    status: "active",
    lastLogin: "3 ชั่วโมงที่แล้ว",
  },
  {
    id: 7,
    citizenId: "1-xxxx-xxxxx-07-0",
    fullName: "มนัส ก้าวหน้า",
    department: "กลุ่มงานการเงิน",
    position: "นักวิชาการเงินและบัญชี",
    role: "FINANCE_OFFICER",
    status: "active",
    lastLogin: "45 นาทีที่แล้ว",
  },
  {
    id: 8,
    citizenId: "1-xxxx-xxxxx-08-0",
    fullName: "ดร.สมศักดิ์ ผู้นำ",
    department: "ผู้อำนวยการ",
    position: "ผู้อำนวยการโรงพยาบาล",
    role: "DIRECTOR",
    status: "active",
    lastLogin: "1 วันที่แล้ว",
  },
  {
    id: 9,
    citizenId: "1-xxxx-xxxxx-09-0",
    fullName: "สมหมาย หยุดงาน",
    department: "กลุ่มงานอายุรกรรม",
    position: "พยาบาลวิชาชีพปฏิบัติการ",
    role: "USER",
    status: "inactive",
    lastLogin: "30 วันที่แล้ว",
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

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.citizenId.includes(searchQuery) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleChangeRole = (user: typeof mockUsers[0]) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsRoleDialogOpen(true)
  }

  const confirmChangeRole = () => {
    // In a real app, this would call an API
    console.log(`Changing role of ${selectedUser?.fullName} to ${newRole}`)
    setIsRoleDialogOpen(false)
    setSelectedUser(null)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้</h1>
          <p className="text-muted-foreground">
            ค้นหาและจัดการผู้ใช้งานในระบบ
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync จาก HRMS
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground">1,234</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">1,180</p>
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
                <p className="text-2xl font-bold text-muted-foreground">54</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online ตอนนี้</p>
                <p className="text-2xl font-bold text-primary">89</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, เลขบัตรประชาชน, หน่วยงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุก Role</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">รายชื่อผู้ใช้</CardTitle>
          <CardDescription>แสดง {filteredUsers.length} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>หน่วยงาน</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เข้าใช้งานล่าสุด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.citizenId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.department}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.position}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <UserCog className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          เปลี่ยน Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync ข้อมูล
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />
                          {user.status === "active" ? "Disable" : "Enable"}
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

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยน Role ผู้ใช้</DialogTitle>
            <DialogDescription>
              เปลี่ยน Role ของ {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role ปัจจุบัน</Label>
              <Badge variant="outline" className={getRoleBadgeColor(selectedUser?.role || "")}>
                {selectedUser?.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Role ใหม่</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={confirmChangeRole} disabled={newRole === selectedUser?.role}>
              ยืนยันการเปลี่ยน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
