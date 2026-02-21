export const env = {
    PORT: process.env.PORT || "5001",
    NODE_ENV: process.env.NODE_ENV || "development",

    DATABASE_URL: process.env.DATABASE_URL || "",
    DIRECT_URL: process.env.DIRECT_URL || "",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",

    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",

    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || "standalone",
    AUTH_MODE: process.env.AUTH_MODE || "internal",

    SMTP_HOST: process.env.SMTP_HOST || "",
    SMTP_PORT: process.env.SMTP_PORT || "587",
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    SMTP_FROM: process.env.SMTP_FROM || "",

    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || "10",
    AUTH_CODE_EXPIRY_MINS: process.env.AUTH_CODE_EXPIRY_MINS || "5",
    CLIENT_SECRET_SALT_ROUNDS: process.env.CLIENT_SECRET_SALT_ROUNDS || "10",
};
