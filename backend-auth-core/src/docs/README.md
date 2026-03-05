# API Documentation Strategy

Production-grade, framework-agnostic API docs for the Celestial Auth Core (Express). OpenAPI 3.x is the single source of truth; specs are **auto-generated from code** (no manual YAML maintenance).

## Quick start

| Action | Command |
|--------|--------|
| View docs (Swagger UI) | Start app, open **http://localhost:3000/docs** |
| Raw spec (JSON) | **GET /docs/spec** or run `pnpm run docs:generate` → `openapi.json` |
| Lint spec (optional) | `npx @stoplight/spectral-cli lint openapi.json` |

## Architecture

- **Single source of truth:** OpenAPI 3.0.3
- **Generation:** `swagger-jsdoc` merges a **base spec** (components, security, tags) with **path definitions** from JSDoc in `src/docs/paths.*.ts`
- **Serving:** Swagger UI at `/docs`, spec at `/docs/spec` (and on disk as `openapi.json` for CI/version control)

## File layout

| File | Purpose |
|------|--------|
| `src/docs/openapi.base.ts` | Base spec: `info`, `servers`, `tags`, `components.schemas`, `components.securitySchemes` |
| `src/docs/paths.auth.email.ts` | JSDoc `@openapi` blocks for `/health`, `/auth/email/login`, `/logout`, `/refresh`, `/me` |
| `src/docs/swagger.config.ts` | Builds full spec: `getOpenApiSpec()` used by app and `docs:generate` |
| `src/docs/generate-spec.ts` | Script to write `openapi.json` (for CI, client-gen, Spectral) |
| `src/app.ts` | Mounts `/docs` (Swagger UI) and `/docs/spec` (JSON) |

## Standards applied

- **Auth:** Bearer JWT (`Authorization: Bearer <token>`) and cookie `celestial_refresh_token` documented in `securitySchemes`
- **Errors:** `ErrorResponse` / `ValidationErrorResponse` schemas; 400/401/403/422 in path responses
- **Multi-tenant:** Examples and descriptions reference tenantId/tenantSlug and TenantUserLink
- **Operation IDs:** Every operation has `operationId` (e.g. `authEmailLogin`) for client generation
- **Tags:** `Health`, `Auth - Email` for grouping in UI
- **Versioning:** API under `/api/v1`; servers in base spec include `/api/v1`

## Adding a new endpoint

1. Implement the handler and route as usual.
2. Add a JSDoc block in the appropriate `src/docs/paths.*.ts` (or create `paths.<module>.ts`):

```ts
/**
 * @openapi
 * /auth/email/register:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Register with email and password
 *     operationId: authEmailRegister
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '201':
 *         description: Created
 *       '400':
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

3. If needed, add a new schema or security scheme in `openapi.base.ts` under `components.schemas` / `components.securitySchemes`.
4. Run `pnpm run docs:generate` and confirm `openapi.json` includes the new path.

## CI/CD (recommended)

- **Validate spec on PR:** Run `pnpm run docs:generate` and optionally `npx @stoplight/spectral-cli lint openapi.json`.
- **Commit `openapi.json`** so client generation and Spectral linting are reproducible.
- **Docker:** Swagger UI can be run as a standalone service pointing at your spec URL (e.g. `/docs/spec`).

## Client generation

Use the generated spec for TypeScript/React clients:

```bash
pnpm run docs:generate
npx @openapitools/openapi-generator-cli generate -i openapi.json -g typescript-fetch -o ./clients/auth-api
```

## Best practices

- **Never trust generated docs alone** — test endpoints in Swagger UI (“Try it out”) or with integration tests.
- **Keep path JSDoc next to the module** (e.g. `paths.auth.email.ts`) or in a single `paths/*.ts` set for easy discovery.
- **Enforce coverage:** Consider ESLint or a custom rule to require `@openapi` (or `operationId`) for every route file so docs stay in sync.
