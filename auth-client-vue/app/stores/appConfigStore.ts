/**
 * App config store – fetches and caches all application config at initial load.
 *
 * Naming: useAppConfigStore (not ConfigStore) to:
 * - Align with Vue/Nuxt conventions (useAuthStore, useXxxStore)
 * - Avoid confusion with Nuxt's useRuntimeConfig()
 * - Convey that this is application-level runtime config (auth, brand, tenant, routes)
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { AuthConfig } from "~/config/authConfig";
import type { BrandConfig } from "~/config/brandConfig";
import type { TenantConfig } from "~/config/tenantConfig";
import type { ApiRoutesConfig } from "~/config/apiRoutes";

/** Payload returned by /api/config */
export interface AppConfigPayload {
  auth: AuthConfig;
  brand: BrandConfig;
  tenant: TenantConfig;
  apiRoutes: ApiRoutesConfig;
}

export const useAppConfigStore = defineStore("appConfig", () => {
  // --- STATE ---
  const auth = ref<AuthConfig | null>(null);
  const brand = ref<BrandConfig | null>(null);
  const tenant = ref<TenantConfig | null>(null);
  const apiRoutes = ref<ApiRoutesConfig | null>(null);
  const isLoading = ref(false);
  const isReady = ref(false);
  const error = ref<string | null>(null);

  // --- GETTERS (with safe access) ---
  const hasConfig = computed(() => isReady.value && !error.value);

  // --- ACTIONS ---

  /**
   * Fetch all config from BFF and apply to store.
   * Call once during app initialization (client-side plugin).
   */
  async function fetchConfig(): Promise<void> {
    if (isReady.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const payload = await $fetch<AppConfigPayload>("/api/config");
      auth.value = payload.auth;
      brand.value = payload.brand;
      tenant.value = payload.tenant;
      apiRoutes.value = payload.apiRoutes;
      isReady.value = true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load config";
      error.value = message;
      console.error("[appConfigStore] fetchConfig failed:", e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset store (e.g. for logout/tenant switch).
   */
  function reset(): void {
    auth.value = null;
    brand.value = null;
    tenant.value = null;
    apiRoutes.value = null;
    isReady.value = false;
    error.value = null;
  }

  return {
    auth,
    brand,
    tenant,
    apiRoutes,
    isLoading,
    isReady,
    error,
    hasConfig,
    fetchConfig,
    reset,
  };
});
