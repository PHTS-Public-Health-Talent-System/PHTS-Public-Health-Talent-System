"use client";

import { useQuery } from '@tanstack/react-query';
import {
  checkSignature,
  getMySignature,
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
