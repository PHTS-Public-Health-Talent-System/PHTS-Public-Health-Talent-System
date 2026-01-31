import { describe, expect, it } from "vitest"
import type { RequestWithDetails } from "@/types/request.types"
import { mapRequestToFormData } from "../request-form-mapper"

describe("mapRequestToFormData", () => {
  it("maps request fields into wizard form data", () => {
    const request: RequestWithDetails = {
      request_id: 42,
      request_no: "PTS-000042",
      user_id: 7,
      citizen_id: "1234567890123",
      personnel_type: "CIVIL_SERVANT",
      current_position_number: "PN-01",
      current_department: "กลุ่มงานการพยาบาล",
      work_attributes: {
        operation: true,
        planning: false,
        coordination: true,
        service: false,
      },
      main_duty: "ไตเทียม",
      request_type: "EDIT_INFO_SAME_RATE",
      target_rate_id: null,
      requested_amount: 1500,
      effective_date: "2025-01-15T00:00:00.000Z",
      status: "DRAFT",
      current_step: 1,
      created_at: "2025-01-15T12:00:00.000Z",
      updated_at: "2025-01-15T12:00:00.000Z",
      step_started_at: null,
      attachments: [
        {
          attachment_id: 10,
          file_name: "license.pdf",
          file_path: "uploads/license.pdf",
          file_type: "LICENSE",
          file_size: 1024,
          ocr_status: "COMPLETED",
        },
      ],
      actions: [],
    }

    const form = mapRequestToFormData(request)

    expect(form.id).toBe("42")
    expect(form.requestType).toBe("EDIT")
    expect(form.employeeType).toBe("CIVIL_SERVANT")
    expect(form.positionNumber).toBe("PN-01")
    expect(form.department).toBe("กลุ่มงานการพยาบาล")
    expect(form.missionGroup).toBe("ไตเทียม")
    expect(form.workAttributes).toEqual({
      operation: true,
      planning: false,
      coordination: true,
      service: false,
    })
    expect(form.classification?.amount).toBe(1500)
    expect(form.effectiveDate).toBe("2025-01-15")
    expect(form.attachments?.[0].file_type).toBe("LICENSE")
    expect(form.ocrResult?.attachmentId).toBe(10)
  })
})
