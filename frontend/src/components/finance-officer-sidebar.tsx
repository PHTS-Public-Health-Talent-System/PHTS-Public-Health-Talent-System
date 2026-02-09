"use client"

import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  FileBarChart,
} from "lucide-react"
import { UnifiedSidebar, type SidebarConfig } from "./unified-sidebar"

const config: SidebarConfig = {
  role: "finance-officer",
  roleLabel: "เจ้าหน้าที่การเงิน",
  roleBgColor: "bg-amber-600",
  navigation: [
    { name: "แดชบอร์ด", href: "/finance-officer", icon: LayoutDashboard },
    { name: "การจ่ายเงิน", href: "/finance-officer/payouts", icon: Wallet, badge: 15 },
    { name: "สรุปรายปี", href: "/finance-officer/yearly-summary", icon: TrendingUp },
  ],
  secondaryNavigation: [
    { name: "ดาวน์โหลดรายงาน", href: "/finance-officer/reports", icon: FileBarChart },
  ],
  secondaryLabel: "รายงาน",
  notificationCount: 2,
  user: {
    name: "วิไล เงินทอง",
    title: "เจ้าหน้าที่การเงิน",
    initials: "วล",
  },
}

export function FinanceOfficerSidebar() {
  return <UnifiedSidebar config={config} />
}
