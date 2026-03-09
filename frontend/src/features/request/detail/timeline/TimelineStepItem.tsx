"use client"

import { Calendar, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

type TimelineStepStatus = "approved" | "pending" | "rejected" | "returned" | "waiting"

const STATUS_META: Record<
  TimelineStepStatus,
  { label: string; badgeClassName: string; icon?: typeof CheckCircle2 }
> = {
  approved: {
    label: "ผ่านแล้ว",
    badgeClassName: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "กำลังดำเนินการ",
    badgeClassName: "bg-primary/10 text-primary border-primary/20",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    badgeClassName: "bg-red-500/10 text-red-700 border-red-200",
    icon: XCircle,
  },
  returned: {
    label: "ส่งกลับแก้ไข",
    badgeClassName: "bg-orange-500/10 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
  waiting: {
    label: "รอดำเนินการ",
    badgeClassName: "bg-muted text-muted-foreground border-border",
  },
}

export function TimelineStepItem({
  number,
  title,
  status,
  actorName,
  actionDate,
  startedAt,
  comment,
  isLast = false,
  description,
}: {
  number: number
  title: string
  status: TimelineStepStatus
  actorName?: string | null
  actionDate?: string | null
  startedAt?: string | null
  comment?: string | null
  isLast?: boolean
  description?: string | null
}) {
  const meta = STATUS_META[status]
  const StatusIcon = meta.icon

  return (
    <div className={`relative flex gap-4 pb-8 ${isLast ? "pb-0" : ""}`}>
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
          status === "approved"
            ? "bg-emerald-500 border-emerald-500 text-white"
            : status === "pending"
              ? "bg-primary border-primary text-primary-foreground"
              : status === "rejected"
                ? "bg-red-500 border-red-500 text-white"
                : status === "returned"
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-background border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        {number}
      </div>

      <div className="flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              status === "waiting" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {title}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClassName}`}
          >
            {StatusIcon ? <StatusIcon className="h-3 w-3" /> : null}
            {meta.label}
          </span>
        </div>

        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}

        {(actorName || actionDate || startedAt) && (
          <div className="mt-2 flex flex-col gap-1">
            {actorName ? <span className="text-xs text-foreground/80">โดย: {actorName}</span> : null}
            {actionDate ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {actionDate}
              </span>
            ) : null}
            {startedAt ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                เริ่มขั้นตอน {startedAt}
              </span>
            ) : null}
          </div>
        )}

        {comment ? (
          <div className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">หมายเหตุ</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {comment}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
