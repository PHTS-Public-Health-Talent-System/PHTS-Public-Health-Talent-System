"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrefill } from "@/features/request/hooks";
import {
  useCheckSignature,
  useDeleteSignature,
  useMySignature,
} from "@/features/signature/hooks";
import { toast } from "sonner";
import Image from "next/image";
import { User, PenTool, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

// Components Helper for ReadOnly Field
const ReadOnlyField = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-2">
     <Label className="text-slate-600 font-normal">{label}</Label>
     <div className="h-12 w-full rounded-lg bg-slate-100 px-3 py-3 text-slate-900 font-medium border-none shadow-inner text-base">
        {value}
     </div>
  </div>
);

export default function UserProfilePage() {
  const { data: prefill, isLoading: isPrefillLoading } = usePrefill();
  const { data: signature, isLoading: isSignatureLoading } = useMySignature();
  const { data: signatureCheck } = useCheckSignature();
  const deleteSignature = useDeleteSignature();

  const isBusy = deleteSignature.isPending;

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
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
           <User className="h-7 w-7" />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-slate-900">โปรไฟล์ผู้ใช้งาน</h1>
           <p className="text-slate-500 text-lg">จัดการข้อมูลส่วนตัวและลายเซ็นดิจิทัล</p>
        </div>
      </div>

      {/* 1. Personal Info Section */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-xl text-slate-800">ข้อมูลส่วนตัว (จากระบบ HR)</CardTitle>
          <CardDescription>ข้อมูลนี้ถูกดึงมาจากระบบฐานข้อมูลบุคลากร หากไม่ถูกต้องกรุณาติดต่อ HR</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isPrefillLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <ReadOnlyField label="ชื่อ-นามสกุล" value={profile?.fullName ?? "-"} />
              <ReadOnlyField label="เลขบัตรประชาชน" value={profile?.citizenId ?? "-"} />

              <div className="md:col-span-2 my-2 h-px bg-slate-100" />

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

      {/* 2. Signature Section */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-3">
          <PenTool className="h-5 w-5 text-primary" />
          <div>
             <CardTitle className="text-xl text-slate-800">ลายเซ็นดิจิทัล</CardTitle>
             <CardDescription>ใช้สำหรับลงนามในเอกสารคำขอเบิกเงิน</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
             <div className="bg-white rounded-xl p-6 border-2 border-slate-100 shadow-sm text-center flex flex-col justify-center items-center">
                <div className="mb-4 text-sm font-medium text-slate-500 uppercase tracking-wider">ลายเซ็นปัจจุบัน</div>
                {isSignatureLoading ? (
                  <Skeleton className="h-32 w-48 mx-auto rounded-lg" />
                ) : signature?.data_url ? (
                  <div className="relative group inline-block w-full max-w-md">
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
                        <Image
                        src={signature.data_url}
                        alt="signature"
                        width={300}
                        height={150}
                        className="max-h-24 w-auto object-contain mx-auto mix-blend-multiply"
                        />
                    </div>
                    <div className="flex justify-center gap-2">
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                         ใช้งานอยู่
                       </span>
                       <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                        onClick={async () => {
                            if (!signatureCheck?.has_signature) return;
                            await deleteSignature.mutateAsync();
                            toast.success("ลบลายเซ็นแล้ว");
                        }}
                        disabled={isBusy || !signatureCheck?.has_signature}
                       >
                        <Eraser className="h-3 w-3 mr-1" /> ลบ
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-slate-400 flex flex-col items-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <PenTool className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="text-sm">ยังไม่พบลายเซ็นในระบบ</p>
                    <p className="text-xs text-slate-400 mt-1">กรุณาติดต่อผู้ดูแลระบบหากต้องการเพิ่มลายเซ็นใหม่</p>
                  </div>
                )}
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
