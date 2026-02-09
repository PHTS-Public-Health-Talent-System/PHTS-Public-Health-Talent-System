"use client"

import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  User,
  Shield,
  RefreshCw,
  Ban,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

// TODO: add icon when document panel is implemented: FileText

// Mock user data
const mockUser = {
  id: 1,
  citizenId: "1-xxxx-xxxxx-01-0",
  fullName: "สมชาย ใจดี",
  email: "somchai@hospital.go.th",
  phone: "081-xxx-xxxx",
  department: "กลุ่มงานอายุรกรรม",
  ward: "หอผู้ป่วยอายุรกรรมชาย 1",
  position: "พยาบาลวิชาชีพชำนาญการ",
  positionLevel: "ชำนาญการ",
  employeeType: "ข้าราชการ",
  role: "USER",
  status: "active",
  lastLogin: "5 นาทีที่แล้ว",
  createdAt: "15 ม.ค. 2566",
  lastSyncAt: "1 ม.ค. 2568",
  licenses: [
    { name: "ใบอนุญาตประกอบวิชาชีพการพยาบาล", number: "พว. 12345", expireDate: "31 ธ.ค. 2569", status: "active" },
  ],
  scopes: [
    { type: "WARD", name: "หอผู้ป่วยอายุรกรรมชาย 1", role: "USER" },
  ],
}

const mockAuditLogs = [
  { id: 1, action: "LOGIN", details: "เข้าสู่ระบบ", timestamp: "5 นาทีที่แล้ว", ip: "192.168.1.100" },
  { id: 2, action: "REQUEST_CREATE", details: "สร้างคำขอ #REQ-2568-0125", timestamp: "1 ชั่วโมงที่แล้ว", ip: "192.168.1.100" },
  { id: 3, action: "REQUEST_SUBMIT", details: "ส่งคำขอ #REQ-2568-0125", timestamp: "1 ชั่วโมงที่แล้ว", ip: "192.168.1.100" },
  { id: 4, action: "LOGIN", details: "เข้าสู่ระบบ", timestamp: "1 วันที่แล้ว", ip: "192.168.1.100" },
  { id: 5, action: "PROFILE_VIEW", details: "ดูโปรไฟล์ตัวเอง", timestamp: "1 วันที่แล้ว", ip: "192.168.1.100" },
]

const mockRoleHistory = [
  { id: 1, fromRole: "-", toRole: "USER", changedBy: "ระบบ (Sync)", timestamp: "15 ม.ค. 2566" },
]

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  void id

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{mockUser.fullName}</h1>
          <p className="text-muted-foreground">{mockUser.citizenId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync ข้อมูล
          </Button>
          <Button variant="outline" size="sm">
            <Shield className="mr-2 h-4 w-4" />
            เปลี่ยน Role
          </Button>
          <Button variant="destructive" size="sm">
            <Ban className="mr-2 h-4 w-4" />
            Disable
          </Button>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                <p className="text-sm font-medium text-foreground">{mockUser.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เลขบัตรประชาชน</p>
                <p className="text-sm font-medium text-foreground">{mockUser.citizenId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {mockUser.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {mockUser.phone}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">หน่วยงาน</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {mockUser.department}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">หอผู้ป่วย/หน่วย</p>
                <p className="text-sm font-medium text-foreground">{mockUser.ward}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                <p className="text-sm font-medium text-foreground">{mockUser.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ประเภทบุคลากร</p>
                <p className="text-sm font-medium text-foreground">{mockUser.employeeType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg">สถานะในระบบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                {mockUser.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">สถานะ</span>
              <Badge
                variant="outline"
                className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">เข้าใช้งานล่าสุด</span>
              <span className="text-sm text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {mockUser.lastLogin}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">สร้างเมื่อ</span>
              <span className="text-sm text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {mockUser.createdAt}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sync ล่าสุด</span>
              <span className="text-sm text-foreground">{mockUser.lastSyncAt}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="licenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="licenses">ใบอนุญาต</TabsTrigger>
          <TabsTrigger value="scopes">Scopes</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="role-history">ประวัติ Role</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">ใบอนุญาตประกอบวิชาชีพ</CardTitle>
              <CardDescription>ข้อมูลจาก HRMS</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ประเภทใบอนุญาต</TableHead>
                    <TableHead>เลขที่</TableHead>
                    <TableHead>วันหมดอายุ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUser.licenses.map((license, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell>{license.number}</TableCell>
                      <TableCell>{license.expireDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                        >
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scopes">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Scopes ที่เข้าถึงได้</CardTitle>
              <CardDescription>หน่วยงานที่ผู้ใช้สามารถเข้าถึงข้อมูลได้</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>Role ใน Scope</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUser.scopes.map((scope, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{scope.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{scope.name}</TableCell>
                      <TableCell>{scope.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Audit Logs</CardTitle>
              <CardDescription>ประวัติการใช้งานระบบของผู้ใช้</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>เวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                      <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-history">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">ประวัติการเปลี่ยน Role</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>จาก Role</TableHead>
                    <TableHead>เป็น Role</TableHead>
                    <TableHead>เปลี่ยนโดย</TableHead>
                    <TableHead>เวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRoleHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{history.fromRole}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{history.toRole}</Badge>
                      </TableCell>
                      <TableCell>{history.changedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{history.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
