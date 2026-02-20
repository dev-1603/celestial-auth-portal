// src/repositories/__tests__/user.repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    findGlobalUserByEmail,
    createGlobalUser,
    type CreateGlobalUserInput,
} from '../user.repository'
import { prisma } from '../../lib/prisma'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        globalUser: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}))

const mockedPrisma = prisma as unknown as {
    globalUser: {
        findUnique: ReturnType<typeof vi.fn>
        create: ReturnType<typeof vi.fn>
    }
}

describe('user.repository (GlobalUser)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('findGlobalUserByEmail returns user when found', async () => {
        const fakeUser = {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: 'hashed',
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        mockedPrisma.globalUser.findUnique.mockResolvedValueOnce(fakeUser)

        const result = await findGlobalUserByEmail('user@example.com')

        expect(mockedPrisma.globalUser.findUnique).toHaveBeenCalledWith({
            where: { email: 'user@example.com' },
        })
        expect(result).toBe(fakeUser)
    })

    it('findGlobalUserByEmail returns null when not found', async () => {
        mockedPrisma.globalUser.findUnique.mockResolvedValueOnce(null)

        const result = await findGlobalUserByEmail('missing@example.com')

        expect(result).toBeNull()
    })

    it('createGlobalUser inserts user with given data', async () => {
        const input: CreateGlobalUserInput = {
            email: 'user@example.com',
            passwordHash: 'hashed',
        }

        const created = {
            id: 'user-1',
            email: input.email,
            passwordHash: input.passwordHash,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        mockedPrisma.globalUser.create.mockResolvedValueOnce(created)

        const result = await createGlobalUser(input)

        expect(mockedPrisma.globalUser.create).toHaveBeenCalledWith({
            data: {
                email: 'user@example.com',
                passwordHash: 'hashed',
            },
        })
        expect(result).toBe(created)
    })
})
