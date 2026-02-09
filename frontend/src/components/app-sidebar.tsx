"use client"

import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  Users,
  AlertTriangle,
  Calendar,
  FileText,
  CalendarDays,
  UserMinus,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"
import { useAuth } from "@/components/providers/auth-provider"

const baseConfig: Omit<SidebarConfig, "user"> = {
  role: "pts-officer",
  roleLabel: "เจ้าหน้าที่ พ.ต.ส.",
  roleBgColor: "bg-primary",
  navigation: [
    { name: "แดชบอร์ด", href: "/pts-officer", icon: LayoutDashboard },
    { name: "คำขอรออนุมัติ", href: "/pts-officer/requests", icon: FileCheck, badge: 12 },
    { name: "รอบจ่ายเงิน", href: "/pts-officer/payroll", icon: Calculator },
    { name: "รายชื่อผู้มีสิทธิ์", href: "/pts-officer/allowance-list", icon: Users },
    { name: "แจ้งเตือนใบอนุญาต", href: "/pts-officer/alerts", icon: AlertTriangle, badge: 8 },
    { name: "จัดการวันลา", href: "/pts-officer/leave-management", icon: CalendarDays },
    { name: "การเปลี่ยนแปลงบุคลากร", href: "/pts-officer/personnel-changes", icon: UserMinus, badge: 2 },
  ],
  secondaryNavigation: [
    { name: "จัดการวันหยุด", href: "/pts-officer/holidays", icon: Calendar },
    { name: "จัดการอัตราเงิน", href: "/pts-officer/rates", icon: FileText },
  ],
  secondaryLabel: "ข้อมูลหลัก",
  notificationCount: 3,
}

function getInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`
}

export function AppSidebar() {
  const { user } = useAuth()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  const name = displayName || user?.username || "ผู้ใช้งาน"
  const title = user?.position || baseConfig.roleLabel

  const config: SidebarConfig = {
    ...baseConfig,
    user: {
      name,
      title,
      initials: getInitials(name),
    },
  }

  return <UnifiedSidebar config={config} />
}
