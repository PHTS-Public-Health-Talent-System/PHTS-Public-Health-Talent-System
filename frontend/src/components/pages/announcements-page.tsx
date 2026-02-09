"use client"

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Megaphone, Calendar, AlertCircle, ChevronRight } from "lucide-react"
import { useActiveAnnouncements } from "@/features/announcement/hooks"

function mapPriorityToDisplay(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "high"
    case "NORMAL":
      return "normal"
    case "LOW":
      return "low"
    default:
      return "normal"
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          สำคัญ
        </Badge>
      )
    case "normal":
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">ทั่วไป</Badge>
    case "low":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">ข้อมูล</Badge>
    default:
      return null
  }
}

export function AnnouncementsPage() {
  const { data: announcements, isLoading, error } = useActiveAnnouncements()

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">ประกาศ</h1>
          <p className="mt-1 text-muted-foreground">ข่าวสารและประกาศจากระบบจัดการเงิน พ.ต.ส.</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
            <p className="mt-4 text-destructive">เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลได้</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">ประกาศ</h1>
        <p className="mt-1 text-muted-foreground">ข่าวสารและประกาศจากระบบจัดการเงิน พ.ต.ส.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const priority = mapPriorityToDisplay(announcement.priority)
            return (
              <Card key={announcement.id} className={`transition-all hover:shadow-md ${priority === "high" ? "border-destructive/50" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${priority === "high" ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <Megaphone className={`h-5 w-5 ${priority === "high" ? "text-destructive" : "text-primary"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {getPriorityBadge(priority)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {announcement.created_at && new Date(announcement.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{announcement.body}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">ไม่มีประกาศในขณะนี้</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
