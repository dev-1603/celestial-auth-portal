import { logger } from '../lib/logger'

export const log = (level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => {
  if (level === 'info') logger.info(message, meta !== undefined ? { meta } : {})
  else if (level === 'warn') logger.warn(message, meta !== undefined ? { meta } : {})
  else logger.error(message, meta !== undefined ? { meta } : {})
}

