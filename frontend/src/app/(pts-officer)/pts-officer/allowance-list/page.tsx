"use client"
export const dynamic = 'force-dynamic'

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Banknote, BriefcaseMedical, ChevronRight } from "lucide-react"
import { useEligibilityList } from "@/features/request/hooks"
import { mapEligibility } from "./utils"

export default function AllowanceListPage() {
  const { data: eligibilityData } = useEligibilityList(true)

  const allowanceList = useMemo(() => {
    if (!Array.isArray(eligibilityData)) return []
    return eligibilityData.map((row) => mapEligibility(row))
  }, [eligibilityData])

  const professionSummaries = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number; amount: number }>()
    allowanceList.forEach((person) => {
      const current = grouped.get(person.professionCode) ?? {
        label: person.professionLabel,
        count: 0,
        amount: 0,
      }
      current.count += 1
      current.amount += person.actualRate
      grouped.set(person.professionCode, current)
    })

    return Array.from(grouped.entries())
      .map(([code, value]) => ({
        code,
        label: value.label,
        count: value.count,
        amount: value.amount,
      }))
      .sort((a, b) => b.count - a.count)
  }, [allowanceList])

  const totalAmount = allowanceList.reduce((sum, person) => sum + person.actualRate, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">เลือกวิชาชีพที่ต้องการตรวจรายชื่อผู้มีสิทธิ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            เลือกก่อนเข้าหน้าตารางรายชื่อผู้มีสิทธิ์ (active) จาก req_eligibility
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pts-officer/allowance-list/profession/all">
            ดูทั้งหมด
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ผู้มีสิทธิทั้งหมด</p>
                <p className="text-2xl font-bold">{allowanceList.length} คน</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนวิชาชีพ</p>
                <p className="text-2xl font-bold">{professionSummaries.length}</p>
              </div>
              <BriefcaseMedical className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวม/เดือน</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{totalAmount.toLocaleString()}</p>
              </div>
              <Banknote className="h-8 w-8 text-[hsl(var(--success))]/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการวิชาชีพ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/pts-officer/allowance-list/profession/all" className="rounded-lg border p-4 transition hover:border-primary/40 hover:bg-primary/5">
              <p className="text-xs text-muted-foreground">ALL</p>
              <p className="mt-1 text-base font-semibold">ทุกวิชาชีพ</p>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{allowanceList.length} คน</span>
                <span>{totalAmount.toLocaleString()} บาท</span>
              </div>
            </Link>
            {professionSummaries.map((profession) => (
              <Link
                key={profession.code}
                href={`/pts-officer/allowance-list/profession/${profession.code}`}
                className="rounded-lg border p-4 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{profession.code}</p>
                  <Badge variant="secondary">{profession.count} คน</Badge>
                </div>
                <p className="mt-1 text-base font-semibold">{profession.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{profession.amount.toLocaleString()} บาท/เดือน</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
