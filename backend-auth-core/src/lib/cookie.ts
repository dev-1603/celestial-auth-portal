export interface RefreshCookieOptions {
    secure?: boolean
    domain?: string
    path?: string
}

export interface CookieDescriptor {
    name: string
    value: string
    options: {
        httpOnly: boolean
        secure: boolean
        sameSite: 'strict' | 'lax'
        path: string
        maxAge?: number
        domain?: string
    }
}

const REFRESH_COOKIE_NAME = 'celestial_refresh_token'

const getDefaultSecure = () => process.env.NODE_ENV === 'production'

export const buildRefreshCookie = (
    token: string,
    opts: RefreshCookieOptions = {},
): CookieDescriptor => {
    const secure = opts.secure ?? getDefaultSecure()

    return {
        name: REFRESH_COOKIE_NAME,
        value: token,
        options: {
            httpOnly: true,
            secure,
            sameSite: 'strict',
            path: opts.path ?? '/',
            maxAge: 7 * 24 * 60 * 60,
            ...(opts.domain ? { domain: opts.domain } : {}),
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
