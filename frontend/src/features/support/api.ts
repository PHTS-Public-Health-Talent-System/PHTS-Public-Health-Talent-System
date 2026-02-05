import api from "@/shared/api/axios";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type CreateSupportTicketPayload = {
  subject: string;
  description: string;
  page_url?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  const res = await api.post<{ success: boolean; data: { id: number } }>(
    "/support/tickets",
    payload,
  );
  return res.data;
}
