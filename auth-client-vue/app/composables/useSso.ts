/**
 * SSO composable – enabled SSO providers from config, redirectToSsoProvider(providerId).
 * Backend BFF route: /api/auth/sso/:provider/initiate (add when backend supports).
 */

import { authConfig } from '../config/authConfig';

export type SsoProvider = {
  id: string;
  type?: string;
  enabled: boolean;
  displayName: string;
  logo: string;
  /** Brand color (hex) for monotone icons. */
  color?: string;
  /** Responsive: true/false, or boundary (e.g. lt-tablet, gt-tablet). */
  iconOnly?: string | boolean;
};

export function useSso() {
  const enabledSsoProviders = computed<SsoProvider[]>(() => {
    const list = authConfig.providers?.sso ?? [];
    return Array.isArray(list) ? list.filter((p: SsoProvider) => p.enabled) : [];
  });

  function redirectToSsoProvider(providerId: string) {
    const url = `/api/auth/sso/${encodeURIComponent(providerId)}/initiate`;
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }

  return {
    enabledSsoProviders,
    redirectToSsoProvider,
  };
}
