/**
 * SAML SP Metadata Handler
 *
 * Returns the SAML Service Provider metadata as XML.
 * The IdP administrator can use this to configure the SP automatically.
 */

import type { Request, Response, NextFunction } from 'express'
import { generateSAMLMetadata } from '../../../services/sso.service'

export const getSAMLMetadata = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const metadata = generateSAMLMetadata()
    res.type('application/xml').send(metadata)
  } catch (err) {
    next(err)
  }
}
