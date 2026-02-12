"use client"

import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  Clock,
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

export function DirectorSidebar() {
  const { user } = useAuth()
  const navigationQuery = useNavigation()

  const fallbackConfig: SidebarConfig = {
    role: "director",
    roleLabel: "ผู้อำนวยการ",
    roleBgColor: "bg-purple-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/director", icon: LayoutDashboard, iconKey: "LayoutDashboard" },
      { name: "คำขอรออนุมัติ", href: "/director/requests", icon: FileCheck, iconKey: "FileCheck" },
      { name: "รอบจ่ายเงิน", href: "/director/payroll", icon: Calculator, iconKey: "Calculator" },
    ],
    secondaryNavigation: [
      { name: "รายงาน SLA", href: "/director/sla-report", icon: Clock, iconKey: "Clock" },
      { name: "ดาวน์โหลดรายงาน", href: "/director/reports", icon: FileBarChart, iconKey: "FileBarChart" },
    ],
    secondaryLabel: "รายงาน",
    notificationCount: 0,
    user: {
      name: "ผู้ใช้งาน",
      title: "ผู้อำนวยการโรงพยาบาล",
      initials: "-",
    },
  }

  const config: SidebarConfig = (() => {
    const nav = navigationQuery.data
    const badges = nav?.badges
    const displayName = nav?.user?.name
      || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
      || "ผู้ใช้งาน"
    const title = nav?.user?.title || user?.position || "ผู้อำนวยการโรงพยาบาล"

    if (!nav) {
      return {
        ...fallbackConfig,
        user: {
          name: displayName,
          title,
          initials: resolveInitials(user?.firstName, user?.lastName),
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
        initials: resolveInitials(user?.firstName, user?.lastName),
      },
    }
  })()

  return <UnifiedSidebar config={config} />
}
