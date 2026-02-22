import { requestQueryService } from '@/modules/request/read/services/query.service.js';
import { requestRepository } from '@/modules/request/data/repositories/request.repository.js';

describe('RequestQueryService.getApprovalHistory', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns requester profile and approval actions for history rows', async () => {
    jest.spyOn(requestRepository, 'findUserIdsByRole').mockResolvedValue([99]);
    jest
      .spyOn(requestRepository, 'findApprovalHistoryIdsForActors')
      .mockResolvedValue([{ request_id: 1001, last_action_date: new Date('2026-02-17T12:00:00.000Z') }]);
    jest.spyOn(requestRepository, 'findByIds').mockResolvedValue([
      {
        request_id: 1001,
        user_id: 21,
        citizen_id: '1100501215023',
        request_no: 'REQ-2569-1001',
        personnel_type: 'CIVIL_SERVANT',
        current_position_number: '66001',
        current_department: 'กลุ่มงานเภสัชกรรม',
        main_duty: 'บริการ',
        work_attributes: {
          operation: true,
          planning: false,
          coordination: false,
          service: true,
        },
        request_type: 'NEW_ENTRY',
        requested_amount: 3000,
        effective_date: '2026-02-01',
        status: 'PENDING',
        current_step: 2,
        submission_data: {},
        created_at: '2026-02-01T01:00:00.000Z',
        updated_at: '2026-02-17T10:00:00.000Z',
        requester_first_name: 'นันทิชา',
        requester_last_name: 'ทักเดือน',
        requester_position: 'เภสัชกร',
      } as any,
    ]);
    jest.spyOn(requestRepository, 'findAttachmentsWithMetadata').mockResolvedValue([]);
    jest.spyOn(requestRepository, 'findApprovalsWithActor').mockResolvedValue([
      {
        action_id: 77,
        request_id: 1001,
        actor_id: 12,
        action: 'APPROVE',
        step_no: 2,
        comment: 'ok',
        created_at: '2026-02-17T11:30:00.000Z',
        actor_citizen_id: '1234567890123',
        actor_role: 'HEAD_DEPT',
        actor_first_name: 'หัวหน้า',
        actor_last_name: 'กลุ่มงาน',
      } as any,
    ]);

    const result = await requestQueryService.getApprovalHistory(12, 'HEAD_HR');

    expect(result).toHaveLength(1);
    expect(result[0].requester).toMatchObject({
      first_name: 'นันทิชา',
      last_name: 'ทักเดือน',
      position: 'เภสัชกร',
    });
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions?.[0]?.action).toBe('APPROVE');
  });
});
