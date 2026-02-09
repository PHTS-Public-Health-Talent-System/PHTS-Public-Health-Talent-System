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
  Search,
  Download,
  Filter,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  User,
  Shield,
  Database,
} from "lucide-react"
// TODO: add icons when audit UI expands: AlertTriangle, RefreshCw

const actionTypes = [
  { value: "all", label: "ทุก Action" },
  { value: "LOGIN", label: "LOGIN" },
  { value: "LOGOUT", label: "LOGOUT" },
  { value: "ROLE_CHANGE", label: "ROLE_CHANGE" },
  { value: "REQUEST_CREATE", label: "REQUEST_CREATE" },
  { value: "REQUEST_APPROVE", label: "REQUEST_APPROVE" },
  { value: "REQUEST_REJECT", label: "REQUEST_REJECT" },
  { value: "PAYROLL_CREATE", label: "PAYROLL_CREATE" },
  { value: "SYNC_TRIGGER", label: "SYNC_TRIGGER" },
  { value: "ANNOUNCEMENT_CREATE", label: "ANNOUNCEMENT_CREATE" },
]

const mockAuditLogs = [
  {
    id: 1,
    action: "LOGIN",
    user: "สมชาย ใจดี",
    userRole: "USER",
    target: "Session Created",
    details: "Login successful via citizen_id",
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
    timestamp: "02/02/2568 14:35:22",
    status: "success",
  },
  {
    id: 2,
    action: "ROLE_CHANGE",
    user: "ผู้ดูแลระบบ",
    userRole: "ADMIN",
    target: "วิชัย สมบูรณ์",
    details: "Role changed: USER → HEAD_WARD",
    ip: "192.168.1.50",
    userAgent: "Chrome/120.0.0.0",
    timestamp: "02/02/2568 14:20:15",
    status: "success",
  },
  {
    id: 3,
    action: "REQUEST_APPROVE",
    user: "ประสิทธิ์ มั่นคง",
    userRole: "PTS_OFFICER",
    target: "REQ-2568-0125",
    details: "Request approved at Step 3",
    ip: "192.168.1.75",
    userAgent: "Firefox/121.0",
    timestamp: "02/02/2568 14:15:00",
    status: "success",
  },
  {
    id: 4,
    action: "PAYROLL_CREATE",
    user: "ประสิทธิ์ มั่นคง",
    userRole: "PTS_OFFICER",
    target: "PAY-2568-02",
    details: "Payroll period created for ก.พ. 2568",
    ip: "192.168.1.75",
    userAgent: "Firefox/121.0",
    timestamp: "02/02/2568 13:45:30",
    status: "success",
  },
  {
    id: 5,
    action: "SYNC_TRIGGER",
    user: "ผู้ดูแลระบบ",
    userRole: "ADMIN",
    target: "HRMS Full Sync",
    details: "Manual sync triggered, 1,234 users synced",
    ip: "192.168.1.50",
    userAgent: "Chrome/120.0.0.0",
    timestamp: "02/02/2568 12:00:00",
    status: "success",
  },
  {
    id: 6,
    action: "LOGIN",
    user: "Unknown",
    userRole: "-",
    target: "Session Failed",
    details: "Login failed: invalid credentials",
    ip: "203.150.xxx.xxx",
    userAgent: "Chrome/120.0.0.0",
    timestamp: "02/02/2568 11:45:22",
    status: "failed",
  },
  {
    id: 7,
    action: "ANNOUNCEMENT_CREATE",
    user: "ผู้ดูแลระบบ",
    userRole: "ADMIN",
    target: "ประกาศวันหยุดสงกรานต์",
    details: "Announcement created and activated",
    ip: "192.168.1.50",
    userAgent: "Chrome/120.0.0.0",
    timestamp: "02/02/2568 10:30:00",
    status: "success",
  },
  {
    id: 8,
    action: "REQUEST_CREATE",
    user: "สุภาพร ดีงาม",
    userRole: "HEAD_WARD",
    target: "REQ-2568-0126",
    details: "Request created as draft",
    ip: "192.168.1.110",
    userAgent: "Safari/17.2",
    timestamp: "02/02/2568 09:15:00",
    status: "success",
  },
]

function getActionIcon(action: string) {
  switch (action) {
    case "LOGIN":
    case "LOGOUT":
      return User
    case "ROLE_CHANGE":
      return Shield
    case "SYNC_TRIGGER":
      return Database
    case "REQUEST_CREATE":
    case "REQUEST_APPROVE":
    case "REQUEST_REJECT":
    case "PAYROLL_CREATE":
    case "ANNOUNCEMENT_CREATE":
      return FileText
    default:
      return FileText
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "LOGIN":
    case "LOGOUT":
      return "bg-primary/10 text-primary border-primary/30"
    case "ROLE_CHANGE":
      return "bg-purple-500/10 text-purple-600 border-purple-500/30"
    case "REQUEST_APPROVE":
    case "PAYROLL_CREATE":
    case "ANNOUNCEMENT_CREATE":
      return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
    case "REQUEST_REJECT":
      return "bg-destructive/10 text-destructive border-destructive/30"
    case "SYNC_TRIGGER":
      return "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesAction && matchesStatus
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">
            บันทึกการใช้งานระบบทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs (30 วัน)</p>
                <p className="text-2xl font-bold text-foreground">45,234</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">44,890</p>
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
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">344</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">วันนี้</p>
                <p className="text-2xl font-bold text-primary">2,340</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
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
                placeholder="ค้นหาผู้ใช้, target, รายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
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
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">รายการ Audit Logs</CardTitle>
          <CardDescription>แสดง {filteredLogs.length} รายการล่าสุด</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action)
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        <ActionIcon className="mr-1 h-3 w-3" />
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.user}</p>
                        <p className="text-xs text-muted-foreground">{log.userRole}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-[150px] truncate">
                      {log.target}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip}
                    </TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
