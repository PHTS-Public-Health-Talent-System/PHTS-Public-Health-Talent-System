import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || 300);
const authWindowMs = Number(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
);
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 5);
const isRateLimitDisabled = () =>
  // Evaluate on each request so `.env.local` hot-reload/dev restarts always reflect latest flag.
  String(process.env.DEMO_DISABLE_RATE_LIMIT || "").toLowerCase() === "true";

export const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    process.env.NODE_ENV === "test" ||
    isRateLimitDisabled() ||
    String(req.path ?? "").startsWith("/auth"),
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test" || isRateLimitDisabled(),
  handler: (req, res) => {
    const now = Date.now();
    const resetTime =
      req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime()
        : now + authWindowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      error: "Too many login attempts, please try again later.",
      message: `Too many login attempts. Please try again in about ${retryAfterMinutes} minute(s).`,
      retry_after_seconds: retryAfterSeconds,
      retry_after_minutes: retryAfterMinutes,
    });
  },
});
