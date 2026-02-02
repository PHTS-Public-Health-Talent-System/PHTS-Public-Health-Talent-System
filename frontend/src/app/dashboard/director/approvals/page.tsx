"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { usePeriods } from "@/features/payroll/hooks";
import { getPeriodStatusLabel, toPeriodLabel } from "@/features/payroll/period-utils";
import type { PayPeriod } from "@/features/payroll/api";

export default function DirectorApprovalsPage() {
  const { data, isLoading } = usePeriods();
  const rows = (data ?? []).filter((p: PayPeriod) => p.status === "WAITING_DIRECTOR");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">งวดรออนุมัติ (ผอ.)</h1>
        <p className="text-slate-500">ตรวจสอบและลงนามอนุมัติเบิกจ่ายเงิน พ.ต.ส.</p>
      </div>

      <Card className="border-slate-200 shadow-soft rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-800">รายการงวดที่รอการตรวจสอบ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="h-12 font-semibold text-slate-700">งวดการรายงาน</TableHead>
                    <TableHead className="h-12 font-semibold text-slate-700">สถานะ</TableHead>
                    <TableHead className="h-12 font-semibold text-slate-700 text-right">จำนวนคน</TableHead>
                    <TableHead className="h-12 font-semibold text-slate-700 text-right">ยอดรวม (บาท)</TableHead>
                    <TableHead className="h-12 text-right w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((period: PayPeriod) => (
                      <TableRow key={period.period_id} className="h-16 hover:bg-slate-50 transition-colors border-slate-100">
                        <TableCell className="font-semibold text-slate-900">
                           {toPeriodLabel(period)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            {getPeriodStatusLabel(period.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-numbers text-slate-600">
                          {period.total_headcount?.toLocaleString() ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-numbers font-bold text-slate-900">
                          {Number(period.total_amount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button asChild size="sm" variant="default" className="shadow-none rounded-lg h-9">
                            <Link href={`/dashboard/director/approvals/${period.period_id}`}>ตรวจสอบ</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                <Clock className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="text-lg font-medium text-slate-600">ไม่มีงวดที่รออนุมัติ</p>
                            <p className="text-sm">ขอบเขตงานของคุณเรียบร้อยดีในขณะนี้</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
