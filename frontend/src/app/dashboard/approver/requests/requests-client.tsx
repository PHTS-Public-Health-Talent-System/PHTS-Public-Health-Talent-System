"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, Search } from "lucide-react"

import { useMyScopes, usePendingApprovals, useApproveBatch } from "@/features/request/hooks"
import { buildScopeOptions } from "@/features/request/approver-utils"
import { StatusBadge } from "@/components/common/status-badge"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
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
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export default function ApproverRequestsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scopeQuery = searchParams.get("scope") || "ALL"
  const queryParam = searchParams.get("q") || ""

  const { user } = useAuth()
  const isDirector = user?.role === "DIRECTOR"
  const approveBatch = useApproveBatch()
  const qc = useQueryClient()

  const { data: scopes } = useMyScopes()
  const [search, setSearch] = useState(queryParam)
  const [scopeFilter, setScopeFilter] = useState(scopeQuery)
  const [batchComment, setBatchComment] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const selectAllVisible = () => {
    setSelectedIds(sorted.map((req) => req.request_id))
  }

  const clearSelection = () => {
    setSelectedIds([])
    setBatchComment("")
  }

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

      {isDirector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">อนุมัติแบบชุด (ผอ.)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={selectAllVisible}
              disabled={sorted.length === 0}
            >
              เลือกทั้งหมดในรายการ
            </Button>
            <Input
              value={batchComment}
              onChange={(e) => setBatchComment(e.target.value)}
              placeholder="ระบุความเห็น (ถ้ามี)"
              className="w-72"
            />
            <ConfirmDialog
              trigger={
                <Button disabled={selectedIds.length === 0 || approveBatch.isPending}>
                  อนุมัติที่เลือก ({selectedIds.length})
                </Button>
              }
              title="ยืนยันการอนุมัติแบบชุด"
              description="ต้องการอนุมัติคำขอที่เลือกทั้งหมดหรือไม่?"
              confirmLabel="อนุมัติทั้งหมด"
              onConfirm={() => {
                approveBatch.mutate(
                  { requestIds: selectedIds, comment: batchComment || undefined },
                  {
                    onSuccess: () => {
                      toast.success("อนุมัติคำขอที่เลือกแล้ว")
                      qc.invalidateQueries({ queryKey: ["pending-approvals"] })
                      clearSelection()
                    },
                    onError: (error: unknown) => {
                      const msg = error instanceof Error ? error.message : "อนุมัติไม่สำเร็จ"
                      toast.error(msg)
                    },
                  },
                )
              }}
            />
            {selectedIds.length > 0 && (
              <Button variant="ghost" onClick={clearSelection}>
                ล้างการเลือก
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
                      {isDirector && (
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedIds.includes(req.request_id)}
                          onChange={() => toggleSelect(req.request_id)}
                        />
                      )}
                      <span className="font-semibold">
                        {req.request_no ?? `#${req.request_id}`}
                      </span>
                      <StatusBadge status={req.status} currentStep={req.current_step} />
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
