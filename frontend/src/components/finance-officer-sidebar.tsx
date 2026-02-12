"use client"

import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
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

export function FinanceOfficerSidebar() {
  const { user } = useAuth()
  const navigationQuery = useNavigation()

  const fallbackConfig: SidebarConfig = {
    role: "finance-officer",
    roleLabel: "เจ้าหน้าที่การเงิน",
    roleBgColor: "bg-amber-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/finance-officer", icon: LayoutDashboard, iconKey: "LayoutDashboard" },
      { name: "การจ่ายเงิน", href: "/finance-officer/payouts", icon: Wallet, iconKey: "Wallet" },
      { name: "สรุปรายปี", href: "/finance-officer/yearly-summary", icon: TrendingUp, iconKey: "TrendingUp" },
    ],
    secondaryNavigation: [
      { name: "ดาวน์โหลดรายงาน", href: "/finance-officer/reports", icon: FileBarChart, iconKey: "FileBarChart" },
    ],
    secondaryLabel: "รายงาน",
    notificationCount: 0,
    user: {
      name: "ผู้ใช้งาน",
      title: "เจ้าหน้าที่การเงิน",
      initials: "-",
    },
  }

  const config: SidebarConfig = (() => {
    const nav = navigationQuery.data
    const badges = nav?.badges
    const displayName = nav?.user?.name
      || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
      || "ผู้ใช้งาน"
    const title = nav?.user?.title || user?.position || "เจ้าหน้าที่การเงิน"

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
