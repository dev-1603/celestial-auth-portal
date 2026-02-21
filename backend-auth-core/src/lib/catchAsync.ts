/**
 * src/lib/catchAsync.ts
 *
 * Small helper to wrap async Express handlers so rejected promises are passed
 * to `next()` without relying on monkey-patching Express internals. This is
 * compatible with Express 5 and keeps behavior explicit/testable.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express'

export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export default catchAsync

