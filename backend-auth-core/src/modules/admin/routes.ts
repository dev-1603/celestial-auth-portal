/**
 * Admin Routes
 *
 * Protected endpoints for admin/owner operations.
 * All routes require authentication + ADMIN or OWNER role.
 *
 * Mounted at: /api/v1/admin/*
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { createIPRateLimiter } from '../../middleware/rateLimit'
import { listRequests, approveRequest, rejectRequest } from './access-requests.handler'

export const adminRouter = Router()

// All admin routes require authentication + ADMIN or OWNER role
adminRouter.use(authenticate)
adminRouter.use(requireRole('ADMIN', 'OWNER'))
adminRouter.use(createIPRateLimiter())

// Access request management (waiting list)
adminRouter.get('/access-requests', listRequests)
adminRouter.post('/access-requests/:id/approve', approveRequest)
adminRouter.post('/access-requests/:id/reject', rejectRequest)
