"use client";

import Link from "next/link";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { requestPasswordReset } from "@/auth/services/authService";
import { ForgotPasswordSchema } from "@/auth/validation/loginSchemas";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const result = ForgotPasswordSchema.safeParse({ email, tenantId: undefined });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.flatten().fieldErrors?.email?.forEach((m) => (errors.email = m));
      setFieldErrors(errors);
      return;
    }
    requestPasswordReset(result.data)
      .then(() => setSuccess(true))
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed"));
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">Forgot password</h1>
          {success ? (
            <div className="rounded-md border border-[var(--border)] bg-muted/50 p-4 text-center">
              <p className="font-medium text-foreground">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a reset link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="fp-email" className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
                    fieldErrors.email && "border-destructive"
                  )}
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>}
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
              >
                Send reset link
              </button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-[var(--primary)] hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
