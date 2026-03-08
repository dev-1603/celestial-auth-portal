/**
 * AuthIdentity Repository
 * 
 * Handles data access for AuthIdentity model.
 * AuthIdentity links multiple authentication methods (email, OAuth, etc.) to a single GlobalUser.
 */

import { prisma } from '../lib/prisma'
import type { AuthIdentity as PrismaAuthIdentity, AuthMethodType } from '@prisma/client'

export type AuthIdentity = PrismaAuthIdentity
export type { AuthMethodType }

export interface CreateAuthIdentityInput {
  userId: string
  providerType: string
  providerUserId: string
  authMethodType?: AuthMethodType | null
  email?: string | null
  displayName?: string | null
  metadata?: any
}

export interface FindAuthIdentityInput {
  providerType: string
  providerUserId: string
}

/**
 * Find AuthIdentity by provider type and provider user ID
 * This is the primary lookup for login flows (e.g. email, OAuth)
 */
export const findAuthIdentityByProvider = async (
  providerType: string,
  providerUserId: string,
): Promise<AuthIdentity | null> => {
  return prisma.authIdentity.findUnique({
    where: {
      providerType_providerUserId: {
        providerType,
        providerUserId,
      },
    },
  })
}

/**
 * Find all AuthIdentities for a user
 * Useful for showing linked accounts or allowing user to choose login method
 */
export const findAuthIdentitiesByUserId = async (
  userId: string,
): Promise<AuthIdentity[]> => {
  return prisma.authIdentity.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

/**
 * Find AuthIdentity by user ID and provider type
 * Useful for checking if a user already has a specific provider linked
 */
export const findAuthIdentityByUserAndProvider = async (
  userId: string,
  providerType: string,
): Promise<AuthIdentity | null> => {
  return prisma.authIdentity.findFirst({
    where: {
      userId,
      providerType,
    },
  })
}

/**
 * Create a new AuthIdentity
 * Used when linking a new auth method to an existing user or creating a new user
 */
export const createAuthIdentity = async (
  data: CreateAuthIdentityInput,
): Promise<AuthIdentity> => {
  return prisma.authIdentity.create({
    data: {
      userId: data.userId,
      providerType: data.providerType,
      providerUserId: data.providerUserId,
      authMethodType: data.authMethodType ?? null,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
    },
  })
}

/**
 * Update an existing AuthIdentity
 * Useful for updating email, displayName, or metadata when provider profile changes
 */
export const updateAuthIdentity = async (
  id: string,
  data: Partial<Pick<CreateAuthIdentityInput, 'email' | 'displayName' | 'metadata' | 'authMethodType'>>,
): Promise<AuthIdentity> => {
  return prisma.authIdentity.update({
    where: { id },
    data: {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.authMethodType !== undefined && { authMethodType: data.authMethodType }),
      ...(data.metadata !== undefined && {
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      }),
    },
  })
}

/**
 * Delete an AuthIdentity
 * Used when unlinking an auth method from a user
 */
export const deleteAuthIdentity = async (id: string): Promise<void> => {
  await prisma.authIdentity.delete({
    where: { id },
  })
}

/**
 * Find AuthIdentity with user and tenant information
 * Useful for login flows that need to resolve user and tenant in one query
 */
export const findAuthIdentityWithUser = async (
  providerType: string,
  providerUserId: string,
) => {
  const identity = await prisma.authIdentity.findUnique({
    where: {
      providerType_providerUserId: {
        providerType,
        providerUserId,
      },
    },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      },
    },
  })

  if (!identity || !identity.user) {
    return null
  }

  // Get primary tenant (or first tenant if no primary)
  const primaryMembership =
    identity.user.memberships.find((m) => m.primary) ||
    identity.user.memberships[0]

  return {
    ...identity,
    user: {
      ...identity.user,
      tenantId: primaryMembership?.tenantId,
      tenantSlug: primaryMembership?.tenant?.slug,
    },
  }
}
