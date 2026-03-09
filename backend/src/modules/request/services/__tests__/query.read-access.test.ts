import { requestQueryService } from '@/modules/request/read/services/query.service.js';
import { requestRepository } from '@/modules/request/data/repositories/request.repository.js';

describe('RequestQueryService.getRequestById read access', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('allows officer-on-behalf creator to read request across roles', async () => {
    jest.spyOn(requestRepository, 'findById').mockResolvedValue({
      request_id: 67918,
      user_id: 12345,
      citizen_id: '1234567890123',
      submission_data: JSON.stringify({
        created_by_officer_id: 49000,
        created_by_officer_role: 'PTS_OFFICER',
        created_mode: 'OFFICER_ON_BEHALF',
      }),
      first_name: 'ทดสอบ',
      last_name: 'ระบบ',
      position_name: 'พยาบาลวิชาชีพ',
      license_no: null,
      license_name: null,
      license_valid_from: null,
      license_valid_until: null,
      license_raw_status: null,
    } as any);
    jest
      .spyOn(requestQueryService, 'getRequestDetails')
      .mockResolvedValue({ request_id: 67918 } as any);

    await expect(
      requestQueryService.getRequestById(67918, 49000, 'FINANCE_OFFICER'),
    ).resolves.toMatchObject({ request_id: 67918 });
  });
});
