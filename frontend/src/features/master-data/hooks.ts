"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiParams, ApiPayload } from '@/shared/api/types';
import {
  addHoliday,
  deleteHoliday,
  getHolidays,
  getMasterRates,
  updateMasterRate,
  getClassificationHierarchy,
} from '@/features/master-data/api';

export function useHolidays(params?: ApiParams) {
  return useQuery({
    queryKey: ['holidays', params ?? {}],
    queryFn: () => getHolidays(params),
  });
}

export function useAddHoliday() {
  return useMutation({
    mutationFn: (payload: { date: string; name: string }) => addHoliday(payload),
  });
}

export function useDeleteHoliday() {
  return useMutation({
    mutationFn: (date: string) => deleteHoliday(date),
  });
}

export function useMasterRatesConfig() {
  return useQuery({
    queryKey: ['master-rates-config'],
    queryFn: getMasterRates,
  });
}

export function useUpdateMasterRate() {
  return useMutation({
    mutationFn: ({ rateId, payload }: { rateId: number | string; payload: ApiPayload }) =>
      updateMasterRate(rateId, payload),
  });
}

export function useClassificationHierarchy() {
  return useQuery({
    queryKey: ['classification-hierarchy'],
    queryFn: getClassificationHierarchy,
    staleTime: 1000 * 60 * 60, // 1 hour (static data)
  });
}
