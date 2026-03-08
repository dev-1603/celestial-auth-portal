/**
 * components/auth/MfaForm.tsx
 * Purpose: MFA code entry using OtpInput; onSubmit({ code }); error banner, loading disables input.
 * Inputs: onSubmit({ code }), error?, loading?.
 * Outputs: Renders heading + OtpInput; calls onSubmit when 6 digits entered.
 * Dependencies: components/auth/OtpInput, Tailwind.
 */

"use client";

import React from "react";
import { OtpInput } from "./OtpInput";
import { cn } from "@/lib/utils";

interface MfaFormProps {
  onSubmit: (data: { code: string }) => void;
  error?: string | null;
  loading?: boolean;
  className?: string;
}

export function MfaForm({
  onSubmit,
  error: externalError,
  loading = false,
  className,
}: MfaFormProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-medium text-foreground">
        Enter the 6-digit code from your authenticator app.
      </h2>
      {externalError && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {externalError}
        </div>
      )}
      <OtpInput
        length={6}
        disabled={loading}
        onComplete={(code) => onSubmit({ code })}
      />
    </div>
  );
}
