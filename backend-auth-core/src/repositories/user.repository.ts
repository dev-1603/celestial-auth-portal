// src/repositories/user.repository.ts
import { prisma } from '../lib/prisma'

export interface GlobalUser {
    id: string
    email: string
    passwordHash: string | null
}

export interface CreateGlobalUserInput {
    email: string
    passwordHash: string
}

export interface GlobalUserWithTenant extends GlobalUser {
    tenantId: string
    tenantSlug?: string
}

export const findGlobalUserByEmail = async (
    email: string,
): Promise<GlobalUser | null> =>
    prisma.globalUser.findUnique({
        where: { email },
    })

export const createGlobalUser = async (
    data: CreateGlobalUserInput,
): Promise<GlobalUser> =>
    prisma.globalUser.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash,
        },
    })

export const findGlobalUserWithTenantByEmail = async (
    email: string,
): Promise<GlobalUserWithTenant | null> => {
    const link = await prisma.tenantUserLink.findFirst({
        where: {
            user: { email },
        },
        include: {
            user: true,
            tenant: true,
        },
    })

    if (!link || !link.user) return null

    return {
        id: link.user.id,
        email: link.user.email,
        passwordHash: link.user.passwordHash,
        tenantId: link.tenantId,
        tenantSlug: link.tenant?.slug ?? undefined,
    }
}
