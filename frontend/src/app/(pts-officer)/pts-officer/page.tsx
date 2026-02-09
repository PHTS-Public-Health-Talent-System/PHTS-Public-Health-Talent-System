"use client"
export const dynamic = 'force-dynamic'

import { useMemo } from "react"
import {
  FileCheck,
  Users,
  Calculator,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { StatCards, type StatItem } from "@/components/stat-cards"
import { DataTableCard } from "@/components/data-table-card"
import { QuickActions } from "@/components/quick-actions"
import { usePendingApprovals } from "@/features/request/hooks"
import { useLicenseAlertsList, useLicenseAlertsSummary } from "@/features/license-alerts/hooks"
import type { RequestWithDetails } from "@/types/request.types"
import { usePeriodPayouts, usePeriods } from "@/features/payroll/hooks"
import type { PayPeriod } from "@/features/payroll/api"

// TODO: add cards when pts-officer dashboard expands: Card, CardContent

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

function formatPeriodLabel(period: PayPeriod | null) {
  if (!period) return "-"
  const monthName = thaiMonths[(period.period_month ?? 1) - 1] ?? "-"
  const yearNum = period.period_year ?? 0
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return `${monthName} ${thaiYear}`
}

type LicenseAlertRow = {
  full_name?: string
  license_expiry?: string | null
  days_left?: number | null
}

const quickActions = [
  { label: "อนุมัติคำขอ", href: "/pts-officer/requests", icon: FileCheck },
  { label: "คำนวณรอบจ่าย", href: "/pts-officer/payroll", icon: Calculator },
  { label: "ดูรายชื่อผู้มีสิทธิ์", href: "/pts-officer/allowance-list", icon: Users },
  { label: "ตรวจสอบแจ้งเตือน", href: "/pts-officer/alerts", icon: AlertTriangle },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          <Clock className="h-3 w-3" />
          รออนุมัติ
        </span>
      )
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          อนุมัติแล้ว
        </span>
      )
    case "returned":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
          <RefreshCw className="h-3 w-3" />
          ส่งกลับแก้ไข
        </span>
      )
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
          <XCircle className="h-3 w-3" />
          ไม่อนุมัติ
        </span>
      )
    default:
      return null
  }
}

