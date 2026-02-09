"use client"

import {
  LayoutDashboard,
  FileText,
  User,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"
import { useMemo } from "react"
import { useMyRequests } from "@/features/request/hooks"
import { useNotifications } from "@/features/notification/hooks"
import type { RequestWithDetails } from "@/types/request.types"

export function UserSidebar() {
  const { data: requestData } = useMyRequests()
  const { data: notifData } = useNotifications()
  const requests = useMemo(
    () => (requestData ?? []) as RequestWithDetails[],
    [requestData],
  )

  const pendingCount = requests.filter((r) => r.status === "PENDING").length
  const notificationCount = notifData?.unreadCount ?? 0

  const config: SidebarConfig = {
    role: "user",
    roleLabel: "ผู้ใช้งานทั่วไป",
    roleBgColor: "bg-sky-600",
    navigation: [
      { name: "แดชบอร์ด", href: "/user", icon: LayoutDashboard },
      {
        name: "คำขอของฉัน",
        href: "/user/my-requests",
        icon: FileText,
        badge: pendingCount,
      },
    ],
    secondaryNavigation: [
      { name: "โปรไฟล์", href: "/user/profile", icon: User },
    ],
    secondaryLabel: "บัญชีผู้ใช้",
    notificationCount,
    user: {
      name: "สมชาย ใจดี",
      title: "พยาบาลวิชาชีพ",
      initials: "สช",
    },
  }

  return <UnifiedSidebar config={config} />
}
