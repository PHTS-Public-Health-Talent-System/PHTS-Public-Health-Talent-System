"use client";

import { Plus, FileText, CheckCircle, Clock, Eye, Pencil, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useMyRequests, usePrefill } from "@/features/request/hooks";
import { useNotifications } from "@/features/notification/hooks";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { REQUEST_TYPE_LABELS } from "@/types/request.types";
import { useMemo } from "react";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { data: requests, isLoading } = useMyRequests();
  const { data: prefill } = usePrefill();
  const { data: notifications, isLoading: isNotifLoading } = useNotifications();

  const total = requests?.length ?? 0;
  const pending = requests?.filter((r) =>
    r.status !== "DRAFT" &&
    r.status !== "APPROVED" &&
    r.status !== "REJECTED" &&
    r.status !== "CANCELLED"
  ).length ?? 0;
  const approved = requests?.filter((r) => r.status === "APPROVED").length ?? 0;
  const sortedRequests = useMemo(() => {
    if (!requests) return [];
    return [...requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [requests]);
  const latestNotifs = notifications?.notifications?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            สวัสดี, {prefill?.first_name || user?.firstName} {prefill?.last_name || user?.lastName}
          </h2>
          <p className="text-muted-foreground">
            ยินดีต้อนรับสู่ระบบบริหารจัดการเงิน พ.ต.ส.
          </p>
        </div>
        <Link href="/dashboard/user/request">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> ยื่นคำขอใหม่
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="คำขอทั้งหมด" value={total} icon={FileText} />
          <StatCard
            title="รอดำเนินการ"
            value={pending}
            icon={Clock}
            iconClassName="bg-orange-100 text-orange-600"
          />
          <StatCard
            title="อนุมัติแล้ว"
            value={approved}
            icon={CheckCircle}
            iconClassName="bg-green-100 text-green-600"
          />
        </div>
      )}

      <Card>
        <CardContent className="flex flex-wrap gap-2 py-4">
          <Link href="/dashboard/user/requests">
            <Button variant="outline" size="sm">ดูทั้งหมด</Button>
          </Link>
          <Link href="/dashboard/user/requests?status=PENDING">
            <Button variant="outline" size="sm">รอดำเนินการ</Button>
          </Link>
          <Link href="/dashboard/user/requests?status=RETURNED">
            <Button variant="outline" size="sm">ส่งกลับแก้ไข</Button>
          </Link>
          <Link href="/dashboard/user/requests?status=DRAFT">
            <Button variant="outline" size="sm">ฉบับร่าง</Button>
          </Link>
          <Link href="/dashboard/user/requests?status=APPROVED">
            <Button variant="outline" size="sm">อนุมัติแล้ว</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" /> การแจ้งเตือนล่าสุด
          </CardTitle>
          <Link href="/dashboard/user/notifications">
            <Button variant="ghost" size="sm">ดูทั้งหมด</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isNotifLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : latestNotifs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p>ยังไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestNotifs.map((n) => (
                <div key={n.notification_id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.is_read && (
                      <span className="text-xs text-destructive">ใหม่</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">คำขอของฉัน</CardTitle>
          {requests && requests.length > 0 && (
            <Link href="/dashboard/user/requests">
              <Button variant="ghost" size="sm">
                ดูทั้งหมด
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-2 opacity-40" />
              <p>ยังไม่มีคำขอ</p>
              <Link href="/dashboard/user/request">
                <Button variant="outline" className="mt-3" size="sm">
                  <Plus className="mr-1 h-3 w-3" /> สร้างคำขอแรก
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่คำขอ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRequests.slice(0, 10).map((req) => (
                      <TableRow key={req.request_id}>
                        <TableCell className="font-medium">
                          {req.request_no ?? `#${req.request_id}`}
                        </TableCell>
                        <TableCell>
                          {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {req.requested_amount.toLocaleString()} บาท
                        </TableCell>
                        <TableCell>
                          {new Date(req.created_at).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/dashboard/user/requests/${req.request_id}`}>
                              <Button variant="ghost" size="icon" title="ดูรายละเอียด">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {(req.status === "DRAFT" || req.status === "RETURNED") && (
                              <Link href={`/dashboard/user/requests/${req.request_id}/edit`}>
                                <Button variant="ghost" size="icon" title="แก้ไข">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {sortedRequests.slice(0, 10).map((req) => (
                  <Link
                    key={req.request_id}
                    href={`/dashboard/user/requests/${req.request_id}`}
                  >
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {req.request_no ?? `#${req.request_id}`}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                      </p>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("th-TH")}
                        </span>
                        <span className="font-semibold text-primary">
                          {req.requested_amount.toLocaleString()} บาท
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
