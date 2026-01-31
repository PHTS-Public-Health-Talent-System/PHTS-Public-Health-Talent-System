"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiParams, ApiPayload } from '@/shared/api/types';
import {
  autoResolveDataQuality,
  createDataQualityIssue,
  getDataQualityDashboard,
  getDataQualityIssues,
  getDataQualitySummary,
  getDataQualityTypes,
  runDataQualityChecks,
  updateDataQualityIssue,
} from '@/features/data-quality/api';

export function useDataQualityDashboard() {
  return useQuery({
    queryKey: ['data-quality-dashboard'],
    queryFn: getDataQualityDashboard,
  });
}

export function useDataQualitySummary() {
  return useQuery({
    queryKey: ['data-quality-summary'],
    queryFn: getDataQualitySummary,
  });
}

export function useDataQualityTypes() {
  return useQuery({
    queryKey: ['data-quality-types'],
    queryFn: getDataQualityTypes,
  });
}

export function useDataQualityIssues(params?: ApiParams) {
  return useQuery({
    queryKey: ['data-quality-issues', params ?? {}],
    queryFn: () => getDataQualityIssues(params),
  });
}

export function useCreateDataQualityIssue() {
  return useMutation({
    mutationFn: (payload: ApiPayload) => createDataQualityIssue(payload),
  });
}

export function useUpdateDataQualityIssue() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ApiPayload }) =>
      updateDataQualityIssue(id, payload),
  });
}

export function useRunDataQualityChecks() {
  return useMutation({
    mutationFn: runDataQualityChecks,
  });
}

export function useAutoResolveDataQuality() {
  return useMutation({
    mutationFn: autoResolveDataQuality,
  });
}
