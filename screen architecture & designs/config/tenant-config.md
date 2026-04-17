# Celestial Auth Portal – Tenant Config (All Modes)

## Core Schema (shared by ALL modes)

Single JSON structure loaded in every deployment type. Mode only affects **where values come from**, not the shape.

```json
{
  "tenant": {
    "id": "acme-corp",
    "name": "Acme Corp",
    "slug": "acme",
    "domains": ["acme.com"],
    "tenantResolution": "subdomain",
    "locales": ["en-US"],
    "primaryLocale": "en-US",
    "timezone": "America/New_York",
    "plan": "pro",
    "dataRegion": "us-east",
    "compliance": "gdpr",
    "status": "active"
  }
}
```

## Mode-specific blocks (optional sections)

These sections exist in the same JSON file, but each mode only uses its own block.

### Single Client ONLY (`MODE=single`)

```json
{
  "singleClient": {
    "environment": "prod",
    "customerContact": "billing@acme.com",
    "supportTier": "priority"
  }
}
```

### Multi-Client Subdomains ONLY (`MODE=multi`)

```json
{
  "deployment": {
    "buildTag": "acme-v1.2.3",
    "cdnBase": "https://cdn.acme.portal.com",
    "deployRegion": "us-west-2"
  }
}
```

### Multi-Tenant Runtime ONLY (`MODE=multi-tenant`)

```json
{
  "runtime": {
    "signupDomainWhitelist": ["acme.com"],
    "featureFlags": {
      "beta_saml": false,
      "advanced_logs": true
    },
    "rateLimits": {
      "signup": 10,
      "login": 100
    }
  }
}
```

## Unified example JSON (all blocks present)

In practice, the stored config can include every block; each mode just ignores what it doesn’t need.

```json
{
  "tenant": {
    "id": "acme-corp",
    "name": "Acme Corp",
    "slug": "acme",
    "domains": ["acme.com", "app.acme.com"],
    "tenantResolution": "subdomain",
    "locales": ["en-US", "es-ES"],
    "primaryLocale": "en-US",
    "timezone": "America/New_York",
    "plan": "enterprise",
    "dataRegion": "us-east",
    "compliance": "gdpr",
    "status": "active"
  },
  "singleClient": {
    "environment": "prod",
    "customerContact": "billing@acme.com"
  },
  "deployment": {
    "buildTag": "acme-v1.2.3",
    "cdnBase": "https://cdn.acme.portal.com",
    "deployRegion": "us-west-2"
  },
  "runtime": {
    "signupDomainWhitelist": ["acme.com"],
    "featureFlags": {
      "beta_saml": true
    },
    "rateLimits": {
      "signup": 10,
      "login": 100
    }
  }
}
```

## Value behaviour by mode

| Field/block      | Single Client (`single`)            | Multi-Client (`multi`)                   | Multi-Tenant (`multi-tenant`)            |
|------------------|-------------------------------------|------------------------------------------|------------------------------------------|
| tenant.id        | From `VITE_TENANT_ID`               | From subdomain (e.g. `acme` in host)     | From DB resolver (host/email)           |
| tenant.domains   | Usually `[]` / ignored              | Deploy host(s) for that client           | Resolution list (host/email domain)     |
| tenant.plan      | Fixed (e.g. "enterprise")         | Per-client at build time                 | Fully dynamic per tenant                 |
| tenant.status    | "active"                          | "active"                               | "active", "suspended", "inactive" |
| singleClient.*   | Used                               | Ignored                                  | Ignored                                  |
| deployment.*     | Ignored                             | Used                                      | Ignored                                  |
| runtime.*        | Ignored                             | Ignored                                   | Used                                     |

## useConfig composable (pseudo-code)

```ts
export async function useConfig() {
  const mode = import.meta.env.MODE
  const config = {} as any

  if (mode === 'single') {
    config.tenant = {
      ...BASE_TENANT,
      id: import.meta.env.VITE_TENANT_ID
    }
    config.singleClient = SINGLE_CLIENT_DEFAULTS
  } else if (mode === 'multi') {
    const subdomain = window.location.host.split('.')[0]
    config.tenant = {
      ...BASE_TENANT,
      id: subdomain
    }
    config.deployment = DEPLOYMENT_CONFIG_FOR_BUILD
  } else {
    // multi-tenant runtime
    Object.assign(config, await $fetch('/api/tenant', {
      query: { host: window.location.host }
    }))
  }

  return config as TenantConfig
}
```
