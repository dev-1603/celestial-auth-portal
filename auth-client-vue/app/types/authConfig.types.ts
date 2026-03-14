/**
 * Enum for responsive icon visibility logic.
 */
export enum IconVisibility {
    Mobile = 'mobile',
    Tablet = 'tablet',
    Desktop = 'desktop',
    LtTablet = 'lt-tablet',
    LtDesktop = 'lt-desktop',
    GtMobile = 'gt-mobile',
    GtTablet = 'gt-tablet',
    Always = 'always', // for true
    Never = 'never', // for false
}

export type SignupMode = 'open' | 'invite_only' | 'disabled';
export type MfaPolicy = 'required' | 'optional' | 'disabled';

// --- Sub-Interfaces ---

export interface PasswordPolicy {
    minLength: number;
    requireUpper: boolean;
    requireLower: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
    allowCommon: boolean;
    maxAgeDays: number;
    historyCount: number;
    lockoutThreshold: number;
    lockoutMinutes: number;
}

export interface MfaConfig {
    required: boolean;
    policy: MfaPolicy;
    methods: ('totp' | 'sms' | 'webauthn')[];
}

export interface AuthProvider {
    id: string;
    displayName: string;
    logo: string;
    buttonVariant: 'primary' | 'outline' | 'secondary' | string;
    color: string;
    iconOnly: IconVisibility | boolean; // Supports the enum or legacy boolean
    customDisplayName: string | false;
    enabled: boolean;
}

export interface MethodsConfig {
    email_password?: { enabled: boolean; allowSignup: boolean };
    email_otp?: { enabled: boolean; digits: number; expiryMinutes: number; maxAttempts: number };
    magic_link?: { enabled: boolean; expiryMinutes: number; allowedDomains: string[] };
    phone_sms_otp?: { enabled: boolean; digits: number; expiryMinutes: number; maxAttempts: number; provider: string; fromNumber: string };
    qr_login?: { enabled: boolean; sessionExpirySeconds: number };
    telegram?: { enabled: boolean; botName: string };
    whatsapp?: { enabled: boolean; provider: string };
    passkey?: { enabled: boolean; userVerification: 'required' | 'preferred' | 'discouraged' };
}

// --- Main Root Interface ---

export interface AuthConfig {
    methodIcons: Record<string, string>;
    enabledMethods: string[];
    defaultMethod: string;
    signupMode: SignupMode;
    passwordPolicy: PasswordPolicy;
    emailVerification: boolean;
    requireVerifiedEmail: boolean;
    mfa: MfaConfig;
    methodsConfig: MethodsConfig;
    ui: {
        providerIconOnly: boolean;
    };
    providers: {
        oauth: AuthProvider[];
        sso: AuthProvider[];
    };
    rateLimits: {
        loginAttempts: number;
        windowMinutesLogin: number;
        resetRequests: number;
        windowMinutesReset: number;
        otpRequests: number;
        windowMinutesOtp: number;
        perIp: number;
        perUser: number;
    };
    session: {
        maxAgeDays: number;
        idleTimeoutMinutes: number;
        sameSite: 'strict' | 'lax' | 'none';
        secure: boolean;
        cookieDomain: string | null;
        refreshTokenRotation: boolean;
        rememberMeMaxAgeDays: number;
    };
    redirects: Record<string, string>;
    security: {
        requestHeaders: Array<{
            name: string;
            value?: string;
            source: 'static' | 'generate-uuid' | string;
        }>;
    };
}