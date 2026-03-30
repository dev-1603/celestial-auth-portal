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
    '~/config': join(_dirname, 'app/config'),
    '~/schema': join(_dirname, 'schema'),
  },

  nitro: {
    alias: {
      '~/config': join(_dirname, 'app/config'),
      '~/schema': join(_dirname, 'schema'),
    },
    storage: {
      /** Access-token session backing store; use driver `redis` in multi-instance deploys. */
      bffSessions: { driver: 'memory' },
    },
  },

  runtimeConfig: {
    authHandshakeSecret: process.env.AUTH_HANDSHAKE_SECRET || '',
    authHandshakeTtlSeconds: 300,
    authProtocol: (process.env.AUTH_PROTOCOL || 'rest') as 'rest' | 'grpc' | 'trpc',
    public: {
      authApiUrl: process.env.NUXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001',
    },
  },

  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/icon', 'shadcn-nuxt', '@pinia/nuxt'],

  vite: {
    plugins: [
      (tailwindcss()) as any,
    ],
  },
})