"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { RequestWithDetails } from "@/types/request.types"
import { APPROVAL_STEPS } from "@/features/request/detail/utils"
import { formatThaiDateTime } from "@/features/request/detail/utils"
import { TimelineStepItem } from "./TimelineStepItem"

export function ApprovalTimelineCard({ request }: { request: RequestWithDetails }) {
  const approvalActions = request.actions ?? []
  const submitAction = approvalActions.find((action) => action.action === "SUBMIT")
  const submitterRole = submitAction?.actor?.role ?? null

  const getVisibleApprovalSteps = () => {
    if (submitterRole === "HEAD_SCOPE") {
      const progressedStepNumbers = approvalActions
        .filter((action) =>
          action.step_no &&
          (action.action === "APPROVE" ||
            action.action === "REJECT" ||
            action.action === "RETURN"),
        )
        .map((action) => action.step_no as number)

      const earliestWorkflowStep = [request.current_step, ...progressedStepNumbers]
        .filter((step): step is number => typeof step === "number" && step >= 1 && step <= 6)
        .sort((a, b) => a - b)[0]

      if (earliestWorkflowStep && earliestWorkflowStep > 1) {
        return APPROVAL_STEPS.filter((step) => step.step >= earliestWorkflowStep)
      }
    }

    if (submitterRole === "WARD_SCOPE") {
      return APPROVAL_STEPS.filter((step) => step.step >= 2)
    }
    if (submitterRole === "DEPT_SCOPE") {
      return APPROVAL_STEPS.filter((step) => step.step >= 3)
    }
    return APPROVAL_STEPS
  }

  const visibleSteps = getVisibleApprovalSteps()
  const currentStepDisplayIndex = (() => {
    const index = visibleSteps.findIndex((step) => step.step === request.current_step)
    if (index >= 0) return index + 1
    if (request.current_step && visibleSteps.length > 0 && request.current_step > visibleSteps[visibleSteps.length - 1].step) {
      return visibleSteps.length
    }
    return null
  })()

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-4 bg-muted/10">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          ลำดับการดำเนินการ
        </CardTitle>
        <CardDescription>
          อยู่ในขั้นตอนที่ {currentStepDisplayIndex ?? "-"} จาก {visibleSteps.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div
          className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-border/50"
          aria-hidden="true"
        />

        <div className="space-y-0">
          {visibleSteps.map((step, index) => {
            const action = approvalActions
              .filter(
                (a) =>
                  a.step_no === step.step &&
                  (a.action === "APPROVE" || a.action === "REJECT" || a.action === "RETURN"),
              )
              .sort((a, b) => (a.action_date || "").localeCompare(b.action_date || ""))
              .pop()

            const status = action
              ? action.action === "APPROVE"
                ? "approved"
                : action.action === "REJECT"
                  ? "rejected"
                  : "returned"
              : request.current_step === step.step
                ? "pending"
                : request.current_step && step.step < request.current_step
                  ? "approved"
                  : "waiting"

            const isLast = index === visibleSteps.length - 1
            const displayStepNumber = index + 1
            const actorName = action?.actor
              ? `${action.actor.first_name} ${action.actor.last_name}`
              : null

            return (
              <TimelineStepItem
                key={step.step}
                number={displayStepNumber}
                title={step.role}
                status={status}
                actorName={actorName}
                actionDate={action?.action_date ? formatThaiDateTime(action.action_date) : null}
                startedAt={status === "pending" && request.step_started_at ? formatThaiDateTime(request.step_started_at) : null}
                comment={action?.comment ?? null}
                isLast={isLast}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
