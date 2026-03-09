'use client';

import { Calendar, List, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PayoutDetail } from '@/features/payroll/api';
import { formatThaiNumber } from '@/shared/utils/thai-locale';
import { cn } from '@/lib/utils';

type ChecksItemsSectionProps = {
  items: PayoutDetail['items'];
};

export function ChecksItemsSection({ items }: ChecksItemsSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground tracking-tight">
        <List className="h-4 w-4 text-primary" />
        รายการย่อยที่นำมาคำนวณ
      </h3>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border/50">
            <tr className="text-left">
              <th className="p-3 pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                รายละเอียดรายการ
              </th>
              <th className="p-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                จำนวนเงิน (บาท)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((item) => {
              const isManualEdit =
                Number(item.reference_month ?? 0) === 0 && Number(item.reference_year ?? 0) === 0;
              const isAdd = item.item_type === 'RETROACTIVE_ADD';
              const isDeduct = item.item_type === 'RETROACTIVE_DEDUCT';

              return (
                <tr key={item.item_id} className="group transition-colors hover:bg-muted/30">
                  <td className="p-3 pl-4">
                    <p className="font-semibold text-foreground/90">{item.description ?? '-'}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {/* Reference Date or Manual Tag */}
                      <div className="flex items-center gap-1.5 bg-background border border-border/50 px-1.5 py-0.5 rounded-md shadow-sm">
                        {isManualEdit ? (
                          <>
                            <PenLine className="h-3 w-3 text-amber-600" />
                            <span className="text-amber-700 font-medium">
                              แก้ไขข้อมูล/เพิ่มด้วยมือ
                            </span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 text-muted-foreground/70" />
                            <span className="font-medium text-muted-foreground">
                              อ้างอิง {String(item.reference_month).padStart(2, '0')}/
                              {item.reference_year}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Type Badge */}
                      {item.item_type !== 'CURRENT' && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-5 px-1.5 text-[10px] font-medium border',
                            isAdd
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isDeduct
                                ? 'bg-orange-50 text-destructive border-orange-200'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {isAdd
                            ? 'ตกเบิก (บวกเพิ่ม)'
                            : isDeduct
                              ? 'ตกเบิก (หักออก)'
                              : item.item_type}
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="p-3 pr-4 text-right tabular-nums">
                    {(() => {
                      const amount = Number(item.amount ?? 0);
                      if (!Number.isFinite(amount)) return '-';

                      if (isDeduct) {
                        return (
                          <span className="font-bold text-destructive">
                            -{formatThaiNumber(amount)}
                          </span>
                        );
                      }
                      if (isAdd) {
                        return (
                          <span className="font-bold text-blue-600">
                            +{formatThaiNumber(amount)}
                          </span>
                        );
                      }
                      return (
                        <span className="font-semibold text-foreground">
                          {formatThaiNumber(amount)}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
