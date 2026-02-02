"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName?: string;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, iconClassName, description }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg p-3 ${iconClassName ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
