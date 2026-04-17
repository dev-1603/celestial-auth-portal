import { getAuthConfig } from '../config/auth-config.loader'

export interface RefreshCookieOptions {
    secure?: boolean
    domain?: string
    path?: string
    rememberMe?: boolean
}

export interface CookieDescriptor {
    name: string
    value: string
    options: {
        httpOnly: boolean
        secure: boolean
        sameSite: 'strict' | 'lax' | 'none'
        path: string
        maxAge?: number
        domain?: string
    }
}

const REFRESH_COOKIE_NAME = 'celestial_refresh_token'

const getDefaultSecure = () => process.env.NODE_ENV === 'production'

/**
 * Get session config from auth.json
 */
function getSessionConfig() {
    const config = getAuthConfig()
    return config.session || {}
}

export const buildRefreshCookie = (
    token: string,
    opts: RefreshCookieOptions = {},
): CookieDescriptor => {
    const sessionConfig = getSessionConfig()
    const secure = opts.secure ?? sessionConfig.secure ?? getDefaultSecure()
    const sameSite = sessionConfig.sameSite || 'strict'
    const cookieDomain = opts.domain ?? sessionConfig.cookieDomain ?? undefined
    
    // Calculate maxAge based on rememberMe or config
    let maxAge: number | undefined
    if (opts.rememberMe && sessionConfig.rememberMeMaxAgeDays) {
        maxAge = sessionConfig.rememberMeMaxAgeDays * 24 * 60 * 60
    } else if (sessionConfig.maxAgeDays) {
        maxAge = sessionConfig.maxAgeDays * 24 * 60 * 60
    } else {
        maxAge = 7 * 24 * 60 * 60 // Default 7 days
    }

    return {
        name: REFRESH_COOKIE_NAME,
        value: token,
        options: {
            httpOnly: true,
            secure,
            sameSite: sameSite as 'strict' | 'lax' | 'none',
            path: opts.path ?? '/',
            maxAge,
            ...(cookieDomain ? { domain: cookieDomain } : {}),
        },
    }
}

export const buildClearRefreshCookie = (
    opts: RefreshCookieOptions = {},
): CookieDescriptor => {
    const secure = opts.secure ?? getDefaultSecure()

    return {
        name: REFRESH_COOKIE_NAME,
        value: '',
        options: {
            httpOnly: true,
            secure,
            sameSite: 'strict',
            path: opts.path ?? '/',
            maxAge: 0,
            ...(opts.domain ? { domain: opts.domain } : {}),
        },
    }
}
