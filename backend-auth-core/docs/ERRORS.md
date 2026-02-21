# Error system & extension guide

This document describes the centralized error handling strategy used by `backend-auth-core`
and shows how to add new errors or adapters.

Core principles
- All handled errors extend `AppError` and expose:
  - `statusCode: number`
  - `code: string` (use the `ErrorCode` enum)
  - `details?: any` (non-sensitive structured info)
  - `isOperational: true`
- The central Express middleware `src/middleware/errorHandler.ts` normalizes errors,
  logs structured JSON in production, and returns a stable JSON response:

```json
{ "success": false, "error": { "code": "SOME_CODE", "message": "Human message", "details?" } }
```

Adding a new error type
1. Add a new value to `src/lib/errors.ts` `ErrorCode` enum.
2. Create a new subclass of `AppError` or reuse `DatabaseError` / `ValidationError`.

Example: RateLimitError

```ts
export enum ErrorCode { /* ... */, RATE_LIMIT = 'RATE_LIMIT' }

export class RateLimitError<T = unknown> extends AppError<T> {
  constructor(details?: T, message = 'Rate limit exceeded') {
    super(429, ErrorCode.RATE_LIMIT, message, details)
  }
}
```

Mapping third-party errors
- Place small adapter functions near service/repository layer. Example:

```ts
function mapPrisma(err: unknown): Error {
  if ((err as any)?.name === 'PrismaClientKnownRequestError') {
    return new DatabaseError({ meta: (err as any).meta }, 'DB constraint')
  }
  return err as Error
}
```

Swapping logging sinks
- Replace the `console.error` calls by implementing a small adapter module (e.g. `src/lib/logger.ts`)
  with the same call sites. This keeps the handler and tests unchanged.

Testing
- Add unit tests for new error classes and mapping functions.
- Keep the public JSON response contract stable for backward compatibility.

Security
- Never include sensitive tokens, passwords, or PII in `details` returned in production.

