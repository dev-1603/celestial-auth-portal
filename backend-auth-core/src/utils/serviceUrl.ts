export const resolveServiceUrl = (env: { SERVICE_URL?: string; PORT?: string | number }) => {
  const { SERVICE_URL, PORT } = env
  const port = PORT ?? process.env.PORT ?? 5001

  if (SERVICE_URL) return SERVICE_URL.replace(/\/$/, '')

  // Fallback to localhost with provided port
  return `http://localhost:${port}`
}

