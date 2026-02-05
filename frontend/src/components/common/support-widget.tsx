"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSupportTicket } from "@/features/support/hooks";
import { AlertTriangle, HelpCircle } from "lucide-react";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending, isSuccess } = useCreateSupportTicket();

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.location.href;
  }, []);

  const userAgent = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.navigator.userAgent;
  }, []);

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!subject.trim() || !description.trim()) {
      setError("กรุณากรอกหัวข้อและรายละเอียดให้ครบ");
      return;
    }
    try {
      await mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        page_url: pageUrl,
        user_agent: userAgent,
      });
      resetForm();
    } catch {
      setError("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:shadow-xl"
      >
        <HelpCircle className="h-4 w-4" />
        แจ้งปัญหา
      </button>

      <Dialog open={open} onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>แจ้งปัญหาการใช้งาน</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                หัวข้อ
              </label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="เช่น หน้าอนุมัติโหลดไม่ขึ้น"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                รายละเอียด
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="อธิบายสิ่งที่พบ พร้อมขั้นตอนที่ทำก่อนเกิดปัญหา"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {isSuccess && !error && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะตรวจสอบและตอบกลับ
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              ปิด
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "กำลังส่ง..." : "ส่งปัญหา"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
