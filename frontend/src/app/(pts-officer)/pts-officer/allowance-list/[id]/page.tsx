"use client"
export const dynamic = "force-dynamic"

import { use, useMemo, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  User,
  Award,
  Phone,
  Mail,
  AlertTriangle,
  Calendar,
  FileText,
  ChevronRight,
  Briefcase,
  Building2,
  Clock,
  CreditCard,
  type LucideIcon,
} from "lucide-react"
import { useEligibilityDetail, useEligibilityList, useRequestDetail } from "@/features/request/hooks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveProfessionLabel } from "../utils"
import type { RequestWithDetails } from "@/types/request.types"

const InfoItem = ({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: ReactNode
  icon?: LucideIcon
  className?: string
}) => (
  <div className={`flex flex-col gap-1 ${className ?? ""}`}>
    <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
      {label}
    </dt>
    <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
  </div>
)

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: LucideIcon }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <h3 className="font-semibold text-base text-foreground">{title}</h3>
  </div>
)

const PERSONNEL_TYPE_LABELS: Record<string, string> = {
  CIVIL_SERVANT: "ข้าราชการ",
  GOV_EMPLOYEE: "พนักงานราชการ",
  PH_EMPLOYEE: "พนักงานกระทรวงสาธารณสุข",
  TEMP_EMPLOYEE: "ลูกจ้างชั่วคราว",
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_ENTRY: "ขอรับ พ.ต.ส. ครั้งแรก",
  EDIT_INFO_SAME_RATE: "แก้ไขข้อมูล (อัตราเดิม)",
  EDIT_INFO_NEW_RATE: "แก้ไขข้อมูล (อัตราใหม่)",
}

const WORK_ATTRIBUTE_LABELS: Record<string, string> = {
  operation: "ปฏิบัติการ",
  planning: "วางแผน",
  coordination: "ประสานงาน",
  service: "บริการ",
}

