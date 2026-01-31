"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, Search } from "lucide-react"

import { useMyScopes, usePendingApprovals } from "@/features/request/hooks"
import { buildScopeOptions } from "@/features/request/approver-utils"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApproverRequestsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scopeQuery = searchParams.get("scope") || "ALL"
  const queryParam = searchParams.get("q") || ""

  const { data: scopes } = useMyScopes()
  const [search, setSearch] = useState(queryParam)
  const [scopeFilter, setScopeFilter] = useState(scopeQuery)

  const pendingScope = scopeFilter === "ALL" ? undefined : scopeFilter
  const { data: requests, isLoading } = usePendingApprovals(pendingScope)

  const scopeOptions = useMemo(() => buildScopeOptions(scopes ?? []), [scopes])

  const updateQuery = (next: { q?: string; scope?: string }) => {
    const params = new URLSearchParams()
    const nextQ = next.q !== undefined ? next.q : search
    const nextScope = next.scope !== undefined ? next.scope : scopeFilter

    if (nextQ) params.set("q", nextQ)
    if (nextScope && nextScope !== "ALL") params.set("scope", nextScope)

    const query = params.toString()
    router.replace(query ? `?${query}` : "/dashboard/approver/requests")
  }

  const filtered = useMemo(() => {
    if (!requests) return []
    const q = search.trim().toLowerCase()
    return requests.filter((req) => {
      if (!q) return true
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
        <h2 className="text-2xl font-bold tracking-tight">คำขอรออนุมัติ</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                updateQuery({ q: e.target.value })
              }}
              placeholder="ค้นหาเลขที่คำขอ"
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Select
            value={scopeFilter}
            onValueChange={(val) => {
              setScopeFilter(val)
              updateQuery({ scope: val })
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="เลือกขอบเขต" />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((scope) => (
                <SelectItem key={scope.value} value={scope.value}>
                  {scope.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการรออนุมัติ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              ไม่มีคำขอที่รออนุมัติ
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
                    <Link href={`/dashboard/approver/requests/${req.request_id}`}>
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
