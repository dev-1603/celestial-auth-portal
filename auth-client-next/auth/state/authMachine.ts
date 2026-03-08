/**
 * auth/state/authMachine.ts
 * Purpose: XState v5 auth flow — anonymous → primaryLogin → awaitingOtp | mfaRequired | authenticated.
 * Inputs: Context (tenantId, user, error, otpChannel, mfaPending); events (LOGIN_WITH_PASSWORD, etc.).
 * Outputs: Machine and useAuthMachine() hook; all state transitions go through this machine.
 * Dependencies: xstate, xstate/actors, auth/types, auth/services/authService, auth/store/authStore.
 */

import { setup, assign } from "xstate";
import { fromPromise } from "xstate/actors";
import type { LoginResponse } from "@/auth/types";
import type { AuthContext, AuthEvent, OtpChannel } from "./authMachine.types";
import * as authService from "@/auth/services/authService";
import { setSession, clearSession } from "@/auth/store/authStore";

type DoneEventWithOutput = { output: LoginResponse };

const loginWithPasswordActor = fromPromise(
  async ({ input }: { input: { email: string; password: string; tenantId?: string } }) => {
    return authService.loginWithPassword(input) as Promise<LoginResponse>;
  }
);

const requestMagicLinkActor = fromPromise(
  async ({ input }: { input: { email: string; tenantId?: string } }) => {
    await authService.requestMagicLink(input);
    return {};
  }
);

const requestEmailOtpActor = fromPromise(
  async ({ input }: { input: { email: string; tenantId?: string } }) => {
    return authService.requestEmailOtp(input);
  }
);

const requestSmsOtpActor = fromPromise(
  async ({ input }: { input: { phone: string; tenantId?: string } }) => {
    return authService.requestSmsOtp(input);
  }
);

const verifyOtpActor = fromPromise(
  async ({
    input,
  }: {
    input: { identifier: string; code: string; channel: OtpChannel; tenantId?: string };
  }) => {
    if (input.channel === "email") return authService.verifyEmailOtp(input);
    return authService.verifySmsOtp(input);
  }
);

const handleOAuthCallbackActor = fromPromise(
  async ({
    input,
  }: {
    input: { provider: string; query: Record<string, string> };
  }) => authService.handleOAuthCallback(input.provider, input.query)
);

const verifyMfaActor = fromPromise(
  async ({ input }: { input: { code?: string; tenantId?: string } }) =>
    authService.verifyMfa(input)
);

