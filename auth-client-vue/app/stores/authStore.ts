import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { navigateTo } from '#app';

export interface AuthUser {
  id: string;
  email: string;
  tenantId?: string;
  tenantSlug?: string;
  role?: string;
  mfaEnabled?: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const accessToken = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!accessToken.value);

  // --- ACTIONS ---

  /**
   * Primary login/success setter
   */
  function setAuth(token: string, userPayload: AuthUser) {
    accessToken.value = token;
    user.value = userPayload;
    // Note: Cookies (refresh_token) are handled by the BFF/Browser automatically
  }

  /**
   * Clear local auth state only (no BFF call, no redirect).
   * Used when logout has already called BFF and the app will navigate.
   */
  function clearAuth() {
    accessToken.value = null;
    user.value = null;
  }

  /**
   * The "Silent Healer" - Called by APIClient when a 401 occurs.
   * Calls the Nuxt Server (BFF) which forwards to Express/NestJS.
   */
  async function refresh(): Promise<string> {
    try {
      // We call the BFF's refresh endpoint
      // The BFF will verify the refresh_token cookie and return a new Access Token
      const response = await $fetch<RefreshResponse>('/api/auth/email-password/refresh', {
        method: 'POST',
      });

      setAuth(response.accessToken, response.user);
      return response.accessToken;
    } catch (error) {
      // If refresh fails (expired refresh token), we must evacuate
      await logout();
      throw error;
    }
  }

  /**
   * Hard Logout - Clears state and redirects
   */
  async function logout() {
    accessToken.value = null;
    user.value = null;

    // Call BFF to clear the refresh_token cookie
    try {
      await $fetch('/api/auth/email-password/logout', { method: 'POST' });
    } catch {
      // Silent fail if network is already gone
    }

    // Redirect to login with a reason
    await navigateTo('/auth/login?reason=session_expired');
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    setAuth,
    clearAuth,
    refresh,
    logout,
  };
});