const queryMock = jest.fn();

jest.mock('@config/database.js', () => ({
  __esModule: true,
  default: {
    query: queryMock,
    execute: jest.fn(),
  },
  getConnection: jest.fn(),
}));

describe('SnapshotRepository', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  test('findSnapshot returns snapshot_data when mysql driver already parsed JSON', async () => {
    const { SnapshotRepository } = await import('../snapshot.repository.js');
    const { SnapshotType } = await import('../../entities/snapshot.entity.js');

    queryMock.mockResolvedValue([[
      {
        snapshot_id: 10,
        period_id: 38,
        snapshot_type: 'SUMMARY',
        snapshot_data: { totals: [{ profession_code: 'NURSE', amount: 5000 }] },
        record_count: 1,
        total_amount: '5000.00',
        created_at: new Date('2026-03-04T10:00:00Z'),
      },
    ]]);

    const snapshot = await SnapshotRepository.findSnapshot(38, SnapshotType.SUMMARY);

    expect(snapshot?.snapshot_data).toEqual({
      totals: [{ profession_code: 'NURSE', amount: 5000 }],
    });
    expect(snapshot?.total_amount).toBe(5000);
  });
});
