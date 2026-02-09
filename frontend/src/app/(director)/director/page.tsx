"use client"

import {
  FileCheck,
  Calculator,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { StatCards, type StatItem } from "@/components/stat-cards"
import { DataTableCard } from "@/components/data-table-card"
import { QuickActions } from "@/components/quick-actions"
import { SlaBadge, type SlaStatusType } from "@/components/status-badge"

const stats: StatItem[] = [
  {
    title: "คำขอรออนุมัติ",
    value: "8",
    description: "รอการพิจารณา",
    icon: FileCheck,
    href: "/director/requests",
    trend: "+2 จากเมื่อวาน",
    trendUp: true,
  },
  {
    title: "รอบจ่ายรออนุมัติ",
    value: "2",
    description: "รอ Director อนุมัติ",
    icon: Calculator,
    href: "/director/payroll",
    trend: "รอบ ส.ค. 68",
    trendUp: false,
  },
  {
    title: "SLA เกินกำหนด",
    value: "1",
    description: "ต้องดำเนินการ",
    icon: Clock,
    href: "/director/sla-report",
    trend: "เกิน 2 วัน",
    trendUp: false,
  },
  {
    title: "อนุมัติเดือนนี้",
    value: "45",
    description: "คำขอที่อนุมัติแล้ว",
    icon: TrendingUp,
    href: "/director/reports",
    trend: "+12% จากเดือนก่อน",
    trendUp: true,
  },
]

const pendingRequests = [
  {
    id: "REQ-2568-001234",
    name: "นางสาวสมหญิง ใจดี",
    position: "พยาบาลวิชาชีพชำนาญการ",
    department: "ICU",
    amount: "12,500",
    submittedAt: "28 ม.ค. 68",
    slaStatus: "normal" as SlaStatusType,
    daysInQueue: 1,
  },
  {
    id: "REQ-2568-001235",
    name: "นายสมชาย รักงาน",
    position: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    department: "ER",
    amount: "15,800",
    submittedAt: "27 ม.ค. 68",
    slaStatus: "warning" as SlaStatusType,
    daysInQueue: 2,
  },
  {
    id: "REQ-2568-001236",
    name: "นางมาลี รักษ์พยาบาล",
    position: "พยาบาลวิชาชีพชำนาญการ",
    department: "OPD",
    amount: "11,200",
    submittedAt: "25 ม.ค. 68",
    slaStatus: "overdue" as SlaStatusType,
    daysInQueue: 4,
  },
]

const pendingPayrolls = [
  {
    id: "PAY-2568-08",
    month: "สิงหาคม 2568",
    totalAmount: "1,245,800",
    totalPersons: 156,
    submittedAt: "28 ม.ค. 68",
  },
  {
    id: "PAY-2568-09",
    month: "กันยายน 2568",
    totalAmount: "1,312,400",
    totalPersons: 162,
    submittedAt: "29 ม.ค. 68",
  },
]

const quickActions = [
  { label: "อนุมัติคำขอ", href: "/director/requests", icon: FileCheck },
  { label: "อนุมัติรอบจ่าย", href: "/director/payroll", icon: Calculator },
  { label: "ดูรายงาน SLA", href: "/director/sla-report", icon: Clock },
  { label: "Batch Approve", href: "/director/requests", icon: CheckCircle },
]

export default function DirectorDashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมคำขอและรอบจ่ายเงินรอการอนุมัติ (Step 6)"
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Pending Requests */}
        <div className="lg:col-span-2">
          <DataTableCard title="คำขอรออนุมัติ" viewAllHref="/director/requests">
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/director/requests/${request.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{request.id}</span>
                      <SlaBadge status={request.slaStatus} />
                    </div>
                    <p className="mt-1 font-medium text-foreground">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.position}</p>
                    <p className="text-xs text-muted-foreground">{request.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{request.amount} บาท</p>
                    <p className="text-xs text-muted-foreground">{request.submittedAt}</p>
                    <p className="text-xs text-muted-foreground">รอ {request.daysInQueue} วัน</p>
                  </div>
                </Link>
              ))}
            </div>
          </DataTableCard>
        </div>

        {/* Pending Payrolls */}
        <DataTableCard title="รอบจ่ายรออนุมัติ" viewAllHref="/director/payroll">
          <div className="space-y-3">
            {pendingPayrolls.map((payroll) => (
              <Link
                key={payroll.id}
                href={`/director/payroll/${payroll.id}`}
                className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{payroll.month}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    รออนุมัติ
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">{payroll.totalAmount} บาท</p>
                <p className="text-sm text-muted-foreground">
                  {payroll.totalPersons} คน | ส่งเมื่อ {payroll.submittedAt}
                </p>
              </Link>
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
