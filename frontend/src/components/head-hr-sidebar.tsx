"use client"

import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  ClipboardList,
  FileBarChart,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"
import { useAuth } from "@/components/providers/auth-provider"
import { useNavigation } from "@/features/navigation/hooks"
import { mapNavigationItems } from "@/features/navigation/mappers"

const resolveInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.trim()?.charAt(0) ?? ""
  const last = lastName?.trim()?.charAt(0) ?? ""
  return (first + last) || "-"
}

export function HeadHRSidebar() {
  const { user } = useAuth()
  const navigationQuery = useNavigation()

  const fallbackConfig: SidebarConfig = {
    role: "head-hr",
    roleLabel: "หัวหน้างานบุคคล",
    roleBgColor: "bg-emerald-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/head-hr", icon: LayoutDashboard, iconKey: "LayoutDashboard" },
      { name: "คำขอรออนุมัติ", href: "/head-hr/requests", icon: FileCheck, iconKey: "FileCheck" },
      { name: "รอบจ่ายเงิน", href: "/head-hr/payroll", icon: Calculator, iconKey: "Calculator" },
    ],
    secondaryNavigation: [
      { name: "รายงาน SLA", href: "/head-hr/sla-report", icon: ClipboardList, iconKey: "ClipboardList" },
      { name: "ดาวน์โหลดรายงาน", href: "/head-hr/reports", icon: FileBarChart, iconKey: "FileBarChart" },
    ],
    secondaryLabel: "รายงาน",
    notificationCount: 0,
    user: {
      name: "ผู้ใช้งาน",
      title: "หัวหน้างานบุคคล",
      initials: "-",
    },
  }

  const config: SidebarConfig = (() => {
    const nav = navigationQuery.data
    const badges = nav?.badges
    const firstName = user?.firstName ?? ""
    const lastName = user?.lastName ?? ""
    const displayName = nav?.user?.name
      || [firstName, lastName].filter(Boolean).join(" ").trim()
      || "ผู้ใช้งาน"
    const title = nav?.user?.title || user?.position || "หัวหน้างานบุคคล"

    if (!nav) {
      return {
        ...fallbackConfig,
        user: {
          name: displayName,
          title,
          initials: resolveInitials(firstName, lastName),
        },
      }
    }

    return {
      ...fallbackConfig,
      navigation: mapNavigationItems(nav.menu, badges),
      secondaryNavigation: mapNavigationItems(nav.secondaryMenu, badges),
      secondaryLabel: nav.secondaryLabel || fallbackConfig.secondaryLabel,
      notificationCount: badges?.notifications ?? 0,
      user: {
        name: displayName,
        title,
        initials: resolveInitials(firstName, lastName),
      },
    }
  })()

  return <UnifiedSidebar config={config} />
}
