import { requestController } from '@/modules/request/controllers/request.controller.js';
import { requestQueryService } from '@/modules/request/read/services/query.service.js';

jest.mock('@/modules/request/read/services/query.service.js', () => ({
  requestQueryService: {
    getEligibilitySummary: jest.fn(),
  },
}));

describe('RequestController.getEligibilitySummary', () => {
  it('passes summary filters through and returns alert summary payload', async () => {
    const req: any = {
      query: {
        active_only: '1',
        profession_code: 'NURSE',
        search: 'ปราณี',
        rate_group: '2',
        department: 'กลุ่มงานการพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน',
        sub_department: 'งานอุบัติเหตุและฉุกเฉิน (ER)',
        license_status: 'expiring',
        alert_filter: 'error',
      },
      user: { userId: 10, role: 'PTS_OFFICER' },
    };

    const res: any = {
      json: jest.fn(),
    };

    (requestQueryService.getEligibilitySummary as jest.Mock).mockResolvedValue({
      updated_at: '2026-03-03T09:34:16.000Z',
      total_people: 75,
      total_rate_amount: 127500,
      alert_summary: {
        people_with_alerts: 75,
        critical_people: 0,
        no_license_people: 0,
        duplicate_people: 0,
        upcoming_change_people: 0,
      },
      by_profession: [
        {
          profession_code: 'NURSE',
          people_count: 75,
          total_rate_amount: 127500,
          people_with_alerts: 75,
          critical_people: 0,
          no_license_people: 0,
          duplicate_people: 0,
          upcoming_change_people: 0,
        },
      ],
    });

    const next = jest.fn();

    await (requestController.getEligibilitySummary as any)(req, res, next);

    expect(requestQueryService.getEligibilitySummary).toHaveBeenCalledWith({
      activeOnly: true,
      professionCode: 'NURSE',
      search: 'ปราณี',
      rateGroup: '2',
      department: 'กลุ่มงานการพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน',
      subDepartment: 'งานอุบัติเหตุและฉุกเฉิน (ER)',
      licenseStatus: 'expiring',
      alertFilter: 'error',
      expiringDays: 90,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        total_people: 75,
        alert_summary: expect.objectContaining({
          people_with_alerts: 75,
        }),
      }),
    });
  });
});
