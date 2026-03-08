/**
 * OAuth composable – enabled providers from config, redirectToProvider(providerId).
 */

import { authConfig } from "../../config/authConfig";
import { getOauthAuthorizeUrl } from "../services/authClientService";

export type OauthProvider = {
  id: string;
  enabled: boolean;
  displayName: string;
  logo: string;
  buttonVariant: string;
};

export function useOauth() {
  const enabledProviders = computed<OauthProvider[]>(() => {
    const list = authConfig.providers?.oauth ?? [];
    return Array.isArray(list) ? list.filter((p: OauthProvider) => p.enabled) : [];
  });

  async function redirectToProvider(providerId: string) {
    const url = await getOauthAuthorizeUrl(providerId);
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }

  return {
    enabledProviders,
    redirectToProvider,
  };
}
