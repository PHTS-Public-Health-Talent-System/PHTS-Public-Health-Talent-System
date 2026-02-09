"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "returned"
  | "paid"
  | "cancelled"
  | "draft"
  | "processing"
  | "completed"
  | "overdue"
  | "warning"
  | "normal"
  | "success"
  | "error"
  | "info"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "รอดำเนินการ",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "อนุมัติแล้ว",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  returned: {
    label: "ส่งกลับแก้ไข",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  paid: {
    label: "จ่ายเงินแล้ว",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    label: "ยกเลิก",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  draft: {
    label: "ฉบับร่าง",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  processing: {
    label: "กำลังดำเนินการ",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "เสร็จสิ้น",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  overdue: {
    label: "เกินกำหนด",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  warning: {
    label: "ใกล้ครบกำหนด",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  normal: {
    label: "ปกติ",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  success: {
    label: "สำเร็จ",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  error: {
    label: "ผิดพลาด",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  info: {
    label: "ข้อมูล",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
}

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {label || config.label}
    </Badge>
  )
}

// SLA Status Badge
export type SlaStatusType = "normal" | "warning" | "danger" | "overdue"

const slaStatusConfig: Record<SlaStatusType, { label: string; className: string }> = {
  normal: {
    label: "ปกติ",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  warning: {
    label: "ใกล้ครบกำหนด",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  danger: {
    label: "เร่งด่วน",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  overdue: {
    label: "เกินกำหนด",
    className: "bg-red-100 text-red-800 border-red-200",
  },
}

interface SlaBadgeProps {
  status: SlaStatusType
  label?: string
  className?: string
}

export function SlaBadge({ status, label, className }: SlaBadgeProps) {
  const config = slaStatusConfig[status] || slaStatusConfig.normal
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {label || config.label}
    </Badge>
  )
}
