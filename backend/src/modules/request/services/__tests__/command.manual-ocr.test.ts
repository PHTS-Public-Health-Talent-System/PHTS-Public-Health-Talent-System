import { RequestCommandService } from "@/modules/request/services/command.service.js";
import { requestRepository } from "@/modules/request/data/repositories/request.repository.js";
import { OcrRequestRepository } from "@/modules/ocr/repositories/ocr-request.repository.js";
import { OcrHttpProvider } from "@/modules/ocr/providers/ocr-http.provider.js";

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn(),
}));

describe("RequestCommandService.persistManualOcrPrecheck", () => {
  const service = new RequestCommandService();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("stores manual OCR result in dedicated OCR table for PTS officer", async () => {
    jest.spyOn(requestRepository, "findById").mockResolvedValue({
      request_id: 67909,
      user_id: 46409,
      status: "APPROVED",
    } as any);
    const upsertSpy = jest
      .spyOn(OcrRequestRepository, "upsertRequestPrecheck")
      .mockResolvedValue();

    await service.persistManualOcrPrecheck(67909, 46941, "PTS_OFFICER", {
      service_url: "http://ocr.test",
      worker: "browser-manual",
      count: 1,
      success_count: 1,
      failed_count: 0,
      results: [
        {
          name: "license.pdf",
          ok: true,
          markdown: "ocr text",
        },
      ],
    });

    expect(upsertSpy).toHaveBeenCalledWith(
      67909,
      expect.objectContaining({
        status: "completed",
        source: "MANUAL_VERIFY",
        service_url: "http://ocr.test",
        worker: "browser-manual",
        success_count: 1,
        failed_count: 0,
        results: [
          expect.objectContaining({
            name: "license.pdf",
            ok: true,
            markdown: "ocr text",
          }),
        ],
      }),
    );
  });

  it("runs OCR for request attachments through backend and merges results", async () => {
    const { readFile } = await import("node:fs/promises");

    jest.spyOn(requestRepository, "findById").mockResolvedValue({
      request_id: 67909,
      user_id: 46409,
      status: "PENDING",
    } as any);
    jest.spyOn(requestRepository, "findAttachmentById").mockResolvedValue({
      attachment_id: 22,
      request_id: 67909,
      file_name: "order.pdf",
      file_path: "uploads/order.pdf",
    } as any);
    jest.spyOn(OcrRequestRepository, "findRequestPrecheck").mockResolvedValue(null);
    jest.spyOn(OcrHttpProvider, "getServiceBase").mockReturnValue("http://ocr.test");
    jest
      .spyOn(OcrHttpProvider, "processSingleFile")
      .mockResolvedValueOnce({ name: "order.pdf", ok: true, markdown: "order text" } as any);
    (readFile as jest.Mock).mockResolvedValue(Buffer.from("file"));
    const upsertSpy = jest
      .spyOn(OcrRequestRepository, "upsertRequestPrecheck")
      .mockResolvedValue();

    const result = await service.runRequestAttachmentsOcr(67909, 46941, "PTS_OFFICER", {
      attachments: [{ attachment_id: 22 }],
    });

    expect(result).toEqual(
      expect.objectContaining({
        saved: true,
        count: 1,
        success_count: 1,
        failed_count: 0,
      }),
    );
    expect(upsertSpy).toHaveBeenCalledWith(
      67909,
      expect.objectContaining({
        service_url: "http://ocr.test",
        results: [expect.objectContaining({ name: "order.pdf" })],
      }),
    );
  });

  it("clears OCR result for a single request attachment by file name", async () => {
    jest.spyOn(requestRepository, "findById").mockResolvedValue({
      request_id: 67909,
      user_id: 46409,
      status: "PENDING",
    } as any);
    jest.spyOn(OcrRequestRepository, "findRequestPrecheck").mockResolvedValue({
      request_id: 67909,
      status: "completed",
      results: [
        { name: "page-5-6.pdf", ok: true, markdown: "ocr text" },
        { name: "memo.pdf", ok: true, markdown: "memo text" },
      ],
    } as any);
    const upsertSpy = jest
      .spyOn(OcrRequestRepository, "upsertRequestPrecheck")
      .mockResolvedValue();

    const result = await service.clearRequestAttachmentOcr(
      67909,
      46941,
      "PTS_OFFICER",
      "page-5-6.pdf",
    );

    expect(result).toEqual({
      saved: true,
      count: 1,
      success_count: 1,
      failed_count: 0,
    });
    expect(upsertSpy).toHaveBeenCalledWith(
      67909,
      expect.objectContaining({
        results: [
          expect.objectContaining({ name: "memo.pdf" }),
          expect.objectContaining({ name: "page-5-6.pdf", suppressed: true }),
        ],
      }),
    );
  });
});
