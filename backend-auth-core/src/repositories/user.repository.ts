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

/**
 * Update user password hash
 */
export const updateUserPassword = async (
    userId: string,
    passwordHash: string,
): Promise<GlobalUser> => {
    return prisma.globalUser.update({
        where: { id: userId },
        data: { passwordHash },
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
        isTenantOwner: link.isTenantOwner ?? false,
        status: '', // Reserved for future use
    }
}

/**
 * Find user with tenant link in a single query (optimized for refresh)
 */
export interface UserWithTenantLink {
    user: GlobalUser
    tenantLink: TenantUserLinkInfo | null
}

export const findUserWithTenantLinkForRefresh = async (
    userId: string,
    tenantId: string,
): Promise<UserWithTenantLink | null> => {
    const user = await prisma.globalUser.findUnique({
        where: { id: userId },
        include: {
            memberships: {
                where: { tenantId },
                include: {
                    tenant: {
                        select: { slug: true },
                    },
                },
            },
        },
    })

    if (!user) return null

    const link = user.memberships[0] || null

    return {
        user,
        tenantLink: link
            ? {
                  tenantId: link.tenantId,
                  tenantSlug: link.tenant?.slug ?? undefined,
                  isTenantOwner: link.isTenantOwner ?? false,
                  status: '',
              }
            : null,
    }
}
