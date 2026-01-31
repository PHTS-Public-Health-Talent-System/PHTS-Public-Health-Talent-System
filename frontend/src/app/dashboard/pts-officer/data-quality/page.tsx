"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAutoResolveDataQuality,
  useCreateDataQualityIssue,
  useDataQualityDashboard,
  useDataQualityIssues,
  useDataQualitySummary,
  useDataQualityTypes,
  useRunDataQualityChecks,
  useUpdateDataQualityIssue,
} from "@/features/data-quality/hooks"

type IssueRow = {
  issue_id: number
  issue_type: string
  severity: "HIGH" | "MEDIUM" | "LOW"
  entity_type: string
  entity_id: number | null
  citizen_id: string | null
  description: string
  affected_calculation: boolean
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED"
  detected_at: string
  resolved_at: string | null
  resolution_note: string | null
}

type IssueSummary = {
  issue_type: string
  severity: string
  issue_count: number
  affecting_calc_count: number
}

type DataQualityDashboard = {
  totalIssues?: number
  criticalIssues?: number
  affectingCalculation?: number
  bySeverity?: Array<{ severity: string; count: number }>
}

type IssueTypeOption = {
  value: string
  label: string
}

const statusOptions: IssueRow["status"][] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "IGNORED",
]

const severityOptions: IssueRow["severity"][] = ["HIGH", "MEDIUM", "LOW"]

