"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePeriods } from "@/features/payroll/hooks"
import {
  useFreezePeriod,
  usePeriodFrozen,
  useReportData,
  useSnapshot,
  useSnapshotsForPeriod,
  useSummaryData,
  useUnfreezePeriod,
} from "@/features/snapshot/hooks"
import { toPeriodLabel } from "@/features/payroll/period-utils"
import type { PayPeriod } from "@/features/payroll/api"

type SnapshotRow = {
  snapshot_id: number
  snapshot_type: string
  record_count: number
  total_amount: number
  created_at: string
}

type ReportData = {
  source: "snapshot" | "live"
  data: unknown
  recordCount?: number
  totalAmount?: number
}

type FrozenStatus = {
  is_frozen: boolean
}

export default function SnapshotsPage() {
  const periods = usePeriods()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
  const [snapshotType, setSnapshotType] = useState("PAYOUT")
  const [unfreezeReason, setUnfreezeReason] = useState("")

  const periodId = selectedPeriodId ? Number(selectedPeriodId) : undefined
  const frozen = usePeriodFrozen(periodId)
  const snapshots = useSnapshotsForPeriod(periodId)
  const snapshot = useSnapshot(periodId, snapshotType)
  const reportData = useReportData(periodId)
  const summaryData = useSummaryData(periodId)
  const freeze = useFreezePeriod()
  const unfreeze = useUnfreezePeriod()

  const periodOptions = useMemo(() => {
    return (periods.data as PayPeriod[] | undefined) ?? []
  }, [periods.data])
  const frozenStatus = (frozen.data as FrozenStatus | undefined)?.is_frozen ?? false
  const snapshotRows = (snapshots.data as SnapshotRow[] | undefined) ?? []
  const payoutData = (reportData.data as ReportData | undefined) ?? undefined
  const summary = (summaryData.data as ReportData | undefined) ?? undefined

  const selectedPeriod = useMemo(() => {
    return periodOptions.find((p) => p.period_id === periodId)
  }, [periodOptions, periodId])

  const handleFreeze = () => {
    if (!periodId) return
    freeze.mutate(
      { id: periodId },
      {
        onSuccess: () => {
          toast.success("Freeze งวดเรียบร้อยแล้ว")
          frozen.refetch()
          snapshots.refetch()
        },
        onError: () => toast.error("Freeze ไม่สำเร็จ"),
      },
    )
  }

  const handleUnfreeze = () => {
    if (!periodId) return
    if (!unfreezeReason.trim()) {
      toast.error("กรุณาระบุเหตุผลการ Unfreeze")
      return
    }
    unfreeze.mutate(
      { id: periodId, payload: { reason: unfreezeReason } },
      {
        onSuccess: () => {
          toast.success("Unfreeze สำเร็จ")
          setUnfreezeReason("")
          frozen.refetch()
        },
        onError: () => toast.error("Unfreeze ไม่สำเร็จ"),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Snapshots</div>
        <div className="text-2xl font-semibold">ล็อกข้อมูลรายงวด</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>เลือกงวด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกงวดที่ต้องการจัดการ" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((period) => (
                <SelectItem key={period.period_id} value={String(period.period_id)}>
                  {toPeriodLabel(period)} ({period.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleFreeze} disabled={!periodId || freeze.isPending || frozenStatus}>
              {freeze.isPending ? "กำลัง Freeze..." : "Freeze"}
            </Button>
            <Button
              variant="outline"
              onClick={handleUnfreeze}
              disabled={!periodId || unfreeze.isPending || !frozenStatus}
            >
              {unfreeze.isPending ? "กำลัง Unfreeze..." : "Unfreeze"}
            </Button>
          </div>
          {frozenStatus && (
            <div className="text-sm text-emerald-600">สถานะ: ถูก Freeze แล้ว</div>
          )}
          {!frozenStatus && periodId && (
            <div className="text-sm text-muted-foreground">สถานะ: ยังไม่ Freeze</div>
          )}
          <Input
            value={unfreezeReason}
            onChange={(e) => setUnfreezeReason(e.target.value)}
            placeholder="เหตุผลการ Unfreeze (ต้องระบุ)"
            className="md:col-span-2"
          />
          {selectedPeriod && (
            <div className="text-xs text-muted-foreground md:col-span-2">
              งวดที่เลือก: {toPeriodLabel(selectedPeriod)} — {selectedPeriod.status}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>รายการ Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshotRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">ยังไม่มี snapshot สำหรับงวดนี้</div>
            ) : (
              <TableBlock rows={snapshotRows} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ดูข้อมูล Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={snapshotType} onValueChange={setSnapshotType}>
              <TabsList className="mb-3">
                <TabsTrigger value="PAYOUT">PAYOUT</TabsTrigger>
                <TabsTrigger value="SUMMARY">SUMMARY</TabsTrigger>
              </TabsList>
              <TabsContent value={snapshotType}>
                <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {snapshot.data ? JSON.stringify(snapshot.data, null, 2) : "ไม่มีข้อมูล snapshot"}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBlock data={payoutData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBlock data={summary} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TableBlock({ rows }: { rows: SnapshotRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2">ประเภท</th>
          <th className="py-2">จำนวนรายการ</th>
          <th className="py-2">ยอดรวม</th>
          <th className="py-2">สร้างเมื่อ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.snapshot_id} className="border-b">
            <td className="py-2">{row.snapshot_type}</td>
            <td className="py-2">{row.record_count}</td>
            <td className="py-2">{Number(row.total_amount ?? 0).toLocaleString()}</td>
            <td className="py-2">{new Date(row.created_at).toLocaleString("th-TH")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReportBlock({ data }: { data?: ReportData }) {
  if (!data) {
    return <div className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</div>
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">source: {data.source}</div>
      <pre className="max-h-[300px] overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
