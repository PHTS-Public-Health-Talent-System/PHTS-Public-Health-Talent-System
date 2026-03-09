import { requestController } from '@/modules/request/controllers/request.controller.js';
import { requestRepository } from '@/modules/request/data/repositories/request.repository.js';
import { requestCommandService } from '@/modules/request/services/command.service.js';

jest.mock('@/modules/request/services/command.service.js', () => ({
  requestCommandService: {
    createRequest: jest.fn(),
  },
}));

jest.mock('@/modules/request/data/repositories/request.repository.js', () => ({
  requestRepository: {
    findEmployeeExists: jest.fn(),
    findUserCitizenId: jest.fn(),
  },
}));

describe('RequestController.createRequest on behalf', () => {
  it('allows PTS_OFFICER to create request for selected personnel even when actor is not in emp_profiles', async () => {
    const req: any = {
      body: {
        target_user_id: '45927',
        personnel_type: 'CIVIL_SERVANT',
        request_type: 'NEW_ENTRY',
        requested_amount: '1500',
        effective_date: '2026-03-03',
        work_attributes: JSON.stringify({
          operation: true,
          planning: true,
          coordination: true,
          service: true,
        }),
        submission_data: JSON.stringify({
          title: 'นางสาว',
          first_name: 'พีรดา',
          last_name: 'แก้วทอด',
        }),
      },
      files: {},
      user: { userId: 9001, citizenId: '3640500458749', role: 'PTS_OFFICER' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (requestRepository.findUserCitizenId as jest.Mock).mockResolvedValue('1100702579863');
    (requestRepository.findEmployeeExists as jest.Mock).mockResolvedValue(true);
    (requestCommandService.createRequest as jest.Mock).mockResolvedValue({
      request_id: 501,
      user_id: 45927,
      citizen_id: '1100702579863',
    });

    const next = jest.fn();

    await (requestController.createRequest as any)(req, res, next);

    expect(requestCommandService.createRequest).toHaveBeenCalledWith(
      9001,
      'PTS_OFFICER',
      expect.objectContaining({
        target_user_id: 45927,
      }),
      [],
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
