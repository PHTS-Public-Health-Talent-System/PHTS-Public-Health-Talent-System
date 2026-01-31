"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useRequestForm } from "@/components/features/request/hooks/useRequestForm"
import { Step1PersonalInfo } from "./steps/step-1-personal"
import { Step2WorkInfo } from "./steps/step-2-work-info"
import { Step3Attachments } from "./steps/step-3-attachments"
import { Step4Classification } from "./steps/step-4-classification"
import { Step5Review } from "./steps/step-5-review"
import { useCheckSignature } from "@/features/signature/hooks"
import type { RequestWithDetails } from "@/types/request.types"

const steps = [
  { id: 1, title: "ข้อมูลส่วนตัว" },
  { id: 2, title: "รายละเอียดงาน" },
  { id: 3, title: "แนบเอกสาร" },
  { id: 4, title: "ตรวจสอบสิทธิ" },
  { id: 5, title: "ยืนยันข้อมูล" },
]

interface RequestWizardProps {
  initialRequest?: RequestWithDetails
}

export function RequestWizard({ initialRequest }: RequestWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const {
    formData,
    updateFormData,
    handleUploadFile,
    removeFile,
    isSubmitting,
    submitRequest,
    confirmAttachments,
    prefillOriginal,
    isOcrPolling
  } = useRequestForm({ initialRequest })
  const { data: signatureCheck } = useCheckSignature()

  const attachmentLabels: Record<string, string> = {
    LICENSE: "ใบประกอบวิชาชีพ",
    ORDER: "คำสั่งมอบหมายงาน",
    OTHER: "เอกสารอื่นๆ",
    DIPLOMA: "วุฒิบัตร",
  }
  const ocrTargets =
    formData.attachments?.filter((att) => att.file_type && att.file_type !== "SIGNATURE") ?? []
  const ocrFailed = ocrTargets.filter((att) => att.ocr_status === "FAILED")
  const ocrPending = ocrTargets.filter((att) => att.ocr_status !== "COMPLETED")
  const isOcrReady = ocrTargets.length > 0 && ocrPending.length === 0 && ocrFailed.length === 0

  const hasLicenseAttachment =
    !!formData.files?.LICENSE ||
    (formData.attachments ?? []).some((att) => att.file_type === "LICENSE")

  const hasSignature =
    formData.signatureMode === "SAVED"
      ? !!signatureCheck?.has_signature
      : !!formData.signature
  const isReadyToSubmit =
    hasSignature &&
    hasLicenseAttachment &&
    !!formData.classification?.groupId &&
    !!formData.classification?.itemId &&
    (formData.classification?.amount ?? 0) > 0 &&
    isOcrReady
  const missingReasons: string[] = []
  if (!hasLicenseAttachment) missingReasons.push("ใบประกอบวิชาชีพ")
  if (!formData.classification?.groupId || !formData.classification?.itemId) missingReasons.push("กลุ่ม/รายการเบิก")
  if ((formData.classification?.amount ?? 0) <= 0) missingReasons.push("จำนวนเงิน")
  if (!hasSignature) missingReasons.push("ลายเซ็น")
  if (!isOcrReady) missingReasons.push("รอผล OCR")
  const disabledReason = missingReasons.length > 0 ? `ยังขาด: ${missingReasons.join(", ")}` : ""
  const isStep3Valid = hasLicenseAttachment

  const handleNext = async () => {
    // 1. Validation Logic (Simplified for now)

    // 2. Trigger OCR when leaving Step 3
    if (currentStep === 3) {
      try {
         const ok = await confirmAttachments()
         if (!ok) return
      } catch {
         toast.error("ไม่สามารถตรวจสอบเอกสารได้")
         return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="relative flex justify-between px-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isActive ? "border-primary bg-primary/10 text-primary font-bold shadow-lg scale-110" :
                    isCompleted ? "bg-primary border-primary text-white" : "border-muted bg-white text-muted-foreground"
                  }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {step.title}
              </span>
              {index !== steps.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-10
                  ${currentStep > step.id ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px] shadow-sm border-t-4 border-t-primary/20">
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1PersonalInfo
              data={formData}
              updateData={updateFormData}
              prefillOriginal={prefillOriginal}
            />
          )}

          {currentStep === 2 && (
            <Step2WorkInfo
              data={formData}
              updateData={updateFormData}
            />
          )}

          {currentStep === 3 && (
             <Step3Attachments
               data={formData}
               onUpload={handleUploadFile}
               onRemove={removeFile}
             />
          )}

          {currentStep === 4 && (
             <Step4Classification
               data={formData}
               updateData={updateFormData}
             />
          )}

          {currentStep === 5 && (
             <Step5Review
               data={formData}
               updateData={updateFormData}
               onGoToStep={(step) => setCurrentStep(step)}
               prefillOriginal={prefillOriginal}
             />
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6 bg-muted/5">
          {currentStep === steps.length && ocrTargets.length > 0 && !isOcrReady && (
            <div className="flex-1">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {ocrFailed.length > 0
                  ? "OCR ล้มเหลว กรุณาอัปโหลดเอกสารใหม่ แล้วรอผลให้เสร็จก่อนยื่นคำขอ"
                  : isOcrPolling
                    ? `กำลังวิเคราะห์เอกสาร (${ocrPending.length}/${ocrTargets.length}) กรุณารอสักครู่`
                    : "กำลังตรวจสอบเอกสาร กรุณารอสักครู่"}
                {ocrPending.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ocrPending.map((att) => (
                      <span key={att.attachment_id} className="rounded bg-white/80 px-2 py-0.5 text-[11px]">
                        {attachmentLabels[att.file_type] ?? att.file_name} — {att.ocr_status ?? "PENDING"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1 || isSubmitting}>
            ย้อนกลับ
          </Button>

          {currentStep === steps.length ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={submitRequest}
                      disabled={isSubmitting || !isReadyToSubmit}
                      className="min-w-[150px] shadow-button-hover bg-secondary hover:bg-secondary/90"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังส่งคำขอ...</>
                      ) : (
                        <>ส่งใบคำขอเบิกเงิน</>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isReadyToSubmit && (
                  <TooltipContent>
                    {disabledReason}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handleNext}
                      disabled={currentStep === 3 && !isStep3Valid}
                      className="min-w-[120px] shadow-button-hover"
                    >
                      ถัดไป
                    </Button>
                  </div>
                </TooltipTrigger>
                {currentStep === 3 && !isStep3Valid && (
                  <TooltipContent>
                    ต้องแนบใบประกอบวิชาชีพก่อนดำเนินการต่อ
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
