/**
 * Generate openapi.json from code (base + JSDoc paths). Run with tsx.
 * Use in CI: pnpm run docs:generate && npx @stoplight/spectral-cli lint openapi.json
 */
import { writeFileSync } from 'fs'
import path from 'path'
import { getOpenApiSpec } from './swagger.config.js'

const spec = getOpenApiSpec()

writeFileSync(
  path.join(process.cwd(), 'openapi.json'),
  JSON.stringify(spec, null, 2),
  'utf-8',
)

console.log('Wrote openapi.json')
