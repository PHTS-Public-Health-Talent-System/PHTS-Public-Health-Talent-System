import { requestQueryService } from '@/modules/request/read/services/query.service.js';
import { OcrRequestRepository } from '@/modules/ocr/repositories/ocr-request.repository.js';

describe('RequestQueryService.getOcrPrecheckHistory', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns OCR history items with engine and document kind metadata', async () => {
    jest.spyOn(OcrRequestRepository, 'findRequestPrecheckHistory').mockResolvedValue({
      items: [
        {
          request_id: 67909,
          request_no: 'REQ-2569-67909',
          status: 'completed',
          success_count: 1,
          failed_count: 0,
          engine_used: 'tesseract',
          document_kind: 'memo',
          fallback_used: false,
          fields: {
            document_no: 'อต 0033.104/000953',
          },
          missing_fields: [],
          fallback_reason: null,
          quality: {
            required_fields: 3,
            captured_fields: 3,
            passed: true,
          },
        } as any,
      ],
      total: 1,
    });

    const result = await requestQueryService.getOcrPrecheckHistory({
      page: 1,
      limit: 20,
      status: 'completed',
      search: '67909',
    });

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          request_id: 67909,
          status: 'completed',
          engine_used: 'tesseract',
          document_kind: 'memo',
          fallback_used: false,
          fields: {
            document_no: 'อต 0033.104/000953',
          },
          missing_fields: [],
          quality: {
            required_fields: 3,
            captured_fields: 3,
            passed: true,
          },
        }),
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
      },
    });
  });
});
