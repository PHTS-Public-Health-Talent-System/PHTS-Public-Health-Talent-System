"use client"
export const dynamic = 'force-dynamic'

import { useCallback, useDeferredValue, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Plus,
  Edit,
  Eye,
  CalendarDays,
  GraduationCap,
  UserCheck,
  CheckCircle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import {
  useAddLeaveRecordDocuments,
  useCreateLeaveRecord,
  useDeleteLeaveRecordDocument,
  useLeaveRecordDocuments,
  useLeaveRecords,
  useLeaveRecordStats,
  useUpsertLeaveRecordExtension,
  useDeleteLeaveRecordExtension,
} from "@/features/leave-records/hooks"
import type { LeaveRecordApiRow } from "@/features/leave-records/api"
import { AttachmentPreviewDialog } from "@/components/common/attachment-preview-dialog"
import { buildSearchParam } from "@/features/leave-records/search"
import { leaveTypes } from "@/components/leave-management/leave-types"
import type { LeaveRecord, LeaveRecordDocument } from "@/components/leave-management/types"
import { LeaveTable } from "@/components/leave-management/LeaveTable"
import { LeaveDetailContent } from "@/components/leave-management/LeaveDetailContent"
import { AddLeaveForm, EditLeaveForm, RecordReportForm } from "@/components/leave-management/LeaveForms"

// TODO: add components when year filter and modal trigger are implemented: YearPicker, DialogTrigger

function calcDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ""
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2])
  const month = months[parseInt(parts[1]) - 1]
  const year = parseInt(parts[0])
  if (Number.isNaN(year)) return dateStr
  return `${day} ${month} ${year + 543}`
}

