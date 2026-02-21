/**
 * src/routes/auth.ts
 *
 * Example auth routes demonstrating integration with centralized errors.
 * - POST /login
 * - POST /register
 *
 * These are illustrative and follow the project's JSON response contract:
 * { success: boolean, data?: any, error?: { code, message, details? } }
 */
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signTokenPair } from '../lib/jwt'
import { AuthError, ErrorCode, ValidationError, DatabaseError } from '../lib/errors'

const prisma = new PrismaClient()
const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}
    if (!email || !password) {
      throw new ValidationError({ fields: ['email', 'password'] }, 'Email and password are required')
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new AuthError(ErrorCode.USER_NOT_FOUND, 'User not found')
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      throw new AuthError(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials')
    }

    const tokens = signTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as any,
    } as any)

    res.json({ success: true, data: tokens })
  } catch (err: any) {
    // Map Prisma known errors to DatabaseError to provide consistent status codes
    if (err?.name === 'PrismaClientKnownRequestError') {
      return next(new DatabaseError({ meta: err.meta }, 'Database constraint error'))
    }
    return next(err)
  }
})

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body ?? {}
    if (!email || !password || !tenantId) {
      throw new ValidationError({ fields: ['email', 'password', 'tenantId'] }, 'Missing required fields')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, tenantId, role: 'USER' },
    })

    res.status(201).json({ success: true, data: { id: user.id, email: user.email } })
  } catch (err: any) {
    if (err?.name === 'PrismaClientKnownRequestError') {
      return next(new DatabaseError({ meta: err.meta }, 'Database constraint error'))
    }
    return next(err)
  }
})

export default router

