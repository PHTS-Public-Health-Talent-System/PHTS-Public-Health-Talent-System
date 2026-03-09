import { describe, expect, it, vi } from "vitest";

import {
  runAllowanceAttachmentOcr,
  runAllowanceSingleAttachmentOcr,
} from "./ocr";

describe("runAllowanceAttachmentOcr", () => {
  it("sends only newly selected files to OCR batch endpoint", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        count: 2,
        results: [{ ok: true }, { ok: false }],
      }),
    })) as unknown as typeof fetch;

    const firstFile = new File(["a"], "new-1.pdf", { type: "application/pdf" });
    const secondFile = new File(["b"], "new-2.pdf", { type: "application/pdf" });

    const result = await runAllowanceAttachmentOcr(
      [firstFile, secondFile],
      "http://ocr.test",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ocr.test/ocr-batch",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(result).toEqual({
      total: 2,
      successCount: 1,
      failedCount: 1,
      results: [{ ok: true }, { ok: false }],
    });
  });
});

describe("runAllowanceSingleAttachmentOcr", () => {
  it("downloads one protected attachment and sends only that file to OCR", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => blob,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          results: [{ ok: true, name: "doc.pdf", markdown: "ocr text" }],
        }),
      }) as unknown as typeof fetch;

    const result = await runAllowanceSingleAttachmentOcr(
      {
        fileUrl: "http://app.test/files/doc.pdf",
        fileName: "doc.pdf",
        serviceBase: "http://ocr.test",
        token: "token-123",
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://app.test/files/doc.pdf",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-123" },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://ocr.test/ocr-batch",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(result).toEqual({
      total: 1,
      successCount: 1,
      failedCount: 0,
      results: [{ ok: true, name: "doc.pdf", markdown: "ocr text" }],
    });
  });
});
