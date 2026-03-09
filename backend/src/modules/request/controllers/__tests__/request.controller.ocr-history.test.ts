import { requestController } from '@/modules/request/controllers/request.controller.js';
import { requestQueryService } from '@/modules/request/read/services/query.service.js';

jest.mock('@/modules/request/read/services/query.service.js', () => ({
  requestQueryService: {
    getOcrPrecheckHistory: jest.fn(),
  },
}));

describe('RequestController.getOcrPrecheckHistory', () => {
  it('passes OCR history filters through and returns paged payload', async () => {
    const req: any = {
      query: {
        page: '2',
        limit: '25',
        status: 'failed',
        search: 'REQ-2569-67903',
      },
      user: { userId: 46941, role: 'PTS_OFFICER' },
    };

    const res: any = {
      json: jest.fn(),
    };

    (requestQueryService.getOcrPrecheckHistory as jest.Mock).mockResolvedValue({
      items: [
        {
          request_id: 67903,
          request_no: 'REQ-2569-67903',
          status: 'failed',
        },
      ],
      meta: {
        page: 2,
        limit: 25,
        total: 1,
      },
    });

    const next = jest.fn();

    await (requestController.getOcrPrecheckHistory as any)(req, res, next);

    expect(requestQueryService.getOcrPrecheckHistory).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      status: 'failed',
      search: 'REQ-2569-67903',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        items: [
          expect.objectContaining({
            request_id: 67903,
            status: 'failed',
          }),
        ],
        meta: expect.objectContaining({
          total: 1,
        }),
      }),
    });
  });
});
