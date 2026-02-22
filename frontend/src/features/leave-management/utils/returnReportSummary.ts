type ReturnReportEventLike = {
  report_date: string
}

export function buildReturnReportSummary(events: ReturnReportEventLike[]) {
  if (!events.length) {
    return {
      return_report_status: "PENDING" as const,
      return_date: undefined,
    }
  }

  const latestEvent = [...events].sort((a, b) => a.report_date.localeCompare(b.report_date)).at(-1)

  return {
    return_report_status: "DONE" as const,
    return_date: latestEvent?.report_date,
  }
}
