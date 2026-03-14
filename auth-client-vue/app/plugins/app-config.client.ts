/**
 * App config plugin – fetches all config on initial load (client-side only).
 * Runs early so config is available before auth flows and theme application.
 */
export default defineNuxtPlugin(async () => {
  const appConfigStore = useAppConfigStore();
  await appConfigStore.fetchConfig();
});
