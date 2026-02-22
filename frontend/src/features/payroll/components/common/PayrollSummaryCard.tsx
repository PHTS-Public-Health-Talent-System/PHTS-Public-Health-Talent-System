"use client"

import { SummaryMetricCard } from "@/components/common"
import type { LucideIcon } from "lucide-react"

export function PayrollSummaryCard({
  icon: Icon,
  title,
  value,
  iconClassName,
  iconBgClassName,
}: {
  icon: LucideIcon
  title: string
  value: string
  iconClassName: string
  iconBgClassName: string
}) {
  return (
    <SummaryMetricCard
      icon={Icon}
      title={title}
      value={value}
      iconClassName={iconClassName}
      iconBgClassName={iconBgClassName}
      layout="horizontal"
    />
  )
}
