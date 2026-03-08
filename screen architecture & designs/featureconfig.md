# =======================================
# PHASE 1: CORE LAUNCH (tenant, auth, brand, features)
# =======================================

tenant:
  purpose: |
    **Defines tenant identity + multi-tenancy resolution mechanism**
    Every single piece of data in your database gets partitioned by tenant_id. 
    Without this, multi-tenant = data leaks across customers.
    
  usage: |
    **App bootstrap extracts tenant_id → filters ALL backend queries**
    1. Browser loads → extracts tenant from subdomain/email/path
    2. Fetches tenant config → loads brand/auth/features
    3. EVERY API call includes tenant_id header → backend WHERE tenant_id=?
    
  impact: |
    **CRITICAL - Wrong config = cross-tenant data leaks / 404 everywhere**
    - Wrong domain mapping → customer sees competitor's branding
    - Wrong resolution → user@competitor.com logs into your tenant
    - Missing compliance → GDPR fines
    
  where: |
    **Pinia store onMount → backend middleware → auth context header**
    - Frontend: `useTenant()` composable (app.vue)
    - Backend: `req.tenantId` middleware (every route)
    - Auth: JWT claims include tenant_id

auth:
  purpose: |
    **Controls every login/signup/MFA/password-reset flow + security policies**
    Renders correct auth buttons → validates forms → backend enforcement.
    Your customers' security depends entirely on this config.
    
  usage: |
    **Dynamic auth UI rendering → validation → backend enforcement**
    1. Loads enabledMethods → renders buttons in exact order
    2. passwordPolicy → real-time form validation + backend check
    3. rateLimits → frontend warnings → backend IP blocks
    4. redirects → post-auth navigation
    
  impact: |
    **CRITICAL - Weak config = hacked customers | Strict = locked out admins**
    - Missing MFA = enterprise customers leave
    - Weak passwords = support tickets + breaches
    - Wrong redirects = infinite login loops
    
  where: |
    **Auth composables → forms → API guards → session/JWT**
    - Frontend: `useAuth()` composable + `<AuthForm :config="config.auth" />`
    - Backend: validation middleware + session store

brand:
  purpose: |
    **Complete white-label UI theming - customers see THEIR brand, not yours**
    CSS variables + logos + backgrounds + layouts = instant brand trust.
    
  usage: |
    **CSS vars injection + CDN assets + layout templates at runtime**
    1. `document.documentElement.style.setProperty('--primary', '#2563eb')`
    2. `<img :src="config.brand.logoLight" />`
    3. `<SignInTemplate :layout="config.brand.templates.signIn" />`
    
  impact: |
    **HIGH - Generic "SaaS template" look = customers leave**
    Branded = "professional solution". Generic = "cheap startup".
    
  where: |
    **Runtime styles → img src → Tailwind config → templates**
    - App.vue: CSS vars injection on config load
    - Components: `:src="config.brand.logo"` bindings
    - Tailwind: dynamic `config.brand.tokens`

features:
  purpose: |
    **Plan-based feature flags - Starter users CANNOT access Pro features**
    Protects your revenue + enables controlled beta rollouts.
    
  usage: |
    **Vue directive + route guards + backend API permissions**
    ```
    <button v-feature="['pro', 'enterprise']">Advanced Analytics</button>
    <AdminPanel v-if="config.features.adminConsole" />
    ```
    
  impact: |
    **HIGH - Revenue protection + controlled feature rollouts**
    - Wrong gates = Starter users access Enterprise → revenue loss
    - Missing flags = can't test beta features safely
    
  where: |
    **Components → routes → backend authorization**
    - Frontend: `v-feature` directive
    - Backend: `if (tenant.plan === 'pro')` checks

# =======================================
# PHASE 2: ENTERPRISE COMPLIANCE (security, integrations)
# =======================================