export default function LeaveManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [fiscalYearFilter, setFiscalYearFilter] = useState<number | "all">("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [sortBy, setSortBy] = useState<"start_date" | "name">("start_date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [previewName, setPreviewName] = useState("")
  const fiscalYearOptions = useMemo(() => {
    const now = new Date()
    const currentFiscalYear = now.getMonth() >= 9 ? now.getFullYear() + 544 : now.getFullYear() + 543
    const years = []
    for (let y = currentFiscalYear - 5; y <= currentFiscalYear + 1; y += 1) {
      years.push(y)
    }
    return years
  }, [])

  const offset = page * pageSize
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const normalizedSearch = useMemo(
    () => buildSearchParam(deferredSearchQuery),
    [deferredSearchQuery],
  )
  const listParams = useMemo(() => ({
    leave_type: typeFilter === "all" ? undefined : typeFilter,
    fiscal_year: fiscalYearFilter === "all" ? undefined : fiscalYearFilter,
    search: normalizedSearch,
    limit: pageSize,
    offset,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [normalizedSearch, offset, pageSize, fiscalYearFilter, sortBy, sortDir, typeFilter])
  const tabListParams = useMemo(() => ({
    leave_type: activeTab === "study" ? "education" : undefined,
    pending_report: activeTab === "pending-report" ? true : undefined,
    fiscal_year: fiscalYearFilter === "all" ? undefined : fiscalYearFilter,
    search: normalizedSearch,
    limit: 500,
    offset: 0,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [normalizedSearch, fiscalYearFilter, sortBy, sortDir, activeTab])

  const {
    data: leaveRecordsData,
    refetch: refetchLeaveRecords,
    isLoading: leaveRecordsLoading,
    isError: leaveRecordsError,
  } = useLeaveRecords(listParams)
  const {
    data: leaveRecordsTabData,
    refetch: refetchLeaveRecordsTab,
    isLoading: leaveRecordsTabLoading,
    isError: leaveRecordsTabError,
  } = useLeaveRecords(tabListParams, { enabled: activeTab !== "all" })
  const { data: leaveRecordsFullData } = useLeaveRecords(undefined, { enabled: showAddDialog })
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useLeaveRecordStats()
  const upsertExtension = useUpsertLeaveRecordExtension()
  const createLeaveRecord = useCreateLeaveRecord()
  const deleteExtension = useDeleteLeaveRecordExtension()
  const addDocuments = useAddLeaveRecordDocuments()
  const deleteDocument = useDeleteLeaveRecordDocument()
  const { data: documentsData, refetch: refetchDocuments } = useLeaveRecordDocuments(
    selectedLeave?.id ?? null,
  )

  const leaveRecordItems = useMemo(
    () => leaveRecordsData?.items ?? [],
    [leaveRecordsData],
  )
  const leaveRecordTabItems = useMemo(
    () => leaveRecordsTabData?.items ?? [],
    [leaveRecordsTabData],
  )
  const leaveRecordItemsForAdd = useMemo(
    () => (showAddDialog ? (leaveRecordsFullData?.items ?? []) : leaveRecordItems),
    [leaveRecordsFullData, leaveRecordItems, showAddDialog],
  )
  const totalRecords = leaveRecordsData?.total ?? leaveRecordItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const showingFrom = totalRecords === 0 ? 0 : offset + 1
  const showingTo = Math.min(offset + pageSize, totalRecords)
  const canPrevPage = page > 0
  const canNextPage = offset + pageSize < totalRecords

  const personnel = useMemo(() => {
    if (!Array.isArray(leaveRecordItemsForAdd)) return []
    const map = new Map<string, { id: string; name: string; position: string; department: string }>()
    leaveRecordItemsForAdd.forEach((row) => {
      const citizenId = String(row.citizen_id ?? "")
      if (!citizenId || map.has(citizenId)) return
      const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || citizenId
      map.set(citizenId, {
        id: citizenId,
        name,
        position: row.position_name ?? "-",
        department: row.department ?? "-",
      })
    })
    return Array.from(map.values())
  }, [leaveRecordItemsForAdd])

  const personMap = useMemo(() => {
    const map = new Map<string, { name: string; position: string; department: string }>()
    personnel.forEach((person) => map.set(person.id, person))
    return map
  }, [personnel])

  const mapLeaveRows = useCallback((rows: LeaveRecordApiRow[]): LeaveRecord[] => {
    return rows.map((row) => {
      const citizenId = String(row.citizen_id ?? "")
      const person = personMap.get(citizenId)
      const rawType = String(row.leave_type ?? "").toLowerCase()
      const type = leaveTypes.some((t) => t.value === rawType) ? rawType : "personal"
      const typeLabel = leaveTypes.find((t) => t.value === type)?.label ?? "อื่นๆ"
      const userStart = row.start_date ?? ""
      const userEnd = row.end_date ?? ""
      const userDays = calcDays(userStart, userEnd)
      const documentDays = row.document_duration_days
        ? Number(row.document_duration_days)
        : calcDays(row.document_start_date ?? "", row.document_end_date ?? "")
      const reportStatus = row.return_report_status === "DONE" ? "reported" : "pending"
      const fallbackName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim()

      return {
        id: Number(row.id),
        source: "hrms" as const,
        personId: citizenId,
        personName: person?.name ?? (fallbackName || citizenId),
        personPosition: person?.position ?? row.position_name ?? "-",
        personDepartment: person?.department ?? row.department ?? "-",
        type,
        typeName: typeLabel,
        userStartDate: userStart,
        userEndDate: userEnd,
        documentStartDate: row.document_start_date ?? "",
        documentEndDate: row.document_end_date ?? "",
        days: userDays,
        requireReport: Boolean(row.require_return_report ?? false),
        reportDate: row.return_date ?? undefined,
        reportStatus: reportStatus,
        studyInfo: row.study_institution
          ? {
              institution: row.study_institution ?? "-",
              program: row.study_program ?? "-",
              field: row.study_major ?? "-",
              startDate: row.study_start_date ?? "",
            }
          : undefined,
        note: row.note ?? row.remark ?? undefined,
        createdAt: String(row.start_date ?? ""),
        documentDays,
      }
    })
  }, [personMap])

  const leaveRecords = useMemo<LeaveRecord[]>(() => {
    if (!Array.isArray(leaveRecordItems)) return []
    return mapLeaveRows(leaveRecordItems as LeaveRecordApiRow[])
  }, [leaveRecordItems, mapLeaveRows])
  const leaveRecordsForTabs = useMemo<LeaveRecord[]>(() => {
    if (!Array.isArray(leaveRecordTabItems)) return []
    return mapLeaveRows(leaveRecordTabItems as LeaveRecordApiRow[])
  }, [leaveRecordTabItems, mapLeaveRows])

  const pendingRecordsSource = activeTab === "pending-report" || activeTab === "study"
    ? leaveRecordsForTabs
    : leaveRecords
  const pendingLoading = activeTab === "pending-report" || activeTab === "study"
    ? leaveRecordsTabLoading
    : leaveRecordsLoading
  const pendingError = activeTab === "pending-report" || activeTab === "study"
    ? leaveRecordsTabError
    : leaveRecordsError
  const pendingRetry = activeTab === "pending-report" || activeTab === "study"
    ? refetchLeaveRecordsTab
    : refetchLeaveRecords

  const pendingReportCount = statsData?.pending_report ?? leaveRecords.filter(r => r.requireReport && r.reportStatus === "pending").length
  const studyLeaveCount = statsData?.study ?? leaveRecords.filter(r => r.type === "education").length

  const getLeaveTypeColor = (type: string) => {
    const leaveType = leaveTypes.find(t => t.value === type)
    return leaveType?.color || "bg-secondary text-muted-foreground border-border"
  }

  const handleAddLeave = async (newLeave: Partial<LeaveRecord> & { leaveRecordId?: number; files?: File[] }) => {
    if (!newLeave.userStartDate || !newLeave.userEndDate) return
    try {
      const leaveRecordId =
        newLeave.leaveRecordId ??
        (await createLeaveRecord.mutateAsync({
          citizen_id: newLeave.personId ?? "",
          leave_type: newLeave.type ?? "",
          start_date: newLeave.userStartDate,
          end_date: newLeave.userEndDate,
          duration_days: newLeave.days,
          remark: newLeave.note,
        })).id

      await upsertExtension.mutateAsync({
        leave_record_id: leaveRecordId,
        document_start_date: newLeave.documentStartDate,
        document_end_date: newLeave.documentEndDate,
        require_return_report: newLeave.requireReport ?? false,
        pay_exception: false,
        note: newLeave.note,
        study_institution: newLeave.studyInfo?.institution,
        study_program: newLeave.studyInfo?.program,
        study_major: newLeave.studyInfo?.field,
        study_start_date: newLeave.studyInfo?.startDate || undefined,
      })

      if (newLeave.files && newLeave.files.length > 0) {
        await addDocuments.mutateAsync({ leaveRecordId, files: newLeave.files })
      }

      await refetchLeaveRecords()
      setShowAddDialog(false)
      setSuccessMessage("บันทึกข้อมูลวันลาสำเร็จ")
      setShowSuccessDialog(true)
    } catch {
      toast.error("ไม่สามารถบันทึกข้อมูลวันลาได้")
    }
  }

  const handleEditLeave = async (updatedLeave: LeaveRecord & { files?: File[] }) => {
    try {
      await upsertExtension.mutateAsync({
        leave_record_id: updatedLeave.id,
        document_start_date: updatedLeave.documentStartDate,
        document_end_date: updatedLeave.documentEndDate,
        require_return_report: updatedLeave.requireReport ?? false,
        pay_exception: false,
        note: updatedLeave.note,
        study_institution: updatedLeave.studyInfo?.institution,
        study_program: updatedLeave.studyInfo?.program,
        study_major: updatedLeave.studyInfo?.field,
        study_start_date: updatedLeave.studyInfo?.startDate || undefined,
      })

      if (updatedLeave.files && updatedLeave.files.length > 0) {
        await addDocuments.mutateAsync({ leaveRecordId: updatedLeave.id, files: updatedLeave.files })
      }

      await refetchLeaveRecords()
      setShowEditDialog(false)
      setSuccessMessage("แก้ไขรายการวันลาสำเร็จ")
      setShowSuccessDialog(true)
    } catch {
      toast.error("ไม่สามารถแก้ไขรายการวันลาได้")
    }
  }

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return
    try {
      await deleteExtension.mutateAsync(selectedLeave.id)
      await refetchLeaveRecords()
      setShowDeleteAlert(false)
      setSelectedLeave(null)
      setSuccessMessage("ลบรายการวันลาสำเร็จ")
      setShowSuccessDialog(true)
    } catch {
      toast.error("ไม่สามารถลบรายการวันลาได้")
    }
  }

  const handleRecordReport = async (reportDate: string, note: string) => {
    if (!selectedLeave) return
    try {
      await upsertExtension.mutateAsync({
        leave_record_id: selectedLeave.id,
        require_return_report: true,
        return_report_status: "DONE",
        return_date: reportDate,
        return_remark: note || undefined,
      })
      await refetchLeaveRecords()
      setShowReportDialog(false)
      setSelectedLeave(null)
      toast.success("บันทึกรายงานตัวสำเร็จ")
    } catch {
      toast.error("ไม่สามารถบันทึกรายงานตัวได้")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="จัดการวันลา"
        description="ดูและจัดการวันลาของบุคลากรทั้งหมด"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มรายการวันลา
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
                <p className="text-2xl font-bold">
                  {statsData?.total ?? totalRecords}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <GraduationCap className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ลาศึกษาต่อ/อบรม</p>
                <p className="text-2xl font-bold text-purple-400">{studyLeaveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <UserCheck className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รอรายงานตัว</p>
                <p className="text-2xl font-bold text-blue-400">{pendingReportCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {statsError && (
        <p className="text-sm text-destructive">
          โหลดข้อมูลสถิติไม่สำเร็จ กำลังใช้ค่าจากรายการที่แสดงแทน
        </p>
      )}
      {statsLoading && !statsError && (
        <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลสถิติ...</p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">รายการทั้งหมด</TabsTrigger>
          <TabsTrigger value="pending-report">
            รอรายงานตัว
            {pendingReportCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                {pendingReportCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="study">ลาศึกษาต่อ/อบรม</TabsTrigger>
        </TabsList>

        {/* Tab: All Records */}
        <TabsContent value="all">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">รายการวันลาทั้งหมด</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อ, แผนก, เลขบัตรประชาชน..."
                      aria-label="ค้นหาชื่อ แผนก เลขบัตรประชาชน"
                      name="leave_search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(0)
                      }}
                      className="pl-9 w-64 bg-secondary border-border"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(value) => {
                    setTypeFilter(value)
                    setPage(0)
                  }}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="ประเภท" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกประเภท</SelectItem>
                      {leaveTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(fiscalYearFilter)} onValueChange={(value) => {
                    setFiscalYearFilter(value === "all" ? "all" : Number(value))
                    setPage(0)
                  }}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="ปีงบ" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกปีงบ</SelectItem>
                      {fiscalYearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${sortBy}:${sortDir}`}
                    onValueChange={(value) => {
                      const [nextSortBy, nextSortDir] = value.split(":") as ["start_date" | "name", "asc" | "desc"]
                      setSortBy(nextSortBy)
                      setSortDir(nextSortDir)
                      setPage(0)
                    }}
                  >
                    <SelectTrigger className="w-44 bg-secondary border-border">
                      <SelectValue placeholder="เรียงลำดับ" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="start_date:desc">วันที่ลา (ใหม่สุด)</SelectItem>
                      <SelectItem value="start_date:asc">วันที่ลา (เก่าสุด)</SelectItem>
                      <SelectItem value="name:asc">ชื่อ (ก-ฮ)</SelectItem>
                      <SelectItem value="name:desc">ชื่อ (ฮ-ก)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeaveTable
                records={leaveRecords}
                onViewDetail={(record) => {
                  setSelectedLeave(record)
                  setShowDetailDialog(true)
                }}
                onEdit={(record) => {
                  setSelectedLeave(record)
                  setShowEditDialog(true)
                }}
                onDelete={(record) => {
                  setSelectedLeave(record)
                  setShowDeleteAlert(true)
                }}
                onRecordReport={(record) => {
                  setSelectedLeave(record)
                  setShowReportDialog(true)
                }}
                getLeaveTypeColor={getLeaveTypeColor}
                formatDateDisplay={formatDateDisplay}
                isLoading={leaveRecordsLoading}
                isError={leaveRecordsError}
                onRetry={() => refetchLeaveRecords()}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  แสดง {showingFrom}-{showingTo} จาก {totalRecords} รายการ
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPage(0)
                    }}
                  >
                    <SelectTrigger className="w-[140px] bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="50">50 แถว/หน้า</SelectItem>
                      <SelectItem value="150">150 แถว/หน้า</SelectItem>
                      <SelectItem value="300">300 แถว/หน้า</SelectItem>
                      <SelectItem value="500">500 แถว/หน้า</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrevPage}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  >
                    ก่อนหน้า
                  </Button>
                  <span>
                    หน้า {Math.min(page + 1, totalPages)} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pending Report */}
        <TabsContent value="pending-report">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                รายการรอรายงานตัว
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveTable
                records={activeTab === "pending-report" ? pendingRecordsSource : pendingRecordsSource.filter(r => r.requireReport && r.reportStatus === "pending")}
                onViewDetail={(record) => {
                  setSelectedLeave(record)
                  setShowDetailDialog(true)
                }}
                onEdit={(record) => {
                  setSelectedLeave(record)
                  setShowEditDialog(true)
                }}
                onDelete={(record) => {
                  setSelectedLeave(record)
                  setShowDeleteAlert(true)
                }}
                onRecordReport={(record) => {
                  setSelectedLeave(record)
                  setShowReportDialog(true)
                }}
                getLeaveTypeColor={getLeaveTypeColor}
                formatDateDisplay={formatDateDisplay}
                showReportButton
                isLoading={pendingLoading}
                isError={pendingError}
                onRetry={pendingRetry}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Study Leave */}
        <TabsContent value="study">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                รายการลาศึกษาต่อ/อบรม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRecordsSource.filter(r => r.type === "education").map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <GraduationCap className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{record.personName}</p>
                          <p className="text-sm text-muted-foreground">{record.personPosition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.requireReport && record.reportStatus === "pending" && (
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            รอรายงานตัว
                          </Badge>
                        )}
                        {record.requireReport && record.reportStatus === "reported" && (
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            รายงานตัวแล้ว
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedLeave(record)
                          setShowDetailDialog(true)
                        }}>
                          <Eye className="mr-1 h-3 w-3" />
                          ดูรายละเอียด
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedLeave(record)
                          setShowEditDialog(true)
                        }}>
                          <Edit className="mr-1 h-3 w-3" />
                          แก้ไข
                        </Button>
                      </div>
                    </div>

                    {record.studyInfo && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">สถานศึกษา</p>
                          <p className="font-medium">{record.studyInfo.institution}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">หลักสูตร</p>
                          <p className="font-medium">{record.studyInfo.program}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">สาขาวิชา</p>
                          <p className="font-medium">{record.studyInfo.field}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">วันที่เริ่มศึกษา</p>
                          <p className="font-medium">{formatDateDisplay(record.studyInfo.startDate)}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">วันที่ลา (ตาม USER)</p>
                        <p className="font-medium">{formatDateDisplay(record.userStartDate)} - {formatDateDisplay(record.userEndDate)}</p>
                      </div>
                      {record.documentStartDate && (
                        <div>
                          <p className="text-muted-foreground">วันที่ลา (ตามเอกสาร)</p>
                          <p className="font-medium text-amber-400">{formatDateDisplay(record.documentStartDate)} - {formatDateDisplay(record.documentEndDate || "")}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">จำนวนวัน (ตาม USER)</p>
                        <p className="font-medium">{record.days} วัน</p>
                      </div>
                      {record.documentDays !== undefined && record.documentDays > 0 && (
                        <div>
                          <p className="text-muted-foreground">จำนวนวัน (ตามเอกสาร)</p>
                          <p className="font-medium text-amber-400">{record.documentDays} วัน</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Leave Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการวันลา</DialogTitle>
            <DialogDescription>
              เพิ่มรายการวันลาตามเอกสารทางราชการ
            </DialogDescription>
          </DialogHeader>
          <AddLeaveForm
            onClose={() => setShowAddDialog(false)}
            onSave={handleAddLeave}
            personnel={personnel}
            onPreview={(url, name) => {
              setPreviewUrl(url)
              setPreviewName(name)
              setPreviewOpen(true)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Leave Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขรายการวันลา</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลวันลาของ {selectedLeave?.personName}
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <EditLeaveForm
              leave={selectedLeave}
              onClose={() => setShowEditDialog(false)}
              onSave={handleEditLeave}
              onPreview={(url, name) => {
                setPreviewUrl(url)
                setPreviewName(name)
                setPreviewOpen(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>รายละเอียดการลา</DialogTitle>
            <DialogDescription>
              ข้อมูลการลาของ {selectedLeave?.personName}
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <LeaveDetailContent
              leave={selectedLeave}
              getLeaveTypeColor={getLeaveTypeColor}
              formatDateDisplay={formatDateDisplay}
              documents={Array.isArray(documentsData) ? (documentsData as LeaveRecordDocument[]) : []}
              onPreview={(url, name) => {
                setPreviewUrl(url)
                setPreviewName(name)
                setPreviewOpen(true)
              }}
              onDeleteDocument={async (documentId) => {
                if (!selectedLeave) return
                await deleteDocument.mutateAsync({ documentId, leaveRecordId: selectedLeave.id })
                await refetchDocuments()
              }}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>ปิด</Button>
            <Button variant="outline" onClick={() => {
              setShowDetailDialog(false)
              setShowEditDialog(true)
            }}>
              <Edit className="mr-2 h-4 w-4" />
              แก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>บันทึกการรายงานตัว</DialogTitle>
            <DialogDescription>
              {selectedLeave?.personName} กลับมารายงานตัวหลังจากลา
            </DialogDescription>
          </DialogHeader>
          <RecordReportForm
            onClose={() => setShowReportDialog(false)}
            onSave={handleRecordReport}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบรายการวันลาของ {selectedLeave?.personName} หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">สำเร็จ</DialogTitle>
            <DialogDescription className="text-center">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">ตกลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previewUrl={previewUrl}
        previewName={previewName}
      />
    </div>
  )
}
