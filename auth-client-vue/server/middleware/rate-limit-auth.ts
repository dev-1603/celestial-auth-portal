/**
 * Rate-limit middleware for OAuth callback and magic-link verification.
 * Protects Backend Core from automated spray attacks.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const store = new Map<string, { count: number; resetAt: number }>();

function getClientIp(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return getHeader(event, 'x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return true;
  }
  return false;
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;

  const isCallback = path.startsWith('/api/auth/callback/');
  const isVerifyLink = path === '/api/auth/verify-link' || path.startsWith('/api/auth/verify-link');
  const isConsume = path === '/api/auth/magic-link/consume' || path.startsWith('/api/auth/magic-link/consume');

  if (!isCallback && !isVerifyLink && !isConsume) {
    return;
  }

  const ip = getClientIp(event);
  if (isRateLimited(ip)) {
    const entry = store.get(ip);
    const retryAfter = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 60;
    setHeader(event, 'Retry-After', String(retryAfter));
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
    });
  }
});
