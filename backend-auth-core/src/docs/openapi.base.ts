/**
 * OpenAPI 3 base spec — single source of truth for components, security, and global settings.
 * Paths are merged from JSDoc in paths.*.ts. Version-controlled for CI/linting (e.g. Spectral).
 */
const base = {
  openapi: '3.0.3',
  info: {
    title: 'Celestial Auth  API',
    version: '1.0.0',
    description: [
      'Pluggable auth service powering multi-tenant identity, JWT session management, and tenant-scoped role resolution for the Celestial SaaS platform.',
      'Protected routes require `Authorization: Bearer <access_token>`.',
      'Refresh tokens are issued as httpOnly cookies — use `POST /auth/refresh` to renew sessions silently.',
    ].join(' '),
    contact: { name: 'Debjyoti Mohapatra' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: `http://localhost:${process.env.PORT || 5001}`, description: 'Local Development' },
    { url: `${process.env.API_URL}`, description: 'Production' },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoint' },
    { name: 'Auth', description: 'Authentication endpoints' },
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
        description: 'HttpOnly refresh cookie (7d). Used by POST /auth/email/refresh.',
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
        properties: {
          status: { type: 'string', example: 'ok' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
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
