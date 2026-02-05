"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveAnnouncements, type Announcement } from "./api";

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ["announcements-active"],
    queryFn: getActiveAnnouncements,
    select: (data) => data as Announcement[],
  });
}
