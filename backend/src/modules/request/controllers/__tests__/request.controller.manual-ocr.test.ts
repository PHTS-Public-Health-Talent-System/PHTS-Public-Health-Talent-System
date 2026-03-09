import { requestController } from "@/modules/request/controllers/request.controller.js";
import { requestCommandService } from "@/modules/request/services/command.service.js";

jest.mock("@/modules/request/services/command.service.js", () => ({
  requestCommandService: {
    persistManualOcrPrecheck: jest.fn(),
  },
}));

describe("RequestController.persistManualOcrPrecheck", () => {
  it("passes manual OCR payload through", async () => {
    const req: any = {
      params: { id: "67909" },
      body: {
        service_url: "http://ocr.test",
        worker: "browser-manual",
        count: 1,
        success_count: 1,
        failed_count: 0,
        results: [{ name: "license.pdf", ok: true, markdown: "ocr text" }],
      },
      user: { userId: 46941, role: "PTS_OFFICER" },
    };
    const res: any = {
      json: jest.fn(),
    };

    (requestCommandService.persistManualOcrPrecheck as jest.Mock).mockResolvedValue({
      saved: true,
    });

    const next = jest.fn();
    await (requestController.persistManualOcrPrecheck as any)(req, res, next);

    expect(requestCommandService.persistManualOcrPrecheck).toHaveBeenCalledWith(
      67909,
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
});
