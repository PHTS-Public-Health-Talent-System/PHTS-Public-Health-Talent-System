"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLicenseAlertsList, useLicenseAlertsSummary } from "@/features/license-alerts/hooks"

type LicenseAlertRow = {
  citizen_id: string
  full_name: string
  position_name: string
  license_expiry: string | null
  days_left: number | null
  bucket: string
}

type LicenseAlertSummary = {
  expired?: number
  expiring_30?: number
  expiring_60?: number
  expiring_90?: number
  total?: number
}

const bucketLabels: Record<string, string> = {
  expired: "หมดอายุ",
  "30": "<= 30 วัน",
  "60": "<= 60 วัน",
  "90": "<= 90 วัน",
}

export default function LicenseAlertsPage() {
  const [bucket, setBucket] = useState("expired")
  const [query, setQuery] = useState("")
  const summary = useLicenseAlertsSummary()
  const list = useLicenseAlertsList({ bucket })

  const rows = useMemo(() => {
    const data = (list.data as LicenseAlertRow[] | undefined) ?? []
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) => {
      const fullName = String(row.full_name ?? "")
      const positionName = String(row.position_name ?? "")
      return (
        row.citizen_id.toLowerCase().includes(q) ||
        fullName.toLowerCase().includes(q) ||
        positionName.toLowerCase().includes(q)
      )
    })
  }, [list.data, query])

  const counts = (summary.data as LicenseAlertSummary | undefined) ?? {}

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">License Alerts</div>
        <div className="text-2xl font-semibold">แจ้งเตือนใบอนุญาตวิชาชีพ</div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">หมดอายุ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {counts.expired ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">&lt;= 30 วัน</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {counts.expiring_30 ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">&lt;= 60 วัน</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-500">
            {counts.expiring_60 ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">&lt;= 90 วัน</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-muted-foreground">
            {counts.expiring_90 ?? 0}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>รายการแจ้งเตือน</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อ/เลขบัตร/ตำแหน่ง"
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={bucket} onValueChange={setBucket}>
            <TabsList className="mb-4">
              {Object.keys(bucketLabels).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {bucketLabels[key]}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={bucket}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead className="text-right">วันหมดอายุ</TableHead>
                    <TableHead className="text-right">คงเหลือ (วัน)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.citizen_id}-${row.license_expiry ?? "na"}`}>
                      <TableCell>
                        {row.full_name?.trim() || row.citizen_id}
                      </TableCell>
                      <TableCell>{row.position_name}</TableCell>
                      <TableCell className="text-right">
                        {row.license_expiry ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.days_left ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        ไม่มีรายการในหมวดนี้
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
