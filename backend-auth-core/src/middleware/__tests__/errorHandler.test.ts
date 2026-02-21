/**
 * src/middleware/errorHandler.test.ts
 *
 * Vitest + Supertest tests for the centralized error handler.
 */
import express from 'express'
import { catchAsync } from '../../lib/catchAsync'
import request from 'supertest'
import { describe, it, expect, vi } from 'vitest'
import errorHandler from '../errorHandler'
import { AuthError, ValidationError, ErrorCode } from '../../lib/errors'

describe('errorHandler', () => {
  it('responds with AuthError (401) and JSON shape in development', async () => {
    process.env.NODE_ENV = 'development'
    const app = express()
    app.get('/throw-auth', () => {
      throw new AuthError(ErrorCode.TOKEN_INVALID, 'token is invalid')
    })
    app.use(errorHandler)

    const res = await request(app).get('/throw-auth')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toHaveProperty('code', ErrorCode.TOKEN_INVALID)
    expect(res.body.error).toHaveProperty('message', 'token is invalid')
  })

  it('hides stack and uses generic message in production for unknown errors', async () => {
    process.env.NODE_ENV = 'production'
    const app = express()
    app.get('/throw-unknown', () => {
      throw new Error('something exploded')
    })
    app.use(errorHandler)

    const res = await request(app).get('/throw-unknown')
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body.error).toHaveProperty('message')
    // In production we should not echo the original message
    expect(res.body.error.message).not.toBe('something exploded')
  })

  it('includes validation details in non-production', async () => {
    process.env.NODE_ENV = 'development'
    const app = express()
    app.get('/validation', () => {
      throw new ValidationError({ fields: ['email'] }, 'email missing')
    })
    app.use(errorHandler)

    const res = await request(app).get('/validation')
    expect(res.status).toBe(400)
    expect(res.body.error).toHaveProperty('details')
    expect((res.body.error as any).details).toHaveProperty('fields')
  })

  it('catches async thrown errors (express-async-errors compatibility)', async () => {
    process.env.NODE_ENV = 'development'
    const app = express()
    app.get('/async-throw', catchAsync(async () => {
      throw new AuthError(ErrorCode.TOKEN_EXPIRED, 'expired')
    }))
    app.use(errorHandler)

    const res = await request(app).get('/async-throw')
    expect(res.status).toBe(401)
    expect(res.body.error).toHaveProperty('code', ErrorCode.TOKEN_EXPIRED)
  })

  it('logs structured JSON in production (console.error called with JSON)', async () => {
    process.env.NODE_ENV = 'production'
    const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
    const app = express()
    app.get('/prod-log', () => {
      throw new Error('boom')
    })
    app.use(errorHandler)

    await request(app).get('/prod-log')
    expect(spy).toHaveBeenCalled()
    const arg = spy.mock.calls[0][0]
    // should be JSON string containing level and service
    expect(typeof arg === 'string').toBeTruthy()
    expect(arg).toContain('"level":"error"')
    expect(arg).toContain('"service":"backend-auth-core"')
    spy.mockRestore()
  })
})

