"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Eye } from "lucide-react"

import { usePendingApprovals } from "@/features/request/hooks"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export default function PtsOfficerVerificationPage() {
  const { data: requests, isLoading } = usePendingApprovals()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!requests) return []
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((req) => {
      const requestNo = req.request_no ?? ""
      return (
        requestNo.toLowerCase().includes(q) ||
        String(req.request_id).includes(q)
      )
    })
  }, [requests, search])

  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">ตรวจสอบคำขอ</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่คำขอ"
            className="pl-9 w-full sm:w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการรอตรวจสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              ไม่มีคำขอที่รอตรวจสอบ
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              ไม่พบคำขอตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((req) => (
                <div
                  key={req.request_id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {req.request_no ?? `#${req.request_id}`}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      สังกัด: {req.current_department ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ยื่นเมื่อ{" "}
                      {new Date(req.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/pts-officer/verification/${req.request_id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-4 w-4" /> ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