export default function DashboardPage() {
  const { data: approvalsData, isLoading: approvalsLoading } = usePendingApprovals()
  const { data: alertsData, isLoading: alertsLoading } = useLicenseAlertsList({ bucket: "30", limit: 3 })
  const { data: alertsSummary } = useLicenseAlertsSummary()
  const { data: periodsData } = usePeriods()

  const latestPeriod = useMemo(() => {
    if (!Array.isArray(periodsData) || periodsData.length === 0) return null
    const sorted = [...periodsData].sort((a, b) => {
      const yearDiff = (b.period_year ?? 0) - (a.period_year ?? 0)
      if (yearDiff !== 0) return yearDiff
      return (b.period_month ?? 0) - (a.period_month ?? 0)
    })
    return sorted[0]
  }, [periodsData])

  const { data: payoutsData } = usePeriodPayouts(latestPeriod?.period_id ?? undefined)

  const approvals = useMemo<RequestWithDetails[]>(() => {
    if (!approvalsData || !Array.isArray(approvalsData)) return []
    return approvalsData as RequestWithDetails[]
  }, [approvalsData])

  const alertRows = useMemo<LicenseAlertRow[]>(() => {
    if (!alertsData || !Array.isArray(alertsData)) return []
    return alertsData as LicenseAlertRow[]
  }, [alertsData])

  const recentRequests = useMemo(() => {
    if (approvals.length === 0) return []
    return approvals.slice(0, 5).map((req) => ({
      id: req.request_id,
      name: req.requester?.first_name || req.requester?.last_name
        ? `${req.requester?.first_name ?? ""} ${req.requester?.last_name ?? ""}`.trim()
        : "-",
      position: req.requester?.position || "-",
      status: req.status?.toLowerCase() || "pending",
      amount: Number(req.requested_amount) || 0,
      date: req.created_at ? new Date(req.created_at).toLocaleDateString('th-TH') : "-",
    }))
  }, [approvals])

  const alerts = useMemo(() => {
    if (alertRows.length === 0) return []
    return alertRows.map((alert) => ({
      name: alert.full_name || "-",
      expiry: alert.license_expiry ? new Date(alert.license_expiry).toLocaleDateString('th-TH') : "-",
      daysLeft: alert.days_left ?? 0,
      status: (alert.days_left ?? 0) <= 15 ? "danger" : "warning",
    }))
  }, [alertRows])

  const stats: StatItem[] = useMemo(() => {
    const pendingCount = approvals.filter((r) => r.status === "PENDING_PTS_OFFICER" || r.status === "PENDING").length
    const allowanceCount = Array.isArray(payoutsData) ? payoutsData.length : 0
    const periodLabel = formatPeriodLabel(latestPeriod)
    const periodStatus = latestPeriod?.status ?? "OPEN"
    const statusLabel =
      periodStatus === "OPEN"
        ? "กำลังคำนวณ"
        : periodStatus === "WAITING_HR"
          ? "รอส่ง HR"
          : periodStatus === "WAITING_HEAD_FINANCE"
            ? "รอหัวหน้าการเงิน"
            : periodStatus === "WAITING_DIRECTOR"
              ? "รอผอ."
              : "ปิดงวด"
    const expiring30 = alertsSummary?.expiring_30 ?? 0
    return [
      {
        title: "คำขอรออนุมัติ",
        value: String(pendingCount),
        description: "รอดำเนินการ",
        icon: FileCheck,
        href: "/pts-officer/requests",
        trend: `+${pendingCount} รายการ`,
        trendUp: pendingCount > 0,
      },
      {
        title: "ผู้มีสิทธิ์รับเงิน",
        value: String(allowanceCount),
        description: "ประจำเดือนนี้",
        icon: Users,
        href: "/pts-officer/allowance-list",
        trend: `${allowanceCount} คน`,
        trendUp: allowanceCount > 0,
      },
      {
        title: "รอบจ่ายเงินปัจจุบัน",
        value: periodLabel,
        description: statusLabel,
        icon: Calculator,
        href: "/pts-officer/payroll",
        trend: statusLabel,
        trendUp: periodStatus === "OPEN",
      },
      {
        title: "แจ้งเตือนสำคัญ",
        value: String(expiring30),
        description: "ใบอนุญาตใกล้หมด",
        icon: AlertTriangle,
        href: "/pts-officer/alerts",
        trend: `${expiring30} ภายใน 30 วัน`,
        trendUp: expiring30 > 0,
      },
    ]
  }, [approvals, payoutsData, latestPeriod, alertsSummary])

  const isLoading = approvalsLoading || alertsLoading

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="แดชบอร์ด"
          description="ภาพรวมระบบจัดการเงิน พ.ต.ส."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมระบบจัดการเงิน พ.ต.ส."
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <DataTableCard title="คำขอล่าสุด" viewAllHref="/pts-officer/requests">
            <div className="space-y-3">
              {recentRequests.length > 0 ? (
                recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/pts-officer/requests/${request.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{request.id}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="mt-1 font-medium text-foreground">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">
                      {request.amount.toLocaleString()} บาท
                    </p>
                    <p className="text-xs text-muted-foreground">{request.date}</p>
                  </div>
                </Link>
              ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  ไม่มีคำขอรออนุมัติ
                </p>
              )}
            </div>
          </DataTableCard>
        </div>

        {/* License Alerts */}
        <DataTableCard title="ใบอนุญาตใกล้หมดอายุ" viewAllHref="/pts-officer/alerts">
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{alert.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      alert.status === "danger"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {alert.daysLeft} วัน
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  หมดอายุ: {alert.expiry}
                </p>
              </div>
            ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                ไม่มีใบอนุญาตใกล้หมดอายุ
              </p>
            )}
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
