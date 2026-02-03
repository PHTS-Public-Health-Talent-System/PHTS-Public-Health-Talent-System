"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrefill } from "@/features/request/hooks";
import { User } from "lucide-react";

// Components Helper for ReadOnly Field
const ReadOnlyField = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-2">
     <Label className="text-slate-700 font-medium text-sm">{label}</Label>
     <div className="h-10 w-full rounded-lg bg-slate-100 px-3 py-2.5 text-slate-900 font-medium border-none shadow-inner text-sm flex items-center">
        {value}
     </div>
  </div>
);

export default function UserProfilePage() {
  const { data: prefill, isLoading: isPrefillLoading } = usePrefill();

  const profile = useMemo(() => {
    if (!prefill) return null;
    const fullName = `${prefill.first_name ?? ""} ${prefill.last_name ?? ""}`.trim();
    return {
      fullName: fullName || "-",
      position: prefill.position_name || "-",
      positionNumber: prefill.position_number || "-",
      citizenId: prefill.citizen_id || "-",
      department: prefill.department || "-",
      subDepartment: prefill.sub_department || "-",
      employeeType: prefill.employee_type || "-",
      missionGroup: prefill.mission_group || "-",
    };
  }, [prefill]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
           <User className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-slate-900">โปรไฟล์ผู้ใช้งาน</h1>
           <p className="text-slate-500 text-sm">จัดการข้อมูลส่วนตัวของคุณ</p>
        </div>
      </div>

      {/* 1. Personal Info Section */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-lg text-slate-800 font-bold">ข้อมูลส่วนตัว (จากระบบ HR)</CardTitle>
          <CardDescription className="text-sm mt-1">ข้อมูลนี้ถูกดึงมาจากระบบฐานข้อมูลบุคลากร หากไม่ถูกต้องกรุณาติดต่อ HR</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isPrefillLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <ReadOnlyField label="ชื่อ-นามสกุล" value={profile?.fullName ?? "-"} />
              <ReadOnlyField label="เลขบัตรประชาชน" value={profile?.citizenId ?? "-"} />

              <div className="md:col-span-2 my-2 h-px bg-slate-200" />

              <ReadOnlyField label="ตำแหน่ง" value={profile?.position ?? "-"} />
              <ReadOnlyField label="เลขที่ตำแหน่ง" value={profile?.positionNumber ?? "-"} />
              <ReadOnlyField label="กลุ่มงาน" value={profile?.department ?? "-"} />
              <ReadOnlyField label="หน่วยงาน" value={profile?.subDepartment ?? "-"} />
              <ReadOnlyField label="ประเภทบุคลากร" value={profile?.employeeType ?? "-"} />
              <ReadOnlyField label="Mission Group" value={profile?.missionGroup ?? "-"} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
