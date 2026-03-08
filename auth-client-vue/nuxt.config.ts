import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  typescript: { strict: true },

  alias: {
    '~/config': join(_dirname, 'config'),
    '~/schema': join(_dirname, 'schema'),
  },

  nitro: {
    alias: {
      '~/config': join(_dirname, 'config'),
      '~/schema': join(_dirname, 'schema'),
    },
  },

  runtimeConfig: {
    public: {
      authApiUrl: process.env.NUXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001',
    },
  },

  css: ['~/assets/css/main.css'],
  modules: ['shadcn-nuxt'],

  vite: {
    plugins: [
      (tailwindcss()) as any,
    ],
  },
})
