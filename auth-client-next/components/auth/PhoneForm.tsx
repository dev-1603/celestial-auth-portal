/**
 * components/auth/PhoneForm.tsx
 * Purpose: Phone input with +[countryCode] prefix (top 10 countries); validate with PhoneOtpRequestSchema; onSubmit({ phone, tenantId }).
 * Inputs: onSubmit(data), error?, loading?.
 * Outputs: Renders form; calls onSubmit with validated data.
 * Dependencies: auth/validation/loginSchemas, Tailwind.
 */

"use client";

import React, { useState } from "react";
import { PhoneOtpRequestSchema } from "@/auth/validation/loginSchemas";
import type { PhoneOtpRequest } from "@/auth/validation/loginSchemas";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "1", label: "US +1" },
  { code: "44", label: "UK +44" },
  { code: "91", label: "IN +91" },
  { code: "86", label: "CN +86" },
  { code: "81", label: "JP +81" },
  { code: "49", label: "DE +49" },
  { code: "33", label: "FR +33" },
  { code: "61", label: "AU +61" },
  { code: "55", label: "BR +55" },
  { code: "52", label: "MX +52" },
];

interface PhoneFormProps {
  onSubmit: (data: PhoneOtpRequest) => void;
  error?: string | null;
  loading?: boolean;
  className?: string;
}

export function PhoneForm({
  onSubmit,
  error: externalError,
  loading = false,
  className,
}: PhoneFormProps) {
  const [countryCode, setCountryCode] = useState("1");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const fullPhone = phone.replace(/\D/g, "");
    const value = `+${countryCode}${fullPhone ? " " + fullPhone : ""}`.trim();
    const result = PhoneOtpRequestSchema.safeParse({
      phone: fullPhone ? `+${countryCode}${fullPhone}` : `+${countryCode}`,
      tenantId: undefined,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.flatten().fieldErrors?.phone?.forEach((m) => (errors.phone = m));
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
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
          Phone number
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={loading}
            className={cn(
              "rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            )}
          >
            {COUNTRY_CODES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="9999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className={cn(
              "flex-1 rounded-md border border-[var(--border)] bg-background px-3 py-2 text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
              fieldErrors.phone && "border-destructive"
            )}
          />
        </div>
        {fieldErrors.phone && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground",
          "hover:opacity-90 disabled:opacity-50"
        )}
      >
        {loading ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}
