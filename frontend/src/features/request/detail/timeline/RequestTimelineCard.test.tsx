import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { RequestWithDetails } from "@/types/request.types"
import { RequestTimelineCard } from "./RequestTimelineCard"

const buildRequest = (overrides: Partial<RequestWithDetails> = {}): RequestWithDetails =>
  ({
    request_id: 67918,
    request_no: "REQ-2569-67918",
    user_id: 1,
    citizen_id: "1234567890123",
    personnel_type: "CIVIL_SERVANT",
    current_position_number: null,
    current_department: null,
    work_attributes: { operation: true, planning: false, coordination: false, service: true },
    main_duty: null,
    request_type: "NEW_ENTRY",
    requested_amount: 1000,
    effective_date: "2026-03-04",
    status: "PENDING",
    current_step: 3,
    created_at: "2026-03-04T01:13:02.000Z",
    updated_at: "2026-03-04T01:13:02.000Z",
    step_started_at: "2026-03-04T01:13:02.000Z",
    submission_data: {},
    attachments: [],
    actions: [
      {
        action: "SUBMIT",
        actor: {
          first_name: "หัวหน้า",
          last_name: "กลุ่มงาน",
          role: "DEPT_SCOPE",
        },
        comment: null,
        action_date: "2026-03-04T01:13:02.000Z",
        step_no: 1,
      },
    ],
    ...overrides,
  }) as RequestWithDetails

describe("RequestTimelineCard", () => {
  it("renders officer-created timeline when request metadata says officer-on-behalf", () => {
    render(
      <RequestTimelineCard
        request={buildRequest({
          status: "APPROVED",
          current_step: 7,
          submission_data: {
            created_mode: "OFFICER_ON_BEHALF",
            created_by_officer_id: 49005,
            created_by_officer_role: "PTS_OFFICER",
          },
        })}
      />,
    )

    expect(screen.getByText("ส่งคำขอโดยเจ้าหน้าที่ พ.ต.ส.")).toBeInTheDocument()
  })

  it("renders normal approval timeline for regular requests", () => {
    render(<RequestTimelineCard request={buildRequest()} />)

    expect(screen.queryByText("ส่งคำขอโดยเจ้าหน้าที่ พ.ต.ส.")).not.toBeInTheDocument()
    expect(screen.getByText("หัวหน้าการเงิน")).toBeInTheDocument()
  })
})
