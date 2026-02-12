"use client"
export const dynamic = 'force-dynamic'

import { use } from "react"
import { PayrollDetailContent } from "@/components/payroll/PayrollDetailContent"
import { toast } from "sonner"
import { useSubmitToHR } from "@/features/payroll/hooks"
import { usePayrollReviewProgress } from "@/features/payroll/usePayrollReviewProgress"
import { useState } from "react"

type PageParams = Promise<{ id: string; code: string }>

export default function PTSOfficerPayrollProfessionPage({ params }: { params: PageParams }) {
  const { id, code } = use(params)
  const submitToHR = useSubmitToHR()
  const { reviewedCodes, setProfessionReviewed } = usePayrollReviewProgress(id)
  const [availableProfessions, setAvailableProfessions] = useState<{ code: string; label: string }[]>([])

  const handleSubmitForReview = async () => {
    const normalizedReviewed = new Set(reviewedCodes.map((item) => item.toUpperCase()))
    const missing = availableProfessions.filter(
      (profession) => !normalizedReviewed.has(profession.code.toUpperCase()),
    )
    if (missing.length > 0) {
      toast.error(`ยังตรวจไม่ครบทุกวิชาชีพ: ${missing.map((item) => item.label).join(", ")}`)
      return
    }

    await submitToHR.mutateAsync(id)
    toast.success("ส่งรอบให้ HR เรียบร้อย")
  }

  return (
    <PayrollDetailContent
      periodId={id}
      selectedProfession={code}
      basePath={`/pts-officer/payroll/${id}`}
      backHref={`/pts-officer/payroll/${id}`}
      compactView
      showSelector={false}
      showSummary
      showTable
      allowApprovalActions={false}
      reviewedProfessionCodes={reviewedCodes}
      onSetProfessionReviewed={setProfessionReviewed}
      onSubmitForReview={handleSubmitForReview}
      isSubmittingForReview={submitToHR.isPending}
      onAvailableProfessionsChange={setAvailableProfessions}
    />
  )
}
