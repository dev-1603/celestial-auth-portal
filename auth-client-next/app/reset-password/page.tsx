"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { resetPassword } from "@/auth/services/authService";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  if (!token) {
    router.replace("/forgot-password");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMatchError(null);
    if (password !== confirm) {
      setMatchError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    resetPassword({ token, password, tenantId: undefined })
      .then(() => router.push("/login?message=PASSWORD_RESET_SUCCESS"))
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed"));
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">Reset password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || matchError) && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {matchError ?? error}
              </div>
            )}
            <div>
              <label htmlFor="rp-password" className="mb-1 block text-sm font-medium text-foreground">New password (min 8)</label>
              <input
                id="rp-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                )}
              />
            </div>
            <div>
              <label htmlFor="rp-confirm" className="mb-1 block text-sm font-medium text-foreground">Confirm password</label>
              <input
                id="rp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                )}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
            >
              Reset password
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-[var(--primary)] hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
