"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Shield,
  FileText,
  Megaphone,
  Activity,
  RefreshCw,
  Settings,
  CheckCircle2,
} from "lucide-react"
// TODO: add Link usage when admin dashboard needs inline navigation
import { PageHeader } from "@/components/page-header"
import { StatCards, type StatItem } from "@/components/stat-cards"
import { DataTableCard } from "@/components/data-table-card"
import { QuickActions } from "@/components/quick-actions"

const stats: StatItem[] = [
  {
    title: "ผู้ใช้ทั้งหมด",
    value: "1,234",
    description: "active 1,180",
    icon: Users,
    href: "/admin/users",
    trend: "+12 เดือนนี้",
    trendUp: true,
  },
  {
    title: "รอตรวจสอบสิทธิ์",
    value: "28",
    description: "review cycle ปัจจุบัน",
    icon: Shield,
    href: "/admin/access-review",
    trend: "เหลือ 5 วัน",
    trendUp: false,
  },
  {
    title: "Audit Logs",
    value: "45.2K",
    description: "30 วันล่าสุด",
    icon: FileText,
    href: "/admin/audit-logs",
    trend: "+2,340 วันนี้",
    trendUp: true,
  },
  {
    title: "ประกาศที่ active",
    value: "3",
    description: "แสดงอยู่ในระบบ",
    icon: Megaphone,
    href: "/admin/announcements",
    trend: "1 หมดอายุใกล้ถึง",
    trendUp: false,
  },
]

const systemStatus = [
  { name: "API Server", status: "online", latency: "45ms" },
  { name: "Database", status: "online", latency: "12ms" },
  { name: "Cache (Redis)", status: "online", latency: "3ms" },
  { name: "Queue Worker", status: "online", latency: "N/A" },
]

const recentAuditLogs = [
  {
    id: 1,
    action: "USER_LOGIN",
    user: "สมชาย ใจดี",
    target: "Session",
    timestamp: "5 นาทีที่แล้ว",
    status: "success",
  },
  {
    id: 2,
    action: "ROLE_CHANGE",
    user: "ผู้ดูแลระบบ",
    target: "วิชัย สมบูรณ์ (USER → HEAD_WARD)",
    timestamp: "15 นาทีที่แล้ว",
    status: "success",
  },
  {
    id: 3,
    action: "ANNOUNCEMENT_CREATE",
    user: "ผู้ดูแลระบบ",
    target: "ประกาศวันหยุดสงกรานต์",
    timestamp: "1 ชั่วโมงที่แล้ว",
    status: "success",
  },
  {
    id: 4,
    action: "SYNC_TRIGGER",
    user: "ผู้ดูแลระบบ",
    target: "HRMS Full Sync",
    timestamp: "2 ชั่วโมงที่แล้ว",
    status: "success",
  },
]

const pendingAccessReviews = [
  {
    id: 1,
    user: "วิไล แสนดี",
    role: "PTS_OFFICER",
    department: "งานบุคคล",
    lastReview: "6 เดือนที่แล้ว",
  },
  {
    id: 2,
    user: "สมศักดิ์ ใจดี",
    role: "HEAD_WARD",
    department: "หอผู้ป่วยใน 1",
    lastReview: "8 เดือนที่แล้ว",
  },
  {
    id: 3,
    user: "พรทิพย์ รักษาดี",
    role: "APPROVER",
    department: "งานการเงิน",
    lastReview: "12 เดือนที่แล้ว",
  },
]

const quickActions = [
  { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
  { label: "ตรวจสอบสิทธิ์", href: "/admin/access-review", icon: Shield },
  { label: "Sync HRMS", href: "/admin/system", icon: RefreshCw },
  { label: "ตั้งค่าระบบ", href: "/admin/system", icon: Settings },
]

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมการจัดการระบบและผู้ใช้งาน"
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* System Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              สถานะระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.latency}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Access Reviews */}
        <DataTableCard title="รอตรวจสอบสิทธิ์" viewAllHref="/admin/access-review">
          <div className="space-y-3">
            {pendingAccessReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-border bg-background/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{review.user}</p>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                    {review.role}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{review.department}</p>
                <p className="text-xs text-muted-foreground">ตรวจสอบล่าสุด: {review.lastReview}</p>
              </div>
            ))}
          </div>
        </DataTableCard>

        {/* Recent Audit Logs */}
        <DataTableCard title="บันทึกล่าสุด" viewAllHref="/admin/audit-logs">
          <div className="space-y-3">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-background/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {log.action}
                  </Badge>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-1 text-sm text-foreground">{log.user}</p>
                <p className="text-xs text-muted-foreground truncate">{log.target}</p>
                <p className="text-xs text-muted-foreground">{log.timestamp}</p>
              </div>
            ))}
          </div>
        </DataTableCard>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions actions={quickActions} />
      </div>
    </div>
  )
}
