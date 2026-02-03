import type { RequestFormData, RequestWithDetails, WorkAttributes } from "@/types/request.types"

const requestTypeMap: Record<string, RequestFormData["requestType"]> = {
  NEW_ENTRY: "NEW",
  EDIT_INFO_SAME_RATE: "EDIT",
  EDIT_INFO_NEW_RATE: "CHANGE_RATE",
}

const normalizeDate = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

const normalizeWorkAttributes = (value: unknown): WorkAttributes => {
  if (value && typeof value === "object") {
    const attrs = value as Partial<WorkAttributes>
    return {
      operation: !!attrs.operation,
      planning: !!attrs.planning,
      coordination: !!attrs.coordination,
      service: !!attrs.service,
    }
  }
  return {
    operation: false,
    planning: false,
    coordination: false,
    service: false,
  }
}

const parseSubmissionData = (
  submissionData?: Record<string, unknown> | string | null,
): Record<string, unknown> => {
  if (!submissionData) return {}
  if (typeof submissionData === "string") {
    try {
      return JSON.parse(submissionData) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return submissionData
}

export const mapRequestToFormData = (
  request: RequestWithDetails,
): Partial<RequestFormData> => {
  const submission = parseSubmissionData(request.submission_data)
  const submissionClassification =
    (submission.classification as Record<string, unknown>) ?? {}
  const classification = {
    groupId:
      (submissionClassification.groupId as string) ??
      (submissionClassification.group_no
        ? String(submissionClassification.group_no)
        : ""),
    itemId:
      (submissionClassification.itemId as string) ??
      (submissionClassification.item_no as string) ??
      "",
    subItemId:
      (submissionClassification.subItemId as string) ??
      (submissionClassification.sub_item_no as string) ??
      "",
    amount:
      (submissionClassification.amount as number) ??
      request.requested_amount ??
      0,
    rateId: submissionClassification.rateId as number | undefined,
    professionCode: submissionClassification.professionCode as string | undefined,
  }

  return {
    id: String(request.request_id),
    requestType: requestTypeMap[request.request_type] ?? "NEW",
    employeeType: request.personnel_type,
    citizenId: request.citizen_id ?? "",
    title: (submission.title as string) ?? "",
    firstName: (submission.first_name as string) ?? "",
    lastName: (submission.last_name as string) ?? "",
    positionName: (submission.position_name as string) ?? "",
    positionNumber: request.current_position_number ?? "",
    department:
      (submission.department as string) ?? request.current_department ?? "",
    subDepartment: (submission.sub_department as string) ?? "",
    employmentRegion:
      (submission.employment_region as RequestFormData["employmentRegion"]) ??
      "REGIONAL",
    missionGroup: request.main_duty ?? "",
    workAttributes: normalizeWorkAttributes(request.work_attributes),
    effectiveDate: normalizeDate(request.effective_date),
    attachments: request.attachments ?? [],
    classification,
  }
}
