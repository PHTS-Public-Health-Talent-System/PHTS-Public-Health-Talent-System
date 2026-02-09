"use client"

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { PenTool, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMySignature, useRefreshSignature } from "@/features/signature/hooks"

export function SignaturePage() {
  const { data: signature, isLoading, error } = useMySignature()
  const refreshSignature = useRefreshSignature()
  const queryClient = useQueryClient()
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  const handleRefresh = () => {
    if (cooldownLeft > 0) return
    refreshSignature.mutate(undefined, {
      onSuccess: (data) => {
        const delayMs = data?.delay_ms ?? 1500
        const now = Date.now()
        const cooldownMs = 5000
        setCooldownUntil(now + cooldownMs)
        window.setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["my-signature"] })
          queryClient.invalidateQueries({ queryKey: ["signature-check"] })
        }, delayMs + 300)
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
        toast.error(message)
      },
    })
  }

  useEffect(() => {
    if (!cooldownUntil) return
    const timer = window.setInterval(() => {
      const left = Math.max(0, cooldownUntil - Date.now())
      setCooldownLeft(left)
      if (left === 0) {
        window.clearInterval(timer)
        setCooldownUntil(null)
      }
    }, 200)
    return () => window.clearInterval(timer)
  }, [cooldownUntil])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">ลายเซ็น</h1>
        <p className="mt-1 text-muted-foreground">ดูและตรวจสอบลายเซ็นของคุณที่ใช้ในระบบ</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  ลายเซ็นปัจจุบัน
                </CardTitle>
                <CardDescription>ลายเซ็นที่ใช้ในการลงนามเอกสาร</CardDescription>
              </div>
              {!isLoading && signature?.data_url && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  มีลายเซ็น
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[150px] w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="mt-4 font-medium text-foreground">เกิดข้อผิดพลาด</p>
                <p className="mt-2 text-sm text-muted-foreground">ไม่สามารถโหลดข้อมูลลายเซ็นได้</p>
              </div>
            ) : signature?.data_url ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8">
                  <Image
                    src={signature.data_url}
                    alt="ลายเซ็น"
                    width={300}
                    height={150}
                    className="max-h-[150px] max-w-full object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">แหล่งข้อมูล:</span>
                  <Badge variant="outline">HRMS</Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
                <AlertCircle className="h-12 w-12 text-warning" />
                <p className="mt-4 font-medium text-foreground">ไม่พบลายเซ็น</p>
                <p className="mt-2 text-sm text-muted-foreground">กรุณาติดต่อฝ่ายบุคคลเพื่ออัปเดตลายเซ็นในระบบ HRMS</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                ข้อมูลสำคัญ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium text-foreground">แหล่งที่มาของลายเซ็น</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  ลายเซ็นถูกดึงมาจากระบบ HRMS ของโรงพยาบาล หากต้องการเปลี่ยนแปลงลายเซ็น กรุณาติดต่อฝ่ายบุคคล
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium text-foreground">การใช้งานลายเซ็น</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  ลายเซ็นนี้จะถูกนำไปใช้ในเอกสารคำขอเงิน พ.ต.ส. และรายงานที่เกี่ยวข้องโดยอัตโนมัติ
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRefresh}
                disabled={refreshSignature.isPending || cooldownLeft > 0}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshSignature.isPending ? "animate-spin" : ""}`} />
                {refreshSignature.isPending
                  ? "กำลังรีเฟรช..."
                  : cooldownLeft > 0
                    ? `รออีก ${Math.ceil(cooldownLeft / 1000)} วินาที`
                    : "รีเฟรชข้อมูลจาก HRMS"}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                ไปที่ระบบ HRMS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
