import { prisma } from '../lib/prisma'

export const createWebAuthnCredential = async (data: {
  userId: string
  credentialId: string
  publicKey: Buffer
  counter: bigint
  transports?: string[]
  deviceType?: string
  backedUp?: boolean
  friendlyName?: string
}) => {
  return prisma.webAuthnCredential.create({ data })
}

export const findWebAuthnCredentialsByUserId = async (userId: string) => {
  return prisma.webAuthnCredential.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export const findWebAuthnCredentialByCredentialId = async (credentialId: string) => {
  return prisma.webAuthnCredential.findUnique({
    where: { credentialId },
    include: { user: true },
  })
}

export const updateWebAuthnCredentialCounter = async (id: string, counter: bigint) => {
  return prisma.webAuthnCredential.update({
    where: { id },
    data: { counter },
  })
}

export const deleteWebAuthnCredential = async (id: string) => {
  return prisma.webAuthnCredential.delete({ where: { id } })
}
