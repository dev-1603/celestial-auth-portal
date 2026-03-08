/**
 * Temp test for authConfigStore (Step 11). Delete after confirming.
 */
import { useAuthConfigStore, setConfig, isMethodEnabled } from "@/auth/store/authConfigStore";

setConfig({
  signupMode: "OPEN",
  enabledMethods: {
    password: true,
    magicLink: true,
    emailOtp: true,
    smsOtp: false,
    oauth: true,
    sso: true,
  },
  mfaPolicy: "OFF",
  theme: {
    logoUrl: "",
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    backgroundVariant: "solid",
  },
});

console.log("Step 11 isMethodEnabled('smsOtp'):", isMethodEnabled("smsOtp") === false ? "PASS" : "FAIL");
console.log("Step 11 isMethodEnabled('password'):", isMethodEnabled("password") === true ? "PASS" : "FAIL");
