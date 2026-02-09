"use client"
export const dynamic = 'force-dynamic'

import { useMemo, useState } from "react"
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Search,
  Info,
  CircleDollarSign,
  Users,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  useCreateMasterRate,
  useDeleteMasterRate,
  useMasterRatesConfig,
  useRateHierarchy,
  useUpdateMasterRate,
} from "@/features/master-data/hooks"
import { normalizeMasterRates } from "@/features/master-data/utils"
import { useQueryClient } from "@tanstack/react-query"

interface AllowanceRate {
  id: number
  professionCode: string
  groupNo: number
  itemNo?: string | null
  subItemNo?: string | null
  code: string
  name: string
  amount: number
  description: string
  requirements: string
  isActive: boolean
  effectiveDate: string
  eligibleCount: number
}

interface ProfessionGroup {
  id: string
  code: string
  name: string
  allowedRates: string[]
  description: string
  isActive: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH").format(amount)
}

function formatThaiDate(dateStr: string): string {
  if (!dateStr) return "-"
  const [year, month, day] = dateStr.split("-")
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ]
  const yearNum = parseInt(year)
  const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
  return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`
}

export default function RatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddRateDialogOpen, setIsAddRateDialogOpen] = useState(false)
  const [isEditRateDialogOpen, setIsEditRateDialogOpen] = useState(false)
  const [isDeleteRateDialogOpen, setIsDeleteRateDialogOpen] = useState(false)
  const [selectedRate, setSelectedRate] = useState<AllowanceRate | null>(null)
  const [newRate, setNewRate] = useState({
    professionCode: "",
    groupNo: "",
    itemNo: "",
    subItemNo: "",
    amount: 0,
    conditionDesc: "",
  })

  const { data: ratesData } = useMasterRatesConfig()
  const { data: hierarchyData } = useRateHierarchy()
  const createRate = useCreateMasterRate()
  const updateRate = useUpdateMasterRate()
  const deleteRate = useDeleteMasterRate()
  const queryClient = useQueryClient()

  const rates = useMemo<AllowanceRate[]>(() => {
    if (!Array.isArray(ratesData)) return []
    return normalizeMasterRates(ratesData as Array<Record<string, unknown>>)
  }, [ratesData])

  const professions = useMemo<ProfessionGroup[]>(() => {
    if (!Array.isArray(hierarchyData)) return []
    return hierarchyData.map((prof) => {
      const amounts = new Set<string>()
      prof.groups.forEach((group) => {
        amounts.add(formatCurrency(group.rate))
      })
      return {
        id: prof.id,
        code: prof.id,
        name: prof.name,
        allowedRates: Array.from(amounts),
        description: `รวม ${prof.groups.length} กลุ่ม`,
        isActive: true,
      }
    })
  }, [hierarchyData])

  const filteredRates = rates.filter((rate) =>
    rate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProfessions = professions.filter((prof) =>
    prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddRate = async () => {
    if (!newRate.professionCode || !newRate.groupNo || !newRate.conditionDesc || newRate.amount <= 0) {
      toast.error("กรุณากรอกข้อมูลอัตราให้ครบถ้วน")
      return
    }
    try {
      await createRate.mutateAsync({
        profession_code: newRate.professionCode,
        group_no: Number(newRate.groupNo),
        item_no: newRate.itemNo || null,
        sub_item_no: newRate.subItemNo || null,
        amount: newRate.amount,
        condition_desc: newRate.conditionDesc,
      })
      await queryClient.invalidateQueries({ queryKey: ["master-rates-config"] })
      await queryClient.invalidateQueries({ queryKey: ["rate-hierarchy"] })
      toast.success("เพิ่มอัตราเงินเรียบร้อย")
      setNewRate({ professionCode: "", groupNo: "", itemNo: "", subItemNo: "", amount: 0, conditionDesc: "" })
      setIsAddRateDialogOpen(false)
    } catch {
      toast.error("ไม่สามารถเพิ่มอัตราเงินได้")
    }
  }

  const handleEditRate = async () => {
    if (!selectedRate) return
    if (!selectedRate.amount || !selectedRate.description) {
      toast.error("กรุณากรอกข้อมูลอัตราให้ครบถ้วน")
      return
    }
    try {
      await updateRate.mutateAsync({
        rateId: selectedRate.id,
        payload: {
          amount: selectedRate.amount,
          condition_desc: selectedRate.description,
          is_active: selectedRate.isActive,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ["master-rates-config"] })
      await queryClient.invalidateQueries({ queryKey: ["rate-hierarchy"] })
      toast.success("อัปเดตอัตราเงินเรียบร้อย")
      setIsEditRateDialogOpen(false)
      setSelectedRate(null)
    } catch {
      toast.error("ไม่สามารถอัปเดตอัตราเงินได้")
    }
  }

  const handleDeleteRate = async () => {
    if (!selectedRate) return
    try {
      await deleteRate.mutateAsync(selectedRate.id)
      await queryClient.invalidateQueries({ queryKey: ["master-rates-config"] })
      await queryClient.invalidateQueries({ queryKey: ["rate-hierarchy"] })
      toast.success("ลบอัตราเงินเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถลบอัตราเงินได้")
    } finally {
      setIsDeleteRateDialogOpen(false)
      setSelectedRate(null)
    }
  }

  const totalEligible = rates.reduce((sum, rate) => sum + rate.eligibleCount, 0)
  const totalMonthlyAmount = rates.reduce((sum, rate) => sum + (rate.amount * rate.eligibleCount), 0)

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">จัดการอัตราเงิน พ.ต.ส.</h1>
            <p className="text-muted-foreground">
              กำหนดอัตราเงินเพิ่มและกลุ่มวิชาชีพที่มีสิทธิ์
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">อัตราเงินทั้งหมด</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{rates.length}</div>
              <p className="text-xs text-muted-foreground">อัตรา</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">กลุ่มวิชาชีพ</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{professions.length}</div>
              <p className="text-xs text-muted-foreground">กลุ่ม</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ผู้มีสิทธิ์ทั้งหมด</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalEligible}</div>
              <p className="text-xs text-muted-foreground">คน</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ยอดเบิกจ่าย/เดือน</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalMonthlyAmount)}</div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาอัตราเงินหรือกลุ่มวิชาชีพ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="rates" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="rates">อัตราเงิน พ.ต.ส.</TabsTrigger>
            <TabsTrigger value="professions">กลุ่มวิชาชีพ</TabsTrigger>
          </TabsList>

          {/* Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddRateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มอัตราเงิน
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">รหัส</TableHead>
                      <TableHead className="text-muted-foreground">ชื่ออัตรา</TableHead>
                      <TableHead className="text-muted-foreground text-right">จำนวนเงิน</TableHead>
                      <TableHead className="text-muted-foreground text-center">ผู้มีสิทธิ์</TableHead>
                      <TableHead className="text-muted-foreground">วันที่มีผล</TableHead>
                      <TableHead className="text-muted-foreground text-center">สถานะ</TableHead>
                      <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRates.map((rate) => (
                      <TableRow key={rate.id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">{rate.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{rate.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold mb-1">{rate.description}</p>
                                <p className="text-xs text-muted-foreground">{rate.requirements}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(rate.amount)} บาท
                        </TableCell>
                        <TableCell className="text-center text-foreground">{rate.eligibleCount} คน</TableCell>
                        <TableCell className="text-foreground">{formatThaiDate(rate.effectiveDate)}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              rate.isActive
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-secondary text-muted-foreground"
                            }
                          >
                            {rate.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedRate(rate)
                                setIsEditRateDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedRate(rate)
                                setIsDeleteRateDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professions Tab */}
          <TabsContent value="professions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfessions.map((profession) => (
                <Card key={profession.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground">{profession.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          profession.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-secondary text-muted-foreground"
                        }
                      >
                        {profession.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      รหัส: {profession.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{profession.description}</p>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">อัตราเงินที่ได้รับ:</p>
                      <div className="flex flex-wrap gap-2">
                        {profession.allowedRates.map((rateCode) => (
                          <Badge key={rateCode} variant="secondary" className="bg-primary/20 text-primary">
                            {rateCode} บาท
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        แก้ไข
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Rate Dialog */}
        <Dialog open={isAddRateDialogOpen} onOpenChange={setIsAddRateDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">เพิ่มอัตราเงิน</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                กรอกข้อมูลอัตราเงิน พ.ต.ส. ที่ต้องการเพิ่ม
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="professionCode" className="text-foreground">รหัสวิชาชีพ</Label>
                  <Input
                    id="professionCode"
                    value={newRate.professionCode}
                    onChange={(e) => setNewRate({ ...newRate, professionCode: e.target.value })}
                    placeholder="เช่น NURSE"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="groupNo" className="text-foreground">กลุ่ม (Group No.)</Label>
                  <Input
                    id="groupNo"
                    type="number"
                    value={newRate.groupNo}
                    onChange={(e) => setNewRate({ ...newRate, groupNo: e.target.value })}
                    placeholder="เช่น 2"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemNo" className="text-foreground">ข้อ (Item No.)</Label>
                <Input
                  id="itemNo"
                  value={newRate.itemNo}
                  onChange={(e) => setNewRate({ ...newRate, itemNo: e.target.value })}
                  placeholder="เช่น 2.1"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subItemNo" className="text-foreground">ข้อย่อย (Sub Item)</Label>
                <Input
                  id="subItemNo"
                  value={newRate.subItemNo}
                  onChange={(e) => setNewRate({ ...newRate, subItemNo: e.target.value })}
                  placeholder="เช่น 2.1.1 (ถ้ามี)"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-foreground">จำนวนเงิน (บาท)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newRate.amount || ""}
                  onChange={(e) => setNewRate({ ...newRate, amount: parseInt(e.target.value) || 0 })}
                  placeholder="2500"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conditionDesc" className="text-foreground">รายละเอียดเงื่อนไข</Label>
                <Textarea
                  id="conditionDesc"
                  value={newRate.conditionDesc}
                  onChange={(e) => setNewRate({ ...newRate, conditionDesc: e.target.value })}
                  placeholder="อธิบายเงื่อนไข/คุณสมบัติของอัตรานี้"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAddRate}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rate Dialog */}
        <Dialog open={isEditRateDialogOpen} onOpenChange={setIsEditRateDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">แก้ไขอัตราเงิน</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                แก้ไขข้อมูลอัตราเงิน พ.ต.ส.
              </DialogDescription>
            </DialogHeader>
            {selectedRate && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-profession" className="text-foreground">วิชาชีพ</Label>
                    <Input
                      id="edit-profession"
                      value={selectedRate.professionCode}
                      disabled
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-group" className="text-foreground">กลุ่ม</Label>
                    <Input
                      id="edit-group"
                      value={selectedRate.groupNo}
                      disabled
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-item" className="text-foreground">ข้อ/ข้อย่อย</Label>
                  <Input
                    id="edit-item"
                    value={`${selectedRate.itemNo ?? "-"}${selectedRate.subItemNo ? `.${selectedRate.subItemNo}` : ""}`}
                    disabled
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description" className="text-foreground">รายละเอียดเงื่อนไข</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedRate.description}
                    onChange={(e) => setSelectedRate({ ...selectedRate, description: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount" className="text-foreground">จำนวนเงิน (บาท)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={selectedRate.amount}
                    onChange={(e) => setSelectedRate({ ...selectedRate, amount: parseInt(e.target.value) || 0 })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleEditRate}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteRateDialogOpen} onOpenChange={setIsDeleteRateDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">ยืนยันการลบ</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                คุณต้องการลบอัตราเงิน &quot;{selectedRate?.name}&quot; หรือไม่?
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteRateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button variant="destructive" onClick={handleDeleteRate}>
                ลบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
