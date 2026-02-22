import { AuditEventType } from '@/modules/audit/entities/audit.entity.js';

jest.mock('@/modules/master-data/repositories/master-data.repository.js', () => ({
  MasterDataRepository: {
    deactivateMasterRate: jest.fn(),
  },
}));

jest.mock('@/modules/audit/services/audit.service.js', () => {
  const actual = jest.requireActual('@/modules/audit/services/audit.service.js');
  return {
    ...actual,
    emitAuditEvent: jest.fn(),
  };
});

import { emitAuditEvent } from '@/modules/audit/services/audit.service.js';
import { MasterDataRepository } from '@/modules/master-data/repositories/master-data.repository.js';
import { deleteMasterRate } from '../services/rate.service.js';

describe("MasterData Rate Service", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deleteMasterRate marks rate inactive and writes audit log", async () => {
    const rateId = 123;
    const actorId = 99;

    (MasterDataRepository.deactivateMasterRate as jest.Mock).mockResolvedValueOnce(undefined);

    await deleteMasterRate(rateId, actorId);

    expect(MasterDataRepository.deactivateMasterRate).toHaveBeenCalledWith(rateId);

    expect(emitAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.MASTER_RATE_UPDATE,
      entityType: "payment_rate",
      entityId: rateId,
      actorId,
      actorRole: null,
      actionDetail: {
        action: "delete",
      },
    });
  });
});
