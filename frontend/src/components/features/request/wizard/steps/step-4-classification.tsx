"use client"

import { useMemo, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { RequestFormData } from "@/types/request.types"
import { CheckCircle2, ShieldCheck, Info, DollarSign } from "lucide-react"
import { useMasterRates } from "@/features/request/hooks"
import { MasterRate } from "@/features/request/api"

// Profession code to Thai name mapping
const PROFESSION_LABELS: Record<string, string> = {
  DOCTOR: "แพทย์",
  DENTIST: "ทันตแพทย์",
  PHARMACIST: "เภสัชกร",
  NURSE: "พยาบาลวิชาชีพ",
  MED_TECH: "นักเทคนิคการแพทย์",
  RAD_TECH: "นักรังสีการแพทย์",
  PHYSIO: "นักกายภาพบำบัด",
  ALLIED_OTHER: "สหวิชาชีพอื่นๆ",
}

const GROUP_SUMMARIES: Record<string, Record<number, string>> = {
  DOCTOR: {
    1: "ปฏิบัติหน้าที่หลักตามมาตรฐานกำหนดตำแหน่ง",
    2: "วุฒิบัตรสาขาอื่นๆ / ปริญญาโท-เอก / พัฒนาคุณภาพ / รพช. > 4 ปี",
    3: "วุฒิบัตรสาขาเฉพาะทาง (พยาธิ, นิติเวช, จิตเวช, ศัลย์ทรวงอก/ประสาท, ระบาด)"
  },
  DENTIST: {
    1: "ปฏิบัติหน้าที่หลักตามมาตรฐานกำหนดตำแหน่ง",
    2: "ปฏิบัติหน้าที่หลัก + ปริญญาโทหรือเอก",
    3: "ปฏิบัติหน้าที่หลัก + วุฒิบัตรแสดงความรู้ความชำนาญ"
  },
  PHARMACIST: {
    1: "ปฏิบัติหน้าที่หลักตามมาตรฐานกำหนดตำแหน่ง",
    2: "เตรียมยาเคมีบำบัด / คลินิกโรคติดต่อร้ายแรง / คุ้มครองผู้บริโภค"
  },
  NURSE: {
    1: "OPD / ครอบครัวและชุมชน / อนามัยโรงเรียน / อาจารย์พยาบาล (กลุ่ม 1)",
    2: "ER / ห้องคลอด / ผ่าตัด / IPD / IC / ตรวจบำบัดพิเศษ / อาจารย์พยาบาล (กลุ่ม 1-2)",
    3: "วิสัญญี / พยาบาลเวชปฏิบัติ (NP) / ICU / CCU / ติดเชื้อรุนแรง / APN / หัวหน้าทีมคุณภาพ / อาจารย์พยาบาล (กลุ่ม 1)"
  },
  MED_TECH: { 1: "ปฏิบัติหน้าที่หลักด้านเทคนิคการแพทย์" },
  RAD_TECH: { 1: "ปฏิบัติหน้าที่หลักด้านรังสีการแพทย์" },
  PHYSIO: { 1: "ปฏิบัติหน้าที่หลักด้านกายภาพบำบัด" },
  CLIN_PSY: { 1: "ปฏิบัติหน้าที่หลักด้านจิตวิทยาคลินิก" },
  ALLIED_OTHER: {
    1: "ปฏิบัติหน้าที่หลัก (สหวิชาชีพอื่นๆ)"
  }
}

interface Step4Props {
  data: RequestFormData
  updateData: (field: keyof RequestFormData, value: unknown) => void
}

export function Step4Classification({ data, updateData }: Step4Props) {
  const { data: masterRates, isLoading } = useMasterRates()
  const rates = (masterRates ?? []) as MasterRate[]

  const selectedProfession = data.professionCode || data.classification?.professionCode || ""

  const professionRates = useMemo(() =>
    rates.filter((r) => r.profession_code === selectedProfession),
    [rates, selectedProfession]
  )

  // 1. Groups for selected profession
  const groups = useMemo(() =>
    Array.from(new Set(professionRates.map((r) => r.group_no))).sort((a, b) => a - b),
    [professionRates]
  )

  const selectedGroupNo = Number(data.classification?.groupId?.match(/\d+/)?.[0] ?? 0)

  // 2. Unique Items for selected Group
  const itemsInGroup = useMemo(() => {
    if (!selectedGroupNo) return []
    const rawItems = professionRates.filter((r) => r.group_no === selectedGroupNo)

    // Find unique item_nos
    const uniqueItemNos = Array.from(new Set(rawItems.map((r) => r.item_no))).sort((a, b) => {
      if (a === null) return -1
      if (b === null) return 1
      return String(a).localeCompare(String(b), undefined, { numeric: true })
    })

    return uniqueItemNos.map((ino) => {
      const itemRows = rawItems.filter((r) => r.item_no === ino)
      const hasSubItems = itemRows.some((r) => r.sub_item_no !== null)

      // If no subItems, this selection usually has a rate (unless it's a parent placeholder, but DB has amount per row)
      // Note: In our DB, even if it's a parent, if it has an amount, it's a valid selection.
      // But typically, if hasSubItems is true, the user MUST select a sub-item.

      return {
        id: ino === null ? "default" : String(ino),
        label: ino === null ? "ทั่วไป/ตามตำแหน่ง" : `ข้อ ${ino}`,
        hasSubItems,
        desc: itemRows[0]?.condition_desc, // Use first row's desc as parent desc
        rate: !hasSubItems ? itemRows[0] : null
      }
    })
  }, [professionRates, selectedGroupNo])

  const selectedItemId = data.classification?.itemId
  const selectedItemData = useMemo(() =>
    itemsInGroup.find(i => i.id === selectedItemId),
    [itemsInGroup, selectedItemId]
  )

  // 3. Sub-items for selected Item
  const subItemsInItem = useMemo(() => {
    if (!selectedItemId || !selectedGroupNo) return []
    const itemNo = selectedItemId === "default" ? null : selectedItemId
    const rows = professionRates.filter(
      (r) => r.group_no === selectedGroupNo && r.item_no === itemNo && r.sub_item_no !== null
    )

    return rows.map((r) => ({
      id: String(r.sub_item_no),
      label: `ข้อย่อย ${r.sub_item_no}`,
      desc: r.condition_desc,
      amount: r.amount,
      rateId: r.rate_id
    })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  }, [professionRates, selectedGroupNo, selectedItemId])

  const selectedSubItemId = data.classification?.subItemId as string | undefined
  const selectedSubItemData = useMemo(() =>
    subItemsInItem.find(si => si.id === selectedSubItemId),
    [subItemsInItem, selectedSubItemId]
  )

  // 4. Auto-select logic
  useEffect(() => {
    if (!isLoading && professionRates.length > 0) {
      // Auto-select Group if only one exists
      if (groups.length === 1 && !data.classification?.groupId) {
        handleGroupChange(`group${groups[0]}`)
      }

      // Auto-select Item if only one exists in the group
      if (itemsInGroup.length === 1 && !selectedItemId && data.classification?.groupId) {
        handleItemChange(itemsInGroup[0].id)
      }

      // Auto-select Sub-item if only one exists in the item
      if (subItemsInItem.length === 1 && !selectedSubItemId && selectedItemId) {
        handleSubItemChange(subItemsInItem[0].id)
      }
    }
  }, [isLoading, professionRates, groups, itemsInGroup, subItemsInItem, data.classification?.groupId, selectedItemId, selectedSubItemId])

  // Handlers
  const handleProfessionChange = (value: string) => {
    updateData("professionCode", value);
    updateData("classification", {
      professionCode: value,
      groupId: "",
      itemId: "",
      subItemId: "",
      amount: 0,
      rateId: undefined,
    })
  }

  const handleGroupChange = (value: string) => {
    // Reset lower levels
    updateData("classification", {
      ...data.classification,
      groupId: value,
      itemId: "",
      subItemId: "",
      amount: 0,
      rateId: undefined,
    })
  }

  const handleItemChange = (value: string) => {
    const item = itemsInGroup.find((i) => i.id === value)

    // If it has no sub-items, we can set the amount and rateId immediately
    if (item && !item.hasSubItems && item.rate) {
      updateData("classification", {
        ...data.classification,
        itemId: value,
        subItemId: "",
        amount: item.rate.amount,
        rateId: item.rate.rate_id,
      })
    } else {
      // Must select sub-item or just reset it
      updateData("classification", {
        ...data.classification,
        itemId: value,
        subItemId: "",
        amount: 0,
        rateId: undefined,
      })
    }
  }

  const handleSubItemChange = (value: string) => {
    const subItem = subItemsInItem.find((si) => si.id === value)
    if (subItem) {
      updateData("classification", {
        ...data.classification,
        subItemId: value,
        amount: subItem.amount,
        rateId: subItem.rateId,
      })
    }
  }

  const selectedAmount = data.classification?.amount ?? 0
  const currentDescription = selectedSubItemData?.desc || selectedItemData?.desc || ""

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-primary">ตรวจสอบสิทธิ พ.ต.ส.</h3>
        <p className="text-sm text-muted-foreground">
          เลือกกลุ่มบัญชีและรายการเบิกจ่ายตามคำสั่งมอบหมายงาน
        </p>
      </div>

      <Separator />

      {/* Profession Info (Read-only context) */}
      <div className="rounded-xl border bg-muted/30 px-4 py-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">
          วิชาชีพของคุณ: <span className="text-primary">{PROFESSION_LABELS[selectedProfession] || selectedProfession || "-"}</span>
        </span>
        <span className="text-xs text-muted-foreground ml-auto">*ดึงข้อมูลจาก HRMS</span>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Column: Selections (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-4">
             {/* Group Select */}
             <div className="space-y-2">
               <Label>กลุ่มบัญชี (Group)</Label>
               {isLoading ? (
                 <Skeleton className="h-10 w-full" />
               ) : (
                 <Select
                   value={data.classification?.groupId ?? ""}
                   onValueChange={handleGroupChange}
                   disabled={!selectedProfession}
                 >
                   <SelectTrigger className="h-10">
                     <SelectValue placeholder="เลือกกลุ่มบัญชี" />
                   </SelectTrigger>
                   <SelectContent>
                     {groups.map((num) => (
                       <SelectItem key={num} value={`group${num}`}>
                         <span className="truncate block max-w-[300px] md:max-w-md text-left">
                           กลุ่มที่ {num} - {GROUP_SUMMARIES[selectedProfession]?.[num] || "ทั่วไป"}
                         </span>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               )}
             </div>

             {/* Item Select */}
             <div className="space-y-2">
               <Label>รายการ (Item)</Label>
               {isLoading ? (
                 <Skeleton className="h-10 w-full" />
               ) : (
                 <Select
                   value={selectedItemId ?? ""}
                   onValueChange={handleItemChange}
                   disabled={!data.classification?.groupId}
                 >
                   <SelectTrigger className="h-10">
                     <SelectValue placeholder="เลือกรายการ" />
                   </SelectTrigger>
                   <SelectContent>
                     {itemsInGroup.map((item) => (
                       <SelectItem key={item.id} value={item.id}>
                         <span className="truncate block max-w-[300px] md:max-w-md text-left">
                           {item.label} {item.hasSubItems ? "(มีข้อย่อย)" : ""}
                         </span>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               )}
             </div>

             {/* Sub-item Select */}
             {selectedItemData?.hasSubItems && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                 <Label>ข้อย่อย (Sub-item)</Label>
                 <Select
                   value={selectedSubItemId ?? ""}
                   onValueChange={handleSubItemChange}
                 >
                   <SelectTrigger className="h-10">
                     <SelectValue placeholder="เลือกข้อย่อย" />
                   </SelectTrigger>
                   <SelectContent>
                     {subItemsInItem.map((si) => (
                       <SelectItem key={si.id} value={si.id}>
                         <span className="truncate block max-w-[300px] md:max-w-md text-left">
                            {si.label}
                         </span>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}

             {/* Effective Date */}
             <div className="space-y-2 pt-2">
                <Label>วันที่มีผล (Effective Date)</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={data.effectiveDate}
                    onChange={(e) => updateData("effectiveDate", e.target.value)}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    *ระบุวันที่เริ่มมีสิทธิตามคำสั่ง
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Details & Amount (5 cols) */}
        <div className="md:col-span-5 space-y-6">
           {/* Amount Display (Moved Top for Visibility) */}
           <Card className={`border shadow-sm transition-colors ${selectedAmount > 0 ? "bg-primary/5 border-primary" : "bg-muted/20"}`}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                 <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">เงินเพิ่มพิเศษ (พ.ต.ส.)</span>
                 <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${selectedAmount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                       {selectedAmount.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">บาท/เดือน</span>
                 </div>
              </CardContent>
           </Card>

           {/* Description Card */}
           <Card className="border shadow-sm">
             <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                   <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                   <div className="space-y-1">
                      <h4 className="font-medium text-sm text-foreground">รายละเอียดตามระเบียบ</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                         {currentDescription || (
                           <span className="italic opacity-70">
                             กรุณาเลือกรายการทางด้านซ้าย<br/>เพื่อดูรายละเอียดเงื่อนไขการเบิกจ่าย
                           </span>
                         )}
                      </p>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
