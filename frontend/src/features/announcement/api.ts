import api from "@/shared/api/axios";

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const res = await api.get<{ success: boolean; data: Announcement[] }>(
    "/announcements/active",
  );
  return res.data.data ?? [];
}
