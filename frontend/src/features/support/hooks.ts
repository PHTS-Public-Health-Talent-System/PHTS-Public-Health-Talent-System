"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMySupportTickets,
  getSupportTicket,
  createSupportTicketWithAttachments,
  listSupportTicketMessages,
  createSupportTicketMessage,
  reopenSupportTicket,
  closeSupportTicket,
  deleteSupportTicket,
} from './api';

export function useMySupportTickets() {
  return useQuery({
    queryKey: ['support-tickets', 'my'],
    queryFn: listMySupportTickets,
  });
}

export function useSupportTicket(ticketId: string | number | undefined) {
  return useQuery({
    queryKey: ['support-tickets', ticketId],
    queryFn: () => getSupportTicket(ticketId!),
    enabled: !!ticketId,
  });
}

export function useSupportTicketMessages(ticketId: string | number | undefined) {
  return useQuery({
    queryKey: ['support-tickets', ticketId, 'messages'],
    queryFn: () => listSupportTicketMessages(ticketId!),
    enabled: !!ticketId,
    refetchOnWindowFocus: true,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => createSupportTicketWithAttachments(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', 'my'] });
    },
  });
}

export function useCreateSupportTicketMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string | number; payload: FormData }) =>
      createSupportTicketMessage(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', ticketId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useReopenSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string | number) => reopenSupportTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', 'my'] });
    },
  });
}

export function useCloseSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string | number) => closeSupportTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', 'my'] });
    },
  });
}

export function useDeleteSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string | number) => deleteSupportTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', 'my'] });
    },
  });
}
