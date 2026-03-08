import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  typescript: { strict: true },

  css: ['~/assets/css/main.css'],
  modules: ['shadcn-nuxt'],

  vite: {
    plugins: [
      (tailwindcss()) as any,
    ],
  },
})
