"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRequestDetail } from "@/features/request/hooks";
import { RequestWizard } from "@/components/features/request/wizard/request-wizard";

export default function RequestEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: request, isLoading } = useRequestDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20 text-muted-foreground">ไม่พบคำขอ</div>
    );
  }

  if (request.status !== "DRAFT" && request.status !== "RETURNED") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        ไม่สามารถแก้ไขคำขอที่มีสถานะ {request.status} ได้
      </div>
    );
  }

  // Find any RETURN action comment
  const returnComment = request.actions
    .filter((a) => a.action === "RETURN")
    .at(-1)?.comment;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-lg shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">
          แก้ไขคำขอ — {request.request_no ?? `#${request.request_id}`}
        </h2>
      </div>

      {/* Return warning */}
      {request.status === "RETURNED" && returnComment && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">คำขอถูกส่งกลับแก้ไข</AlertTitle>
          <AlertDescription className="text-sm mt-1">{returnComment}</AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        <RequestWizard initialRequest={request} />
      </div>
    </div>
  );
}
