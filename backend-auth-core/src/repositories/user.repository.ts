// src/repositories/user.repository.ts
import { prisma } from '../lib/prisma'
import type { GlobalUser as PrismaGlobalUser } from '@prisma/client'

export type GlobalUser = PrismaGlobalUser

export interface CreateGlobalUserInput {
    email: string
    passwordHash: string | null
}

export interface GlobalUserWithTenant extends PrismaGlobalUser {
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
            passwordHash: data.passwordHash ?? null,
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
        ...link.user,
        tenantId: link.tenantId,
        tenantSlug: link.tenant?.slug ?? undefined,
    }
}

export const findGlobalUserById = async (
    userId: string,
): Promise<GlobalUser | null> => {
    return prisma.globalUser.findUnique({
        where: { id: userId },
    })
}

export interface TenantUserLinkInfo {
    tenantId: string
    tenantSlug?: string
    isTenantOwner: boolean
    status: string
}

export const findTenantUserLink = async (
    userId: string,
    tenantId: string,
): Promise<TenantUserLinkInfo | null> => {
    const link = await prisma.tenantUserLink.findFirst({
        where: {
            tenantId,
            user: { id: userId },
        },
        include: {
            tenant: {
                select: { slug: true },
            },
        },
    })

    if (!link) return null

    return {
        tenantId: link.tenantId,
        tenantSlug: link.tenant?.slug ?? undefined,
        isTenantOwner: (link as any).isTenantOwner ?? false,
        status: (link as any).status ?? '',
    }
}
