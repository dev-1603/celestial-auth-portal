/**
 * Server-only plugin: hydrate auth store from session restored by auth-restore middleware.
 * Prevents client-side flicker by populating Pinia before the page is sent.
 */

export default defineNuxtPlugin((nuxtApp) => {
  const event = useRequestEvent();
  const authRestore = event?.context?.authRestore as
    | { accessToken: string; user: { id: string; email: string; tenantId?: string; tenantSlug?: string; role?: string } }
    | undefined;

  if (authRestore?.accessToken && authRestore?.user) {
    const store = useAuthStore(nuxtApp.$pinia);
    store.setAuth(authRestore.accessToken, authRestore.user);
  }
});
