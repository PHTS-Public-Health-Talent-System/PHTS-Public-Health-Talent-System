"use client"

import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  Clock,
  FileBarChart,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"

const config: SidebarConfig = {
  role: "director",
  roleLabel: "ผู้อำนวยการ",
  roleBgColor: "bg-purple-600",
  navigation: [
    { name: "แดชบอร์ด", href: "/director", icon: LayoutDashboard },
    { name: "คำขอรออนุมัติ", href: "/director/requests", icon: FileCheck, badge: 6 },
    { name: "รอบจ่ายเงิน", href: "/director/payroll", icon: Calculator, badge: 1 },
  ],
  secondaryNavigation: [
    { name: "รายงาน SLA", href: "/director/sla-report", icon: Clock },
    { name: "ดาวน์โหลดรายงาน", href: "/director/reports", icon: FileBarChart },
  ],
  secondaryLabel: "รายงาน",
  notificationCount: 3,
  user: {
    name: "นพ.สมศักดิ์ รักษาดี",
    title: "ผู้อำนวยการโรงพยาบาล",
    initials: "สศ",
  },
}

export function DirectorSidebar() {
  return <UnifiedSidebar config={config} />
}
