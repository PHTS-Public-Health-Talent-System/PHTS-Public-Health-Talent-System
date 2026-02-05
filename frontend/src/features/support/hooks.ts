import { useMutation } from "@tanstack/react-query";
import { createSupportTicket, type CreateSupportTicketPayload } from "./api";

export const useCreateSupportTicket = () =>
  useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) =>
      createSupportTicket(payload),
  });
