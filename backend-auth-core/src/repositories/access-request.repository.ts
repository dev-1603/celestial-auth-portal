import { prisma } from '../lib/prisma'

export interface CreateAccessRequestInput {
  email: string
  name?: string
  reason?: string
  tenantId: string
}

export const createAccessRequest = async (data: CreateAccessRequestInput) => {
  return prisma.accessRequest.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name || null,
      reason: data.reason || null,
      tenantId: data.tenantId,
    },
  })
}

export const findAccessRequestById = async (id: string) => {
  return prisma.accessRequest.findUnique({
    where: { id },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  })
}

export const findPendingAccessRequestByEmail = async (email: string, tenantId: string) => {
  return prisma.accessRequest.findFirst({
    where: {
      email: email.toLowerCase(),
      tenantId,
      status: 'pending',
    },
  })
}

export interface ListAccessRequestsOptions {
  tenantId: string
  status?: string
  page?: number
  limit?: number
}

export const listAccessRequests = async (options: ListAccessRequestsOptions) => {
  const { tenantId, status, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where = { tenantId, ...(status ? { status } : {}) }

  const [items, total] = await Promise.all([
    prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.accessRequest.count({ where }),
  ])

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const updateAccessRequestStatus = async (
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
) => {
  return prisma.accessRequest.update({
    where: { id },
    data: {
      status,
      reviewedBy,
      reviewedAt: new Date(),
    },
  })
}
