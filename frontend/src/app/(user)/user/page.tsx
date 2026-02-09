'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, Bell, Plus, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatCards } from '@/components/stat-cards';
import { DataTableCard } from '@/components/data-table-card';
import { QuickActions } from '@/components/quick-actions';
import { StatusBadge, type StatusType } from '@/components/status-badge';
import { useCurrentUser } from '@/features/auth/hooks';
import { useUserDashboard } from '@/features/dashboard/hooks';
import type { RequestStatus } from '@/types/request.types';
import { buildStatItems } from './dashboard-mappers';

const quickActions = [
  { label: 'สร้างคำขอใหม่', href: '/user/my-requests/new', icon: Plus },
  { label: 'คำขอของฉัน', href: '/user/my-requests', icon: FileText },
  { label: 'ดูประกาศ', href: '/user/announcements', icon: Megaphone },
  { label: 'แจ้งเตือน', href: '/user/notifications', icon: Bell },
];

export default function UserDashboardPage() {
  const { data: userResponse } = useCurrentUser();
  const { data: dashboardData } = useUserDashboard();

  const dashboardStats = useMemo(
    () =>
      dashboardData?.stats ?? {
        total: 0,
        pending: 0,
        approved: 0,
        unread: 0,
        pending_steps: [],
        total_trend: '0 เดือนนี้',
        total_trend_up: false,
        pending_trend: undefined,
        pending_trend_up: false,
        approved_trend: 'อนุมัติแล้ว 0 รายการ',
        approved_trend_up: false,
        unread_trend: 'วันนี้ 0 รายการ',
        unread_trend_up: false,
      },
    [dashboardData?.stats],
  );

  const stats = useMemo(() => {
    return buildStatItems(dashboardStats, {
      FileText,
      Clock,
      CheckCircle2,
      Bell,
    });
  }, [dashboardStats]);

  const recentRequests = dashboardData?.recent_requests ?? [];
  const announcements = dashboardData?.announcements ?? [];
  const greeting = useMemo(() => {
    const user = userResponse?.data as {
      first_name?: string;
      last_name?: string;
      firstName?: string;
      lastName?: string;
    } | undefined;
    const name = `${user?.first_name ?? user?.firstName ?? ''} ${user?.last_name ?? user?.lastName ?? ''}`.trim();
    return `ยินดีต้อนรับ ${name || 'ผู้ใช้งาน'} - ติดตามคำขอและรับเงิน พ.ต.ส. ของคุณ`;
  }, [userResponse?.data]);

  const mapStatusToBadge = (status: RequestStatus): StatusType => {
    switch (status) {
      case 'APPROVED':
        return 'approved';
      case 'REJECTED':
        return 'rejected';
      case 'RETURNED':
        return 'returned';
      case 'CANCELLED':
        return 'cancelled';
      case 'DRAFT':
        return 'draft';
      default:
        return 'pending';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="แดชบอร์ด"
        description={greeting}
        actions={[{ label: 'สร้างคำขอใหม่', href: '/user/my-requests/new', icon: Plus }]}
      />

      {/* Stats Grid */}
      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <DataTableCard title="คำขอล่าสุด" viewAllHref="/user/my-requests">
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <Link
                  key={request.request_id}
                  href={`/user/my-requests/${request.request_id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{request.display_id}</span>
                      <StatusBadge
                        status={mapStatusToBadge(request.status)}
                        label={request.status_label}
                      />
                    </div>
                    <p className="mt-1 font-medium text-foreground">{request.month_label}</p>
                    <p className="text-sm text-muted-foreground">ขั้นตอน {request.step}/6</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{request.amount} บาท</p>
                    <p className="text-xs text-muted-foreground">{request.submitted_label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DataTableCard>
        </div>

        {/* Announcements */}
        <DataTableCard title="ประกาศล่าสุด" viewAllHref="/user/announcements">
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg border border-border bg-background/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground text-sm">{announcement.title}</p>
                  {announcement.priority === 'high' && (
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800 border-red-200 text-xs shrink-0"
                    >
                      สำคัญ
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{announcement.date}</p>
              </div>
            ))}
          </div>
        </DataTableCard>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
