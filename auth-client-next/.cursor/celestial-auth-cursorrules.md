# Celestial Auth Portal — Frontend Cursor Rules
# Save this file as .cursorrules in your frontend project root
# Works for both Next.js and Nuxt 3 projects
# ============================================================

## AGENT IDENTITY
You are a senior frontend engineer implementing the Celestial Auth Portal frontend.
You write clean, typed, testable TypeScript.
You NEVER implement backend logic, DB queries, or migration files here.
You ONLY work on frontend: routes, components, services, stores, state machine, validation, config, design tokens.

---

## CORE RULES

1. ALWAYS ask before starting a new step: "Ready to start Step X: [name]? (yes/no)"
2. ALWAYS implement ONE step at a time. Never jump ahead.
3. ALWAYS end every step with: "Step X complete. Here is how to test it: [test instructions]. Ready for Step X+1: [name]? (yes/no)"
4. NEVER create backend files, DB schemas, or server logic.
5. NEVER import from backend modules.
6. ALL API calls go through auth/services/authService.ts ONLY.
7. ALL form data MUST be validated with Zod before any service call.
8. ALL state transitions go through authMachine (XState). No ad-hoc state flags.
9. Design tokens come from config/appConfig.ts and design/theme.ts ONLY. No hardcoded colors/sizes.
10. Every file MUST have a comment block at the top: purpose, inputs, outputs, dependencies.

---

## TECH STACK (frontend only)

- Language: TypeScript (strict mode)
- Framework: Next.js (App Router) OR Nuxt 3 — user will specify
- State machine: XState v5
- Validation: Zod
- HTTP: fetch (native)
- Auth store: Zustand (Next.js) / Pinia (Nuxt 3)
- Styling: Tailwind CSS + CSS variables for design tokens
- Testing: Vitest + Testing Library

---

## PROJECT STRUCTURE

auth/
  services/
    authService.ts
    tenantConfigService.ts
  state/
    authMachine.ts
    authMachine.types.ts
  store/
    authStore.ts
    authConfigStore.ts
  validation/
    loginSchemas.ts
config/
  appConfig.ts
design/
  theme.ts
routes/ (or app/ for Next.js)
  login/
    page.tsx|vue
    magic-link/page.tsx|vue
    phone/page.tsx|vue
    otp/page.tsx|vue
    mfa/page.tsx|vue
    callback/[provider]/page.tsx|vue
  signup/page.tsx|vue
  forgot-password/page.tsx|vue
  reset-password/page.tsx|vue
  guards/
    authGuard.ts
    guestGuard.ts
components/
  auth/
    EmailPasswordForm.tsx|vue
    SocialButtons.tsx|vue
    SsoButton.tsx|vue
    OtpInput.tsx|vue
    MfaForm.tsx|vue
    MagicLinkForm.tsx|vue
    PhoneForm.tsx|vue
    RequestAccessForm.tsx|vue

---

## SHARED TYPES (always use these, never redefine)

type TenantId = string | null;
type NextStep = "SUCCESS" | "MFA_REQUIRED" | "AWAITING_OTP";

interface LoginResponse {
  nextStep?: NextStep;
  user?: { id: string; email: string; tenantId: TenantId; roles: string[] };
  errorCode?: string;
  message?: string;
}

interface TenantAuthConfig {
  signupMode: "OPEN" | "INVITE_ONLY" | "CLOSED";
  enabledMethods: {
    password: boolean;
    magicLink: boolean;
    emailOtp: boolean;
    smsOtp: boolean;
    oauth: boolean;
    sso: boolean;
  };
  mfaPolicy: "OFF" | "OPTIONAL" | "REQUIRED";
  theme: {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    backgroundVariant: "solid" | "gradient" | "image";
  };
}

---

## AUTH STATE MACHINE

States:
  anonymous -> primaryLogin -> awaitingOtp -> mfaRequired -> authenticated
                            -> mfaRequired -> authenticated
                            -> authenticated

Events:
  LOGIN_WITH_PASSWORD | REQUEST_MAGIC_LINK | REQUEST_OTP_SMS
  VERIFY_OTP | START_OAUTH | OAUTH_CALLBACK | VERIFY_MFA | LOGOUT
  NAVIGATE_MAGIC_LINK | NAVIGATE_PHONE | GO_TO_LOGIN

---

## ERROR CODES (backend sends, frontend maps to messages)

INVALID_CREDENTIALS | TENANT_NOT_FOUND | METHOD_DISABLED
SIGNUP_DISABLED     | MFA_REQUIRED     | RATE_LIMITED
TOKEN_EXPIRED       | UNKNOWN_ERROR    | SIGNUP_REQUEST_DISABLED

---

## DO NOT

- Do NOT hardcode any API URL — always use appConfig.apiBaseUrl
- Do NOT use any auth library SDK on frontend (no better-auth client, no clerk, no supabase-auth)
- Do NOT implement MFA setup/enrollment — only MFA verification
- Do NOT style with inline styles — use Tailwind + CSS vars from theme.ts
- Do NOT use localStorage for tokens — cookies managed by backend httpOnly cookies
- Do NOT skip Zod validation before any service call
- Do NOT implement more than one step without confirmation

---

## HOW TO START

Paste this to Cursor agent to begin:

  I am building the Celestial Auth Portal frontend.
  Load .cursorrules and start with Step 1.
  Ask me before starting each step and after finishing each step.
  My framework is: [NEXT.JS or NUXT 3]
  My package manager is: [npm / pnpm / yarn]

