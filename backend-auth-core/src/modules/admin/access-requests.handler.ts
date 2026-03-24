/**
 * Admin Access Requests Handlers
 *
 * Protected endpoints for admins/owners to manage the waiting list.
 * - List pending/approved/rejected access requests (scoped to admin's tenant)
 * - Approve a request → creates Invitation + sends invite email
 * - Reject a request → optionally notifies the user
 */

import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../middleware/authenticate'
import {
  listAccessRequests,
  findAccessRequestById,
  updateAccessRequestStatus,
} from '../../repositories/access-request.repository'
import { prisma } from '../../lib/prisma'
import { sendEmail } from '../../services/email.service'
import crypto from 'crypto'

/**
 * GET /api/v1/admin/access-requests
 * Query params: ?status=pending&page=1&limit=20
 * Results are scoped to the admin's tenant.
 */
export const listRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUser = req.user
    if (!adminUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const status = req.query.status as string | undefined
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

    const result = await listAccessRequests({
      tenantId: adminUser.tenantId,
      status,
      page,
      limit,
    })

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/admin/access-requests/:id/approve
 * Approves the request, creates an Invitation, and sends an invite email.
 * The invitation is created for the tenant specified in the access request.
 */
export const approveRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params
    const adminUser = req.user

    if (!adminUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Find the access request (includes tenant info)
    const accessRequest = await findAccessRequestById(id)
    if (!accessRequest) {
      res.status(404).json({ error: 'Access request not found' })
      return
    }

    // Ensure the request belongs to the admin's tenant
    if (accessRequest.tenantId !== adminUser.tenantId) {
      res.status(403).json({ error: 'Access request does not belong to your tenant' })
      return
    }

    if (accessRequest.status !== 'pending') {
      res.status(400).json({ error: `Request has already been ${accessRequest.status}` })
      return
    }

    // Mark as approved
    await updateAccessRequestStatus(id, 'approved', adminUser.userId)

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation for the access request's tenant
    const invitation = await prisma.invitation.create({
      data: {
        email: accessRequest.email,
        tenantId: accessRequest.tenantId,
        invitedBy: adminUser.userId,
        token: inviteToken,
        expiresAt,
      },
    })

    // Send invite email with tenant context
    const tenantName = accessRequest.tenant.name
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
    const inviteLink = `${baseUrl}/auth/register?invite=${inviteToken}&email=${encodeURIComponent(accessRequest.email)}`

    try {
      await sendEmail({
        to: accessRequest.email,
        subject: `Your access request to ${tenantName} has been approved!`,
        html: `
          <h2>Welcome!</h2>
          <p>Your request to join <strong>${tenantName}</strong> has been approved.</p>
          <p>Click the link below to create your account:</p>
          <p><a href="${inviteLink}">${inviteLink}</a></p>
          <p>This link expires in 7 days.</p>
        `,
      })
    } catch {
      // Log but don't fail — the invitation was already created
    }

    res.status(200).json({
      message: 'Access request approved. Invitation sent.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/admin/access-requests/:id/reject
 * Rejects the request and optionally notifies the user.
 */
export const rejectRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params
    const adminUser = req.user
    const { notify } = req.body ?? {}

    if (!adminUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Find the access request
    const accessRequest = await findAccessRequestById(id)
    if (!accessRequest) {
      res.status(404).json({ error: 'Access request not found' })
      return
    }

    // Ensure the request belongs to the admin's tenant
    if (accessRequest.tenantId !== adminUser.tenantId) {
      res.status(403).json({ error: 'Access request does not belong to your tenant' })
      return
    }

    if (accessRequest.status !== 'pending') {
      res.status(400).json({ error: `Request has already been ${accessRequest.status}` })
      return
    }

    // Mark as rejected
    await updateAccessRequestStatus(id, 'rejected', adminUser.userId)

    // Optionally send rejection notification
    if (notify === true) {
      const tenantName = accessRequest.tenant.name
      try {
        await sendEmail({
          to: accessRequest.email,
          subject: `Access request update — ${tenantName}`,
          html: `
            <p>Thank you for your interest in <strong>${tenantName}</strong>.</p>
            <p>Unfortunately, your access request was not approved at this time.</p>
            <p>You may submit a new request in the future.</p>
          `,
        })
      } catch {
        // Log but don't fail
      }
    }

    res.status(200).json({
      message: 'Access request rejected.',
    })
  } catch (err) {
    next(err)
  }
}
