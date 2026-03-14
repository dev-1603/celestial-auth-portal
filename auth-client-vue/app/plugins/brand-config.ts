/**
 * Brand config – theme is now applied by ThemeHandler via appConfigStore.
 * This plugin is kept for any future brand-related setup (e.g. preload fonts).
 */
export default defineNuxtPlugin(() => {
    // Theme injection moved to ThemeHandler (uses appConfigStore.brand ?? static brandConfig)
});
