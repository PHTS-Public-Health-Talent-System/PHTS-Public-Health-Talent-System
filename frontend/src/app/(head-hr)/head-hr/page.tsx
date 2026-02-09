"use client"

import {
  FileCheck,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { StatCards, type StatItem } from "@/components/stat-cards"
import { DataTableCard } from "@/components/data-table-card"
import { QuickActions } from "@/components/quick-actions"
import { SlaBadge, type SlaStatusType } from "@/components/status-badge"
import { useHeadHrDashboard } from "@/features/dashboard/hooks"
import { buildHeadHrStatItems } from "./head-hr-dashboard-mappers"

// TODO: add cards and actions when head-hr dashboard is expanded: Card, CardContent, Button

const quickActions = [
  { label: "อนุมัติคำขอ", href: "/head-hr/requests", icon: FileCheck },
  { label: "อนุมัติรอบจ่าย", href: "/head-hr/payroll", icon: Calculator },
  { label: "ดูรายงาน SLA", href: "/head-hr/sla-report", icon: Clock },
  { label: "ดาวน์โหลดรายงาน", href: "/head-hr/reports", icon: ArrowRight },
]

export default function HeadHRDashboardPage() {
  const { data: dashboard } = useHeadHrDashboard()
  const stats: StatItem[] = buildHeadHrStatItems(
    dashboard?.stats ?? {
      pending_requests: 0,
      pending_payrolls: 0,
      approved_month: 0,
      sla_overdue: 0,
    },
    {
      FileCheck,
      Calculator,
      CheckCircle2,
      AlertTriangle,
    },
  )
  const pendingRequests = dashboard?.pending_requests ?? []
  const pendingPayrolls = dashboard?.pending_payrolls ?? []

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมคำขอและรอบจ่ายเงิน พ.ต.ส. รอการอนุมัติ"
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Pending Requests */}
        <div className="lg:col-span-2">
          <DataTableCard title="คำขอรออนุมัติ" viewAllHref="/head-hr/requests">
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/head-hr/requests/${request.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{request.id}</span>
                      <SlaBadge status={request.sla_status as SlaStatusType} />
                    </div>
                    <p className="mt-1 font-medium text-foreground">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.position}</p>
                    <p className="text-xs text-muted-foreground">{request.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">
                      {request.amount.toLocaleString()} บาท
                    </p>
                    <p className="text-xs text-muted-foreground">{request.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DataTableCard>
        </div>

        {/* Pending Payrolls */}
        <DataTableCard title="รอบจ่ายรออนุมัติ" viewAllHref="/head-hr/payroll">
          <div className="space-y-3">
            {pendingPayrolls.map((payroll) => (
              <Link
                key={payroll.id}
                href={`/head-hr/payroll/${payroll.id}`}
                className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{payroll.month}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    รออนุมัติ
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {payroll.totalAmount.toLocaleString()} บาท
                </p>
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
