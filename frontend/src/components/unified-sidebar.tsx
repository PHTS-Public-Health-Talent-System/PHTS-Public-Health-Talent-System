"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  Calendar,
  CalendarDays,
  Calculator,
  Clock,
  ClipboardList,
  FileBarChart,
  FileCheck,
  FileText,
  LogOut,
  LayoutDashboard,
  Megaphone,
  PenTool,
  Server,
  Settings,
  Shield,
  TrendingUp,
  User,
  UserMinus,
  Users,
  Wallet,
  HelpCircle,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"

export interface NavItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  iconKey?: string
  badge?: number
}

export interface SidebarConfig {
  role: string
  roleLabel: string
  roleBgColor: string
  roleTextColor?: string
  navigation: NavItem[]
  secondaryNavigation?: NavItem[]
  secondaryLabel?: string
  user: {
    name: string
    title: string
    initials: string
  }
  notificationCount?: number
}

export function UnifiedSidebar({ config }: { config: SidebarConfig }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const basePath = `/${config.role.toLowerCase().replace(/_/g, "-")}`

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    FileText,
    User,
    FileCheck,
    Calculator,
    ClipboardList,
    FileBarChart,
    Users,
    Shield,
    Megaphone,
    Server,
    Clock,
    Wallet,
    TrendingUp,
    AlertTriangle,
    Calendar,
    CalendarDays,
    UserMinus,
  }

  const resolveIcon = (item: NavItem) =>
    item.icon ?? (item.iconKey ? iconMap[item.iconKey] : undefined) ?? FileText

  // Common items for all roles
  const commonItems: NavItem[] = [
    { name: "แจ้งเตือน", href: `${basePath}/notifications`, icon: Bell, badge: config.notificationCount || 0 },
    { name: "ลายเซ็น", href: `${basePath}/signature`, icon: PenTool },
    { name: "ประกาศ", href: `${basePath}/announcements`, icon: Megaphone },
    { name: "แจ้งปัญหา", href: `${basePath}/support`, icon: HelpCircle },
  ]

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.roleBgColor)}>
          <span className={cn("text-sm font-bold", config.roleTextColor || "text-white")}>
            {config.role.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">ระบบ พ.ต.ส.</span>
          <span className="text-xs text-muted-foreground">{config.roleLabel}</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.roleBgColor + "/20")}>
            <span className={cn("text-sm font-medium", config.roleBgColor.replace("bg-", "text-"))}>
              {config.user.initials}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{config.user.name}</span>
            <span className="text-xs text-muted-foreground truncate">{config.user.title}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          เมนูหลัก
        </div>
        {config.navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href))
          const Icon = resolveIcon(item)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                  config.roleBgColor
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {config.secondaryNavigation && config.secondaryNavigation.length > 0 && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {config.secondaryLabel || "อื่นๆ"}
            </div>
            {config.secondaryNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              const Icon = resolveIcon(item)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                      config.roleBgColor
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </>
        )}

        {/* Common Items Section */}
        <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ทั่วไป
        </div>
        {commonItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          const Icon = resolveIcon(item)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                  config.roleBgColor
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        <Link
          href={`${basePath}/settings`}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <Settings className="h-5 w-5" />
          ตั้งค่า
        </Link>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          ออกจากระบบ
        </button>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการออกจากระบบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการออกจากระบบใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ออกจากระบบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
