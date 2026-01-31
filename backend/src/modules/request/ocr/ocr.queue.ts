import redis from "../../../config/redis.js";

const OCR_QUEUE_KEY = process.env.OCR_QUEUE_KEY || "ocr:queue";
const OCR_QUEUE_BLOCK_SECONDS = Number(
  process.env.OCR_QUEUE_BLOCK_SECONDS || "5",
);

export type OcrQueueJob = {
  attachmentId: number;
  attempts?: number;
};

export async function enqueueOcrJob(job: OcrQueueJob): Promise<void> {
  await redis.lpush(OCR_QUEUE_KEY, JSON.stringify(job));
}

export async function dequeueOcrJob(): Promise<OcrQueueJob | null> {
  const result = await redis.brpop(OCR_QUEUE_KEY, OCR_QUEUE_BLOCK_SECONDS);
  if (!result) return null;
  const [, payload] = result;
  try {
    return JSON.parse(payload) as OcrQueueJob;
  } catch {
    return null;
  }
}
