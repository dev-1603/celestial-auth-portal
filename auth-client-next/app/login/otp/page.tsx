"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { useAuthMachine } from "@/auth/state/authMachine";
import { OtpInput } from "@/components/auth/OtpInput";
import { useState, useCallback } from "react";

type Channel = "email" | "sms" | "whatsapp";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = (searchParams.get("channel") as Channel) || "email";
  const [snapshot, send] = useAuthMachine("default");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleComplete = useCallback(
    (code: string) => {
      const identifier =
        channel === "email"
          ? snapshot.context.user?.email ?? ""
          : "";
      send({
        type: "VERIFY_OTP",
        payload: { identifier, code, channel, tenantId: snapshot.context.tenantId },
      });
    },
    [channel, send, snapshot.context.tenantId, snapshot.context.user?.email]
  );

  if (snapshot.value === "authenticated") router.push("/app");
  if (snapshot.value === "mfaRequired") router.push("/login/mfa");

  const channelLabel =
    channel === "email" ? "email" : channel === "sms" ? "SMS" : "WhatsApp";

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">
            Enter the code sent to your {channelLabel}
          </h1>
          <OtpInput onComplete={handleComplete} />
          {snapshot.context.error && (
            <p className="text-center text-sm text-destructive">{snapshot.context.error}</p>
          )}
          {resendCooldown > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Resend available in {resendCooldown}s
            </p>
          ) : (
            <button
              type="button"
              className="text-center text-sm text-[var(--primary)] hover:underline"
              onClick={() => setResendCooldown(60)}
            >
              Resend code
            </button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
