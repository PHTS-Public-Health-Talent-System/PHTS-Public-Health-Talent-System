"use client"

import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Megaphone,
  ClipboardList,
  Server,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"

const config: SidebarConfig = {
  role: "admin",
  roleLabel: "ผู้ดูแลระบบ",
  roleBgColor: "bg-rose-600",
  navigation: [
    { name: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard },
    { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
    { name: "ตรวจสอบสิทธิ์", href: "/admin/access-review", icon: Shield, badge: 5 },
    { name: "บันทึกการใช้งาน", href: "/admin/audit-logs", icon: FileText },
  ],
  secondaryNavigation: [
    { name: "จัดการประกาศ", href: "/admin/announcements", icon: Megaphone },
    { name: "ตั้งค่า SLA", href: "/admin/sla-config", icon: ClipboardList },
    { name: "ระบบ", href: "/admin/system", icon: Server },
  ],
  secondaryLabel: "การจัดการ",
  notificationCount: 2,
  user: {
    name: "ผู้ดูแลระบบ",
    title: "System Administrator",
    initials: "AD",
  },
}

export function AdminSidebar() {
  return <UnifiedSidebar config={config} />
}
