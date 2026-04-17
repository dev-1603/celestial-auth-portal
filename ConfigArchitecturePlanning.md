
{
  "tenant": {
    "id": "acme-corp",                    // REQUIRED - DB partitioning key
    "name": "Acme Corp",                  // REQUIRED - UI display everywhere
    "slug": "acme",                       // REQUIRED - URL fallback
    "domains": ["acme.com"],              // Multi: deploy/resolve targets
    "tenantResolution": "subdomain",      // Multi-tenant ONLY - "subdomain" | "email_domain" | "path"
    "locales": ["en-US"],                 // Optional - i18n support
    "primaryLocale": "en-US",             // Optional - default language
    "timezone": "America/New_York",       // Optional - date formatting
    "plan": "pro",                        // REQUIRED - feature gating
    "dataRegion": "us-east",              // Optional - DB sharding
    "compliance": "gdpr",                 // Optional - logging rules
    "status": "active"                    // REQUIRED - enable/disable tenant
  }
}
Mode-Specific Fields (Loaded Conditionally)
Single Client (MODE=single) - Static .env
json
{
  "singleClient": {
    "environment": "prod",              // prod/staging/dev
    "customerContact": "billing@acme.com",  // Direct support email
    "supportTier": "priority"           // SLA level
  }
}
Multi-Client Subdomains (MODE=multi) - Build-time
json
{
  "deployment": {
    "buildTag": "acme-v1.2.3",          // Per-client build artifact
    "cdnBase": "https://cdn.acme.portal.com",  // Client assets
    "deployRegion": "us-west-2"         // Infra region hint
  }
}
Multi-Tenant Runtime (MODE=multi-tenant) - Dynamic DB
json
{
  "runtime": {
    "signupDomainWhitelist": ["acme.com", "acme.co"],  // Self-signup allowed domains
    "featureFlags": {
      "beta_saml": false,
      "advanced_logs": true
    },
    "rateLimits": {
      "signup": 10,      // per hour
      "login": 100       // per hour
    }
  }
}
Complete Unified Config Example
json
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
    "cdnBase": "https://cdn.acme.portal.com"
  },
  "runtime": {
    "signupDomainWhitelist": ["acme.com"],
    "featureFlags": { "beta_saml": true }
  }
}
Value Switch Matrix
Field	Single Client	Multi-Client	Multi-Tenant
Core tenant block	✅ Loaded	✅ Loaded	✅ Loaded
singleClient block	✅ Active	Ignored	Ignored
deployment block	Ignored	✅ Active	Ignored
runtime block	Ignored	Ignored	✅ Active
Usage in useConfig() Composable
ts
// ONE composable handles ALL modes
export async function useConfig() {
  const mode = import.meta.env.MODE
  const config = ref<TenantConfig>({})

  // ALWAYS load core tenant
  if (mode === 'single') {
    config.value.tenant.id = import.meta.env.VITE_TENANT_ID
    config.value.singleClient = { /* static */ }
  } else if (mode === 'multi') {
    config.value.tenant.id = window.location.host.split('.')[0]
    config.value.deployment = { /* build-time */ }
  } else {
    config.value = await $fetch('/api/tenant')  // Full config + runtime
  }

  return config
}