export default function DataQualityPage() {
  const dashboard = useDataQualityDashboard()
  const summary = useDataQualitySummary()
  const types = useDataQualityTypes()
  const runChecks = useRunDataQualityChecks()
  const autoResolve = useAutoResolveDataQuality()
  const updateIssue = useUpdateDataQualityIssue()
  const createIssue = useCreateDataQualityIssue()

  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [severityFilter, setSeverityFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("OPEN")
  const [affectsCalcFilter, setAffectsCalcFilter] = useState<string>("ALL")

  const issuesQuery = useDataQualityIssues({
    type: typeFilter === "ALL" ? undefined : typeFilter,
    severity: severityFilter === "ALL" ? undefined : severityFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    affectsCalc:
      affectsCalcFilter === "ALL" ? undefined : affectsCalcFilter === "YES",
  })

  const issueRows = ((issuesQuery.data as { issues?: IssueRow[] })?.issues ?? []) as IssueRow[]
  const issueSummary = useMemo(() => {
    return (summary.data as IssueSummary[] | undefined) ?? []
  }, [summary.data])
  const typeOptions = (types.data as IssueTypeOption[] | undefined) ?? []
  const dash = (dashboard.data as DataQualityDashboard | undefined) ?? {}

  const [newIssue, setNewIssue] = useState({
    type: "",
    severity: "MEDIUM",
    entityType: "",
    description: "",
    entityId: "",
    citizenId: "",
    affectsCalc: false,
  })

  const [statusDraft, setStatusDraft] = useState<Record<number, IssueRow["status"]>>({})
  const [noteDraft, setNoteDraft] = useState<Record<number, string>>({})

  const handleUpdate = (issue: IssueRow) => {
    const status = statusDraft[issue.issue_id] ?? issue.status
    const note = noteDraft[issue.issue_id] ?? ""
    updateIssue.mutate(
      { id: issue.issue_id, payload: { status, note } },
      {
        onSuccess: () => {
          toast.success("อัปเดตสถานะเรียบร้อยแล้ว")
          issuesQuery.refetch()
        },
        onError: () => toast.error("อัปเดตสถานะไม่สำเร็จ"),
      },
    )
  }

  const handleCreate = () => {
    if (!newIssue.type || !newIssue.entityType || !newIssue.description) {
      toast.error("กรุณากรอกประเภท/แหล่งข้อมูล/รายละเอียดให้ครบ")
      return
    }
    createIssue.mutate(
      {
        type: newIssue.type,
        severity: newIssue.severity,
        entityType: newIssue.entityType,
        description: newIssue.description,
        entityId: newIssue.entityId ? Number(newIssue.entityId) : undefined,
        citizenId: newIssue.citizenId || undefined,
        affectsCalc: newIssue.affectsCalc,
      },
      {
        onSuccess: () => {
          toast.success("บันทึก issue ใหม่แล้ว")
          setNewIssue({
            type: "",
            severity: "MEDIUM",
            entityType: "",
            description: "",
            entityId: "",
            citizenId: "",
            affectsCalc: false,
          })
          issuesQuery.refetch()
        },
        onError: () => toast.error("บันทึก issue ไม่สำเร็จ"),
      },
    )
  }

  const summaryMap = useMemo(() => {
    const map = new Map<string, number>()
    issueSummary.forEach((row) => {
      map.set(`${row.severity}`, (map.get(`${row.severity}`) ?? 0) + row.issue_count)
    })
    return map
  }, [issueSummary])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Data Quality</div>
        <div className="text-2xl font-semibold">ตรวจสอบคุณภาพข้อมูล</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{dash.totalIssues ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical (HIGH)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {dash.criticalIssues ?? summaryMap.get("HIGH") ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">กระทบการคำนวณ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {dash.affectingCalculation ?? 0}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>ควบคุมการตรวจสอบ</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                runChecks.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("รันตรวจสอบเรียบร้อยแล้ว")
                    issuesQuery.refetch()
                    dashboard.refetch()
                  },
                  onError: () => toast.error("รันตรวจสอบไม่สำเร็จ"),
                })
              }
              disabled={runChecks.isPending}
            >
              {runChecks.isPending ? "กำลังรัน..." : "Run Checks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const confirmed = window.confirm("ยืนยัน Auto-Resolve ปัญหาที่แก้ไขได้อัตโนมัติ?")
                if (!confirmed) return
                autoResolve.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Auto-Resolve สำเร็จ")
                    issuesQuery.refetch()
                    dashboard.refetch()
                  },
                  onError: () => toast.error("Auto-Resolve ไม่สำเร็จ"),
                })
              }}
              disabled={autoResolve.isPending}
            >
              {autoResolve.isPending ? "กำลังแก้ไข..." : "Auto-Resolve"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">สร้าง Issue ใหม่</div>
            <Select value={newIssue.type} onValueChange={(val) => setNewIssue((p) => ({ ...p, type: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท Issue" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newIssue.severity}
              onValueChange={(val) => setNewIssue((p) => ({ ...p, severity: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newIssue.entityType}
              onChange={(e) => setNewIssue((p) => ({ ...p, entityType: e.target.value }))}
              placeholder="Entity type (เช่น emp_profiles)"
            />
            <Input
              value={newIssue.description}
              onChange={(e) => setNewIssue((p) => ({ ...p, description: e.target.value }))}
              placeholder="รายละเอียด"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={newIssue.entityId}
                onChange={(e) => setNewIssue((p) => ({ ...p, entityId: e.target.value }))}
                placeholder="Entity ID (ถ้ามี)"
              />
              <Input
                value={newIssue.citizenId}
                onChange={(e) => setNewIssue((p) => ({ ...p, citizenId: e.target.value }))}
                placeholder="Citizen ID (ถ้ามี)"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newIssue.affectsCalc}
                onChange={(e) => setNewIssue((p) => ({ ...p, affectsCalc: e.target.checked }))}
              />
              กระทบการคำนวณ
            </div>
            <Button onClick={handleCreate} disabled={createIssue.isPending}>
              {createIssue.isPending ? "กำลังบันทึก..." : "บันทึก Issue"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">ตัวกรองรายการ</div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภท Issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {severityOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={affectsCalcFilter} onValueChange={setAffectsCalcFilter}>
              <SelectTrigger>
                <SelectValue placeholder="กระทบการคำนวณ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="YES">กระทบ</SelectItem>
                <SelectItem value="NO">ไม่กระทบ</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => issuesQuery.refetch()}>
              รีเฟรชรายการ
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการ Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภท</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>กระทบคำนวณ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issueRows.map((issue) => (
                <TableRow key={issue.issue_id}>
                  <TableCell>{issue.issue_type}</TableCell>
                  <TableCell>{issue.severity}</TableCell>
                  <TableCell className="max-w-xs truncate">{issue.description}</TableCell>
                  <TableCell>{issue.affected_calculation ? "ใช่" : "ไม่"}</TableCell>
                  <TableCell>
                    <Select
                      value={statusDraft[issue.issue_id] ?? issue.status}
                      onValueChange={(val) =>
                        setStatusDraft((prev) => ({ ...prev, [issue.issue_id]: val as IssueRow["status"] }))
                      }
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue placeholder="สถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={noteDraft[issue.issue_id] ?? ""}
                      onChange={(e) =>
                        setNoteDraft((prev) => ({ ...prev, [issue.issue_id]: e.target.value }))
                      }
                      placeholder="หมายเหตุ"
                      className="mt-2 h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleUpdate(issue)}>
                      บันทึก
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {issueRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    ไม่มี issue ตามเงื่อนไขที่เลือก
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
