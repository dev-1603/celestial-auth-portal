/**
 * Temp test for authStore (Step 10). Delete after confirming.
 */
import { useAuthStore, setSession, clearSession } from "@/auth/store/authStore";

setSession({
  nextStep: "SUCCESS",
  user: { id: "1", email: "a@b.com", tenantId: "default", roles: ["user"] },
});
const state1 = useAuthStore.getState();
console.log(
  "Step 10 setSession:",
  state1.isAuthenticated === true && state1.user?.email === "a@b.com" ? "PASS" : "FAIL",
  state1
);

clearSession();
const state2 = useAuthStore.getState();
console.log(
  "Step 10 clearSession:",
  state2.isAuthenticated === false && state2.user === null ? "PASS" : "FAIL",
  state2
);
