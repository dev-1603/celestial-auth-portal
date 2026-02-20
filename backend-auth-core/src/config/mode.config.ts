import { env } from './env.config'

export const modeConfig = {
    deploymentMode: env.DEPLOYMENT_MODE as 'standalone' | 'saas',
    authMode: env.AUTH_MODE as 'internal' | 'external',

    isStandalone: env.DEPLOYMENT_MODE !== 'saas',
    isSaas: env.DEPLOYMENT_MODE === 'saas',

    isInternal: env.AUTH_MODE !== 'external',
    isExternal: env.AUTH_MODE === 'external',
} as const

export type ModeConfig = typeof modeConfig
