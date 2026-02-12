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
import { useAuth } from "@/components/providers/auth-provider"
import { useNavigation } from "@/features/navigation/hooks"
import { mapNavigationItems } from "@/features/navigation/mappers"

const resolveInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.trim()?.charAt(0) ?? ""
  const last = lastName?.trim()?.charAt(0) ?? ""
  return (first + last) || "-"
}

export function AdminSidebar() {
  const { user } = useAuth()
  const navigationQuery = useNavigation()

  const fallbackConfig: SidebarConfig = {
    role: "admin",
    roleLabel: "ผู้ดูแลระบบ",
    roleBgColor: "bg-rose-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard, iconKey: "LayoutDashboard" },
      { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users, iconKey: "Users" },
      { name: "ตรวจสอบสิทธิ์", href: "/admin/access-review", icon: Shield, iconKey: "Shield" },
      { name: "บันทึกการใช้งาน", href: "/admin/audit-logs", icon: FileText, iconKey: "FileText" },
    ],
    secondaryNavigation: [
      { name: "จัดการประกาศ", href: "/admin/announcements", icon: Megaphone, iconKey: "Megaphone" },
      { name: "ตั้งค่า SLA", href: "/admin/sla-config", icon: ClipboardList, iconKey: "ClipboardList" },
      { name: "ระบบ", href: "/admin/system", icon: Server, iconKey: "Server" },
    ],
    secondaryLabel: "การจัดการ",
    notificationCount: 0,
    user: {
      name: "ผู้ดูแลระบบ",
      title: "System Administrator",
      initials: "AD",
    },
  }

  const config: SidebarConfig = (() => {
    const nav = navigationQuery.data
    const badges = nav?.badges
    const displayName = nav?.user?.name
      || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
      || "ผู้ดูแลระบบ"
    const title = nav?.user?.title || user?.position || "System Administrator"

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
