/**
 * OAuth composable – enabled providers from config, redirectToProvider(providerId).
 */

import { authConfig } from "../config/authConfig";
import { getOauthAuthorizeUrl } from "../services/authClientService";

export type OauthProvider = {
  id: string;
  enabled: boolean;
  displayName: string;
  logo: string;
  buttonVariant: string;
  /** Brand color (hex) for monotone icons. */
  color?: string;
  /** Responsive: true/false, or boundary (e.g. lt-tablet, gt-tablet). */
  iconOnly?: string | boolean;
};

export function useOauth() {
  const enabledProviders = computed<OauthProvider[]>(() => {
    const list = authConfig.providers?.oauth ?? [];
    return Array.isArray(list) ? list.filter((p: OauthProvider) => p.enabled) : [];
  });

  function redirectToProvider(providerId: string) {
    const url = getOauthAuthorizeUrl(providerId);
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }

  return {
    enabledProviders,
    redirectToProvider,
  };
}
