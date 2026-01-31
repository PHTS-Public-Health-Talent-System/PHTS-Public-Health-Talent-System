"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePendingApprovals } from "@/features/request/hooks"
import { usePeriods } from "@/features/payroll/hooks"
import { useDataQualityDashboard } from "@/features/data-quality/hooks"
import { useLicenseAlertsSummary } from "@/features/license-alerts/hooks"
import type { RequestWithDetails } from "@/types/request.types"
import type { PayPeriod } from "@/features/payroll/api"

type LicenseAlertsSummary = {
  expired?: number
  expiring_30?: number
  expiring_60?: number
  expiring_90?: number
  total?: number
}

type DataQualityDashboard = {
  totalIssues?: number
  criticalIssues?: number
  affectingCalculation?: number
}

export default function PtsOfficerDashboardPage() {
  const pending = usePendingApprovals()
  const periods = usePeriods()
  const dataQuality = useDataQualityDashboard()
  const licenseSummary = useLicenseAlertsSummary()

  const pendingCount = (pending.data as RequestWithDetails[] | undefined)?.length ?? 0
  const periodRows = (periods.data as PayPeriod[] | undefined) ?? []
  const openPeriods = periodRows.filter((p) => p.status === "OPEN").length
  const waitingHr = periodRows.filter((p) => p.status === "WAITING_HR").length

  const dq = (dataQuality.data as DataQualityDashboard | undefined) ?? {}
  const alerts = (licenseSummary.data as LicenseAlertsSummary | undefined) ?? {}

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">ภาพรวมเจ้าหน้าที่ พ.ต.ส.</div>
        <div className="text-2xl font-semibold">แดชบอร์ดหลัก</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">คำขอรอตรวจ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{pendingCount}</div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/pts-officer/verification">ไปตรวจเอกสาร</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">งวดที่เปิดอยู่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{openPeriods}</div>
            <div className="text-xs text-muted-foreground">รอส่งต่อ HR: {waitingHr} งวด</div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/pts-officer/payroll">จัดการงวด</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{dq.totalIssues ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              กระทบการคำนวณ: {dq.affectingCalculation ?? 0}
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/pts-officer/data-quality">ตรวจคุณภาพข้อมูล</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">License Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{alerts.expired ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              ใกล้หมดอายุ &lt;=30 วัน: {alerts.expiring_30 ?? 0}
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/pts-officer/license-alerts">ดูรายการแจ้งเตือน</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ทางลัดที่ใช้บ่อย</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard/pts-officer/payroll-history">ค้นหา/ตรวจย้อนหลัง</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/pts-officer/snapshots">Snapshots</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/pts-officer/master-data">ตั้งค่าข้อมูลหลัก</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