function formatThaiDate(value?: string | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatThaiDateTime(value?: string | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function resolveLicenseStatus(expiryDate?: string | null): "active" | "expiring" | "expired" {
  if (!expiryDate) return "active"
  const expiry = new Date(expiryDate)
  if (Number.isNaN(expiry.getTime())) return "active"
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "expired"
  if (diffDays <= 90) return "expiring"
  return "active"
}

const licenseStatusConfig = {
  active: {
    label: "สิทธิยังใช้งานได้",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  expiring: {
    label: "สิทธิใกล้หมดอายุ",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  expired: {
    label: "สิทธิหมดอายุแล้ว",
    color: "bg-red-50 text-red-700 border-red-200",
  },
}

function parseSubmission(value: RequestWithDetails["submission_data"]) {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value
}

function getSubmissionString(submission: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = submission[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return undefined
}

export default function AllowanceEligibilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const profession = searchParams.get("profession")
  const normalizedProfession = profession ? profession.toUpperCase() : null
  const backHref = normalizedProfession
    ? `/pts-officer/allowance-list/profession/${normalizedProfession}`
    : "/pts-officer/allowance-list"

  const { data: eligibilityList } = useEligibilityList(true)
  const { data, isLoading } = useEligibilityDetail(id)
  const { data: sourceRequest } = useRequestDetail(data?.request_id ?? undefined)

  const personOptions = useMemo(() => {
    const rows = Array.isArray(eligibilityList) ? eligibilityList : []
    return [...rows]
      .sort((a, b) => (b.eligibility_id ?? 0) - (a.eligibility_id ?? 0))
      .map((row) => {
        const fullName = `${row.title ?? ""}${row.first_name ?? "-"} ${row.last_name ?? ""}`.trim()
        const professionLabel = resolveProfessionLabel(row.profession_code ?? "-")
        return {
          id: String(row.eligibility_id),
          label: `${fullName} (${professionLabel})`,
        }
      })
  }, [eligibilityList])

  const submission = useMemo(
    () => parseSubmission(sourceRequest?.submission_data) as Record<string, unknown>,
    [sourceRequest?.submission_data],
  )

  const submissionPositionName = getSubmissionString(submission, ["position_name", "positionName"])
  const submissionDepartment = getSubmissionString(submission, ["department"])
  const submissionSubDepartment = getSubmissionString(submission, ["sub_department", "subDepartment"])

  const fullName = `${data?.title ?? ""}${data?.first_name ?? "-"} ${data?.last_name ?? ""}`.trim()
  const professionLabel = resolveProfessionLabel(data?.profession_code ?? "-")
  const groupNo = data?.group_no !== null && data?.group_no !== undefined ? String(data.group_no) : "-"
  const itemNo = data?.item_no !== null && data?.item_no !== undefined ? String(data.item_no) : "-"
  const subItemNo =
    data?.sub_item_no !== null && data?.sub_item_no !== undefined ? String(data.sub_item_no) : null
  const itemLabel = subItemNo ? `${itemNo}.${subItemNo}` : itemNo
  const rateAmount = Number(data?.rate_amount ?? 0)
  const licenseStatusKey = resolveLicenseStatus(data?.expiry_date ?? null)
  const licenseStatus = licenseStatusConfig[licenseStatusKey]

  const requestTypeLabel = sourceRequest?.request_type
    ? (REQUEST_TYPE_LABELS[sourceRequest.request_type] ?? sourceRequest.request_type)
    : "-"
  const personnelTypeLabel = sourceRequest?.personnel_type
    ? (PERSONNEL_TYPE_LABELS[sourceRequest.personnel_type] ?? sourceRequest.personnel_type)
    : "-"
  const workAttributes = sourceRequest?.work_attributes
    ? Object.entries(sourceRequest.work_attributes)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => WORK_ATTRIBUTE_LABELS[key] ?? key)
    : []

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold text-foreground">ไม่พบข้อมูลสิทธิ</h2>
        <p className="text-muted-foreground mb-6">รายการนี้อาจไม่มีอยู่ในระบบ</p>
        <Link href={backHref}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="w-full md:w-[520px]">
        <Select
          value={id}
          onValueChange={(value) => {
            if (value !== id) {
              const nextUrl = normalizedProfession
                ? `/pts-officer/allowance-list/${value}?profession=${normalizedProfession}`
                : `/pts-officer/allowance-list/${value}`
              router.push(nextUrl)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกผู้มีสิทธิที่ต้องการดูรายละเอียด" />
          </SelectTrigger>
          <SelectContent>
            {personOptions.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href={backHref} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            รายชื่อผู้มีสิทธิ
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
          <span className="text-foreground font-medium">รายละเอียดสิทธิ</span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{fullName}</h1>
              <Badge variant="outline" className={licenseStatus.color}>{licenseStatus.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Eligibility ID: {data.eligibility_id} {data.request_no ? `| คำขอ ${data.request_no}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="space-y-8 lg:col-span-8">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title="ข้อมูลผู้มีสิทธิ" icon={User} />
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                <InfoItem label="ชื่อ-นามสกุล" value={fullName} icon={User} className="sm:col-span-2" />
                <InfoItem label="เลขบัตรประชาชน" value={data.citizen_id} />

                <div className="col-span-full border-t border-border/50 my-2" />

                <InfoItem label="ตำแหน่ง" value={submissionPositionName ?? data.position_name ?? "-"} icon={Briefcase} className="sm:col-span-2" />
                <InfoItem label="เลขที่ตำแหน่ง" value={data.position_number ?? "-"} />

                <InfoItem label="หน่วยงาน" value={submissionSubDepartment ?? data.sub_department ?? "-"} icon={Building2} />
                <InfoItem label="กลุ่มงาน" value={submissionDepartment ?? data.department ?? "-"} />

                <InfoItem label="อีเมล" value={data.email ?? "-"} icon={Mail} />
                <InfoItem label="โทรศัพท์" value={data.phone ?? "-"} icon={Phone} />
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title="รายละเอียดสิทธิ" icon={Award} />
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <InfoItem label="วิชาชีพ" value={professionLabel} />
                <InfoItem label="อัตรา" value={`กลุ่ม ${groupNo} | ข้อ ${itemLabel}`} />
                <InfoItem label="วันที่เริ่มสิทธิ" value={formatThaiDate(data.effective_date)} icon={Calendar} />
                <InfoItem label="วันหมดอายุสิทธิ" value={formatThaiDate(data.expiry_date ?? null)} icon={Calendar} />
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <SectionHeader title="ข้อมูลจากคำขอต้นทาง" icon={CreditCard} />
              {sourceRequest ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <InfoItem label="เลขที่คำขอ" value={sourceRequest.request_no ?? sourceRequest.request_id} />
                  <InfoItem label="สถานะคำขอ" value={sourceRequest.status} />
                  <InfoItem label="ประเภทคำขอ" value={requestTypeLabel} />
                  <InfoItem label="ประเภทบุคลากร" value={personnelTypeLabel} />
                  <InfoItem label="หน้าที่หลัก" value={sourceRequest.main_duty || "-"} className="sm:col-span-2" />
                  <InfoItem label="ลักษณะงาน" value={workAttributes.length > 0 ? workAttributes.join(", ") : "-"} className="sm:col-span-2" />
                  <InfoItem label="อัปเดตล่าสุด" value={formatThaiDateTime(sourceRequest.updated_at)} icon={Clock} />
                  <InfoItem label="เริ่มขั้นตอนปัจจุบัน" value={formatThaiDateTime(sourceRequest.step_started_at)} icon={Clock} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มีข้อมูลคำขอต้นทางหรือไม่สามารถเข้าถึงได้</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4 sticky top-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5 overflow-hidden">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-primary/80 mb-1">อัตราเงินเพิ่มตามสิทธิ</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">{rateAmount.toLocaleString()}</span>
                <span className="text-sm text-primary/80">บาท/เดือน</span>
              </div>
              <Separator className="my-4 bg-primary/10" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วิชาชีพ</span>
                  <span className="font-medium">{professionLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">กลุ่ม/ข้อ</span>
                  <span className="font-medium">{groupNo}/{itemLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                ข้อมูลอ้างอิง
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Eligibility ID</span>
                <span className="font-medium">{data.eligibility_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Master Rate ID</span>
                <span className="font-medium">{data.master_rate_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Request ID</span>
                <span className="font-medium">{data.request_id ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">สร้างสิทธิเมื่อ</span>
                <span className="font-medium">{formatThaiDateTime(data.created_at ?? null)}</span>
              </div>
            </CardContent>
          </Card>

          {licenseStatusKey === "expiring" && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-700">สิทธิใกล้หมดอายุ</p>
                    <p className="text-sm text-amber-700/80 mt-1">
                      สิทธินี้จะหมดอายุในวันที่ {formatThaiDate(data.expiry_date ?? null)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
