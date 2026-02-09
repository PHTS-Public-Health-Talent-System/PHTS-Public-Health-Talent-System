"use client"

import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  ClipboardList,
  FileBarChart,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"

const config: SidebarConfig = {
  role: "head-hr",
  roleLabel: "หัวหน้างานบุคคล",
  roleBgColor: "bg-emerald-600",
  navigation: [
    { name: "แดชบอร์ด", href: "/head-hr", icon: LayoutDashboard },
    { name: "คำขอรออนุมัติ", href: "/head-hr/requests", icon: FileCheck, badge: 8 },
    { name: "รอบจ่ายเงิน", href: "/head-hr/payroll", icon: Calculator, badge: 2 },
  ],
  secondaryNavigation: [
    { name: "รายงาน SLA", href: "/head-hr/sla-report", icon: ClipboardList },
    { name: "ดาวน์โหลดรายงาน", href: "/head-hr/reports", icon: FileBarChart },
  ],
  secondaryLabel: "รายงาน",
  notificationCount: 4,
  user: {
    name: "พรทิพย์ สุขใจ",
    title: "หัวหน้างานบุคคล",
    initials: "พร",
  },
}

export function HeadHRSidebar() {
  return <UnifiedSidebar config={config} />
}
