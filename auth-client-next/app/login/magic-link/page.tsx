"use client";

import Link from "next/link";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { useAuthMachine } from "@/auth/state/authMachine";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { useState } from "react";

export default function MagicLinkPage() {
  const [snapshot, send] = useAuthMachine("default");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (data: { email: string; tenantId?: string }) => {
    send({ type: "REQUEST_MAGIC_LINK", payload: data });
    setSubmitted(true);
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">Sign in with magic link</h1>
          <MagicLinkForm
            onSubmit={handleSubmit}
            submitted={submitted}
            error={snapshot.context.error}
          />
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
