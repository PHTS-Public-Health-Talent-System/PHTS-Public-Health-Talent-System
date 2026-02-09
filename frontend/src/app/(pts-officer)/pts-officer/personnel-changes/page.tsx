"use client"
export const dynamic = 'force-dynamic'

// TODO: backend API for personnel changes is not available yet; keep mock data.

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Eye,
  Calendar,
  UserX,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  CalendarClock,
  Save,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"

type ChangeType = "retirement" | "resign" | "transfer"
type ChangeStatus = "pending" | "processed" | "completed"

interface PersonnelChange {
  id: string
  personId: string
  personName: string
  personPosition: string
  personDepartment: string
  profession: string
  changeType: ChangeType
  effectiveDate: string
  reason?: string
  transferTo?: string
  status: ChangeStatus
  notifiedAt: string
  processedAt?: string
  note?: string
}

const initialPersonnelChanges: PersonnelChange[] = [
  {
    id: "PC001",
    personId: "50",
    personName: "นาง สนอง ล้วนรัตนากร",
    personPosition: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    personDepartment: "บริหาร",
    profession: "พยาบาลวิชาชีพ",
    changeType: "retirement",
    effectiveDate: "2570-11-24",
    status: "pending",
    notifiedAt: "2568-08-01",
    note: "เกษียณอายุราชการ (เหลืออีก 22 เดือน)",
  },
  {
    id: "PC002",
    personId: "51",
    personName: "นางสาว กมลวรรณ อ่อนขำ",
    personPosition: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    personDepartment: "ศัลยกรรม",
    profession: "พยาบาลวิชาชีพ",
    changeType: "retirement",
    effectiveDate: "2570-12-23",
    status: "pending",
    notifiedAt: "2568-08-01",
    note: "เกษียณอายุราชการ (เหลืออีก 23 เดือน)",
  },
  {
    id: "PC003",
    personId: "52",
    personName: "นาง กฤติยา จำปา",
    personPosition: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    personDepartment: "อายุรกรรม",
    profession: "พยาบาลวิชาชีพ",
    changeType: "retirement",
    effectiveDate: "2570-12-23",
    status: "pending",
    notifiedAt: "2568-08-01",
    note: "เกษียณอายุราชการ (เหลืออีก 23 เดือน)",
  },
  {
    id: "PC004",
    personId: "53",
    personName: "นาง แก้วกัณหา พรหมน้อย",
    personPosition: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    personDepartment: "OR",
    profession: "พยาบาลวิชาชีพ",
    changeType: "retirement",
    effectiveDate: "2570-12-23",
    status: "pending",
    notifiedAt: "2568-08-01",
    note: "เกษียณอายุราชการ (เหลืออีก 23 เดือน)",
  },
  {
    id: "PC005",
    personId: "54",
    personName: "นาง กานต์พิชา จันทร์หงษ์",
    personPosition: "พยาบาลวิชาชีพชำนาญการพิเศษ",
    personDepartment: "ICU",
    profession: "พยาบาลวิชาชีพ",
    changeType: "retirement",
    effectiveDate: "2570-12-23",
    status: "pending",
    notifiedAt: "2568-08-01",
    note: "เกษียณอายุราชการ (เหลืออีก 23 เดือน)",
  },
  {
    id: "PC010",
    personId: "75",
    personName: "นาย วิชัย สุขสันต์",
    personPosition: "นักกายภาพบำบัดชำนาญการพิเศษ",
    personDepartment: "กลุ่มงานเวชกรรมฟื้นฟู",
    profession: "นักกายภาพบำบัด",
    changeType: "retirement",
    effectiveDate: "2568-09-30",
    status: "pending",
    notifiedAt: "2568-08-01",
  },
  {
    id: "PC011",
    personId: "120",
    personName: "นางสาว พิมพ์ใจ รักษาศรี",
    personPosition: "พยาบาลวิชาชีพชำนาญการ",
    personDepartment: "หอผู้ป่วยอายุรกรรม 2",
    profession: "พยาบาลวิชาชีพ",
    changeType: "resign",
    effectiveDate: "2568-08-31",
    reason: "ลาออกเพื่อไปทำงานที่โรงพยาบาลเอกชน",
    status: "processed",
    notifiedAt: "2568-08-15",
    processedAt: "2568-08-20",
  },
  {
    id: "PC012",
    personId: "85",
    personName: "นาง จันทร์เพ็ญ แก้วมณี",
    personPosition: "พยาบาลวิชาชีพชำนาญการ",
    personDepartment: "OR",
    profession: "พยาบาลวิชาชีพ",
    changeType: "transfer",
    effectiveDate: "2568-10-01",
    transferTo: "โรงพยาบาลศูนย์ขอนแก่น",
    status: "pending",
    notifiedAt: "2568-08-25",
  },
  {
    id: "PC013",
    personId: "200",
    personName: "นาย สมบูรณ์ พิทักษ์",
    personPosition: "นักเทคนิคการแพทย์ชำนาญการ",
    personDepartment: "ห้องปฏิบัติการ",
    profession: "นักเทคนิคการแพทย์",
    changeType: "resign",
    effectiveDate: "2568-09-15",
    reason: "ลาออกเพื่อศึกษาต่อต่างประเทศ",
    status: "pending",
    notifiedAt: "2568-09-01",
  },
]

