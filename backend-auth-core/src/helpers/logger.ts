import { safeStringify } from '../utils/format'

export const log = (level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => {
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '')
  const pid = process.pid
  const base = `[${now}] [pid:${pid}] [${level.toUpperCase()}]`
  const payload = meta ? `${base} ${message} - ${safeStringify(meta)}` : `${base} ${message}`
  const printer = (console as any)[level] ?? console.log
  printer(payload)
}

