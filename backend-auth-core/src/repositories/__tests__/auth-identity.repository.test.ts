/**
 * AuthIdentity Repository Tests
 * 
 * Tests for AuthIdentity repository functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    findAuthIdentityByProvider,
    findAuthIdentitiesByUserId,
    createAuthIdentity,
    updateAuthIdentity,
    deleteAuthIdentity,
    findAuthIdentityWithUser,
    type CreateAuthIdentityInput,
} from '../auth-identity.repository'
import { prisma } from '../../lib/prisma'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        authIdentity: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}))

const mockedPrisma = prisma as unknown as {
    authIdentity: {
        findUnique: ReturnType<typeof vi.fn>
        findMany: ReturnType<typeof vi.fn>
        findFirst: ReturnType<typeof vi.fn>
        create: ReturnType<typeof vi.fn>
        update: ReturnType<typeof vi.fn>
        delete: ReturnType<typeof vi.fn>
    }
}

describe('auth-identity.repository', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('findAuthIdentityByProvider', () => {
        it('returns AuthIdentity when found', async () => {
            const fakeIdentity = {
                id: 'identity-1',
                userId: 'user-1',
                providerType: 'email',
                providerUserId: 'user@example.com',
                email: 'user@example.com',
                displayName: null,
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            mockedPrisma.authIdentity.findUnique.mockResolvedValueOnce(fakeIdentity)

            const result = await findAuthIdentityByProvider('email', 'user@example.com')

            expect(mockedPrisma.authIdentity.findUnique).toHaveBeenCalledWith({
                where: {
                    providerType_providerUserId: {
                        providerType: 'email',
                        providerUserId: 'user@example.com',
                    },
                },
            })
            expect(result).toBe(fakeIdentity)
        })

        it('returns null when not found', async () => {
            mockedPrisma.authIdentity.findUnique.mockResolvedValueOnce(null)

            const result = await findAuthIdentityByProvider('email', 'missing@example.com')

            expect(result).toBeNull()
        })
    })

    describe('findAuthIdentitiesByUserId', () => {
        it('returns all AuthIdentities for a user', async () => {
            const fakeIdentities = [
                {
                    id: 'identity-1',
                    userId: 'user-1',
                    providerType: 'email',
                    providerUserId: 'user@example.com',
                    email: 'user@example.com',
                    displayName: null,
                    metadata: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'identity-2',
                    userId: 'user-1',
                    providerType: 'google',
                    providerUserId: 'google-sub-123',
                    email: 'user@gmail.com',
                    displayName: 'User Name',
                    metadata: { picture: 'https://...' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]

            mockedPrisma.authIdentity.findMany.mockResolvedValueOnce(fakeIdentities)

            const result = await findAuthIdentitiesByUserId('user-1')

            expect(mockedPrisma.authIdentity.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { createdAt: 'asc' },
            })
            expect(result).toEqual(fakeIdentities)
        })
    })

    describe('createAuthIdentity', () => {
        it('creates AuthIdentity with given data', async () => {
            const input: CreateAuthIdentityInput = {
                userId: 'user-1',
                providerType: 'email',
                providerUserId: 'user@example.com',
                email: 'user@example.com',
            }

            const created = {
                id: 'identity-1',
                ...input,
                displayName: null,
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            mockedPrisma.authIdentity.create.mockResolvedValueOnce(created)

            const result = await createAuthIdentity(input)

            expect(mockedPrisma.authIdentity.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    providerType: 'email',
                    providerUserId: 'user@example.com',
                    email: 'user@example.com',
                    displayName: null,
                    metadata: null,
                },
            })
            expect(result).toBe(created)
        })

        it('handles metadata as JSON', async () => {
            const input: CreateAuthIdentityInput = {
                userId: 'user-1',
                providerType: 'google',
                providerUserId: 'google-sub-123',
                email: 'user@gmail.com',
                metadata: { picture: 'https://...', name: 'User' },
            }

            const created = {
                id: 'identity-1',
                ...input,
                displayName: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            mockedPrisma.authIdentity.create.mockResolvedValueOnce(created)

            await createAuthIdentity(input)

            expect(mockedPrisma.authIdentity.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    providerType: 'google',
                    providerUserId: 'google-sub-123',
                    email: 'user@gmail.com',
                    displayName: null,
                    metadata: { picture: 'https://...', name: 'User' },
                },
            })
        })
    })

    describe('updateAuthIdentity', () => {
        it('updates AuthIdentity fields', async () => {
            const updated = {
                id: 'identity-1',
                userId: 'user-1',
                providerType: 'email',
                providerUserId: 'user@example.com',
                email: 'newemail@example.com',
                displayName: 'New Name',
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            mockedPrisma.authIdentity.update.mockResolvedValueOnce(updated)

            const result = await updateAuthIdentity('identity-1', {
                email: 'newemail@example.com',
                displayName: 'New Name',
            })

            expect(mockedPrisma.authIdentity.update).toHaveBeenCalledWith({
                where: { id: 'identity-1' },
                data: {
                    email: 'newemail@example.com',
                    displayName: 'New Name',
                },
            })
            expect(result).toBe(updated)
        })
    })

    describe('deleteAuthIdentity', () => {
        it('deletes AuthIdentity', async () => {
            mockedPrisma.authIdentity.delete.mockResolvedValueOnce({} as any)

            await deleteAuthIdentity('identity-1')

            expect(mockedPrisma.authIdentity.delete).toHaveBeenCalledWith({
                where: { id: 'identity-1' },
            })
        })
    })

    describe('findAuthIdentityWithUser', () => {
        it('returns AuthIdentity with user and tenant info', async () => {
            const fakeIdentity = {
                id: 'identity-1',
                userId: 'user-1',
                providerType: 'email',
                providerUserId: 'user@example.com',
                email: 'user@example.com',
                displayName: null,
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    passwordHash: 'hashed',
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    memberships: [
                        {
                            id: 'membership-1',
                            userId: 'user-1',
                            tenantId: 'tenant-1',
                            primary: true,
                            createdAt: new Date(),
                            tenant: {
                                id: 'tenant-1',
                                name: 'Test Tenant',
                                slug: 'test-tenant',
                                domain: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        },
                    ],
                },
            }

            mockedPrisma.authIdentity.findUnique.mockResolvedValueOnce(fakeIdentity as any)

            const result = await findAuthIdentityWithUser('email', 'user@example.com')

            expect(result).toEqual({
                ...fakeIdentity,
                user: {
                    ...fakeIdentity.user,
                    tenantId: 'tenant-1',
                    tenantSlug: 'test-tenant',
                },
            })
        })

        it('returns null when AuthIdentity not found', async () => {
            mockedPrisma.authIdentity.findUnique.mockResolvedValueOnce(null)

            const result = await findAuthIdentityWithUser('email', 'missing@example.com')

            expect(result).toBeNull()
        })
    })
})
