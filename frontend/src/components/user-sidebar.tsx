"use client"

import {
  LayoutDashboard,
  FileText,
  User,
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

export function UserSidebar() {
  const { user } = useAuth()
  const navigationQuery = useNavigation()

  const fallbackConfig: SidebarConfig = {
    role: "user",
    roleLabel: "ผู้ใช้งานทั่วไป",
    roleBgColor: "bg-sky-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/user", icon: LayoutDashboard, iconKey: "LayoutDashboard" },
      {
        name: "คำขอของฉัน",
        href: "/user/my-requests",
        icon: FileText,
        iconKey: "FileText",
      },
    ],
    secondaryNavigation: [
      { name: "โปรไฟล์", href: "/user/profile", icon: User, iconKey: "User" },
    ],
    secondaryLabel: "บัญชีผู้ใช้",
    user: {
      name: "ผู้ใช้งาน",
      title: "ผู้ใช้งานทั่วไป",
      initials: "-",
    },
  }

  const config: SidebarConfig = (() => {
    const nav = navigationQuery.data
    const badges = nav?.badges
    const displayName = nav?.user?.name
      || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
      || "ผู้ใช้งาน"
    const title = nav?.user?.title || user?.position || "ผู้ใช้งานทั่วไป"

    if (!nav) {
      return {
        ...fallbackConfig,
        notificationCount: 0,
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
