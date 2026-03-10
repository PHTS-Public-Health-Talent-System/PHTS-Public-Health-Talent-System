jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn((config: unknown) => {
    const middleware = jest.fn();
    (middleware as any).__config = config;
    return middleware;
  }),
}));

describe('rateLimiter', () => {
  const originalEnv = { ...process.env };
  const getRateLimitMock = () =>
    (jest.requireMock('express-rate-limit').default as unknown as jest.Mock);

  const getConfigs = async () => {
    jest.resetModules();
    const mod = await import('@middlewares/rateLimiter.js');
    const mockedRateLimit = getRateLimitMock();
    const calls = mockedRateLimit.mock.calls;
    return {
      mod,
      apiConfig: calls[0]?.[0] as any,
      authConfig: calls[1]?.[0] as any,
    };
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    getRateLimitMock().mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds api/auth limiters with env-based thresholds and messages', async () => {
    process.env.RATE_LIMIT_WINDOW_MS = '10000';
    process.env.RATE_LIMIT_MAX = '123';
    process.env.AUTH_RATE_LIMIT_WINDOW_MS = '20000';
    process.env.AUTH_RATE_LIMIT_MAX = '7';

    const { mod, apiConfig, authConfig } = await getConfigs();

    expect(typeof mod.apiRateLimiter).toBe('function');
    expect(typeof mod.authRateLimiter).toBe('function');
    expect(apiConfig.windowMs).toBe(10000);
    expect(apiConfig.max).toBe(123);
    expect(apiConfig.message.error).toContain('Too many requests');
    expect(authConfig.windowMs).toBe(20000);
    expect(authConfig.max).toBe(7);
    expect(authConfig.message.error).toContain('Too many login attempts');
  });

  it('skips limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';

    const { apiConfig, authConfig } = await getConfigs();

    expect(apiConfig.skip({}, {})).toBe(true);
    expect(authConfig.skip({}, {})).toBe(true);
  });

  it('skips limiting when DEMO_DISABLE_RATE_LIMIT is true (case-insensitive)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_DISABLE_RATE_LIMIT = 'TrUe';

    const { apiConfig, authConfig } = await getConfigs();

    expect(apiConfig.skip({}, {})).toBe(true);
    expect(authConfig.skip({}, {})).toBe(true);
  });

  it('does not skip limiting in non-test env when disable flag is absent', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DEMO_DISABLE_RATE_LIMIT;

    const { apiConfig, authConfig } = await getConfigs();

    expect(apiConfig.skip({}, {})).toBe(false);
    expect(authConfig.skip({}, {})).toBe(false);
  });
});
