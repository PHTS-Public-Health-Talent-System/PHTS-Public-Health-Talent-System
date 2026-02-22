/**
 * access-review module - API client
 *
 */
import api from "@/shared/api/axios";
import { ApiPayload, ApiParams, ApiResponse } from "@/shared/api/types";

export async function getAccessReviewCycles(params?: ApiParams) {
  const res = await api.get<ApiResponse<ApiPayload>>("/access-review/cycles", {
    params,
  });
  return res.data.data;
}

export async function createAccessReviewCycle(payload: ApiPayload) {
  const res = await api.post<ApiResponse<ApiPayload>>(
    "/access-review/cycles",
    payload,
  );
  return res.data.data;
}

export async function getAccessReviewCycle(id: number | string) {
  const res = await api.get<ApiResponse<ApiPayload>>(
    `/access-review/cycles/${id}`,
  );
  return res.data.data;
}

export async function getAccessReviewItems(
  id: number | string,
  params?: ApiParams,
) {
  const res = await api.get<ApiResponse<ApiPayload>>(
    `/access-review/cycles/${id}/items`,
    { params },
  );
  return res.data.data;
}

export async function completeAccessReviewCycle(
  id: number | string,
  payload?: ApiPayload,
) {
  const res = await api.post<ApiResponse<ApiPayload>>(
    `/access-review/cycles/${id}/complete`,
    payload ?? {},
  );
  return res.data.data;
}

export async function updateAccessReviewItem(
  id: number | string,
  payload: ApiPayload,
) {
  const res = await api.put<ApiResponse<ApiPayload>>(
    `/access-review/items/${id}`,
    payload,
  );
  return res.data.data;
}

export async function runAccessReviewAutoDisable() {
  const res = await api.post<ApiResponse<ApiPayload>>(
    "/access-review/auto-disable",
  );
  return res.data.data;
}

export async function sendAccessReviewReminders() {
  const res = await api.post<ApiResponse<ApiPayload>>(
    "/access-review/send-reminders",
  );
  return res.data.data;
}
