"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markNotificationRead, getNotificationSettings, updateNotificationSettings } from '@/features/notification/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  });
}
