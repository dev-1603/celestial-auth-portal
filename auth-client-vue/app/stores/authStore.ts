import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { navigateTo } from '#app';
import { logout as logoutService } from '../services/authClientService';

export interface AuthUser {
  id: string;
  email: string;
  tenantId?: string;
  tenantSlug?: string;
  role?: string;
  mfaEnabled?: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  function setAuth(userPayload: AuthUser) {
    user.value = userPayload;
  }

  function clearAuth() {
    user.value = null;
  }

  /**
   * Refresh BFF session (access token updated server-side). Updates user from response.
   */
  async function refresh(): Promise<boolean> {
    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/email-password/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response?.user) {
        setAuth(response.user);
        return true;
      }
      return false;
    } catch {
      await logout();
      return false;
    }
  }

  /**
   * Hard Logout - Clears state and redirects
   */
  async function logout() {
    user.value = null;

    try {
      await logoutService();
    } catch {
      // Silent fail if network is already gone
    }

    await navigateTo('/auth/login?reason=session_expired');
  }

  return {
    user,
    isAuthenticated,
    setAuth,
    clearAuth,
    refresh,
    logout,
  };
});
