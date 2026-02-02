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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">
          แก้ไขคำขอ — {request.request_no ?? `#${request.request_id}`}
        </h2>
      </div>

      {/* Return warning */}
      {request.status === "RETURNED" && returnComment && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>คำขอถูกส่งกลับแก้ไข</AlertTitle>
          <AlertDescription>{returnComment}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-6xl mx-auto">
        <RequestWizard initialRequest={request} />
      </div>
    </div>
  );
}
