/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development and testing.
 * 
 * Usage:
 *   npm run db:seed
 * 
 * Or directly:
 *   tsx prisma/seed.ts
 * 
 * This will create:
 * - Sample tenants
 * - Sample roles (USER, ADMIN, OWNER)
 * - Sample users with passwords
 * - AuthIdentity records for each user
 * - Tenant-user links
 * - Role assignments
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/bcrypt'
import { config } from 'dotenv'

// Load environment variables
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await clearDatabase()

  // 1. Create Roles
  console.log('📋 Creating roles...')
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Standard user role',
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role',
    },
  })

  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: {
      name: 'OWNER',
      description: 'Tenant owner role',
    },
  })

  console.log(`   ✓ Created roles: USER, ADMIN, OWNER\n`)

  // 2. Create Tenants
  console.log('🏢 Creating tenants...')
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.example.com',
    },
  })

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      domain: 'demo.example.com',
    },
  })

  console.log(`   ✓ Created tenants: ${tenant1.name}, ${tenant2.name}\n`)

  // 3. Create Users with Passwords
  console.log('👤 Creating users...')
  const passwordHash = await hashPassword('Password123!') // Default password for all seed users

  const user1 = await prisma.globalUser.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      passwordHash,
      isVerified: true,
    },
  })

  const user2 = await prisma.globalUser.upsert({
    where: { email: 'user@acme.com' },
    update: {},
    create: {
      email: 'user@acme.com',
      passwordHash,
      isVerified: true,
    },
  })

  const user3 = await prisma.globalUser.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash,
      isVerified: true,
    },
  })

  const user4 = await prisma.globalUser.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash,
      isVerified: false, // Unverified user for testing
    },
  })

  console.log(`   ✓ Created users: ${user1.email}, ${user2.email}, ${user3.email}, ${user4.email}\n`)

  // 4. Create AuthIdentity records for each user
  console.log('🔐 Creating AuthIdentity records...')
  await prisma.authIdentity.upsert({
    where: {
      providerType_providerUserId: {
        providerType: 'email',
        providerUserId: user1.email,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      providerType: 'email',
      providerUserId: user1.email,
      email: user1.email,
      displayName: 'Admin User',
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      providerType_providerUserId: {
        providerType: 'email',
        providerUserId: user2.email,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      providerType: 'email',
      providerUserId: user2.email,
      email: user2.email,
      displayName: 'Regular User',
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      providerType_providerUserId: {
        providerType: 'email',
        providerUserId: user3.email,
      },
    },
    update: {},
    create: {
      userId: user3.id,
      providerType: 'email',
      providerUserId: user3.email,
      email: user3.email,
      displayName: 'Tenant Owner',
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      providerType_providerUserId: {
        providerType: 'email',
        providerUserId: user4.email,
      },
    },
    update: {},
    create: {
      userId: user4.id,
      providerType: 'email',
      providerUserId: user4.email,
      email: user4.email,
      displayName: 'Unverified User',
    },
  })

  console.log(`   ✓ Created AuthIdentity records for all users\n`)

  // 5. Link Users to Tenants
  console.log('🔗 Linking users to tenants...')
  const membership1 = await prisma.tenantUserLink.upsert({
    where: {
      userId_tenantId: {
        userId: user1.id,
        tenantId: tenant1.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      tenantId: tenant1.id,
      primary: true,
    },
  })

  const membership2 = await prisma.tenantUserLink.upsert({
    where: {
      userId_tenantId: {
        userId: user2.id,
        tenantId: tenant1.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      tenantId: tenant1.id,
      primary: true,
    },
  })

  const membership3 = await prisma.tenantUserLink.upsert({
    where: {
      userId_tenantId: {
        userId: user3.id,
        tenantId: tenant2.id,
      },
    },
    update: {},
    create: {
      userId: user3.id,
      tenantId: tenant2.id,
      primary: true,
    },
  })

  const membership4 = await prisma.tenantUserLink.upsert({
    where: {
      userId_tenantId: {
        userId: user4.id,
        tenantId: tenant2.id,
      },
    },
    update: {},
    create: {
      userId: user4.id,
      tenantId: tenant2.id,
      primary: true,
    },
  })

  console.log(`   ✓ Created tenant-user links\n`)

  // 6. Assign Roles
  console.log('🎭 Assigning roles...')
  await prisma.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership1.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      membershipId: membership1.id,
      roleId: adminRole.id,
    },
  })

  await prisma.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership2.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      membershipId: membership2.id,
      roleId: userRole.id,
    },
  })

  await prisma.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership3.id,
        roleId: ownerRole.id,
      },
    },
    update: {},
    create: {
      membershipId: membership3.id,
      roleId: ownerRole.id,
    },
  })

  await prisma.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership4.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      membershipId: membership4.id,
      roleId: userRole.id,
    },
  })

  console.log(`   ✓ Assigned roles to users\n`)

  // Summary
  console.log('✅ Seed completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - Tenants: 2`)
  console.log(`   - Roles: 3`)
  console.log(`   - Users: 4`)
  console.log(`   - AuthIdentities: 4`)
  console.log(`   - Tenant-User Links: 4`)
  console.log(`   - Role Assignments: 4\n`)
  console.log('🔑 Test Credentials:')
  console.log(`   - Email: admin@acme.com | Password: Password123! | Role: ADMIN | Tenant: acme-corp`)
  console.log(`   - Email: user@acme.com | Password: Password123! | Role: USER | Tenant: acme-corp`)
  console.log(`   - Email: owner@demo.com | Password: Password123! | Role: OWNER | Tenant: demo-company`)
  console.log(`   - Email: user@demo.com | Password: Password123! | Role: USER | Tenant: demo-company (unverified)\n`)
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')
  // Delete in reverse order of dependencies
  await prisma.membershipRole.deleteMany()
  await prisma.membershipModule.deleteMany()
  await prisma.tenantUserLink.deleteMany()
  await prisma.tenantModule.deleteMany()
  await prisma.appAccess.deleteMany()
  await prisma.authCode.deleteMany()
  await prisma.clientApp.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.session.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.verificationCode.deleteMany()
  await prisma.authIdentity.deleteMany()
  await prisma.globalUser.deleteMany()
  await prisma.module.deleteMany()
  await prisma.role.deleteMany()
  await prisma.tenant.deleteMany()
  console.log('   ✓ Database cleared\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
