"use client";

import { Badge } from "@/components/ui/badge";
import { RequestStatus, STATUS_LABELS } from "@/types/request.types";

const STATUS_STYLES: Record<RequestStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  PENDING: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  PENDING_HEAD_WARD: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  PENDING_HEAD_DEPT: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  PENDING_PTS_OFFICER: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  PENDING_HR: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  PENDING_FINANCE: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  APPROVED: "bg-green-100 text-green-700 hover:bg-green-200",
  REJECTED: "bg-red-100 text-red-700 hover:bg-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 hover:bg-gray-200",
  RETURNED: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
