/**
 * Seed script: Add 2–3 test users (and a test tenant) for local/dev testing.
 *
 * Creates:
 * - 1 Tenant: "Test Tenant" (slug: test-tenant)
 * - 3 GlobalUser records with hashed passwords
 * - AuthIdentity (email) for each user
 * - TenantUserLink linking each user to the test tenant (primary)
 *
 * Test credentials (same password for all):
 *   alice@test.local   /  Test123!
 *   bob@test.local     /  Test123!
 *   carol@test.local   /  Test123!
 *
 * Usage:
 *   pnpm run db:seed
 *   # or with env:
 *   dotenv -e .env.local -- tsx scripts/seed-test-users.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10
const TEST_PASSWORD = 'Test123!'

const TEST_USERS = [
  { email: 'alice@test.local', displayName: 'Alice Test' },
  { email: 'bob@test.local', displayName: 'Bob Test' },
  { email: 'carol@test.local', displayName: 'Carol Test' },
] as const

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

async function seed() {
  console.log('Seeding test tenant and users...\n')

  const passwordHash = await hash(TEST_PASSWORD)

  // 1. Ensure test tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'test-tenant' },
  })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant',
        domain: null,
      },
    })
    console.log('Created tenant: Test Tenant (slug: test-tenant)')
  } else {
    console.log('Using existing tenant: Test Tenant (slug: test-tenant)')
  }

  for (const { email, displayName } of TEST_USERS) {
    const existingUser = await prisma.globalUser.findUnique({
      where: { email },
      include: {
        memberships: { where: { tenantId: tenant.id } },
      },
    })

    if (existingUser) {
      const hasMembership = existingUser.memberships.length > 0
      if (!hasMembership) {
        await prisma.tenantUserLink.create({
          data: {
            userId: existingUser.id,
            tenantId: tenant.id,
            primary: true,
          },
        })
        console.log(`  Updated ${email}: added TenantUserLink`)
      } else {
        console.log(`  Skip ${email} (already exists)`)
      }
      continue
    }

    // Create user + TenantUserLink only (AuthIdentity added in next step)
    await prisma.globalUser.create({
      data: {
        email,
        passwordHash,
        isVerified: true,
        memberships: {
          create: {
            tenantId: tenant.id,
            primary: true,
          },
        },
      },
    })
    console.log(`  Created ${email} (password: ${TEST_PASSWORD})`)
  }

  // Ensure AuthIdentity exists for each user (required for email/password login)
  let authIdentityOk = true
  for (const { email, displayName } of TEST_USERS) {
    try {
      const user = await prisma.globalUser.findUnique({ where: { email } })
      if (!user) continue
      const existing = await prisma.authIdentity.findUnique({
        where: {
          providerType_providerUserId: { providerType: 'email', providerUserId: email },
        },
      })
      if (existing) continue
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          providerType: 'email',
          providerUserId: email,
          authMethodType: 'PASSWORD',
          email,
          displayName,
        },
      })
      console.log(`  AuthIdentity for ${email}`)
    } catch (e: unknown) {
      const err = e as { code?: string; meta?: { table?: string; modelName?: string } }
      const isMissingTable = err?.code === 'P2021' && (
        err?.meta?.table === 'AuthIdentity' ||
        err?.meta?.table === 'public.AuthIdentity' ||
        err?.meta?.modelName === 'AuthIdentity'
      )
      if (isMissingTable) {
        authIdentityOk = false
        break
      }
      throw e
    }
  }

  if (!authIdentityOk) {
    console.log(
      '\nAuthIdentity table is missing. Run migrations then re-run seed:',
    )
    console.log('  pnpm run db:migrate')
    console.log('  pnpm run db:seed')
    console.log('\nUsers and tenant were created; login will work after the above.')
    return
  }

  console.log('\nDone. You can log in with any of the emails above and password:', TEST_PASSWORD)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
