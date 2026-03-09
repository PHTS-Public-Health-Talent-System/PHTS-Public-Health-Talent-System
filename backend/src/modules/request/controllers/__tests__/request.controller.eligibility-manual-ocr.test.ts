import { requestController } from "@/modules/request/controllers/request.controller.js";
import { requestCommandService } from "@/modules/request/services/command.service.js";

jest.mock("@/modules/request/services/command.service.js", () => ({
  requestCommandService: {
    persistEligibilityManualOcrPrecheck: jest.fn(),
    runEligibilityAttachmentsOcr: jest.fn(),
  },
}));

describe("RequestController.persistEligibilityManualOcrPrecheck", () => {
  it("passes manual OCR payload through for eligibility detail", async () => {
    const req: any = {
      params: { id: "2978" },
      body: {
        service_url: "http://ocr.test",
        worker: "browser-manual",
        count: 1,
        success_count: 1,
        failed_count: 0,
        results: [{ name: "memo.pdf", ok: true, markdown: "ocr text" }],
      },
      user: { userId: 46941, role: "PTS_OFFICER" },
    };
    const res: any = {
      json: jest.fn(),
    };

    (requestCommandService.persistEligibilityManualOcrPrecheck as jest.Mock).mockResolvedValue({
      saved: true,
    });

    const next = jest.fn();
    await (requestController.persistEligibilityManualOcrPrecheck as any)(req, res, next);

    expect(requestCommandService.persistEligibilityManualOcrPrecheck).toHaveBeenCalledWith(
      2978,
      46941,
      "PTS_OFFICER",
      expect.objectContaining({
        service_url: "http://ocr.test",
        worker: "browser-manual",
      }),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { saved: true },
    });
  });

  it("runs allowance attachment OCR via backend", async () => {
    const req: any = {
      params: { eligibilityId: "2978" },
      body: {
        attachments: [
          { attachment_id: 11, source: "eligibility" },
          { attachment_id: 22, source: "request" },
        ],
      },
      user: { userId: 46941, role: "PTS_OFFICER" },
    };
    const res: any = { json: jest.fn() };

    (requestCommandService.runEligibilityAttachmentsOcr as jest.Mock).mockResolvedValue({
      saved: true,
      count: 2,
      success_count: 2,
      failed_count: 0,
      results: [],
    });

    const next = jest.fn();
    await (requestController.runEligibilityAttachmentsOcr as any)(req, res, next);

    expect(requestCommandService.runEligibilityAttachmentsOcr).toHaveBeenCalledWith(
      2978,
      46941,
      "PTS_OFFICER",
      {
        attachments: [
          { attachment_id: 11, source: "eligibility" },
          { attachment_id: 22, source: "request" },
        ],
      },
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        saved: true,
        count: 2,
        success_count: 2,
        failed_count: 0,
        results: [],
      },
    });
  });
});
