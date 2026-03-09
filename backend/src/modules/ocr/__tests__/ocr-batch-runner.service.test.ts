jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('@/modules/ocr/providers/ocr-http.provider.js', () => ({
  OcrHttpProvider: {
    getServiceBase: jest.fn(),
    processSingleFile: jest.fn(),
  },
}));

import { readFile } from 'node:fs/promises';
import { OcrHttpProvider } from '@/modules/ocr/providers/ocr-http.provider.js';

describe('ocr batch runner service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs OCR for stored files and returns summarized counts', async () => {
    (readFile as jest.Mock).mockResolvedValue(Buffer.from('file'));
    (OcrHttpProvider.getServiceBase as jest.Mock).mockReturnValue('local-tesseract');
    (OcrHttpProvider.processSingleFile as jest.Mock)
      .mockResolvedValueOnce({ name: 'a.pdf', ok: true, markdown: 'a' })
      .mockResolvedValueOnce({ name: 'b.pdf', ok: false, error: 'bad' });

    const { runStoredFileOcrBatch } = await import(
      '@/modules/ocr/services/ocr-batch-runner.service.js'
    );

    const result = await runStoredFileOcrBatch([
      { file_name: 'a.pdf', file_path: 'uploads/a.pdf' },
      { file_name: 'b.pdf', file_path: 'uploads/b.pdf' },
    ]);

    expect(result).toEqual({
      service_url: 'local-tesseract',
      count: 2,
      success_count: 1,
      failed_count: 1,
      results: [
        { name: 'a.pdf', ok: true, markdown: 'a' },
        { name: 'b.pdf', ok: false, error: 'bad' },
      ],
    });
  });

  it('merges OCR results by normalized file name and prefers incoming results', async () => {
    const { mergeOcrResultsByFileName } = await import(
      '@/modules/ocr/services/ocr-batch-runner.service.js'
    );

    const result = mergeOcrResultsByFileName(
      [
        { name: ' Memo.PDF ', ok: true, markdown: 'old' },
        { name: 'order.pdf', ok: true, markdown: 'stay' },
      ],
      [
        { name: 'memo.pdf', ok: true, markdown: 'new' },
        { name: 'fresh.pdf', ok: true, markdown: 'fresh' },
      ],
    );

    expect(result).toEqual([
      { name: 'memo.pdf', ok: true, markdown: 'new' },
      { name: 'order.pdf', ok: true, markdown: 'stay' },
      { name: 'fresh.pdf', ok: true, markdown: 'fresh' },
    ]);
  });
});
