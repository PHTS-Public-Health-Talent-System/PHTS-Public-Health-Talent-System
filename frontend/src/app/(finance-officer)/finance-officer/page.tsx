"use client"
export const dynamic = 'force-dynamic'


import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
} from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { StatCards, type StatItem } from "@/components/stat-cards"
import { DataTableCard } from "@/components/data-table-card"
import { QuickActions } from "@/components/quick-actions"
import { useFinanceDashboard } from "@/features/finance/hooks"

type PendingPayout = {
  id?: number | string
  payout_id?: number | string
  employee_name?: string
  employeeName?: string
  profession?: string
  amount?: number | string
  period_name?: string
  due_date?: string
}

type RecentPayment = {
  id?: number | string
  employee_name?: string
  employeeName?: string
  amount?: number | string
  paid_at?: string
}

type MonthlySummaryItem = {
  month?: string
  total?: number | string
}

type FinanceDashboardData = {
  year?: number
  pending_count?: number
  pending_trend?: string
  paid_count?: number
  paid_total?: number | string
  paid_trend?: string
  cancelled_count?: number
  cancelled_trend?: string
  yearly_total?: number | string
  yearly_trend?: string
  pending_payouts?: PendingPayout[]
  recent_payments?: RecentPayment[]
  monthly_summary?: MonthlySummaryItem[]
}

const quickActions = [
  { label: "จ่ายเงิน", href: "/finance-officer/payouts", icon: Wallet },
  { label: "Batch Pay", href: "/finance-officer/payouts", icon: CheckCircle2 },
  { label: "สรุปรายปี", href: "/finance-officer/yearly-summary", icon: TrendingUp },
  { label: "ดาวน์โหลดรายงาน", href: "/finance-officer/reports", icon: Download },
]

export default function FinanceOfficerDashboardPage() {
  const { data: dashboardData, isLoading } = useFinanceDashboard()

  const data = useMemo<FinanceDashboardData>(() => {
    if (!dashboardData || typeof dashboardData !== "object") return {}
    return dashboardData as FinanceDashboardData
  }, [dashboardData])

  const stats: StatItem[] = useMemo(() => {
    if (!data || typeof data !== 'object') return []
    return [
      {
        title: "รอจ่ายเงิน",
        value: String(data.pending_count ?? 0),
        description: "รายการรอดำเนินการ",
        icon: Clock,
        href: "/finance-officer/payouts",
        trend: String(data.pending_trend ?? "+0 จากสัปดาห์ก่อน"),
        trendUp: true,
      },
      {
        title: "จ่ายแล้วเดือนนี้",
        value: String(data.paid_count ?? 0),
        description: `${(Number(data.paid_total) || 0) / 1000000}M บาท`,
        icon: CheckCircle2,
        href: "/finance-officer/payouts?status=paid",
        trend: String(data.paid_trend ?? "+0% จากเดือนก่อน"),
        trendUp: true,
      },
      {
        title: "ยกเลิกเดือนนี้",
        value: String(data.cancelled_count ?? 0),
        description: "รายการยกเลิก",
        icon: XCircle,
        href: "/finance-officer/payouts?status=cancelled",
        trend: String(data.cancelled_trend ?? "+0 จากเดือนก่อน"),
        trendUp: false,
      },
      {
        title: "ยอดรวมปีนี้",
        value: `${((Number(data.yearly_total) || 0) / 1000000).toFixed(1)}M`,
        description: "บาท",
        icon: TrendingUp,
        href: "/finance-officer/yearly-summary",
        trend: String(data.yearly_trend ?? "+0% YoY"),
        trendUp: true,
      },
    ]
  }, [data])

  const pendingPayouts = (Array.isArray(data.pending_payouts) ? data.pending_payouts : []).slice(0, 4)
  const recentPayments = (Array.isArray(data.recent_payments) ? data.recent_payments : []).slice(0, 3)
  const monthlyData = Array.isArray(data.monthly_summary) ? data.monthly_summary : []

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="แดชบอร์ด"
          description="ภาพรวมการจ่ายเงิน พ.ต.ส. และสถานะการดำเนินการ"
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
        description="ภาพรวมการจ่ายเงิน พ.ต.ส. และสถานะการดำเนินการ"
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Pending Payouts */}
        <div className="lg:col-span-2">
          <DataTableCard
            title="รอจ่ายเงิน"
            viewAllHref="/finance-officer/payouts"
            action={
              <Button size="sm" variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Batch Pay
              </Button>
            }
          >
            <div className="space-y-3">
              {pendingPayouts.length > 0 ? (
                pendingPayouts.map((payout) => (
                  <Link
                    key={payout.id}
                    href={`/finance-officer/payouts/${payout.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          {payout.payout_id || payout.id}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          รอจ่าย
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">
                        {payout.employee_name || payout.employeeName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.profession || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {(payout.amount || 0).toLocaleString()} บาท
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.period_name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        กำหนด: {payout.due_date || "-"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  ไม่มีรายการรอจ่ายเงิน
                </p>
              )}
            </div>
          </DataTableCard>
        </div>

        {/* Recent Payments */}
        <DataTableCard title="จ่ายเงินล่าสุด" viewAllHref="/finance-officer/payouts?status=paid">
          <div className="space-y-3">
              {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-lg border border-border bg-background/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">
                      {payment.employee_name || payment.employeeName}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      จ่ายแล้ว
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {(payment.amount || 0).toLocaleString()} บาท
                  </p>
                  <p className="text-xs text-muted-foreground">
                    จ่ายเมื่อ: {payment.paid_at || "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                ไม่มีรายการจ่ายเงิน
              </p>
            )}
          </div>
        </DataTableCard>
      </div>

      {/* Monthly Summary */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            สรุปยอดจ่ายรายเดือน (ปี {data.year ?? 2568})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            {monthlyData.length > 0 ? (
              monthlyData.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-background/50 p-3 text-center"
                >
                  <p className="text-sm text-muted-foreground">{item.month}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {((Number(item.total) || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-6 text-center py-8">
                ไม่มีข้อมูลรายเดือน
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions actions={quickActions} />
      </div>
    </div>
  )
}
