/**
 * SSO Providers Handler
 *
 * Returns the list of enabled SSO providers from auth.json configuration.
 * Used by the frontend to render SSO login buttons.
 */

import type { Request, Response, NextFunction } from 'express'
import { getEnabledSSOProviders } from '../../../config/auth-config.loader'

export const getSSOProviders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providers = getEnabledSSOProviders()

    res.status(200).json({
      providers: providers.map((p) => ({
        id: p.id,
        type: p.type,
        displayName: p.displayName || p.id,
      })),
    })
  } catch (err) {
    next(err)
  }
}
