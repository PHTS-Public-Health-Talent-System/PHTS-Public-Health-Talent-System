"use client"
export const dynamic = 'force-dynamic'

import { useMemo, useState } from "react"
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAddHoliday, useDeleteHoliday, useHolidays } from "@/features/master-data/hooks"

// TODO: add icon when bulk remove is implemented: X
import { Badge } from "@/components/ui/badge"
import { YearPicker } from "@/components/month-year-picker"

interface Holiday {
  id: string
  date: string
  name: string
  type: "national" | "special" | "substitution"
  year: number
  sourceDate: string
}

const holidayTypeLabels: Record<Holiday["type"], string> = {
  national: "วันหยุดราชการ",
  special: "วันหยุดพิเศษ",
  substitution: "วันหยุดชดเชย",
}

const holidayTypeColors: Record<Holiday["type"], string> = {
  national: "bg-primary/20 text-primary border-primary/30",
  special: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  substitution: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

function formatThaiDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  const yearNum = parseInt(year)
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`
}

export default function HolidaysPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState("2568")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: "",
    type: "national" as Holiday["type"],
  })

  const selectedYearNum = parseInt(selectedYear)
  const queryYear = selectedYearNum > 2400 ? selectedYearNum - 543 : selectedYearNum
  const { data: holidaysData, refetch } = useHolidays({ year: queryYear })
  const addMutation = useAddHoliday()
  const deleteMutation = useDeleteHoliday()

  const holidays = useMemo<Holiday[]>(() => {
    if (!Array.isArray(holidaysData)) return []
    return (holidaysData as Array<{ holiday_date?: string; holiday_name?: string }>).map((row) => {
      const date = row.holiday_date ?? ""
      const yearNum = date ? parseInt(date.split("-")[0]) : selectedYearNum
      const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
      const name = row.holiday_name ?? "-"
      const type: Holiday["type"] = name.includes("ชดเชย")
        ? "substitution"
        : name.includes("พิเศษ")
          ? "special"
          : "national"
      return {
        id: date || `${name}-${thaiYear}`,
        date,
        name,
        type,
        year: thaiYear,
        sourceDate: date,
      }
    })
  }, [holidaysData, selectedYearNum])

  const filteredHolidays = holidays.filter((holiday) => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = holiday.year.toString() === selectedYear
    const matchesMonth = selectedMonth === "all" || holiday.date.split("-")[1] === selectedMonth.padStart(2, "0")
    return matchesSearch && matchesYear && matchesMonth
  })

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      toast.error("กรุณากรอกวันที่และชื่อวันหยุดให้ครบ")
      return
    }
    try {
      await addMutation.mutateAsync({ date: newHoliday.date, name: newHoliday.name.trim() })
      await refetch()
      toast.success("เพิ่มวันหยุดเรียบร้อย")
      setNewHoliday({ date: "", name: "", type: "national" })
      setIsAddDialogOpen(false)
    } catch {
      toast.error("ไม่สามารถเพิ่มวันหยุดได้")
    }
  }

  const handleEditHoliday = async () => {
    if (!selectedHoliday) return
    if (!selectedHoliday.date || !selectedHoliday.name.trim()) {
      toast.error("กรุณากรอกวันที่และชื่อวันหยุดให้ครบ")
      return
    }
    try {
      await deleteMutation.mutateAsync(selectedHoliday.sourceDate)
      await addMutation.mutateAsync({ date: selectedHoliday.date, name: selectedHoliday.name.trim() })
      await refetch()
      toast.success("แก้ไขวันหยุดเรียบร้อย")
      setIsEditDialogOpen(false)
      setSelectedHoliday(null)
    } catch {
      toast.error("ไม่สามารถแก้ไขวันหยุดได้")
    }
  }

  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return
    try {
      await deleteMutation.mutateAsync(selectedHoliday.sourceDate)
      await refetch()
      toast.success("ลบวันหยุดเรียบร้อย")
      setIsDeleteDialogOpen(false)
      setSelectedHoliday(null)
    } catch {
      toast.error("ไม่สามารถลบวันหยุดได้")
    }
  }

  const stats = {
    total: filteredHolidays.length,
    national: filteredHolidays.filter(h => h.type === "national").length,
    special: filteredHolidays.filter(h => h.type === "special").length,
    substitution: filteredHolidays.filter(h => h.type === "substitution").length,
  }

return (
  <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการวันหยุด</h1>
          <p className="text-muted-foreground">
            กำหนดวันหยุดราชการและวันหยุดพิเศษสำหรับคำนวณเงิน พ.ต.ส.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มวันหยุด
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">วันหยุดทั้งหมด</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">วัน</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">วันหยุดราชการ</CardTitle>
            <div className="h-3 w-3 rounded-full bg-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.national}</div>
            <p className="text-xs text-muted-foreground">วัน</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">วันหยุดพิเศษ</CardTitle>
            <div className="h-3 w-3 rounded-full bg-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.special}</div>
            <p className="text-xs text-muted-foreground">วัน</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">วันหยุดชดเชย</CardTitle>
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.substitution}</div>
            <p className="text-xs text-muted-foreground">วัน</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาวันหยุด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear((parseInt(selectedYear) - 1).toString())}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <YearPicker
                value={parseInt(selectedYear)}
                onChange={(year) => setSelectedYear(year.toString())}
                minYear={2550}
                maxYear={2600}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear((parseInt(selectedYear) + 1).toString())}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue placeholder="เดือน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกเดือน</SelectItem>
                {thaiMonths.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">วันที่</TableHead>
                <TableHead className="text-muted-foreground">ชื่อวันหยุด</TableHead>
                <TableHead className="text-muted-foreground">ประเภท</TableHead>
                <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {formatThaiDate(holiday.date)}
                  </TableCell>
                  <TableCell className="text-foreground">{holiday.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={holidayTypeColors[holiday.type]}>
                      {holidayTypeLabels[holiday.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedHoliday(holiday)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedHoliday(holiday)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredHolidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    ไม่พบข้อมูลวันหยุด
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">เพิ่มวันหยุด</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              กรอกข้อมูลว���นหยุดที่ต้องการเพิ่ม
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-foreground">วันที่</Label>
              <Input
                id="date"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">ชื่อวันหยุด</Label>
              <Input
                id="name"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="เช่น วันขึ้นปีใหม่"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-foreground">ประเภท</Label>
              <Select
                value={newHoliday.type}
                onValueChange={(value: Holiday["type"]) => setNewHoliday({ ...newHoliday, type: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">วันหยุดราชการ</SelectItem>
                  <SelectItem value="special">วันหยุดพิเศษ</SelectItem>
                  <SelectItem value="substitution">วันหยุดชดเชย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddHoliday}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">แก้ไขวันหยุด</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              แก้ไขข้อมูลวันหยุด
            </DialogDescription>
          </DialogHeader>
          {selectedHoliday && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date" className="text-foreground">วันที่</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={selectedHoliday.date}
                  onChange={(e) => setSelectedHoliday({ ...selectedHoliday, date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-foreground">ชื่อวันหยุด</Label>
                <Input
                  id="edit-name"
                  value={selectedHoliday.name}
                  onChange={(e) => setSelectedHoliday({ ...selectedHoliday, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type" className="text-foreground">ประเภท</Label>
                <Select
                  value={selectedHoliday.type}
                  onValueChange={(value: Holiday["type"]) => setSelectedHoliday({ ...selectedHoliday, type: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">วันหยุดราชการ</SelectItem>
                    <SelectItem value="special">วันหยุดพิเศษ</SelectItem>
                    <SelectItem value="substitution">วันหยุดชดเชย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditHoliday}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">ยืนยันการลบ</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              คุณต้องการลบวันหยุด &quot;{selectedHoliday?.name}&quot; หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteHoliday}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
