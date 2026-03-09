import { requestQueryService } from '@/modules/request/read/services/query.service.js';
import { requestRepository } from '@/modules/request/data/repositories/request.repository.js';
import { OcrRequestRepository } from '@/modules/ocr/repositories/ocr-request.repository.js';

describe('RequestQueryService.getRequestDetails OCR precheck', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('hydrates OCR precheck from dedicated OCR table when submission_data has no OCR payload', async () => {
    jest.spyOn(requestRepository, 'findById').mockResolvedValue({
      request_id: 2001,
      user_id: 21,
      citizen_id: '1100501215023',
      request_no: 'REQ-2569-2001',
      personnel_type: 'CIVIL_SERVANT',
      current_position_number: '66001',
      current_department: 'กลุ่มงานเภสัชกรรม',
      main_duty: 'บริการ',
      work_attributes: {
        operation: true,
        service: true,
      },
      request_type: 'NEW_ENTRY',
      requested_amount: 3000,
      effective_date: '2026-02-01',
      status: 'PENDING',
      current_step: 3,
      submission_data: {
        title: 'นางสาว',
        first_name: 'นันทิชา',
      },
      created_at: '2026-02-01T01:00:00.000Z',
      updated_at: '2026-02-17T10:00:00.000Z',
    } as any);
    jest.spyOn(requestRepository, 'findAttachmentsWithMetadata').mockResolvedValue([]);
    jest.spyOn(requestRepository, 'findApprovalsWithActor').mockResolvedValue([]);
    jest.spyOn(requestRepository, 'findLatestVerificationSnapshotByRequestId').mockResolvedValue(null);
    jest.spyOn(requestRepository, 'findLatestEligibilityByRequestId').mockResolvedValue({
      eligibility_id: 3363,
      profession_code: 'NURSE',
      is_active: 1,
    } as any);
    jest.spyOn(OcrRequestRepository, 'findRequestPrecheck').mockResolvedValue({
      request_id: 2001,
      status: 'completed',
      service_url: 'http://ocr.test',
      worker: 'redis-list',
      count: 1,
      success_count: 1,
      failed_count: 0,
      started_at: '2026-03-03T10:00:00.000Z',
      finished_at: '2026-03-03T10:01:00.000Z',
      error: null,
      results: [
        {
          name: 'license.pdf',
          ok: true,
          markdown: 'ocr text',
        },
      ],
    } as any);

    const result = await requestQueryService.getRequestDetails(2001);

    expect(OcrRequestRepository.findRequestPrecheck).toHaveBeenCalledWith(2001);
    expect(result.ocr_precheck).toEqual(
      expect.objectContaining({
        status: 'completed',
        service_url: 'http://ocr.test',
      }),
    );
    expect(result.linked_eligibility).toEqual({
      eligibility_id: 3363,
      profession_code: 'NURSE',
      is_active: true,
    });
    expect((result.submission_data as any).ocr_precheck).toBeUndefined();
  });
});
