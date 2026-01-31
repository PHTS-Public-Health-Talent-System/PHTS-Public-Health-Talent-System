import api from '@/shared/api/axios';
import { ApiPayload, ApiParams, ApiResponse } from '@/shared/api/types';

export async function getDataQualityDashboard() {
  const res = await api.get<ApiResponse<ApiPayload>>('/data-quality/dashboard');
  return res.data.data;
}

export async function getDataQualitySummary() {
  const res = await api.get<ApiResponse<ApiPayload>>('/data-quality/summary');
  return res.data.data;
}

export async function getDataQualityTypes() {
  const res = await api.get<ApiResponse<ApiPayload>>('/data-quality/types');
  return res.data.data;
}

export async function getDataQualityIssues(params?: ApiParams) {
  const res = await api.get<ApiResponse<ApiPayload>>('/data-quality/issues', { params });
  return res.data.data;
}

export async function createDataQualityIssue(payload: ApiPayload) {
  const res = await api.post<ApiResponse<ApiPayload>>('/data-quality/issues', payload);
  return res.data.data;
}

export async function updateDataQualityIssue(id: number | string, payload: ApiPayload) {
  const res = await api.put<ApiResponse<ApiPayload>>(`/data-quality/issues/${id}`, payload);
  return res.data.data;
}

export async function runDataQualityChecks() {
  const res = await api.post<ApiResponse<ApiPayload>>('/data-quality/run-checks');
  return res.data.data;
}

export async function autoResolveDataQuality() {
  const res = await api.post<ApiResponse<ApiPayload>>('/data-quality/auto-resolve');
  return res.data.data;
}
