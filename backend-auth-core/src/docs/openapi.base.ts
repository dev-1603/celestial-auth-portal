/**
 * OpenAPI 3 base spec — single source of truth for components, security, and global settings.
 * Paths are merged from JSDoc in paths.*.ts. Root (/) and health (/health, /health/live, /health/ready)
 * are unversioned; all other API routes are under /api/v1.
 */
const base = {
  openapi: '3.0.3',
  info: {
    title: 'Celestial Auth API',
    version: '1.0.0',
    description: [
      'Pluggable auth service powering multi-tenant identity, JWT session management, and tenant-scoped role resolution for the Celestial SaaS platform.',
      'Unversioned: GET / (root), GET /health, GET /health/live, GET /health/ready. Versioned API: /api/v1/*.',
      'Protected routes require `Authorization: Bearer <access_token>`.',
      'Refresh tokens are issued as httpOnly cookies — use `POST /api/v1/auth/email/refresh` to renew sessions silently.',
    ].join(' '),
    contact: { name: 'Debjyoti Mohapatra' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: `http://localhost:${process.env.PORT || 5001}`, description: 'Local Development' },
    { url: process.env.API_URL || 'https://api.example.com', description: 'Production' },
  ],
  tags: [
    { name: 'Health', description: 'Unversioned health and liveness endpoints' },
    { name: 'Auth', description: 'Authentication endpoints (under /api/v1)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from login or refresh (15m expiry)',
      },
      cookieRefresh: {
        type: 'apiKey',
        in: 'cookie',
        name: 'celestial_refresh_token',
        description: 'HttpOnly refresh cookie (7d). Used by POST /api/v1/auth/email/refresh.',
      },
    },
    schemas: {
      UserDTO: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clxx123' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          tenantId: { type: 'string', example: 'tenant-abc' },
          tenantSlug: { type: 'string', nullable: true, example: 'acme-corp' },
        },
      },
      MeResponse: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          tenantId: { type: 'string' },
          tenantSlug: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'OWNER'] },
          apps: {
            type: 'array',
            items: { type: 'object', properties: { key: { type: 'string' }, role: { type: 'string' } } },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (15m)' },
          user: { $ref: '#/components/schemas/UserDTO' },
        },
      },
      RefreshResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'New JWT access token' },
        },
      },
      LogoutResponse: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true } },
      },
      HealthResponse: {
        type: 'object',
        description: 'Simple health response (GET /health)',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'celestial-auth-core' },
        },
      },
      HealthDetailResponse: {
        type: 'object',
        description: 'Detailed health response (GET /health/live, GET /health/ready)',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
          dialect: { type: 'string', description: 'Database dialect', example: 'postgresql' },
          latencyMs: { type: 'number', description: 'DB check latency in ms' },
          pool: { type: 'object', description: 'Pool info when details=true' },
          timestamp: { type: 'string', format: 'date-time' },
          error: { type: 'string', description: 'Present when status is degraded' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Client-facing message' },
          code: { type: 'string', description: 'Machine-readable code', example: 'VALIDATION' },
          details: { type: 'object', description: 'Structured details when safe' },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string', example: 'VALIDATION' },
          details: { type: 'object' },
        },
      },
      RouteNotFoundResponse: {
        type: 'object',
        description: 'Returned when the requested path has no handler',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'ROUTE_NOT_FOUND' },
          path: { type: 'string', description: 'Requested path', example: '/' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
    },
  },
  security: [],
}

export default base
