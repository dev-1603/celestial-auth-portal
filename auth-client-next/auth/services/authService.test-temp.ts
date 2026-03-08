/**
 * Temp test for auth/services/authService.ts (Step 4).
 * Confirms ZodError is thrown before any network request for invalid payload.
 * Delete after confirming.
 */
import { loginWithPassword } from "@/auth/services/authService";
import { ZodError } from "zod";

async function run() {
  try {
    await loginWithPassword({ email: "bad", password: "x" });
    console.log("FAIL: expected ZodError to be thrown");
  } catch (e) {
    if (e instanceof ZodError) {
      console.log("PASS: ZodError thrown (validation ran before network)");
      console.log("  issues:", e.issues.length);
    } else {
      console.log("FAIL: threw but not ZodError:", e?.constructor?.name, e);
    }
  }
}

run();
