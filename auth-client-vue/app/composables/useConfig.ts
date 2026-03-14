/**
 * Composable to access fetched app config with fallback.
 * Uses appConfigStore when available; falls back to static imports for SSR or before fetch.
 *
 * Usage: const { auth, brand, tenant, apiRoutes } = useConfig();
 *
 * Note: Named useConfig (not useAppConfig) to avoid conflict with Nuxt's built-in useAppConfig.
 */
import { authConfig } from "~/config/authConfig";
import { brandConfig } from "~/config/brandConfig";
import { tenantConfig } from "~/config/tenantConfig";
import { apiRoutesConfig } from "~/config/apiRoutes";

export function useConfig() {
  const store = useAppConfigStore();

  return {
    /** Auth config – from store or static fallback */
    auth: computed(() => store.auth ?? authConfig),
    /** Brand config – from store or static fallback */
    brand: computed(() => store.brand ?? brandConfig),
    /** Tenant config – from store or static fallback */
    tenant: computed(() => store.tenant ?? tenantConfig),
    /** API routes config – from store or static fallback */
    apiRoutes: computed(() => store.apiRoutes ?? apiRoutesConfig),
    /** Whether config was successfully fetched (client-only) */
    isReady: computed(() => store.isReady),
    /** Whether config is currently loading */
    isLoading: computed(() => store.isLoading),
    /** Error message if fetch failed */
    error: computed(() => store.error),
  };
}
