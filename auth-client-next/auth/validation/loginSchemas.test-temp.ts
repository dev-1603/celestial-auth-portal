/**
 * Temp test for auth/validation/loginSchemas.ts (Step 3).
 * Delete after confirming.
 */
import {
  LoginWithPasswordSchema,
  OtpVerifySchema,
} from "@/auth/validation/loginSchemas";

// Test 1: safeParse LoginWithPasswordSchema with invalid email — confirm error on email field
const r1 = LoginWithPasswordSchema.safeParse({
  email: "not-an-email",
  password: "secret12",
});
console.log("LoginWithPasswordSchema invalid email:", r1.success ? "FAIL (expected error)" : "PASS");
if (!r1.success) {
  const emailError = r1.error.flatten().fieldErrors.email;
  console.log("  email field errors:", emailError);
  console.log("  error on email field:", emailError?.length ? "PASS" : "FAIL");
}

// Test 2: safeParse OtpVerifySchema with code="12345" (5 digits) — confirm error on code field
const r2 = OtpVerifySchema.safeParse({
  identifier: "user@example.com",
  code: "12345",
  channel: "email",
});
console.log("OtpVerifySchema code length 5:", r2.success ? "FAIL (expected error)" : "PASS");
if (!r2.success) {
  const codeError = r2.error.flatten().fieldErrors.code;
  console.log("  code field errors:", codeError);
  console.log("  error on code field:", codeError?.length ? "PASS" : "FAIL");
}
