"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Bell,
  CheckCircle2,
  Clock,
  Check,
  Trash2,
  CheckCheck,
  Info,
  CreditCard,
  FileWarning,
  CalendarClock,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNotifications, useMarkNotificationRead, useDeleteReadNotifications } from "@/features/notification/hooks"

type NotificationType = "approval" | "reminder" | "system" | "payment" | "license" | "leave"

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "approval":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    case "reminder":
      return <Clock className="h-5 w-5 text-amber-500" />
    case "system":
      return <Info className="h-5 w-5 text-primary" />
    case "payment":
      return <CreditCard className="h-5 w-5 text-emerald-500" />
    case "license":
      return <FileWarning className="h-5 w-5 text-destructive" />
    case "leave":
      return <CalendarClock className="h-5 w-5 text-primary" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case "approval": return "การอนุมัติ"
    case "reminder": return "เตือนความจำ"
    case "system": return "ระบบ"
    case "payment": return "การจ่ายเงิน"
    case "license": return "ใบอนุญาต"
    case "leave": return "การลา"
    default: return "อื่นๆ"
  }
}

export function NotificationsPage() {
  const { data: notifData, isLoading, error } = useNotifications()
  const markRead = useMarkNotificationRead()
  const deleteRead = useDeleteReadNotifications()
  
  const [filterType, setFilterType] = useState<string>("all")
  const [filterReadStatus, setFilterReadStatus] = useState<string>("all")

  const notifications = notifData?.notifications || []
  const unreadCount = notifData?.unreadCount || 0

  const filteredNotifications = notifications.filter((n) => {
    const matchesType = filterType === "all" || n.type === filterType
    const matchesRead = filterReadStatus === "all" || (filterReadStatus === "unread" ? !n.is_read : n.is_read)
    return matchesType && matchesRead
  })

  const handleMarkAsRead = (id: number) => {
    markRead.mutate(id, {
      onSuccess: () => {
        toast.success("ทำเครื่องหมายอ่านแล้ว")
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
        toast.error(message)
      },
    })
  }

  const handleMarkAllAsRead = () => {
    // Mark all unread as read
    notifications
      .filter((n) => !n.is_read)
      .forEach((n) => {
        markRead.mutate(n.id)
      })
    toast.success("ทำเครื่องหมายอ่านทั้งหมดแล้ว")
  }

  const handleDeleteRead = () => {
    deleteRead.mutate(undefined, {
      onSuccess: () => {
        toast.success("ลบการแจ้งเตือนที่อ่านแล้ว")
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
        toast.error(message)
      },
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "เมื่อสักครู่"
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
    if (diffInHours < 48) return "เมื่อวาน"
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">การแจ้งเตือน</h1>
          <p className="mt-1 text-muted-foreground">รายการแจ้งเตือนทั้งหมด</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-destructive/50" />
            <p className="mt-4 text-destructive">เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลได้</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">การแจ้งเตือน</h1>
          <p className="mt-1 text-muted-foreground">
            รายการแจ้งเตือนทั้งหมด {unreadCount > 0 && `(ยังไม่อ่าน ${unreadCount} รายการ)`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ประเภท:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="approval">การอนุมัติ</SelectItem>
                  <SelectItem value="payment">การจ่ายเงิน</SelectItem>
                  <SelectItem value="license">ใบอนุญาต</SelectItem>
                  <SelectItem value="leave">การลา</SelectItem>
                  <SelectItem value="reminder">เตือนความจำ</SelectItem>
                  <SelectItem value="system">ระบบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">สถานะ:</span>
              <Select value={filterReadStatus} onValueChange={setFilterReadStatus}>
                <SelectTrigger className="w-[140px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
                  <SelectItem value="read">อ่านแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">ไม่มีการแจ้งเตือน</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors ${!notification.is_read ? "border-primary/50 bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    {getNotificationIcon(notification.type as NotificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type as NotificationType)}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="default" className="text-xs bg-primary">
                              ใหม่
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleMarkAsRead(notification.id)} 
                            title="อ่านแล้ว"
                            disabled={markRead.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary and Actions */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>แสดง {filteredNotifications.length} จาก {notifications.length} รายการ</span>
        {notifications.some((n) => n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteRead}
            disabled={deleteRead.isPending}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            ลบการแจ้งเตือนที่อ่านแล้ว
          </Button>
        )}
      </div>
    </div>
  )
}
