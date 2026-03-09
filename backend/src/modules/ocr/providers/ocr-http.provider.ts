import type {
  OcrBatchResponse,
  OcrBatchResultItem,
} from '@/modules/ocr/entities/ocr-precheck.entity.js';
import { enrichOcrBatchResult } from '@/modules/ocr/services/ocr-gateway-analysis.service.js';
import * as localTesseractService from '@/modules/ocr/services/ocr-local-tesseract.service.js';

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_RETRY_COUNT = 2;
const LOCAL_TESSERACT_SERVICE_BASE = 'local-tesseract';

const toReadableOcrErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : 'Unknown OCR error';
  if (
    raw === 'OCR_MAIN_SERVICE_UNAVAILABLE' ||
    raw.includes('spawn tesseract ENOENT') ||
    raw.includes('spawn pdftoppm ENOENT')
  ) {
    return 'ยังไม่ได้เปิดบริการ OCR หลัก';
  }
  return raw;
};

const getOcrServiceBase = (): string => {
  const base = (process.env.OCR_SERVICE_URL || process.env.OCR_API_URL || '').trim();
  if (!base) {
    return LOCAL_TESSERACT_SERVICE_BASE;
  }
  let normalized = base;
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const getTyphoonServiceBase = (): string => {
  const base = (process.env.OCR_TYPHOON_SERVICE_URL || '').trim();
  let normalized = base;
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const getPerFileTimeoutMs = (): number => {
  const raw = Number(process.env.OCR_FILE_TIMEOUT_MS || process.env.OCR_HTTP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw < 1000) return DEFAULT_TIMEOUT_MS;
  return raw;
};

const getRetryCount = (): number => {
  const raw = Number(process.env.OCR_FILE_RETRY_COUNT || DEFAULT_RETRY_COUNT);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_RETRY_COUNT;
  return Math.floor(raw);
};

const parseOcrBatchResult = async (
  response: Response,
  fallbackName: string,
): Promise<OcrBatchResultItem> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `OCR service returned ${response.status}`);
  }
  const payload = (await response.json()) as OcrBatchResponse;
  const result = payload.results?.[0];
  if (!result) {
    throw new Error('OCR response missing result item');
  }
  if (!result.ok) {
    throw new Error(result.error || 'OCR file processing failed');
  }
  const normalized: OcrBatchResultItem = {
    name: result.name || fallbackName,
    ok: true,
    markdown: result.markdown || '',
    engine_used: result.engine_used,
    fallback_used: result.fallback_used,
    document_kind: result.document_kind,
    fields: result.fields,
    missing_fields: result.missing_fields,
    quality: result.quality,
  };
  return enrichOcrBatchResult(normalized);
};

const callOcrOnce = async (
  fileName: string,
  fileBuffer: Buffer,
  ocrBase: string,
  timeoutMs: number,
): Promise<OcrBatchResultItem> => {
  if (ocrBase === LOCAL_TESSERACT_SERVICE_BASE) {
    return localTesseractService.runLocalTesseract(fileName, fileBuffer);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new FormData();
    form.append('files', new Blob([fileBuffer]), fileName);
    const response = await fetch(`${ocrBase}/ocr-batch`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    return await parseOcrBatchResult(response, fileName);
  } finally {
    clearTimeout(timeout);
  }
};

const shouldFallbackToTyphoon = (result: OcrBatchResultItem): boolean =>
  result.ok === true &&
  result.engine_used !== 'typhoon' &&
  result.quality?.passed === false;

export class OcrHttpProvider {
  static getServiceBase(): string {
    return getOcrServiceBase();
  }

  static async processSingleFile(
    fileName: string,
    fileBuffer: Buffer,
    ocrBase: string,
  ): Promise<OcrBatchResultItem> {
    const effectiveOcrBase = ocrBase?.trim() ? ocrBase.trim() : getOcrServiceBase();
    const timeoutMs = getPerFileTimeoutMs();
    const retryCount = getRetryCount();

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        const primaryResult = await callOcrOnce(fileName, fileBuffer, effectiveOcrBase, timeoutMs);
        const typhoonBase = getTyphoonServiceBase();
        if (!shouldFallbackToTyphoon(primaryResult) || !typhoonBase) {
          return primaryResult;
        }

        try {
          const typhoonResult = await callOcrOnce(fileName, fileBuffer, typhoonBase, timeoutMs);
          return {
            ...typhoonResult,
            fallback_used: true,
          };
        } catch {
          // Typhoon is an optional fallback layer. If it is unavailable, keep the
          // primary Tesseract result instead of failing the whole OCR run.
          return {
            ...primaryResult,
            fallback_used: false,
          };
        }
      } catch (error) {
        if (attempt === retryCount) {
          return {
            name: fileName,
            ok: false,
            error: toReadableOcrErrorMessage(error),
          };
        }
      }
    }

    return {
      name: fileName,
      ok: false,
      error: 'Unexpected OCR retry flow',
    };
  }
}