const authMachineSetup = setup({
  types: {} as {
    context: AuthContext;
    events: AuthEvent;
    input: { tenantId: string };
  },
  actors: {
    loginWithPassword: loginWithPasswordActor,
    requestMagicLink: requestMagicLinkActor,
    requestEmailOtp: requestEmailOtpActor,
    requestSmsOtp: requestSmsOtpActor,
    verifyOtp: verifyOtpActor,
    handleOAuthCallback: handleOAuthCallbackActor,
    verifyMfa: verifyMfaActor,
  },
  actions: {
    clearError: assign({ error: null }),
    setErrorFromEvent: assign({
      error: (args: { event?: { data?: { message?: string } } }) =>
        args.event?.data?.message ?? "An error occurred",
    } as any),
    setSessionAction: ((args: { event?: { output?: LoginResponse } }) => {
      if (args.event?.output) setSession(args.event.output);
    }) as any,
    clearSessionAction: () => {
      clearSession();
      authService.logout().catch(() => {});
    },
    setOtpChannelEmail: assign({ otpChannel: "email" as OtpChannel }),
    setOtpChannelSms: assign({ otpChannel: "sms" as OtpChannel }),
  },
}).createMachine({
  id: "auth",
  context: ({ input }): AuthContext => ({
    tenantId: input?.tenantId ?? "default",
    user: null,
    error: null,
    otpChannel: null,
    mfaPending: false,
  }),
  initial: "anonymous",
  states: {
    anonymous: {
      on: {
        GO_TO_LOGIN: { target: "primaryLogin", actions: "clearError" },
      },
    },
    primaryLogin: {
      on: {
        LOGIN_WITH_PASSWORD: {
          target: "primaryLogin",
          actions: "clearError",
          invoke: {
            src: "loginWithPassword",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "LOGIN_WITH_PASSWORD"
                ? {
                    email: event.payload.email,
                    password: event.payload.password,
                    tenantId: event.payload.tenantId,
                  }
                : { email: "", password: "" },
            onDone: [
              {
                target: "authenticated",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "SUCCESS",
                actions: ["setSessionAction"],
              },
              {
                target: "mfaRequired",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "MFA_REQUIRED",
                actions: ["setSessionAction"],
              },
              {
                target: "primaryLogin",
                actions: ["setSessionAction"],
              },
            ],
            onError: {
              target: "primaryLogin",
              actions: "setErrorFromEvent",
            },
          },
        },
        REQUEST_MAGIC_LINK: {
          target: "primaryLogin",
          invoke: {
            src: "requestMagicLink",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "REQUEST_MAGIC_LINK"
                ? { email: event.payload.email, tenantId: event.payload.tenantId }
                : { email: "" },
            onDone: { target: "primaryLogin" },
            onError: { target: "primaryLogin", actions: "setErrorFromEvent" },
          },
        },
        START_OAUTH: {
          actions: ({ event }) => {
            if (event.type === "START_OAUTH")
              authService.startOAuth(event.payload.provider, event.payload.tenantId);
          },
        },
        NAVIGATE_MAGIC_LINK: {},
        NAVIGATE_PHONE: {},
        REQUEST_OTP_EMAIL: {
          target: "primaryLogin",
          invoke: {
            src: "requestEmailOtp",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "REQUEST_OTP_EMAIL"
                ? { email: event.payload.email, tenantId: event.payload.tenantId }
                : { email: "" },
            onDone: {
              target: "awaitingOtp",
              actions: "setOtpChannelEmail",
            },
            onError: { target: "primaryLogin", actions: "setErrorFromEvent" },
          },
        },
        REQUEST_OTP_SMS: {
          target: "primaryLogin",
          invoke: {
            src: "requestSmsOtp",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "REQUEST_OTP_SMS"
                ? { phone: event.payload.phone, tenantId: event.payload.tenantId }
                : { phone: "" },
            onDone: {
              target: "awaitingOtp",
              actions: "setOtpChannelSms",
            },
            onError: { target: "primaryLogin", actions: "setErrorFromEvent" },
          },
        },
        OAUTH_CALLBACK: {
          target: "primaryLogin",
          invoke: {
            src: "handleOAuthCallback",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "OAUTH_CALLBACK"
                ? { provider: event.payload.provider, query: event.payload.query }
                : { provider: "", query: {} },
            onDone: [
              {
                target: "authenticated",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "SUCCESS",
                actions: ["setSessionAction"],
              },
              {
                target: "mfaRequired",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "MFA_REQUIRED",
                actions: ["setSessionAction"],
              },
              {
                target: "primaryLogin",
                actions: ["setSessionAction"],
              },
            ],
            onError: { target: "primaryLogin", actions: "setErrorFromEvent" },
          },
        },
      },
    },
    awaitingOtp: {
      on: {
        VERIFY_OTP: {
          target: "awaitingOtp",
          invoke: {
            src: "verifyOtp",
            input: ({ context, event }: { context: AuthContext; event: AuthEvent }) =>
              event.type === "VERIFY_OTP"
                ? {
                    identifier: event.payload.identifier,
                    code: event.payload.code,
                    channel: context.otpChannel ?? "email",
                    tenantId: event.payload.tenantId,
                  }
                : { identifier: "", code: "", channel: "email" as OtpChannel },
            onDone: [
              {
                target: "authenticated",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "SUCCESS",
                actions: ["setSessionAction"],
              },
              {
                target: "mfaRequired",
                guard: ({ event }: { event: DoneEventWithOutput }) => event.output?.nextStep === "MFA_REQUIRED",
                actions: ["setSessionAction"],
              },
              {
                target: "awaitingOtp",
                actions: ["setSessionAction"],
              },
            ],
            onError: { target: "awaitingOtp", actions: "setErrorFromEvent" },
          },
        },
      },
    },
    mfaRequired: {
      on: {
        VERIFY_MFA: {
          target: "mfaRequired",
          invoke: {
            src: "verifyMfa",
            input: ({ event }: { event: AuthEvent }) =>
              event.type === "VERIFY_MFA"
                ? { code: event.payload.code, tenantId: event.payload.tenantId }
                : {},
            onDone: {
              target: "authenticated",
              actions: ["setSessionAction"],
            },
            onError: { target: "mfaRequired", actions: "setErrorFromEvent" },
          },
        },
      },
    },
    authenticated: {
      on: {
        LOGOUT: {
          target: "anonymous",
          actions: "clearSessionAction",
        },
      },
    },
    error: {
      on: {
        RETRY: { target: "primaryLogin", actions: "clearError" },
      },
    },
  },
});

export const authMachine = authMachineSetup;

export type AuthMachine = typeof authMachine;

// ——— React hook (Step 15) ———
import { createActor } from "xstate";
import { useRef, useState, useEffect } from "react";

export function useAuthMachine(tenantId?: string) {
  const actorRef = useRef<ReturnType<typeof createActor<typeof authMachine>> | null>(null);
  if (!actorRef.current) {
    actorRef.current = createActor(authMachine, {
      input: { tenantId: tenantId ?? "default" },
    });
    actorRef.current.start();
  }
  const actor = actorRef.current;
  const [snapshot, setSnapshot] = useState(actor.getSnapshot());
  useEffect(() => {
    const sub = actor.subscribe(setSnapshot);
    return () => sub.unsubscribe();
  }, [actor]);
  return [snapshot, actor.send] as const;
}
