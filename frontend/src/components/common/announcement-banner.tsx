"use client";

import { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useActiveAnnouncements } from "@/features/announcement/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityStyles = {
  LOW: "border-sky-200 bg-sky-50 text-sky-900",
  NORMAL: "border-amber-200 bg-amber-50 text-amber-900",
  HIGH: "border-rose-200 bg-rose-50 text-rose-900",
} as const;

export function AnnouncementBanner() {
  const { data, isLoading } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});

  const items = useMemo(() => data ?? [], [data]);
  const visibleItems = items.filter((item) => !dismissed[item.id]);

  if (isLoading || visibleItems.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleItems.map((announcement) => (
        <div
          key={announcement.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm",
            priorityStyles[announcement.priority] ?? priorityStyles.NORMAL,
          )}
        >
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/60">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{announcement.title}</p>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
                {announcement.priority}
              </span>
            </div>
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
              {announcement.body}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() =>
              setDismissed((prev) => ({ ...prev, [announcement.id]: true }))
            }
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
