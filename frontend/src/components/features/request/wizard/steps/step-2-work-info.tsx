"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { RequestFormData } from "@/types/request.types"
import { usePrefill } from "@/features/request/hooks"

interface Step2Props {
  data: RequestFormData
  updateData: (key: keyof RequestFormData, value: unknown) => void
}

export function Step2WorkInfo({ data, updateData }: Step2Props) {
  const { data: prefill } = usePrefill()

  // Helper for toggle checkbox
  const toggleAttribute = (key: keyof RequestFormData['workAttributes']) => {
    updateData("workAttributes", {
      ...data.workAttributes,
      [key]: !data.workAttributes[key]
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-primary">รายละเอียดการปฏิบัติงาน</h3>
        <p className="text-sm text-muted-foreground">
          กรุณาระบุลักษณะงานที่ท่านรับผิดชอบเพื่อใช้ประกอบการพิจารณา (ตาม Wireframe Section 4)
        </p>
      </div>

      {/* Section 1: Request Type */}
      <Card className="border border-muted">
        <CardContent className="pt-6">
          <Label className="text-base mb-3 block">ประเภทการยื่นคำขอ</Label>
          <RadioGroup
            defaultValue={data.requestType}
            onValueChange={(val) => updateData("requestType", val)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 ${data.requestType === 'NEW' ? 'border-primary bg-primary/5' : ''}`}>
              <RadioGroupItem value="NEW" id="new" />
              <Label htmlFor="new" className="cursor-pointer">ยื่นคำขอใหม่</Label>
            </div>
            <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 ${data.requestType === 'EDIT' ? 'border-primary bg-primary/5' : ''}`}>
              <RadioGroupItem value="EDIT" id="edit" />
              <Label htmlFor="edit" className="cursor-pointer">แก้ไขข้อมูล (อัตราเดิม)</Label>
            </div>
            <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 ${data.requestType === 'CHANGE_RATE' ? 'border-primary bg-primary/5' : ''}`}>
              <RadioGroupItem value="CHANGE_RATE" id="change" />
              <Label htmlFor="change" className="cursor-pointer">แก้ไข (เปลี่ยนอัตรา)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Section 4: Work Details */}
      <div className="space-y-4">
        {prefill?.department && (
          <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            สังกัดจากระบบบุคลากร: {prefill.department}
            {prefill.sub_department ? ` / ${prefill.sub_department}` : ""}
          </div>
        )}
        {/* Mission Group */}
        <div className="space-y-2">
          <Label htmlFor="mission">หน้าที่ความรับผิดชอบหลัก (Mission Group)</Label>
          <Input
            id="mission"
            placeholder="เช่น ให้การพยาบาลผู้ป่วยวิกฤต, ตรวจวิเคราะห์สิ่งส่งตรวจ"
            value={data.missionGroup}
            onChange={(e) => updateData("missionGroup", e.target.value)}
          />
        </div>

        {/* Work Attributes Checkboxes */}
        <div className="space-y-3">
          <Label>ลักษณะงานที่ปฏิบัติ (เลือกได้มากกว่า 1 ข้อ)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-muted/30">
              <Checkbox
                id="attr_ops"
                checked={data.workAttributes.operation}
                onCheckedChange={() => toggleAttribute("operation")}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="attr_ops" className="font-semibold cursor-pointer">
                  งานปฏิบัติการ (Operation)
                </Label>
                <p className="text-sm text-muted-foreground">
                  ปฏิบัติงานเทคนิค/วิชาชีพโดยตรงกับผู้ป่วย
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-muted/30">
              <Checkbox
                id="attr_plan"
                checked={data.workAttributes.planning}
                onCheckedChange={() => toggleAttribute("planning")}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="attr_plan" className="font-semibold cursor-pointer">
                  งานวางแผน (Planning)
                </Label>
                <p className="text-sm text-muted-foreground">
                  วางแผนระบบงาน พัฒนาคุณภาพ หรือนโยบาย
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-muted/30">
              <Checkbox
                id="attr_coord"
                checked={data.workAttributes.coordination}
                onCheckedChange={() => toggleAttribute("coordination")}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="attr_coord" className="font-semibold cursor-pointer">
                  งานประสานงาน (Coordination)
                </Label>
                <p className="text-sm text-muted-foreground">
                  ประสานงานกับหน่วยงานภายในและภายนอก
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-muted/30">
              <Checkbox
                id="attr_service"
                checked={data.workAttributes.service}
                onCheckedChange={() => toggleAttribute("service")}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="attr_service" className="font-semibold cursor-pointer">
                  งานบริการ (Service)
                </Label>
                <p className="text-sm text-muted-foreground">
                  ให้บริการวิชาการ หรือสนับสนุนบริการทางการแพทย์
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
