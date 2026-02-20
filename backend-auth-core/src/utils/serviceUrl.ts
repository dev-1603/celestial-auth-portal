export const resolveServiceUrl = (env: { DIRECT_URL?: string; ALLOWED_ORIGINS?: string; PORT?: string | number }) => {
  if (env.DIRECT_URL) return env.DIRECT_URL.replace(/\/$/, '')
  const firstAllowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).find(Boolean)
  if (firstAllowed && (firstAllowed.startsWith('http://') || firstAllowed.startsWith('https://'))) {
    return firstAllowed.replace(/\/$/, '')
  }
  return `http://localhost:${env.PORT}`
}

