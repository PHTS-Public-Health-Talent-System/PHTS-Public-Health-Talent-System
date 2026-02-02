import { RequestWizard } from "@/components/features/request/wizard/request-wizard"

export default function CreateRequestPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">ยื่นคำขอรับเงิน พ.ต.ส.</h1>
        <p className="text-muted-foreground">กรุณากรอกข้อมูลให้ครบถ้วนตามขั้นตอน</p>
      </div>

      {/* Wizard Component */}
      <RequestWizard />
    </div>
  )
}
