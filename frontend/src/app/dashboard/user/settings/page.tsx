"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/features/notification/hooks";
import { Bell, Settings } from "lucide-react";

type NotificationSettings = {
  inApp: boolean;
  sms: boolean;
  email: boolean;
};

export default function UserSettingsPage() {
  const { data: notifSettings, isLoading: isNotifLoading } = useNotificationSettings();
  const updateNotifSettings = useUpdateNotificationSettings();
  const [localNotif, setLocalNotif] = useState<NotificationSettings>({
    inApp: true,
    sms: false,
    email: false,
  });

  const notificationSettings: NotificationSettings = notifSettings
    ? {
        inApp: !!notifSettings.in_app,
        sms: !!notifSettings.sms,
        email: !!notifSettings.email,
      }
    : localNotif;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
           <Settings className="h-7 w-7" />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
           <p className="text-slate-500 text-lg">จัดการการตั้งค่าการใช้งานและการแจ้งเตือน</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center gap-3 bg-slate-50 border-b border-slate-100">
           <Bell className="h-5 w-5 text-primary" />
           <CardTitle className="text-xl text-slate-800">ตั้งค่าการแจ้งเตือน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 p-6">
          {isNotifLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="divide-y divide-slate-100">
               {[
                 { id: "in-app", label: "แจ้งเตือนในระบบ (In-App)", key: "inApp", desc: "แสดงรายการแจ้งเตือนที่มุมขวาบนของหน้าจอ" },
                 { id: "sms", label: "แจ้งเตือนทาง SMS", key: "sms", desc: "ส่งข้อความเมื่อมีความเคลื่อนไหวสำคัญ (อาจมีค่าบริการ)", disabled: true },
                 { id: "email", label: "แจ้งเตือนทางอีเมล", key: "email", desc: "ส่งรายละเอียดไปยังอีเมลที่ลงทะเบียนไว้", disabled: true }
               ].map((item) => (
                 <div key={item.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                    <Checkbox
                      id={item.id}
                      checked={notificationSettings[item.key as keyof NotificationSettings]}
                      disabled={item.disabled}
                      className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      onCheckedChange={(val) => {
                        const next = { ...notificationSettings, [item.key]: !!val };
                        setLocalNotif(next);
                        updateNotifSettings.mutate({
                          in_app: next.inApp,
                          sms: next.sms,
                          email: next.email,
                        });
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={item.id}
                        className={`text-base font-medium ${item.disabled ? 'text-slate-400' : 'text-slate-900 cursor-pointer'}`}
                      >
                        {item.label}
                      </Label>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