security:
  purpose: |
    **Zero-trust security layer BEYOND authentication**
    CSP headers + IP allowlists + audit trails = enterprise compliance.
    
  usage: |
    **CSP headers → IP filtering → audit logging → encryption flags**
    1. `<meta http-equiv="Content-Security-Policy" :content="csp">`
    2. Backend rejects `1.2.3.4` if not in IP allowlist
    3. Every action logged: `user123@acme.com changed password`
    
  impact: |
    **CRITICAL - Zero-trust + GDPR/HIPAA/SOC2 compliance**
    - No CSP = XSS attacks steal sessions
    - No audit = can't prove GDPR compliance
    - No IP lists = competitors hammer your APIs
    
  where: |
    **Middleware → meta tags → backend filters → logging**
    - Frontend: `<Head>` component CSP injection
    - Backend: IP middleware + audit service

integrations:
  purpose: |
    **Connect YOUR auth to THEIR email/payment/notification systems**
    Customers want emails via THEIR SendGrid, payments via THEIR Stripe.
    
  usage: |
    **SMTP config → webhook URLs → payment processor keys**
    1. Welcome emails via `customer.sendgrid.com`
    2. Stripe webhooks to `customer.com/stripe`
    3. Custom SMTP: `smtp.customer.com`
    
  impact: |
    **HIGH - Email delivery + payment failures = support hell**
    Generic "no-reply@yoursaas.com" = spam folder.
    
  where: |
    **Service clients → webhook handlers → payment flows**
    - Email service: `new SendGrid(config.integrations.smtp)`
    - Webhooks: POST to `config.integrations.stripe.webhook`

# =======================================
# PHASE 3: FULL SAAS PLATFORM (billing, notifications, api, ui)
# =======================================

billing:
  purpose: |
    **Usage quotas + real MRR enforcement**
    "Pro plan = 100 users max" → actually ENFORCE it.
    
  usage: |
    **Quota checks → overage alerts → invoice webhooks**
    1. API middleware: `if (users > config.billing.maxUsers) 429`
    2. Dashboard shows "Upgrade for 50 more users"
    3. Stripe webhook syncs usage → invoices
    
  impact: |
    **CRITICAL - Revenue accuracy + billing disputes**
    - No quotas = revenue leakage
    - Wrong limits = angry customers
    
  where: |
    **API middleware → dashboard → Stripe sync**
    - Backend: quota middleware
    - Frontend: usage charts

notifications:
  purpose: |
    **Multi-channel customer communication system**
    Email + Slack + Teams + in-app banners = high engagement.
    
  usage: |
    **Custom email templates + Slack/Teams + in-app messaging**
    1. "Welcome to Acme" emails via custom templates
    2. Slack alerts: `#acme-security`
    3. In-app: "New feature available!"
    
  impact: |
    **MEDIUM - Customer engagement + retention**
    Poor comms = churn. Great comms = testimonials.
    
  where: |
    **Notification service → email rendering → channels**
    - Unified `sendNotification()` service

api:
  purpose: |
    **Tenant-specific API customization + extensibility**
    Customers need THEIR endpoints + CORS + rate limits.
    
  usage: |
    **Custom CORS origins → rate limits → custom routes**
    1. `https://acme.com` allowed, `competitor.com` blocked
    2. Acme: 1000 req/min, Starter: 100 req/min
    3. `/api/acme/custom` endpoints
    
  impact: |
    **HIGH - Third-party integrations + extensibility**
    Locked APIs = angry developers.
    
  where: |
    **Backend routes → CORS middleware → API gateway**
    - Backend: tenant-specific routes

ui:
  purpose: |
    **PWA + custom JS/CSS + error pages = premium polish**
    Mobile app experience + fully branded error screens.
    
  usage: |
    **Custom JS/CSS injection → PWA manifest → error pages**
    1. `<link rel="manifest" href="/acme-manifest.json">`
    2. `<script src="/acme-custom.js">`
    3. 404 page branded for Acme
    
  impact: |
    **MEDIUM - Mobile support + dedicated branding**
    Looks cheap → feels enterprise.
    
  where: |
    **Router config → service worker → meta tags**
    - Head manager + service worker
