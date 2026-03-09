import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { OcrBatchResultItem } from '@/modules/ocr/entities/ocr-precheck.entity.js';
import { enrichOcrBatchResult } from '@/modules/ocr/services/ocr-gateway-analysis.service.js';

const execFile = promisify(execFileCallback);
const TESSERACT_LANG = 'tha+eng';
const TESSERACT_OEM = '1';
const TESSERACT_PSM = '4';
const PDF_RENDER_DPI = '200';
const TESSERACT_THREAD_LIMIT = '1';
const LOCAL_ENGINE_NAME = 'tesseract';

const isPdf = (fileName: string): boolean => fileName.toLowerCase().endsWith('.pdf');

const runTesseractOnImage = async (imagePath: string): Promise<string> => {
  const { stdout } = await execFile('tesseract', [
    imagePath,
    'stdout',
    '-l',
    TESSERACT_LANG,
    '--oem',
    TESSERACT_OEM,
    '--psm',
    TESSERACT_PSM,
    '-c',
    'preserve_interword_spaces=1',
  ], {
    env: {
      ...process.env,
      OMP_THREAD_LIMIT: TESSERACT_THREAD_LIMIT,
    },
  });
  return stdout.trim();
};

const renderPdfPages = async (pdfPath: string, outputPrefix: string): Promise<string[]> => {
  await execFile('pdftoppm', ['-r', PDF_RENDER_DPI, '-png', pdfPath, outputPrefix]);
  const dir = path.dirname(outputPrefix);
  const base = path.basename(outputPrefix);
  const files = await readdir(dir);
  return files
    .filter((file) => file.startsWith(`${base}-`) && file.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => path.join(dir, file));
};

export const runLocalTesseract = async (
  fileName: string,
  fileBuffer: Buffer,
): Promise<OcrBatchResultItem> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'phts-ocr-local-'));
  try {
    const tempInputPath = path.join(tempDir, fileName);
    await writeFile(tempInputPath, fileBuffer);

    let markdown = '';
    if (isPdf(fileName)) {
      const pages = await renderPdfPages(tempInputPath, path.join(tempDir, 'page'));
      const pageTexts: string[] = [];
      for (const page of pages) {
        pageTexts.push(await runTesseractOnImage(page));
      }
      markdown = pageTexts.filter(Boolean).join('\n\n');
    } else {
      markdown = await runTesseractOnImage(tempInputPath);
    }

    return enrichOcrBatchResult({
      name: fileName,
      ok: true,
      markdown,
      engine_used: LOCAL_ENGINE_NAME,
      fallback_used: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OCR error';
    if (
      message.includes('spawn tesseract ENOENT') ||
      message.includes('spawn pdftoppm ENOENT')
    ) {
      throw new Error('OCR_MAIN_SERVICE_UNAVAILABLE');
    }
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
