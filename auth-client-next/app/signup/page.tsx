"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { useAuthConfigStore } from "@/auth/store/authConfigStore";
import { signupWithPassword } from "@/auth/services/authService";
import { RequestAccessForm } from "@/components/auth/RequestAccessForm";
import { SignupSchema } from "@/auth/validation/loginSchemas";
import type { SignupRequest } from "@/auth/validation/loginSchemas";
import type { Signup } from "@/auth/validation/loginSchemas";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const config = useAuthConfigStore((s) => s.config);
  const signupMode = config?.signupMode ?? "OPEN";
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignupWithPassword = async (data: Signup) => {
    setError(null);
    try {
      const resp = await signupWithPassword(data);
      if (resp.nextStep === "SUCCESS" || resp.user) router.push("/app");
      else setError(resp.message ?? "Signup failed");
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Signup failed");
    }
  };

  const handleRequestAccess = async (data: SignupRequest) => {
    setError(null);
    try {
      await fetch("/api/auth/signup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setRequestSubmitted(true);
    } catch {
      setError("Request failed");
    }
  };

  if (signupMode === "CLOSED") {
    return (
      <GuestGuard>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm space-y-4 text-center">
            <h1 className="text-xl font-semibold text-foreground">Sign up</h1>
            <p className="text-muted-foreground">
              Signups are not available. Contact your admin.
            </p>
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </GuestGuard>
    );
  }

  if (signupMode === "INVITE_ONLY") {
    return (
      <GuestGuard>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm space-y-4">
            <h1 className="text-center text-xl font-semibold text-foreground">Request access</h1>
            <RequestAccessForm
              onSubmit={handleRequestAccess}
              submitted={requestSubmitted}
              error={error}
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

  return (
    <GuestGuard>
      <OpenSignupForm onSubmit={handleSignupWithPassword} error={error} />
    </GuestGuard>
  );
}

function OpenSignupForm({
  onSubmit,
  error: externalError,
}: {
  onSubmit: (data: Signup) => void;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = SignupSchema.safeParse({ email, password, name, tenantId: undefined });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.flatten().fieldErrors?.email?.forEach((m) => (errors.email = m));
      result.error.flatten().fieldErrors?.password?.forEach((m) => (errors.password = m));
      result.error.flatten().fieldErrors?.name?.forEach((m) => (errors.name = m));
      setFieldErrors(errors);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-semibold text-foreground">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {externalError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {externalError}
            </div>
          )}
          <div>
            <label htmlFor="su-name" className="mb-1 block text-sm font-medium text-foreground">Name (optional)</label>
            <input
              id="su-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn("w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]")}
            />
          </div>
          <div>
            <label htmlFor="su-email" className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn("w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]", fieldErrors.email && "border-destructive")}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="su-password" className="mb-1 block text-sm font-medium text-foreground">Password (min 8)</label>
            <input
              id="su-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn("w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]", fieldErrors.password && "border-destructive")}
            />
            {fieldErrors.password && <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>}
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Sign up
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-[var(--primary)] hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
