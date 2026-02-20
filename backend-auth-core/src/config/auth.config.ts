import { env } from './env.config'

export const authConfig = {
    jwt: {
        accessSecret: env.JWT_ACCESS_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET,
        accessExpiry: env.JWT_ACCESS_EXPIRY,
        refreshExpiry: env.JWT_REFRESH_EXPIRY,
    },

    bcrypt: {
        rounds: Number(env.BCRYPT_ROUNDS),
    },

    authCode: {
        expiryMins: Number(env.AUTH_CODE_EXPIRY_MINS),
    },

    clientSecret: {
        saltRounds: Number(env.CLIENT_SECRET_SALT_ROUNDS),
    },

    // which auth methods are enabled
    methods: {
        email: true,
        phone: false,   // Phase 4
        magic: false,   // Phase 4
        oauth: false,   // Phase 4
        sso: false,   // Phase 4
    },
}

export type AuthConfig = typeof authConfig
