/**
 * Request Access Handler
 *
 * Public endpoint for users to request access when signupMode is 'invite_only'.
 * Creates an AccessRequest record in "pending" status for admin review.
 * Requires a tenantSlug so the system knows which tenant the user wants to join.
 */

import type { Request, Response, NextFunction } from 'express'
import { getSignupMode } from '../../../config/auth-config.loader'
import {
  createAccessRequest,
  findPendingAccessRequestByEmail,
} from '../../../repositories/access-request.repository'
import { findGlobalUserByEmail } from '../../../repositories/user.repository'
import { prisma } from '../../../lib/prisma'

export const requestAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, name, reason, tenantSlug } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      res.status(400).json({ error: 'tenantSlug is required' })
      return
    }

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    })

    if (!tenant) {
      // Don't reveal whether the tenant exists — return generic success
      res.status(200).json({
        message: 'If this email is eligible, your request has been submitted for review.',
      })
      return
    }

    const signupMode = getSignupMode()

    // If signup is open, no need for access request
    if (signupMode === 'open') {
      res.status(400).json({ error: 'Open signup is enabled. Please register directly.' })
      return
    }

    if (signupMode === 'closed') {
      res.status(403).json({ error: 'Signup is currently closed' })
      return
    }

    // Check if user already exists
    const existingUser = await findGlobalUserByEmail(email.toLowerCase())
    if (existingUser) {
      // Don't reveal that the user exists — return success anyway
      res.status(200).json({
        message: 'If this email is eligible, your request has been submitted for review.',
      })
      return
    }

    // Check for existing pending request for this tenant
    const existingRequest = await findPendingAccessRequestByEmail(email, tenant.id)
    if (existingRequest) {
      // Don't reveal duplicate — return success
      res.status(200).json({
        message: 'If this email is eligible, your request has been submitted for review.',
      })
      return
    }

    // Create access request tied to the tenant
    await createAccessRequest({
      email: email.toLowerCase(),
      name: name || undefined,
      reason: reason || undefined,
      tenantId: tenant.id,
    })

    res.status(201).json({
      message: 'If this email is eligible, your request has been submitted for review.',
    })
  } catch (err) {
    next(err)
  }
}
