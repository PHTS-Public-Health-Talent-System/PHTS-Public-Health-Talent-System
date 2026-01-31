import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

type TyphoonOcrResult = {
  text: string;
  confidence?: number | null;
};

export class OcrNonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OcrNonRetryableError";
  }
}

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "";
const OCR_HTTP_TIMEOUT_MS = Number(process.env.OCR_HTTP_TIMEOUT_MS || "900000");

function ensureServiceUrl(): string {
  const trimmed = OCR_SERVICE_URL.replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("OCR_SERVICE_URL is missing");
  }
  return trimmed;
}

function buildMultipartBody(params: {
  fileBuffer: Buffer;
  filename: string;
  contentType: string;
}): { body: Buffer; boundary: string } {
  const boundary = `----phts-ocr-${Date.now()}`;
  const lineBreak = "\r\n";
  const parts: Buffer[] = [];

  parts.push(Buffer.from(`--${boundary}${lineBreak}`));
  parts.push(
    Buffer.from(
      `Content-Disposition: form-data; name="file"; filename="${params.filename}"${lineBreak}`,
    ),
  );
  parts.push(Buffer.from(`Content-Type: ${params.contentType}${lineBreak}${lineBreak}`));
  parts.push(params.fileBuffer);
  parts.push(Buffer.from(lineBreak));
  parts.push(Buffer.from(`--${boundary}--${lineBreak}`));

  return { body: Buffer.concat(parts), boundary };
}

export async function runTyphoonOcr(
  filePath: string,
  pageNum?: number,
): Promise<TyphoonOcrResult> {
  const baseUrl = ensureServiceUrl();
  const fileBuffer = await readFile(filePath);
  const fileType = await fileTypeFromBuffer(fileBuffer);
  const contentType = fileType?.mime ?? "application/octet-stream";
  const filename = path.basename(filePath);
  const { body, boundary } = buildMultipartBody({
    fileBuffer,
    filename,
    contentType,
  });

  const url = new URL(`${baseUrl}/ocr`);
  if (pageNum) {
    url.searchParams.set("page_num", String(pageNum));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OCR_HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message = `OCR HTTP error: ${response.status} ${response.statusText}${
        errorText ? ` | ${errorText}` : ""
      }`;
      if (response.status >= 400 && response.status < 500) {
        throw new OcrNonRetryableError(message);
      }
      throw new Error(message);
    }

    const payload = (await response.json()) as {
      text?: string;
      confidence?: number | null;
    };

    return {
      text: String(payload.text || ""),
      confidence: payload.confidence ?? null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OCR request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
