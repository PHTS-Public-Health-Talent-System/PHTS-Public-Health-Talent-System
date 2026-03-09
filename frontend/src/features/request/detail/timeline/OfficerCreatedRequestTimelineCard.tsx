"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { RequestWithDetails } from "@/types/request.types"
import { formatThaiDateTime } from "@/features/request/detail/utils"
import { TimelineStepItem } from "./TimelineStepItem"

type OfficerCreatedStepState = "approved" | "pending" | "waiting"

type OfficerCreatedStep = {
  key: string
  label: string
  description: string
  status: OfficerCreatedStepState
  at?: string | null
}

const buildOfficerCreatedSteps = (request: RequestWithDetails): OfficerCreatedStep[] => {
  const submitAction = (request.actions ?? []).find((action) => action.action === "SUBMIT")
  const createdAt = request.created_at ?? null
  const submittedAt = submitAction?.action_date ?? null
  const completedAt = request.updated_at ?? null

  const isDraft = request.status === "DRAFT"
  const isSubmitted = request.status !== "DRAFT" && request.status !== "CANCELLED"
  const isCompleted = request.status === "APPROVED"

  return [
    {
      key: "draft",
      label: "บันทึกคำขอแทนบุคลากร",
      description: "เจ้าหน้าที่ พ.ต.ส. จัดทำคำขอจากข้อมูลบุคลากรในระบบ",
      status: isDraft ? "pending" : "approved",
      at: createdAt,
    },
    {
      key: "submit",
      label: "ส่งคำขอโดยเจ้าหน้าที่ พ.ต.ส.",
      description: "คำขอถูกส่งเข้าสู่ระบบโดยไม่ผ่านสายอนุมัติปกติ",
      status: isSubmitted ? "approved" : "waiting",
      at: submittedAt,
    },
    {
      key: "approved",
      label: "อนุมัติแล้ว",
      description: "สิทธิถูกสร้างและพร้อมใช้งานในระบบผู้มีสิทธิ",
      status: isCompleted ? "approved" : isSubmitted ? "pending" : "waiting",
      at: isCompleted ? completedAt : null,
    },
  ]
}

export function OfficerCreatedRequestTimelineCard({
  request,
}: {
  request: RequestWithDetails
}) {
  const steps = buildOfficerCreatedSteps(request)

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-4 bg-muted/10">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          ลำดับการดำเนินการ
        </CardTitle>
        <CardDescription>
          อยู่ในขั้นตอนที่ {steps.findIndex((step) => step.status === "pending") >= 0 ? steps.findIndex((step) => step.status === "pending") + 1 : steps.length} จาก {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-border/50" aria-hidden="true" />
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1

            return (
              <TimelineStepItem
                key={step.key}
                number={index + 1}
                title={step.label}
                status={step.status}
                actionDate={step.at ? formatThaiDateTime(step.at) : null}
                isLast={isLast}
                description={step.description}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
