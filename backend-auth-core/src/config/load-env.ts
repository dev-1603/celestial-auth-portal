import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

const cwd = process.cwd()

const loadIfExists = (relativePath: string) => {
  const fullPath = path.resolve(cwd, relativePath)
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false })
  }
}

const nodeEnv = process.env.NODE_ENV ?? 'development'

// Base env for all environments (including production containers if used)
loadIfExists('.env')

// Local overrides for developers; never required in production.
if (nodeEnv !== 'production') {
  loadIfExists('.env.local')
  // Backwards-compat: also support src/.env.local (current location)
  loadIfExists('src/.env.local')
}

