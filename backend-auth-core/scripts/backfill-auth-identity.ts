/**
 * Backfill script: Migrate existing GlobalUser records to AuthIdentity
 * 
 * This script creates AuthIdentity records for all existing GlobalUser records
 * that have an email address. It sets providerType="email" and providerUserId=email.
 * 
 * Usage:
 *   tsx scripts/backfill-auth-identity.ts
 * 
 * Or via npm:
 *   npm run db:backfill
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config()

const prisma = new PrismaClient()

async function backfillAuthIdentities() {
  console.log('Starting AuthIdentity backfill...')

  try {
    // Get all GlobalUsers with email
    const users = await prisma.globalUser.findMany({
      where: {
        email: {
          not: null,
        },
      },
    })

    console.log(`Found ${users.length} users to backfill`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const user of users) {
      try {
        // Check if AuthIdentity already exists for this email
        const existing = await prisma.authIdentity.findUnique({
          where: {
            providerType_providerUserId: {
              providerType: 'email',
              providerUserId: user.email,
            },
          },
        })

        if (existing) {
          console.log(`  Skipping ${user.email} - AuthIdentity already exists`)
          skipped++
          continue
        }

        // Create AuthIdentity for email provider
        await prisma.authIdentity.create({
          data: {
            userId: user.id,
            providerType: 'email',
            providerUserId: user.email,
            email: user.email,
          },
        })

        console.log(`  ✓ Created AuthIdentity for ${user.email}`)
        created++
      } catch (error: any) {
        console.error(`  ✗ Error processing ${user.email}:`, error.message)
        errors++
      }
    }

    console.log('\nBackfill complete:')
    console.log(`  Created: ${created}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Errors: ${errors}`)
  } catch (error) {
    console.error('Fatal error during backfill:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the backfill
backfillAuthIdentities()
  .then(() => {
    console.log('Backfill script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Backfill script failed:', error)
    process.exit(1)
  })
