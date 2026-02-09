"use client"

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mail,
  Phone,
  Briefcase,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { useCurrentUser } from "@/features/auth/hooks"
import type { ApiResponse } from "@/shared/api/types"
import type { User } from "@/types/auth"

type UserProfile = User & {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

const formatThaiDate = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const resolveLicenseStatusLabel = (status?: UserProfile['license_status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'ใช้งานได้'
    case 'EXPIRED':
      return 'หมดอายุ'
    case 'INACTIVE':
      return 'ไม่ใช้งาน'
    case 'UNKNOWN':
      return 'ไม่พบข้อมูล'
    default:
      return 'ไม่พบข้อมูล'
  }
}

const resolveLicenseStatusClass = (status?: UserProfile['license_status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20'
    case 'EXPIRED':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'INACTIVE':
      return 'bg-muted text-muted-foreground border-muted'
    default:
      return 'bg-muted text-muted-foreground border-muted'
  }
}

export default function ProfilePage() {
  const { data: response, isLoading } = useCurrentUser()
  const user = (response as ApiResponse<UserProfile> | undefined)?.data ?? null

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">โปรไฟล์</h1>
        <p className="mt-1 text-muted-foreground">
          ข้อมูลส่วนตัวและการตั้งค่าบัญชี
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-bold text-primary">
                      {(user?.firstName || user?.first_name)?.charAt(0)}
                      {(user?.lastName || user?.last_name)?.charAt(0)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">ข้อมูลจากระบบ HRMS</p>

                  <Separator className="my-6" />

                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user?.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user?.phone || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                ข้อมูลส่วนตัว
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">ชื่อจริง</p>
                    <p className="font-medium">{user?.firstName || user?.first_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">นามสกุล</p>
                    <p className="font-medium">{user?.lastName || user?.last_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">อีเมล</p>
                    <p className="font-medium">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                    <p className="font-medium">{user?.phone || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ใบอนุญาตประกอบวิชาชีพ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">เลขที่ใบอนุญาต</p>
                    <p className="font-medium">{user?.license_no || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันหมดอายุ</p>
                    <p className="font-medium">{formatThaiDate(user?.license_valid_until)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ประเภทใบอนุญาต</p>
                    <p className="font-medium">{user?.license_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">สถานะ</p>
                    <Badge
                      variant="outline"
                      className={`mt-1 gap-1 ${resolveLicenseStatusClass(user?.license_status)}`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {resolveLicenseStatusLabel(user?.license_status)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                ไปที่ระบบ HRMS
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                ติดต่อฝ่ายบุคคล
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
