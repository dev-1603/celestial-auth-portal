/**
 * components/auth/MagicLinkForm.tsx
 * Purpose: Single email field; validate with MagicLinkRequestSchema; onSubmit(data); submitted shows "Check your inbox".
 * Inputs: onSubmit(data), submitted?, error?.
 * Outputs: Renders form or success message.
 * Dependencies: auth/validation/loginSchemas, Tailwind.
 */

"use client";

import React, { useState } from "react";
import { MagicLinkRequestSchema } from "@/auth/validation/loginSchemas";
import type { MagicLinkRequest } from "@/auth/validation/loginSchemas";
import { cn } from "@/lib/utils";

interface MagicLinkFormProps {
  onSubmit: (data: MagicLinkRequest) => void;
  submitted?: boolean;
  error?: string | null;
  className?: string;
}

export function MagicLinkForm({
  onSubmit,
  submitted = false,
  error: externalError,
  className,
}: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = MagicLinkRequestSchema.safeParse({ email, tenantId: undefined });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.flatten().fieldErrors?.email?.forEach((m) => (errors.email = m));
      setFieldErrors(errors);
      return;
    }
    onSubmit(result.data);
  };

  if (submitted) {
    return (
      <div className={cn("rounded-md border border-[var(--border)] bg-muted/50 p-4 text-center", className)}>
        <p className="font-medium text-foreground">Check your inbox</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a magic link to <strong>{email || "your email"}</strong>. Click it to sign in.
        </p>
      </div>
    );
  }

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
        <label htmlFor="magic-email" className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="magic-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      <button
        type="submit"
        className={cn(
          "w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground",
          "hover:opacity-90"
        )}
      >
        Send magic link
      </button>
    </form>
  );
}
