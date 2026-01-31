"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import SignaturePad from "@/components/common/signature-pad";
import { usePrefill } from "@/features/request/hooks";
import {
  useCheckSignature,
  useDeleteSignature,
  useMySignature,
  useUploadSignatureBase64,
  useUploadSignatureFile,
} from "@/features/signature/hooks";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import Image from "next/image";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/features/notification/hooks";

type NotificationSettings = {
  inApp: boolean;
  sms: boolean;
  email: boolean;
};

export default function UserProfilePage() {
  const { data: prefill, isLoading: isPrefillLoading } = usePrefill();
  const { user } = useAuth();
  const { data: signature, isLoading: isSignatureLoading } = useMySignature();
  const { data: signatureCheck } = useCheckSignature();
  const uploadBase64 = useUploadSignatureBase64();
  const uploadFile = useUploadSignatureFile();
  const deleteSignature = useDeleteSignature();
  const { data: notifSettings, isLoading: isNotifLoading } = useNotificationSettings();
  const updateNotifSettings = useUpdateNotificationSettings();
  const [localNotif, setLocalNotif] = useState<NotificationSettings>({
    inApp: true,
    sms: false,
    email: false,
  });

  const [localSignature, setLocalSignature] = useState<string>("");
  const notificationSettings: NotificationSettings = notifSettings
    ? {
        inApp: !!notifSettings.in_app,
        sms: !!notifSettings.sms,
        email: !!notifSettings.email,
      }
    : localNotif;

  const isBusy = uploadBase64.isPending || uploadFile.isPending || deleteSignature.isPending;


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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">โปรไฟล์ผู้ใช้งาน</h2>
        <p className="text-muted-foreground">ข้อมูลส่วนตัวและการตั้งค่าทั่วไป</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent>
          {isPrefillLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล</Label>
                <Input value={profile?.fullName ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>ตำแหน่ง</Label>
                <Input value={profile?.position ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>เลขที่ตำแหน่ง</Label>
                <Input value={profile?.positionNumber ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>เลขบัตรประชาชน</Label>
                <Input value={profile?.citizenId ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>กลุ่มงาน</Label>
                <Input value={profile?.department ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>หน่วยงาน (Sub-Department)</Label>
                <Input value={profile?.subDepartment ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>ประเภทบุคลากร</Label>
                <Input value={profile?.employeeType ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Mission Group</Label>
                <Input value={profile?.missionGroup ?? "-"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>สิทธิ์การใช้งาน</Label>
                <Input value={user?.role ?? "-"} readOnly className="bg-muted/50" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ลายเซ็นดิจิทัล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              สถานะ: {signatureCheck?.has_signature ? "มีลายเซ็น" : "ยังไม่มีลายเซ็น"}
            </div>
          </div>

          {isSignatureLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : signature?.data_url ? (
            <div className="border rounded-lg p-4 bg-white">
              <Image
                src={signature.data_url}
                alt="signature"
                width={320}
                height={120}
                className="max-h-40 w-auto"
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ยังไม่มีลายเซ็นที่บันทึกไว้</div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label>วาดลายเซ็นใหม่</Label>
            <SignaturePad
              onSave={(value) => setLocalSignature(value)}
              placeholder="เซ็นชื่อที่นี่"
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!localSignature) {
                    toast.error("กรุณาวาดลายเซ็นก่อนบันทึก");
                    return;
                  }
                  await uploadBase64.mutateAsync(localSignature);
                  toast.success("บันทึกลายเซ็นแล้ว");
                }}
                disabled={isBusy}
              >
                บันทึกลายเซ็น
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!signatureCheck?.has_signature) return;
                  await deleteSignature.mutateAsync();
                  toast.success("ลบลายเซ็นแล้ว");
                }}
                disabled={isBusy || !signatureCheck?.has_signature}
              >
                ลบลายเซ็น
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>อัปโหลดไฟล์ลายเซ็น</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await uploadFile.mutateAsync(file);
                toast.success("อัปโหลดลายเซ็นแล้ว");
              }}
              disabled={isBusy}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การแจ้งเตือน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isNotifLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif-inapp"
                  checked={notificationSettings.inApp}
                  onCheckedChange={(val) => {
                    const next = { ...notificationSettings, inApp: !!val };
                    setLocalNotif(next);
                    updateNotifSettings.mutate({
                      in_app: next.inApp,
                      sms: next.sms,
                      email: next.email,
                    });
                  }}
                />
                <Label htmlFor="notif-inapp">แจ้งเตือนในระบบ</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif-sms"
                  checked={notificationSettings.sms}
                  onCheckedChange={(val) => {
                    const next = { ...notificationSettings, sms: !!val };
                    setLocalNotif(next);
                    updateNotifSettings.mutate({
                      in_app: next.inApp,
                      sms: next.sms,
                      email: next.email,
                    });
                  }}
                />
                <Label htmlFor="notif-sms">แจ้งเตือนทาง SMS (ยังไม่เปิดใช้)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif-email"
                  checked={notificationSettings.email}
                  onCheckedChange={(val) => {
                    const next = { ...notificationSettings, email: !!val };
                    setLocalNotif(next);
                    updateNotifSettings.mutate({
                      in_app: next.inApp,
                      sms: next.sms,
                      email: next.email,
                    });
                  }}
                />
                <Label htmlFor="notif-email">แจ้งเตือนทางอีเมล (ยังไม่เปิดใช้)</Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
