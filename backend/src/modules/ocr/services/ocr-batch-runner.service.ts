import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { OcrHttpProvider } from '@/modules/ocr/providers/ocr-http.provider.js';
import type { OcrBatchResultItem } from '@/modules/ocr/entities/ocr-precheck.entity.js';

export type StoredOcrFileInput = {
  file_name: string;
  file_path: string;
};

export type OcrBatchRunSummary = {
  service_url: string;
  count: number;
  success_count: number;
  failed_count: number;
  results: OcrBatchResultItem[];
};

export const resolveStoredOcrFilePath = (filePath: string): string => {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(process.cwd(), filePath);
};

export const mergeOcrResultsByFileName = (
  existing: OcrBatchResultItem[],
  incoming: OcrBatchResultItem[],
): OcrBatchResultItem[] => {
  const merged = new Map<string, OcrBatchResultItem>();
  for (const item of existing) {
    const key = String(item.name ?? '').trim().toLowerCase();
    if (!key) continue;
    merged.set(key, item);
  }
  for (const item of incoming) {
    const key = String(item.name ?? '').trim().toLowerCase();
    if (!key) continue;
    merged.set(key, item);
  }
  return Array.from(merged.values());
};

export const runStoredFileOcrBatch = async (
  files: StoredOcrFileInput[],
  ocrBase = OcrHttpProvider.getServiceBase(),
): Promise<OcrBatchRunSummary> => {
  const results: OcrBatchResultItem[] = [];
  for (const file of files) {
    const bytes = await readFile(resolveStoredOcrFilePath(file.file_path));
    const result = await OcrHttpProvider.processSingleFile(file.file_name, bytes, ocrBase);
    results.push(result);
  }

  const success_count = results.filter((item) => item.ok).length;
  const failed_count = results.length - success_count;

  return {
    service_url: ocrBase,
    count: results.length,
    success_count,
    failed_count,
    results,
  };
};
