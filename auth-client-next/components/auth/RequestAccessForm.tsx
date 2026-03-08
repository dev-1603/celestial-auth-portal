/**
 * components/auth/RequestAccessForm.tsx
 * Purpose: Request access form — name?, email, company?, message?; validate with SignupRequestSchema; onSubmit(data).
 * Inputs: onSubmit(data), submitted?, error?.
 * Outputs: Renders form or "We'll be in touch" success.
 * Dependencies: auth/validation/loginSchemas, Tailwind.
 */

"use client";

import React, { useState } from "react";
import { SignupRequestSchema } from "@/auth/validation/loginSchemas";
import type { SignupRequest } from "@/auth/validation/loginSchemas";
import { cn } from "@/lib/utils";

interface RequestAccessFormProps {
  onSubmit: (data: SignupRequest) => void;
  submitted?: boolean;
  error?: string | null;
  className?: string;
}

export function RequestAccessForm({
  onSubmit,
  submitted = false,
  error: externalError,
  className,
}: RequestAccessFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = SignupRequestSchema.safeParse({
      email,
      name: name || undefined,
      company: company || undefined,
      message: message || undefined,
      tenantId: undefined,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      const flat = result.error.flatten().fieldErrors;
      Object.entries(flat).forEach(([k, v]) => { if (v?.[0]) errors[k] = v[0]; });
      setFieldErrors(errors);
      return;
    }
    onSubmit(result.data);
  };

  if (submitted) {
    return (
      <div className={cn("rounded-md border border-[var(--border)] bg-muted/50 p-4 text-center", className)}>
        <p className="font-medium text-foreground">We&apos;ll be in touch</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your request has been submitted. We&apos;ll contact you soon.
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
        <label htmlFor="ra-name" className="mb-1 block text-sm font-medium text-foreground">
          Name (optional)
        </label>
        <input
          id="ra-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(
            "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          )}
        />
      </div>
      <div>
        <label htmlFor="ra-email" className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="ra-email"
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
      <div>
        <label htmlFor="ra-company" className="mb-1 block text-sm font-medium text-foreground">
          Company (optional)
        </label>
        <input
          id="ra-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={cn(
            "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          )}
        />
      </div>
      <div>
        <label htmlFor="ra-message" className="mb-1 block text-sm font-medium text-foreground">
          Message (optional)
        </label>
        <textarea
          id="ra-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(
            "w-full rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          )}
        />
      </div>
      <button
        type="submit"
        className={cn(
          "w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground",
          "hover:opacity-90"
        )}
      >
        Request access
      </button>
    </form>
  );
}