// Mock retirement forecast
const mockRetirementForecast = [
  { year: 2568, count: 5, names: ["นาง สุภาพร ใจงาม", "นาย วิชัย สุขสันต์", "นาง อำพร มั่นคง", "นาย ประสิทธิ์ เจริญสุข", "นาง ลำดวน รักษา"] },
  { year: 2569, count: 8, names: ["นาย สมชาย ดีมาก", "นาง วิภา สุขสันต์", "นาย อดิศร ใจดี", "นาง พิมพ์พร รักดี", "นาย ศ���กดิ์ชัย บุญมา", "นาง สมหมาย รักษา", "นาย วิรัตน์ สุขใจ", "นาง จันทร์ดี มาลา"] },
  { year: 2570, count: 12, names: [] },
  { year: 2571, count: 6, names: [] },
]

const mockPersonnel = [
  { id: "50", name: "นาง สุภาพร ใจงาม", position: "พยาบาลวิชาชีพชำนาญการพิเศษ", department: "กลุ่มการพยาบาล", profession: "พยาบาลวิชาชีพ" },
  { id: "75", name: "นาย วิชัย สุขสันต์", position: "นักกายภาพบำบัดชำนาญการพิเศษ", department: "กลุ่มงานเวชกรรมฟื้นฟู", profession: "นักกายภาพบำบัด" },
  { id: "120", name: "นางสาว พิมพ์ใจ รักษาศรี", position: "พยาบาลวิชาชีพชำนาญการ", department: "หอผู้ป่วยอายุรกรรม 2", profession: "พยาบาลวิชาชีพ" },
  { id: "85", name: "นาง จันทร์เพ็ญ แก้วมณี", position: "พยาบาลวิชาชีพชำนาญการ", department: "OR", profession: "พยาบาลวิชาชีพ" },
  { id: "200", name: "นาย สมบูรณ์ พิทักษ์", position: "นักเทคนิคการแพทย์ชำนาญการ", department: "ห้องปฏิบัติการ", profession: "นักเทคนิคการแพทย์" },
  { id: "300", name: "นางสาว วรรณา สดใส", position: "เภสัชกรชำนาญการ", department: "กลุ่มงานเภสัชกรรม", profession: "เภสัชกร" },
]

const changeTypeConfig: Record<ChangeType, { label: string; color: string; icon: React.ElementType }> = {
  retirement: { label: "เกษียณอายุ", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CalendarClock },
  resign: { label: "ลาออก", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: UserX },
  transfer: { label: "ย้าย", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: ArrowRightLeft },
}

const statusConfig: Record<ChangeStatus, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  processed: { label: "กำลังดำเนินการ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "เสร็จสิ้น", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ""
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2])
  const month = months[parseInt(parts[1]) - 1]
  const year = parts[0]
  return `${day} ${month} ${year}`
}

