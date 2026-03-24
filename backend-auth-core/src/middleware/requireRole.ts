/**
 * Role-based authorization middleware.
 * Must be used AFTER the `authenticate` middleware (req.user must be set).
 *
 * Usage:
 *   router.get('/admin/resource', authenticate, requireRole('ADMIN', 'OWNER'), handler)
 */
import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from './authenticate'
import type { GlobalRole } from '../lib/jwt'

export const requireRole = (...allowedRoles: GlobalRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
