"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreatePeriod, usePeriods } from "@/features/payroll/hooks";
import { getPeriodStatusLabel, toPeriodLabel } from "@/features/payroll/period-utils";
import type { PayPeriod } from "@/features/payroll/api";

export default function PayrollPeriodsPage() {
  const { data, isLoading } = usePeriods();
  const createPeriod = useCreatePeriod();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const handleCreate = () => {
    const payload = {
      year: Number(year),
      month: Number(month),
    };
    createPeriod.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้างงวดใหม่</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">ปี</div>
            <Input value={year} onChange={(e) => setYear(e.target.value)} className="w-32" />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">เดือน</div>
            <Input value={month} onChange={(e) => setMonth(e.target.value)} className="w-24" />
          </div>
          <Button onClick={handleCreate} disabled={createPeriod.isPending}>
            {createPeriod.isPending ? "กำลังสร้าง..." : "สร้างงวด"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>งวดทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>งวด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จำนวนคน</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((period: PayPeriod) => (
                  <TableRow key={period.period_id}>
                    <TableCell>{toPeriodLabel(period)}</TableCell>
                    <TableCell>{getPeriodStatusLabel(period.status)}</TableCell>
                    <TableCell className="text-right">{period.total_headcount ?? 0}</TableCell>
                    <TableCell className="text-right">{Number(period.total_amount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/pts-officer/payroll/${period.period_id}`}>ดูรายละเอียด</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      ยังไม่มีงวด
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
