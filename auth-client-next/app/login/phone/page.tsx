"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { useAuthMachine } from "@/auth/state/authMachine";
import { PhoneForm } from "@/components/auth/PhoneForm";
import { useEffect } from "react";

export default function PhonePage() {
  const router = useRouter();
  const [snapshot, send] = useAuthMachine("default");

  useEffect(() => {
    if (snapshot.value === "awaitingOtp") router.push("/login/otp?channel=sms");
  }, [snapshot.value, router]);

  const handleSubmit = (data: { phone: string; tenantId?: string }) => {
    send({ type: "REQUEST_OTP_SMS", payload: data });
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">Sign in with phone</h1>
          <PhoneForm onSubmit={handleSubmit} error={snapshot.context.error} />
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
