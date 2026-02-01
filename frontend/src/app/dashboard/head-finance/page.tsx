"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePeriods } from "@/features/payroll/hooks";
import type { PayPeriod } from "@/features/payroll/api";

export default function HeadFinanceDashboardPage() {
  const periods = usePeriods();
  const periodRows = (periods.data as PayPeriod[] | undefined) ?? [];

  const waitingFinance = periodRows.filter((p) => p.status === "WAITING_HEAD_FINANCE").length;
  const waitingDirector = periodRows.filter((p) => p.status === "WAITING_DIRECTOR").length;
  const closed = periodRows.filter((p) => p.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">ภาพรวมหัวหน้าการเงิน</div>
        <div className="text-2xl font-semibold">แดชบอร์ดหลัก</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">งวดรอตรวจ (การเงิน)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{waitingFinance}</div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/head-finance/budget-check">ตรวจสอบงวด</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">งวดรอผอ.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{waitingDirector}</div>
            <div className="text-xs text-muted-foreground">งวดที่อนุมัติแล้ว ส่งต่อผอ.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">งวดที่ปิดแล้ว</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{closed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ทางลัดที่ใช้บ่อย</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard/head-finance/requests">คำขอรออนุมัติ</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/head-finance/budget-check">ตรวจสอบงวดเงินเดือน</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/head-finance/history">ค้นหา/ตรวจย้อนหลัง</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/head-finance/reports">ดาวน์โหลดรายงาน</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
