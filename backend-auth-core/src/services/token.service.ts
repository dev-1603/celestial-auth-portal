// src/services/token.service.ts
import { hashPassword, comparePassword } from "../lib/bcrypt";
import { JWTPayload, TokenPair, signTokenPair } from "../lib/jwt";
import {
    buildRefreshCookie,
    buildClearRefreshCookie,
    CookieDescriptor,
} from "../lib/cookie";

export interface LoginTokens {
    accessToken: string;
    refreshCookie: CookieDescriptor;
}

export interface LogoutTokens {
    clearRefreshCookie: CookieDescriptor;
}

export const hashPasswordForUser = (plain: string): Promise<string> =>
    hashPassword(plain);

export const verifyUserPassword = (
    plain: string,
    passwordHash: string,
): Promise<boolean> => comparePassword(plain, passwordHash);

export const issueTokenPair = (payload: JWTPayload): TokenPair =>
    signTokenPair(payload);

export const buildLoginTokens = (payload: JWTPayload): LoginTokens => {
    const pair = issueTokenPair(payload);

    return {
        accessToken: pair.accessToken,
        refreshCookie: buildRefreshCookie(pair.refreshToken),
    };
};

export const buildLogoutTokens = (): LogoutTokens => ({
    clearRefreshCookie: buildClearRefreshCookie(),
});
