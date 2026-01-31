import api from '@/shared/api/axios';
import { ApiPayload, ApiParams, ApiResponse } from '@/shared/api/types';

export async function getMyDelegations(params?: ApiParams) {
  const res = await api.get<ApiResponse<ApiPayload>>('/delegations/my', { params });
  return res.data.data;
}

export async function getActingRoles() {
  const res = await api.get<ApiResponse<ApiPayload>>('/delegations/acting');
  return res.data.data;
}

export async function checkCanAct(role: string, params?: ApiParams) {
  const res = await api.get<ApiResponse<ApiPayload>>(`/delegations/check/${role}`, { params });
  return res.data.data;
}

export async function searchDelegationCandidates(params?: ApiParams) {
  const res = await api.get<ApiResponse<ApiPayload>>('/delegations/candidates', { params });
  return res.data.data;
}

export async function createDelegation(payload: ApiPayload) {
  const res = await api.post<ApiResponse<ApiPayload>>('/delegations', payload);
  return res.data.data;
}

export async function cancelDelegation(id: number | string) {
  const res = await api.delete<ApiResponse<ApiPayload>>(`/delegations/${id}`);
  return res.data.data;
}

export async function getAllDelegations() {
  const res = await api.get<ApiResponse<ApiPayload>>('/delegations/all');
  return res.data.data;
}

export async function expireDelegations() {
  const res = await api.post<ApiResponse<ApiPayload>>('/delegations/expire');
  return res.data.data;
}
