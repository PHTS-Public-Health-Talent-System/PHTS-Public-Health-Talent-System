"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiParams, ApiPayload } from '@/shared/api/types';
import {
  cancelDelegation,
  checkCanAct,
  createDelegation,
  expireDelegations,
  getActingRoles,
  getAllDelegations,
  getMyDelegations,
  searchDelegationCandidates,
} from '@/features/delegation/api';

export function useMyDelegations(params?: ApiParams) {
  return useQuery({
    queryKey: ['delegations-my', params ?? {}],
    queryFn: () => getMyDelegations(params),
  });
}

export function useActingRoles() {
  return useQuery({
    queryKey: ['delegations-acting'],
    queryFn: getActingRoles,
  });
}

export function useCheckCanAct(role: string, params?: ApiParams) {
  return useQuery({
    queryKey: ['delegations-check', role, params ?? {}],
    queryFn: () => checkCanAct(role, params),
  });
}

export function useSearchDelegationCandidates(params?: ApiParams) {
  return useQuery({
    queryKey: ['delegations-candidates', params ?? {}],
    queryFn: () => searchDelegationCandidates(params),
  });
}

export function useCreateDelegation() {
  return useMutation({
    mutationFn: (payload: ApiPayload) => createDelegation(payload),
  });
}

export function useCancelDelegation() {
  return useMutation({
    mutationFn: (id: number | string) => cancelDelegation(id),
  });
}

export function useAllDelegations() {
  return useQuery({
    queryKey: ['delegations-all'],
    queryFn: getAllDelegations,
  });
}

export function useExpireDelegations() {
  return useMutation({
    mutationFn: expireDelegations,
  });
}
