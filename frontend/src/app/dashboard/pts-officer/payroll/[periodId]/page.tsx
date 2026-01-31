"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAddPeriodItems,
  useCalculatePeriod,
  useDownloadPeriodReport,
  usePeriodDetail,
  usePeriodPayouts,
  usePeriodSummaryByProfession,
  useRemovePeriodItem,
  useSubmitToHR,
} from "@/features/payroll/hooks";
import { canEditPeriod, getPeriodStatusLabel, toPeriodLabel } from "@/features/payroll/period-utils";
import { usePendingApprovals } from "@/features/request/hooks";
import type { PayPeriod, PeriodItem, PeriodPayoutRow, PeriodSummaryRow } from "@/features/payroll/api";
import type { RequestWithDetails } from "@/types/request.types";

export default function PayrollPeriodDetailPage() {
  const params = useParams();
  const periodId = Number(params.periodId);
  const { data, isLoading } = usePeriodDetail(periodId);
  const payouts = usePeriodPayouts(periodId);
  const summary = usePeriodSummaryByProfession(periodId);
  const pending = usePendingApprovals();
  const addItems = useAddPeriodItems();
  const removeItem = useRemovePeriodItem();
  const calculate = useCalculatePeriod();
  const submit = useSubmitToHR();
  const downloadReport = useDownloadPeriodReport();
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);

  const period = data?.period as PayPeriod | undefined;
  const items = data?.items ?? [];
  const editable = period ? canEditPeriod(period.status) : false;

  const pendingRows = useMemo(() => {
    const list = (pending.data ?? []) as RequestWithDetails[];
    return list.filter((req) => req.status === "PENDING");
  }, [pending.data]);

  const toggleRequest = (requestId: number, disabled?: boolean) => {
    if (disabled) return;
    setSelectedRequestIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId],
    );
  };

  const handleAddItems = () => {
    if (!selectedRequestIds.length) return;
    addItems.mutate(
      { periodId, payload: { request_ids: selectedRequestIds } },
      {
        onError: (error: unknown) => {
          const missing =
            (error as { response?: { data?: { data?: { missing_request_ids?: number[] } } } })
              ?.response?.data?.data?.missing_request_ids ?? [];
          if (missing.length) {
            toast.error("มีคำขอที่ยังไม่ยืนยันผลตรวจ");
            return;
          }
          toast.error("เพิ่มรายการไม่สำเร็จ");
        },
      },
    );
    setSelectedRequestIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">งวด</div>
          <div className="text-2xl font-semibold">{period ? toPeriodLabel(period) : "-"}</div>
          <div className="text-sm text-muted-foreground">{period ? getPeriodStatusLabel(period.status) : ""}</div>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/pts-officer/payroll">ย้อนกลับ</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สรุปงวด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">จำนวนคน</div>
            <div className="text-lg font-semibold">{period?.total_headcount ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">ยอดรวม</div>
            <div className="text-lg font-semibold">{Number(period?.total_amount ?? 0).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => calculate.mutate(periodId)} disabled={!editable || calculate.isPending}>
              {calculate.isPending ? "กำลังคำนวณ..." : "คำนวณงวด"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => submit.mutate(periodId)}
              disabled={!editable || submit.isPending}
            >
              {submit.isPending ? "กำลังส่ง..." : "ส่งต่อ HR"}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const blob = await downloadReport.mutateAsync(periodId);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `period-${periodId}-report.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              disabled={downloadReport.isPending}
            >
              ดาวน์โหลด PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการในงวด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขคำขอ</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>หน่วยงาน</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: PeriodItem) => (
                  <TableRow key={item.period_item_id}>
                    <TableCell>{item.request_no ?? "-"}</TableCell>
                    <TableCell>
                      {(item.first_name || item.last_name)
                        ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()
                        : item.citizen_id}
                    </TableCell>
                    <TableCell>{item.position_name ?? "-"}</TableCell>
                    <TableCell>{item.current_department ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {editable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            removeItem.mutate({ periodId, itemId: item.period_item_id })
                          }
                        >
                          ลบ
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      ยังไม่มีรายการในงวด
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มรายการจากคำขอที่รอตรวจ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            เลือกคำขอที่ต้องการนำเข้ามาในงวด (เฉพาะสถานะ PENDING)
          </div>
          <div className="space-y-2">
            {pendingRows.map((req) => {
              const isVerified = !!req.has_verification_snapshot;
              return (
              <label key={req.request_id} className="flex items-center gap-3">
                <Checkbox
                  checked={selectedRequestIds.includes(req.request_id)}
                  onCheckedChange={() => toggleRequest(req.request_id, !isVerified)}
                  disabled={!isVerified}
                />
                <span className="text-sm">
                  {req.request_no ?? `REQ-${req.request_id}`} — {req.requester?.first_name ?? ""}{" "}
                  {req.requester?.last_name ?? ""} ({req.citizen_id})
                  {!isVerified && (
                    <span className="ml-2 text-xs text-destructive">
                      ยังไม่ยืนยันผลตรวจ
                    </span>
                  )}
                </span>
              </label>
            )})}
            {pendingRows.length === 0 && (
              <div className="text-sm text-muted-foreground">ไม่มีคำขอค้างตรวจ</div>
            )}
          </div>
          <Button onClick={handleAddItems} disabled={!editable || addItems.isPending}>
            {addItems.isPending ? "กำลังเพิ่ม..." : "เพิ่มรายการ"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>สรุปตามวิชาชีพ</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.isLoading ? (
            <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">จำนวนคน</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead className="text-right">มีหัก</TableHead>
                  <TableHead className="text-right">ยอดที่ถูกหัก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary.data ?? []).map((row: PeriodSummaryRow) => (
                  <TableRow key={row.position_name}>
                    <TableCell>{row.position_name}</TableCell>
                    <TableCell className="text-right">{Number(row.headcount)}</TableCell>
                    <TableCell className="text-right">{Number(row.total_payable).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(row.deducted_count)}</TableCell>
                    <TableCell className="text-right">{Number(row.deducted_total).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(summary.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      ยังไม่มีข้อมูลสรุป
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการจ่ายเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.isLoading ? (
            <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">วันสิทธิ</TableHead>
                  <TableHead className="text-right">วันหัก</TableHead>
                  <TableHead className="text-right">อัตรา</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payouts.data ?? []).map((row: PeriodPayoutRow) => (
                  <TableRow key={row.payout_id}>
                    <TableCell>
                      {row.first_name ?? ""} {row.last_name ?? ""}
                    </TableCell>
                    <TableCell>{row.position_name ?? "-"}</TableCell>
                    <TableCell className="text-right">{row.eligible_days ?? 0}</TableCell>
                    <TableCell className="text-right">{row.deducted_days ?? 0}</TableCell>
                    <TableCell className="text-right">{Number(row.rate ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(row.total_payable ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(payouts.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      ยังไม่มีรายการ
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
