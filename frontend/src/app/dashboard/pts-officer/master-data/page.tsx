"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAddHoliday,
  useDeleteHoliday,
  useHolidays,
  useMasterRatesConfig,
  useUpdateMasterRate,
} from "@/features/master-data/hooks"

type HolidayRow = {
  holiday_id: number
  holiday_date: string
  holiday_name: string
  is_active: boolean
}

type MasterRateRow = {
  rate_id: number
  profession_code: string
  group_no: number
  item_no: string | number
  condition_desc: string | null
  amount: number
  is_active: boolean
}

export default function MasterDataPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [holidayDate, setHolidayDate] = useState("")
  const [holidayName, setHolidayName] = useState("")

  const holidays = useHolidays({ year })
  const addHoliday = useAddHoliday()
  const deleteHoliday = useDeleteHoliday()

  const rates = useMasterRatesConfig()
  const updateRate = useUpdateMasterRate()

  const holidayRows = (holidays.data as HolidayRow[] | undefined) ?? []
  const rateRows = useMemo(() => {
    return (rates.data as MasterRateRow[] | undefined) ?? []
  }, [rates.data])

  const [rateDrafts, setRateDrafts] = useState<Record<number, MasterRateRow>>({})

  const handleRateDraft = (rate: MasterRateRow, field: keyof MasterRateRow, value: string | number | boolean) => {
    setRateDrafts((prev) => ({
      ...prev,
      [rate.rate_id]: {
        ...rate,
        ...prev[rate.rate_id],
        [field]: value,
      } as MasterRateRow,
    }))
  }

  const handleUpdateRate = (rate: MasterRateRow) => {
    const draft = rateDrafts[rate.rate_id] ?? rate
    if (!draft.condition_desc || !draft.condition_desc.trim()) {
      toast.error("กรุณาระบุเงื่อนไขก่อนบันทึก")
      return
    }
    updateRate.mutate(
      {
        rateId: rate.rate_id,
        payload: {
          amount: Number(draft.amount),
          condition_desc: draft.condition_desc ?? "",
          is_active: !!draft.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success("อัปเดตอัตราเรียบร้อยแล้ว")
          rates.refetch()
        },
        onError: () => toast.error("อัปเดตอัตราไม่สำเร็จ"),
      },
    )
  }

  const handleAddHoliday = () => {
    if (!holidayDate || !holidayName) {
      toast.error("กรุณากรอกวันที่และชื่อวันหยุด")
      return
    }
    addHoliday.mutate(
      { date: holidayDate, name: holidayName },
      {
        onSuccess: () => {
          toast.success("เพิ่มวันหยุดเรียบร้อยแล้ว")
          setHolidayDate("")
          setHolidayName("")
          holidays.refetch()
        },
        onError: () => toast.error("เพิ่มวันหยุดไม่สำเร็จ"),
      },
    )
  }

  const handleDeleteHoliday = (date: string) => {
    deleteHoliday.mutate(date, {
      onSuccess: () => {
        toast.success("ลบวันหยุดเรียบร้อยแล้ว")
        holidays.refetch()
      },
      onError: () => toast.error("ลบวันหยุดไม่สำเร็จ"),
    })
  }

  const sortedRates = useMemo(() => {
    return [...rateRows].sort((a, b) => {
      if (a.profession_code !== b.profession_code) {
        return a.profession_code.localeCompare(b.profession_code)
      }
      if (a.group_no !== b.group_no) return a.group_no - b.group_no
      return String(a.item_no).localeCompare(String(b.item_no))
    })
  }, [rateRows])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Master Data</div>
        <div className="text-2xl font-semibold">ตั้งค่าข้อมูลหลัก</div>
      </div>

      <Tabs defaultValue="holidays">
        <TabsList>
          <TabsTrigger value="holidays">วันหยุดราชการ</TabsTrigger>
          <TabsTrigger value="rates">อัตรา พ.ต.ส.</TabsTrigger>
        </TabsList>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle>วันหยุดราชการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">ปี</div>
                  <Input value={year} onChange={(e) => setYear(e.target.value)} className="w-24" />
                </div>
                <Button variant="outline" onClick={() => holidays.refetch()}>
                  โหลดรายการ
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-44"
                />
                <Input
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="ชื่อวันหยุด"
                  className="w-64"
                />
                <Button onClick={handleAddHoliday} disabled={addHoliday.isPending}>
                  {addHoliday.isPending ? "กำลังเพิ่ม..." : "เพิ่มวันหยุด"}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ชื่อวันหยุด</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidayRows.map((holiday) => (
                    <TableRow key={holiday.holiday_id}>
                      <TableCell>{holiday.holiday_date}</TableCell>
                      <TableCell>{holiday.holiday_name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteHoliday(holiday.holiday_date)}
                        >
                          ลบ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {holidayRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        ยังไม่มีรายการวันหยุด
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>อัตรา พ.ต.ส.</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วิชาชีพ</TableHead>
                    <TableHead>กลุ่ม</TableHead>
                    <TableHead>ข้อ</TableHead>
                    <TableHead>เงื่อนไข</TableHead>
                    <TableHead className="text-right">อัตรา</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRates.map((rate) => {
                    const draft = rateDrafts[rate.rate_id] ?? rate
                    return (
                      <TableRow key={rate.rate_id}>
                        <TableCell>{rate.profession_code}</TableCell>
                        <TableCell>{rate.group_no}</TableCell>
                        <TableCell>{rate.item_no}</TableCell>
                        <TableCell>
                          <Input
                            value={draft.condition_desc ?? ""}
                            onChange={(e) =>
                              handleRateDraft(rate, "condition_desc", e.target.value)
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={draft.amount}
                            onChange={(e) =>
                              handleRateDraft(rate, "amount", Number(e.target.value))
                            }
                            className="h-8 w-28 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={!!draft.is_active}
                            onChange={(e) =>
                              handleRateDraft(rate, "is_active", e.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleUpdateRate(rate)}>
                            บันทึก
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {sortedRates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        ยังไม่มีข้อมูลอัตรา
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
