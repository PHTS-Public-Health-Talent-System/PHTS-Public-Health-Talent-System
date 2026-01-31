import { dequeueOcrJob, enqueueOcrJob } from "../modules/request/ocr/ocr.queue.js";
import { processAttachmentOcr } from "../modules/request/ocr/ocr.service.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = Number(process.env.OCR_MAX_RETRIES || "3");
const RETRY_DELAY_MS = Number(process.env.OCR_RETRY_DELAY_MS || "1500");

async function run(): Promise<void> {
  console.log("[OCR Worker] Started");

  for (;;) {
    let job = null;
    try {
      job = await dequeueOcrJob();
      if (!job) {
        await sleep(250);
        continue;
      }
      await processAttachmentOcr(job.attachmentId);
    } catch (error) {
      console.error("[OCR Worker] Job failed:", error);
      const attempts = job?.attempts ?? 0;
      if (job?.attachmentId && attempts < MAX_RETRIES) {
        await enqueueOcrJob({ attachmentId: job.attachmentId, attempts: attempts + 1 });
        await sleep(RETRY_DELAY_MS * (attempts + 1));
      } else {
        await sleep(1000);
      }
    }
  }
}

void run();