export default function PersonnelChangesPage() {
  const [personnelChanges, setPersonnelChanges] = useState<PersonnelChange[]>(initialPersonnelChanges)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedChange, setSelectedChange] = useState<PersonnelChange | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const filteredChanges = personnelChanges.filter((change) => {
    const matchesSearch = change.personName.includes(searchQuery) || change.personDepartment.includes(searchQuery)
    const matchesType = typeFilter === "all" || change.changeType === typeFilter
    const matchesStatus = statusFilter === "all" || change.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const pendingCount = personnelChanges.filter(c => c.status === "pending").length
  const retirementCount = personnelChanges.filter(c => c.changeType === "retirement").length
  const resignCount = personnelChanges.filter(c => c.changeType === "resign").length
  const transferCount = personnelChanges.filter(c => c.changeType === "transfer").length

  const handleAddChange = (newChange: Partial<PersonnelChange>) => {
    const change: PersonnelChange = {
      id: `PC${String(personnelChanges.length + 1).padStart(3, "0")}`,
      personId: newChange.personId || "",
      personName: newChange.personName || "",
      personPosition: newChange.personPosition || "",
      personDepartment: newChange.personDepartment || "",
      profession: newChange.profession || "",
      changeType: newChange.changeType || "retirement",
      effectiveDate: newChange.effectiveDate || "",
      reason: newChange.reason,
      transferTo: newChange.transferTo,
      status: "pending",
      notifiedAt: new Date().toISOString().split("T")[0],
      note: newChange.note,
    }
    setPersonnelChanges([...personnelChanges, change])
    setShowAddDialog(false)
    setSuccessMessage("เพิ่มรายการการเปลี่ยนแปลงสำเร็จ")
    setShowSuccessDialog(true)
  }

  const handleEditChange = (updatedChange: PersonnelChange) => {
    setPersonnelChanges(personnelChanges.map(c => c.id === updatedChange.id ? updatedChange : c))
    setShowEditDialog(false)
    setSuccessMessage("แก้ไขรายการสำเร็จ")
    setShowSuccessDialog(true)
  }

  const handleDeleteChange = () => {
    if (selectedChange) {
      setPersonnelChanges(personnelChanges.filter(c => c.id !== selectedChange.id))
      setShowDeleteAlert(false)
      setSelectedChange(null)
      setSuccessMessage("ลบรายการสำเร็จ")
      setShowSuccessDialog(true)
    }
  }

  const handleConfirmProcess = () => {
    if (selectedChange) {
      setPersonnelChanges(personnelChanges.map(c => 
        c.id === selectedChange.id 
          ? { ...c, status: "processed" as const, processedAt: new Date().toISOString().split("T")[0] }
          : c
      ))
      setShowDetailDialog(false)
      setSelectedChange(null)
      setSuccessMessage("ยืนยันการดำเนินการสำเร็จ")
      setShowSuccessDialog(true)
    }
  }

  const handleMarkComplete = () => {
    if (selectedChange) {
      setPersonnelChanges(personnelChanges.map(c => 
        c.id === selectedChange.id 
          ? { ...c, status: "completed" as const }
          : c
      ))
      setShowDetailDialog(false)
      setSelectedChange(null)
      setSuccessMessage("ทำเครื่องหมายเสร็จสิ้นสำเร็จ")
      setShowSuccessDialog(true)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="การเปลี่ยนแปลงบุคลากร"
        description="ติดตามการเกษียณอายุ ลาออก และย้ายของบุคลากร"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <CalendarClock className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เกษียณอายุ</p>
                <p className="text-2xl font-bold text-purple-400">{retirementCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <UserX className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ลาออก</p>
                <p className="text-2xl font-bold text-red-400">{resignCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <ArrowRightLeft className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ย้าย</p>
                <p className="text-2xl font-bold text-blue-400">{transferCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="retirement">
            เกษียณอายุ
            {retirementCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                {retirementCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecast">คาดการณ์เกษียณ</TabsTrigger>
        </TabsList>

        {/* Tab: All Changes */}
        <TabsContent value="all">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">รายการการเปลี่ยนแปลงบุคลากร</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อ, แผนก..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-secondary border-border"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="ประเภท" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกประเภท</SelectItem>
                      <SelectItem value="retirement">เกษียณอายุ</SelectItem>
                      <SelectItem value="resign">ลาออก</SelectItem>
                      <SelectItem value="transfer">ย้าย</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">ทุกสถานะ</SelectItem>
                      <SelectItem value="pending">รอดำเนินการ</SelectItem>
                      <SelectItem value="processed">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChangesTable 
                changes={filteredChanges}
                onViewDetail={(change) => {
                  setSelectedChange(change)
                  setShowDetailDialog(true)
                }}
                onEdit={(change) => {
                  setSelectedChange(change)
                  setShowEditDialog(true)
                }}
                onDelete={(change) => {
                  setSelectedChange(change)
                  setShowDeleteAlert(true)
                }}
                formatDateDisplay={formatDateDisplay}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Retirement */}
        <TabsContent value="retirement">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                รายการเกษียณอายุราชการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChangesTable 
                changes={personnelChanges.filter(c => c.changeType === "retirement")}
                onViewDetail={(change) => {
                  setSelectedChange(change)
                  setShowDetailDialog(true)
                }}
                onEdit={(change) => {
                  setSelectedChange(change)
                  setShowEditDialog(true)
                }}
                onDelete={(change) => {
                  setSelectedChange(change)
                  setShowDeleteAlert(true)
                }}
                formatDateDisplay={formatDateDisplay}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Forecast */}
        <TabsContent value="forecast">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                คาดการณ์การเกษียณอายุราชการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRetirementForecast.map((item) => (
                  <div
                    key={item.year}
                    className="p-4 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">ปีงบประมาณ {item.year}</p>
                          <p className="text-sm text-muted-foreground">30 กันยายน {item.year}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">{item.count} คน</p>
                      </div>
                    </div>
                    {item.names.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">รายชื่อผู้เกษียณ:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.names.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="bg-secondary">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการการเปลี่ยนแปลง</DialogTitle>
            <DialogDescription>
              บันทึกรายการเกษียณ ลาออก หรือย้ายของบุคลากร
            </DialogDescription>
          </DialogHeader>
          <AddChangeForm 
            onClose={() => setShowAddDialog(false)} 
            onSave={handleAddChange}
            personnel={mockPersonnel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>แก้ไขรายการ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลการเปลี่ยนแปลงของ {selectedChange?.personName}
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <EditChangeForm 
              change={selectedChange}
              onClose={() => setShowEditDialog(false)} 
              onSave={handleEditChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>รายละเอียดการเปลี่ยนแปลง</DialogTitle>
          </DialogHeader>
          {selectedChange && (
            <ChangeDetailContent change={selectedChange} formatDateDisplay={formatDateDisplay} />
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>ปิด</Button>
            {selectedChange?.status === "pending" && (
              <Button onClick={handleConfirmProcess}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                ยืนยันการดำเนินการ
              </Button>
            )}
            {selectedChange?.status === "processed" && (
              <Button onClick={handleMarkComplete} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                ทำเครื่องหมายเสร็จสิ้น
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบรายการของ {selectedChange?.personName} หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="p-3 rounded-full bg-emerald-500/10 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <DialogTitle className="text-center mb-2">สำเร็จ</DialogTitle>
            <p className="text-muted-foreground text-center">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">ตกลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Changes Table Component
function ChangesTable({ 
  changes, 
  onViewDetail,
  onEdit,
  onDelete,
  formatDateDisplay
}: { 
  changes: PersonnelChange[]
  onViewDetail: (change: PersonnelChange) => void
  onEdit: (change: PersonnelChange) => void
  onDelete: (change: PersonnelChange) => void
  formatDateDisplay: (date: string) => string
}) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ไม่พบรายการ
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="text-muted-foreground">ชื่อ-นามสกุล</TableHead>
            <TableHead className="text-muted-foreground">ตำแหน่ง/หน่วยงาน</TableHead>
            <TableHead className="text-muted-foreground">ประเภท</TableHead>
            <TableHead className="text-muted-foreground">วันที่มีผล</TableHead>
            <TableHead className="text-muted-foreground text-center">สถานะ</TableHead>
            <TableHead className="text-muted-foreground w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => {
            const typeInfo = changeTypeConfig[change.changeType]
            const statusInfo = statusConfig[change.status]
            const TypeIcon = typeInfo.icon
            
            return (
              <TableRow key={change.id} className="hover:bg-secondary/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeInfo.color.split(' ')[0]}`}>
                      <TypeIcon className={`h-4 w-4 ${typeInfo.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="font-medium">{change.personName}</p>
                      <p className="text-xs text-muted-foreground">{change.profession}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{change.personPosition}</p>
                    <p className="text-xs text-muted-foreground">{change.personDepartment}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeInfo.color}>
                    {typeInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatDateDisplay(change.effectiveDate)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(change)} title="ดูรายละเอียด">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(change)} title="แก้ไข">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(change)} title="ลบ">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Change Detail Content Component
function ChangeDetailContent({ change, formatDateDisplay }: { change: PersonnelChange, formatDateDisplay: (date: string) => string }) {
  const typeInfo = changeTypeConfig[change.changeType]
  const statusInfo = statusConfig[change.status]
  const TypeIcon = typeInfo.icon

  return (
    <div className="space-y-4">
      {/* Person Info */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <User className="h-5 w-5 text-primary" />
          <span className="font-medium">ข้อมูลบุคลากร</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">ชื่อ-นามสกุล</p>
            <p className="font-medium">{change.personName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ตำแหน่ง</p>
            <p className="font-medium">{change.personPosition}</p>
          </div>
          <div>
            <p className="text-muted-foreground">วิชาชีพ</p>
            <p className="font-medium">{change.profession}</p>
          </div>
          <div>
            <p className="text-muted-foreground">หน่วยงาน</p>
            <p className="font-medium">{change.personDepartment}</p>
          </div>
        </div>
      </div>

      {/* Change Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <TypeIcon className={`h-4 w-4 ${typeInfo.color.split(' ')[1]}`} />
            ประเภทการเปลี่ยนแปลง
          </span>
          <Badge variant="outline" className={typeInfo.color}>
            {typeInfo.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">วันที่มีผล</p>
            <p className="font-medium">{formatDateDisplay(change.effectiveDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">สถานะ</p>
            <Badge variant="outline" className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">วันที่แจ้ง</p>
            <p className="font-medium">{formatDateDisplay(change.notifiedAt)}</p>
          </div>
          {change.processedAt && (
            <div>
              <p className="text-muted-foreground">วันที่ดำเนินการ</p>
              <p className="font-medium">{formatDateDisplay(change.processedAt)}</p>
            </div>
          )}
        </div>

        {change.reason && (
          <div>
            <p className="text-sm text-muted-foreground">เหตุผล</p>
            <p className="font-medium">{change.reason}</p>
          </div>
        )}

        {change.transferTo && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">ย้ายไปที่</span>
            </div>
            <p className="font-medium">{change.transferTo}</p>
          </div>
        )}

        {change.note && (
          <div>
            <p className="text-sm text-muted-foreground">หมายเหตุ</p>
            <p className="text-sm">{change.note}</p>
          </div>
        )}
      </div>

      {/* Actions Required */}
      {change.status === "pending" && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="font-medium text-amber-400">การดำเนินการที่ต้องทำ</span>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>- ปรับปรุงข้อมูลในระบบ พ.ต.ส.</li>
            <li>- ยกเลิกสิทธิ์การรับเงินตั้งแต่ {formatDateDisplay(change.effectiveDate)}</li>
            {change.changeType === "transfer" && (
              <li>- แจ้งหน่วยงานปลายทางเรื่องสิทธิ์ พ.ต.ส.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// Add Change Form Component
function AddChangeForm({ 
  onClose, 
  onSave,
  personnel
}: { 
  onClose: () => void
  onSave: (change: Partial<PersonnelChange>) => void
  personnel: { id: string; name: string; position: string; department: string; profession: string }[]
}) {
  const [selectedPerson, setSelectedPerson] = useState("")
  const [changeType, setChangeType] = useState<ChangeType | "">("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [reason, setReason] = useState("")
  const [transferTo, setTransferTo] = useState("")
  const [note, setNote] = useState("")

  const person = personnel.find(p => p.id === selectedPerson)

  const handleSubmit = () => {
    if (!selectedPerson || !changeType || !effectiveDate) return

    const newChange: Partial<PersonnelChange> = {
      personId: selectedPerson,
      personName: person?.name || "",
      personPosition: person?.position || "",
      personDepartment: person?.department || "",
      profession: person?.profession || "",
      changeType: changeType as ChangeType,
      effectiveDate,
      reason: changeType === "resign" ? reason : undefined,
      transferTo: changeType === "transfer" ? transferTo : undefined,
      note: note || undefined,
    }

    onSave(newChange)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>เลือกบุคลากร</Label>
        <Select value={selectedPerson} onValueChange={setSelectedPerson}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="เลือกบุคลากร" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {personnel.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} - {p.department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>ประเภทการเปลี่ยนแปลง</Label>
        <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="เลือกประเภท" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="retirement">เกษียณอายุราชการ</SelectItem>
            <SelectItem value="resign">ลาออก</SelectItem>
            <SelectItem value="transfer">ย้าย</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>วันที่มีผล</Label>
        <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="bg-secondary border-border" />
      </div>

      {changeType === "resign" && (
        <div className="space-y-2">
          <Label>เหตุผลการลาออก</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผล" className="bg-secondary border-border" />
        </div>
      )}

      {changeType === "transfer" && (
        <div className="space-y-2">
          <Label>ย้ายไปหน่วยงาน</Label>
          <Input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="ระบุหน่วยงานปลายทาง" className="bg-secondary border-border" />
        </div>
      )}

      <div className="space-y-2">
        <Label>หมายเหตุ</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุหมายเหตุ (ถ้ามี)" className="bg-secondary border-border" />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSubmit} disabled={!selectedPerson || !changeType || !effectiveDate}>
          <Save className="mr-2 h-4 w-4" />
          บันทึก
        </Button>
      </DialogFooter>
    </div>
  )
}

// Edit Change Form Component
function EditChangeForm({ 
  change,
  onClose, 
  onSave
}: { 
  change: PersonnelChange
  onClose: () => void
  onSave: (change: PersonnelChange) => void
}) {
  const [changeType, setChangeType] = useState<ChangeType>(change.changeType)
  const [effectiveDate, setEffectiveDate] = useState(change.effectiveDate)
  const [reason, setReason] = useState(change.reason || "")
  const [transferTo, setTransferTo] = useState(change.transferTo || "")
  const [note, setNote] = useState(change.note || "")
  const [status, setStatus] = useState<ChangeStatus>(change.status)

  const handleSubmit = () => {
    const updatedChange: PersonnelChange = {
      ...change,
      changeType,
      effectiveDate,
      reason: changeType === "resign" ? reason : undefined,
      transferTo: changeType === "transfer" ? transferTo : undefined,
      note: note || undefined,
      status,
      processedAt: status !== "pending" && !change.processedAt ? new Date().toISOString().split("T")[0] : change.processedAt,
    }

    onSave(updatedChange)
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm text-muted-foreground">บุคลากร</p>
        <p className="font-medium">{change.personName}</p>
        <p className="text-sm text-muted-foreground">{change.personPosition} - {change.personDepartment}</p>
      </div>

      <div className="space-y-2">
        <Label>ประเภทการเปลี่ยนแปลง</Label>
        <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="retirement">เกษียณอายุราชการ</SelectItem>
            <SelectItem value="resign">ลาออก</SelectItem>
            <SelectItem value="transfer">ย้าย</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>สถานะ</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ChangeStatus)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="pending">รอดำเนินการ</SelectItem>
            <SelectItem value="processed">กำลังดำเนินการ</SelectItem>
            <SelectItem value="completed">เสร็จสิ้น</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>วันที่มีผล</Label>
        <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="bg-secondary border-border" />
      </div>

      {changeType === "resign" && (
        <div className="space-y-2">
          <Label>เหตุผลการลาออก</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผล" className="bg-secondary border-border" />
        </div>
      )}

      {changeType === "transfer" && (
        <div className="space-y-2">
          <Label>ย้ายไปหน่วยงาน</Label>
          <Input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="ระบุหน่วยงานปลายทาง" className="bg-secondary border-border" />
        </div>
      )}

      <div className="space-y-2">
        <Label>หมายเหตุ</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุหมายเหตุ (ถ้ามี)" className="bg-secondary border-border" />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSubmit}>
          <Save className="mr-2 h-4 w-4" />
          บันทึกการแก้ไข
        </Button>
      </DialogFooter>
    </div>
  )
}
