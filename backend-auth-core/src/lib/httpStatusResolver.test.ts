/**
 * src/lib/httpStatusResolver.test.ts
 *
 * Unit tests for the HTTP status/message resolver.
 */
import { describe, it, expect } from 'vitest'
import resolveStatusAndMessage from './httpStatusResolver'
import { StatusCodes } from 'http-status-codes'
import { ErrorCode } from './errors'

describe('httpStatusResolver', () => {
  it('resolves known ErrorCode to configured status and message', () => {
    const r = resolveStatusAndMessage(ErrorCode.TOKEN_EXPIRED)
    expect(r.status).toBe(StatusCodes.UNAUTHORIZED)
    expect(typeof r.publicMessage).toBe('string')
  })

  it('falls back to provided status/message when unknown', () => {
    const r = resolveStatusAndMessage('SOME_UNKNOWN_CODE', StatusCodes.TOO_MANY_REQUESTS, 'Rate limited')
    expect(r.status).toBe(StatusCodes.TOO_MANY_REQUESTS)
    expect(r.publicMessage).toBe('Rate limited')
  })
})

