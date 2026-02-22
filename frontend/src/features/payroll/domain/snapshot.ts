export type SnapshotStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED" | "UNKNOWN";

export function normalizeSnapshotStatus(value: unknown): SnapshotStatus {
  const status = String(value ?? "").trim().toUpperCase();
  if (status === "PENDING") return "PENDING";
  if (status === "PROCESSING") return "PROCESSING";
  if (status === "READY") return "READY";
  if (status === "FAILED") return "FAILED";
  return "UNKNOWN";
}

export function getSnapshotStatusUi(status: SnapshotStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "READY":
      return {
        label: "Snapshot พร้อมใช้งาน",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "PROCESSING":
      return {
        label: "Snapshot กำลังประมวลผล",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "FAILED":
      return {
        label: "Snapshot ล้มเหลว",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "PENDING":
      return {
        label: "Snapshot รอประมวลผล",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Snapshot ไม่ทราบสถานะ",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}
