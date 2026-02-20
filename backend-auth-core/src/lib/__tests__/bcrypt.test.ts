// src/lib/__tests__/bcrypt.test.ts
import { describe, it, expect, vi } from 'vitest'

// mock authConfig so SALT_ROUNDS is stable in tests
vi.mock('../../config/auth.config', () => ({
    authConfig: {
        bcrypt: {
            rounds: 10,
        },
    },
}))

import { hashPassword, comparePassword } from '../bcrypt'

describe('bcrypt', () => {
    const password = 'Password123!'

    it('hashPassword returns a bcrypt hash string', async () => {
        const hash = await hashPassword(password)

        expect(typeof hash).toBe('string')
        expect(hash.split('$').length).toBeGreaterThanOrEqual(4)
        expect(hash.startsWith('$2')).toBe(true)
    })

    it('comparePassword returns true for matching password', async () => {
        const hash = await hashPassword(password)
        const ok = await comparePassword(password, hash)
        expect(ok).toBe(true)
    })

    it('comparePassword returns false for wrong password', async () => {
        const hash = await hashPassword(password)
        const ok = await comparePassword('wrong-password', hash)
        expect(ok).toBe(false)
    })
})
