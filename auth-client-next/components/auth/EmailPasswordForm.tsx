/**
 * components/auth/EmailPasswordForm.tsx
 * Purpose: Login form — email, password (show/hide), rememberMe; validate with LoginWithPasswordSchema; onSubmit(data).
 * Inputs: onSubmit(data), error?, loading?.
 * Outputs: Renders form; calls onSubmit with validated data; shows Zod errors and error banner.
 * Dependencies: auth/validation/loginSchemas, Zod, Tailwind, theme.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LoginWithPasswordSchema } from "@/auth/validation/loginSchemas";
import type { LoginWithPassword } from "@/auth/validation/loginSchemas";
import { cn } from "@/lib/utils";

interface EmailPasswordFormProps {
  onSubmit: (data: LoginWithPassword) => void;
  error?: string | null;
  loading?: boolean;
  className?: string;
}

export function EmailPasswordForm({
  onSubmit,
  error: externalError,
  loading = false,
  className,
}: EmailPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = LoginWithPasswordSchema.safeParse({
      email,
      password,
      tenantId: undefined,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.flatten().fieldErrors?.email?.forEach((m) => (errors.email = m));
      result.error.flatten().fieldErrors?.password?.forEach((m) => (errors.password = m));
      setFieldErrors(errors);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {externalError && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {externalError}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={cn(
            "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
            fieldErrors.email && "border-destructive"
          )}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className={cn(
              "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 pr-10 text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
              fieldErrors.password && "border-destructive"
            )}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="rounded border-[var(--border)]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground",
          "hover:opacity-90 disabled:opacity-50"
        )}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
