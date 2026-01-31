"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkSignature,
  deleteSignature,
  getMySignature,
  uploadSignatureBase64,
  uploadSignatureFile,
} from '@/features/signature/api';

export function useMySignature() {
  return useQuery({
    queryKey: ['signature'],
    queryFn: getMySignature,
  });
}

export function useCheckSignature() {
  return useQuery({
    queryKey: ['signature-check'],
    queryFn: checkSignature,
  });
}

export function useUploadSignatureBase64() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image_base64: string) => uploadSignatureBase64(image_base64),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signature'] });
      qc.invalidateQueries({ queryKey: ['signature-check'] });
    },
  });
}

export function useUploadSignatureFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadSignatureFile(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signature'] });
      qc.invalidateQueries({ queryKey: ['signature-check'] });
    },
  });
}

export function useDeleteSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSignature,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signature'] });
      qc.invalidateQueries({ queryKey: ['signature-check'] });
    },
  });
}
