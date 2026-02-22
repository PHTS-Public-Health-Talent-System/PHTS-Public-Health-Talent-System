import { ReturnReportStatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { LeaveRecord } from '@/features/leave-management/types/leaveManagement.types';
import { Edit, Eye, GraduationCap } from 'lucide-react';

export function StudyLeavesTab({
  records,
  formatDateDisplay,
  onViewDetail,
  onEdit,
  isLoading,
  isError,
  onRetry,
}: {
  records: LeaveRecord[];
  formatDateDisplay: (date: string) => string;
  onViewDetail: (record: LeaveRecord) => void;
  onEdit: (record: LeaveRecord) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <TabsContent value="study">
      <Card className="border-border shadow-sm">
        <CardHeader className="py-4 px-6 border-b bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            รายการลาศึกษาต่อ/อบรม
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-destructive">
              <span>โหลดข้อมูลไม่สำเร็จ</span>
              <Button variant="outline" size="sm" onClick={onRetry}>
                ลองอีกครั้ง
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">ไม่พบรายการ</div>
          ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{record.personName}</p>
                      <p className="text-sm text-muted-foreground">{record.personPosition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.requireReport && (
                      <ReturnReportStatusBadge status={record.reportStatus} tone="soft" />
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onViewDetail(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {record.studyInfo && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-secondary/20 p-3 rounded-md">
                    <div>
                      <p className="text-muted-foreground text-xs">สถานศึกษา</p>
                      <p className="font-medium">{record.studyInfo.institution}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">หลักสูตร</p>
                      <p className="font-medium">{record.studyInfo.program}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">สาขาวิชา</p>
                      <p className="font-medium">{record.studyInfo.field}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">เริ่มศึกษา</p>
                      <p className="font-medium">{formatDateDisplay(record.studyInfo.startDate)}</p>
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">วันที่ลา (User)</p>
                    <p className="font-medium">
                      {formatDateDisplay(record.userStartDate)} - {formatDateDisplay(record.userEndDate)}
                    </p>
                  </div>
                  {record.documentStartDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">วันที่ลา (Doc)</p>
                      <p className="font-medium text-amber-600">
                        {formatDateDisplay(record.documentStartDate)} -{' '}
                        {formatDateDisplay(record.documentEndDate || '')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">จำนวนวัน</p>
                    <p className="font-medium">{record.days} วัน</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
