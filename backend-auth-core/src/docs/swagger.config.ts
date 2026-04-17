/**
 * Swagger/OpenAPI config — generates spec from base + JSDoc path definitions.
 * Used by app to serve /docs (Swagger UI) and /docs/spec (JSON spec).
 */
import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import base from './openapi.base'

/** Glob patterns for files containing @openapi JSDoc (paths). Resolved from cwd (project root). */
const apis = [path.join(process.cwd(), 'src', 'docs', 'paths.*.ts')]

const options: swaggerJsdoc.OAS3Options = {
  definition: base as swaggerJsdoc.OAS3Definition,
  apis,
  failOnErrors: false,
}

/**
 * Generate the full OpenAPI spec (base + paths from JSDoc).
 */
export function getOpenApiSpec(): object {
  return swaggerJsdoc(options)
}

export default getOpenApiSpec
