/**
 * Auth composable – delegates to authClientService. No direct HTTP.
 * Exposes loginWithPassword(values), logout, refresh, user, getMe, loading, error. Redirect from config on success.
 */

import { authConfig } from "../config/authConfig";
import {
  loginWithPassword as serviceLogin,
  logout as serviceLogout,
  refreshToken as serviceRefresh,
  getMe as serviceGetMe,
} from "../services/authClientService";
import type { LoginWithPasswordInput } from "../../schema/zod/authSchemas";

export function useAuth() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const router = useRouter();
  const { setAuth, clearAuth, user: storeUser } = useAuthStore();

  const isEmailPasswordEnabled = computed(
    () => authConfig.methodsConfig?.email_password?.enabled === true,
  );

  const user = storeUser;

  async function loginWithPassword(values: LoginWithPasswordInput) {
    if (!isEmailPasswordEnabled.value) {
      error.value = "Email/password login is not enabled";
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const result = await serviceLogin(values);
      setAuth(result.user);
      const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
      await router.push(redirectTo);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Login failed";
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    error.value = null;
    try {
      await serviceLogout();
      clearAuth();
      const redirectTo = authConfig.redirects?.afterLogout ?? "/auth/login";
      await router.push(redirectTo);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Logout failed";
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    try {
      const result = await serviceRefresh();
      if (result) {
        setAuth(result.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function getMe() {
    try {

      const result = await serviceGetMe();
      if (!result) {
        throw new Error('Failed to get user');
      }
      setAuth(result.user);
      return result;
    } catch (error) {
      error.value = error instanceof Error ? error.message : 'Failed to get user';
      return null;
    } finally {
      loading.value = false;
    }
  }


  return {
    loginWithPassword,
    logout,
    refresh,
    getMe,
    user,
    loading,
    error,
    isEmailPasswordEnabled,
  };
}
