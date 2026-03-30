// app/unusedutils/APIClient.ts — not wired; kept for reference
import { $fetch, type FetchOptions } from 'ofetch';
import { createError } from 'nuxt/app';
import { useNotify } from '@/composables/useNotify';
import { useAuthStore } from '@/stores/authStore';

type JsonFetchOptions = FetchOptions<'json'>;

type APIClientOptions = JsonFetchOptions & {
    /**
     * When true, APIClient will attach the proxy access token
     * as Authorization header. Defaults to false.
     */
    authenticated?: boolean;
};

interface NormalizedError {
    statusCode: number;
    statusMessage: string;
    data?: unknown;
}

// 1. Traffic Control State
const inFlightRequests = new Map<string, Promise<unknown>>();
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string | null) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

const buildRequestKey = (url: string, options: APIClientOptions = {}): string => {
    const method = (options.method || 'GET').toUpperCase();
    // Body may be undefined, string or object – stringify consistently for deduping
    const bodyKey =
        options.body === undefined
            ? ''
            : typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);

    return `${method}:${url}:${bodyKey}`;
};

export const APIClient = async <T>(  url: string,  options: APIClientOptions = {} ): Promise<T> => {
    const authStore = useAuthStore();
    const { accessToken, refresh, logout } = authStore;
    const { error: notifyError } = useNotify();

    // 2. Request Deduplication
    const requestKey = buildRequestKey(url, options);
    const existing = inFlightRequests.get(requestKey) as Promise<T> | undefined;
    if (existing) {
        return existing;
    }

    const fetchPromise = (async (): Promise<T> => {
        try {
            return await $fetch<T>(url, {
                ...options,
                // 3. Header Injection
                onRequest({ options }) {
                    const token = accessToken;
                    const { authenticated = false } = options as APIClientOptions;

                    if (token && authenticated) {
                        const existingHeaders = (options.headers ?? {}) as unknown as Record<string, string>;
                        options.headers = {
                            ...existingHeaders,
                            Authorization: `Bearer ${token}`,
                        } as any;
                    }
                },

                // 4. Global Error & Session Management
                async onResponseError({ response, options }) {
                    const status = response.status;
                    const errorData = response._data;
                    const errorMessage =
                        (errorData as { message?: string } | undefined)?.message ||
                        'An unexpected error occurred';

                    // CASE A: Token Expired (401)
                    if (status === 401 && !url.includes('/auth/refresh')) {
                        if (!isRefreshing) {
                            isRefreshing = true;
                            try {
                                const newToken = await refresh(); // Triggers BFF /refresh
                                isRefreshing = false;
                                onTokenRefreshed(newToken);
                            } catch (refreshErr) {
                                isRefreshing = false;
                                onTokenRefreshed(null);
                                await logout(); // Hard logout if refresh fails
                                notifyError('Session expired. Please login again.');
                                return Promise.reject(refreshErr);
                            }
                        }

                        // Wait for refresh and retry
                        return new Promise((resolve, reject) => {
                            subscribeTokenRefresh((token) => {
                                if (!token) {
                                    reject(
                                        createError<NormalizedError>({
                                            statusCode: 401,
                                            statusMessage: 'Session expired',
                                        }),
                                    );
                                    return;
                                }

                                const existingHeaders = (options.headers ?? {}) as unknown as Record<string, string>;
                                resolve(
                                    $fetch(url, {
                                        ...options,
                                        headers: {
                                            ...existingHeaders,
                                            Authorization: `Bearer ${token}`,
                                        } as any,
                                    }),
                                );
                            });
                        });
                    }

                    // CASE B: Global Notification Trigger (400, 429, 500, etc.)
                    // We notify the user globally BUT still throw so the form can handle it
                    if (status === 400 || status === 429 || status >= 500) {
                        notifyError(errorMessage);
                    }

                    // 5. Normalization & Re-throw
                    throw createError<NormalizedError>({
                        statusCode: status,
                        statusMessage: errorMessage,
                        data: errorData,
                    });
                },
            });
        } catch (err: unknown) {
            // Non-response errors: network failure, timeout, invalid JSON, etc.
            if (err && typeof err === 'object' && 'statusCode' in err) {
                throw err; // Already a normalized createError from onResponseError
            }
            const message = err instanceof Error ? err.message : 'Network or data error';
            notifyError(message);
            throw createError({
                statusCode: 0,
                statusMessage: message,
                data: err,
            });
        }
    })().finally(() => {
        inFlightRequests.delete(requestKey);
    });

    inFlightRequests.set(requestKey, fetchPromise);
    return fetchPromise as Promise<T>;
};
