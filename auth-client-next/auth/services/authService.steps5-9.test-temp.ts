/**
 * Temp tests for authService (Steps 5–8) and tenantConfigService (Step 9).
 * Step 5/6: Run requestMagicLink / requestSmsOtp and check Network tab in browser (dev server).
 * Step 7: startOAuth("google", "default") — test in browser (URL redirect).
 * Step 8: getSession() with no session — returns without throw, user null.
 * Step 9: getTenantConfig("default") shape; safe defaults when fetch throws.
 */

import { getSession } from "@/auth/services/authService";
import { getTenantConfig } from "@/auth/services/tenantConfigService";

async function run() {
  // ——— Step 8: getSession() no session ———
  try {
    const session = await getSession();
    const hasUser = session?.user != null;
    console.log("Step 8 getSession():", hasUser ? "user present" : "user null/absent", session?.user === null || session?.user === undefined ? "PASS" : "check");
    if (!hasUser) console.log("  PASS: returns without throwing, user is null/absent");
  } catch (e) {
    console.log("Step 8 getSession(): FAIL — threw", e);
  }

  // ——— Step 9: getTenantConfig("default") shape ———
  try {
    const config = await getTenantConfig("default");
    const hasShape =
      typeof config.signupMode === "string" &&
      typeof config.enabledMethods === "object" &&
      ["password", "magicLink", "emailOtp", "smsOtp", "oauth", "sso"].every(
        (k) => typeof (config.enabledMethods as Record<string, boolean>)[k] === "boolean"
      ) &&
      typeof config.mfaPolicy === "string" &&
      config.theme &&
      typeof config.theme.logoUrl === "string" &&
      typeof config.theme.primaryColor === "string" &&
      typeof config.theme.accentColor === "string" &&
      typeof config.theme.backgroundVariant === "string";
    console.log("Step 9 getTenantConfig('default') shape:", hasShape ? "PASS" : "FAIL", config);
  } catch (e) {
    console.log("Step 9 getTenantConfig shape: FAIL", e);
  }

  // ——— Step 9: safe defaults when network down (mock fetch throw) ———
  const origFetch = globalThis.fetch;
  try {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () => Promise.reject(new Error("offline"));
    const defaults = await getTenantConfig("default");
    const isSafe =
      defaults.signupMode === "OPEN" &&
      defaults.enabledMethods.password === true &&
      defaults.mfaPolicy === "OFF";
    console.log("Step 9 getTenantConfig when fetch throws (safe defaults):", isSafe ? "PASS" : "FAIL");
  } catch (e) {
    console.log("Step 9 safe defaults: FAIL — should not throw", e);
  } finally {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = origFetch;
  }

  // Steps 5 & 6: requestMagicLink / requestSmsOtp — run in browser and check Network tab
  console.log("\nManual: requestMagicLink({ email: 'test@test.com' }) then check Network → POST to .../auth/magic-link/request");
  console.log("Manual: requestSmsOtp({ phone: '+919999999999' }) then check Network → POST to .../auth/otp/sms/request");
  console.log("Manual: startOAuth('google', 'default') in browser → URL should redirect to .../auth/oauth/google?tenantId=default");
}

run();
