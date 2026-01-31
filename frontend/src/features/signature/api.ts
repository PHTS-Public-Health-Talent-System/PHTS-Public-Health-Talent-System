import api from '@/shared/api/axios';
import { ApiPayload, ApiResponse } from '@/shared/api/types';

export async function getMySignature() {
  const res = await api.get<ApiResponse<{ image_base64: string; data_url: string; mime_type: string }>>(
    '/signatures/my-signature',
  );
  return res.data.data;
}

export async function checkSignature() {
  const res = await api.get<ApiResponse<{ has_signature: boolean }>>('/signatures/check');
  return res.data.data;
}

export async function uploadSignatureBase64(image_base64: string) {
  const res = await api.post<ApiResponse<ApiPayload>>('/signatures/upload', { image_base64 });
  return res.data.data;
}

export async function uploadSignatureFile(file: File) {
  const formData = new FormData();
  formData.append('signature', file);
  const res = await api.post<ApiResponse<ApiPayload>>('/signatures/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function deleteSignature() {
  const res = await api.delete<ApiResponse<ApiPayload>>('/signatures');
  return res.data.data;
}
