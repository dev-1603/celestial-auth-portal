/**
 * components/auth/OtpInput.tsx
 * Purpose: 6 single-char inputs for OTP; auto-focus next, backspace focuses previous; onComplete(code).
 * Inputs: length=6, disabled=false, onComplete(code: string). Ref exposes clear().
 * Outputs: Renders inputs; calls onComplete when all 6 filled.
 * Dependencies: React, Tailwind, theme CSS vars.
 */

"use client";

import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

export interface OtpInputRef {
  clear: () => void;
}

interface OtpInputProps {
  length?: number;
  disabled?: boolean;
  onComplete: (code: string) => void;
  className?: string;
}

export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(
  { length = LENGTH, disabled = false, onComplete, className },
  ref
) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = useCallback((i: number) => {
    inputRefs.current[i]?.focus();
  }, []);

  const setValue = useCallback(
    (i: number, v: string) => {
      if (v.length > 1) v = v.slice(-1);
      const next = [...values];
      next[i] = v;
      setValues(next);
      if (v && i < length - 1) focus(i + 1);
      if (next.every((c) => c.length === 1)) onComplete(next.join(""));
    },
    [values, length, focus, onComplete]
  );

  const handleKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !values[i] && i > 0) {
        focus(i - 1);
        const next = [...values];
        next[i - 1] = "";
        setValues(next);
      }
    },
    [values, focus]
  );

  const clear = useCallback(() => {
    setValues(Array(length).fill(""));
    focus(0);
  }, [length, focus]);

  useImperativeHandle(ref, () => ({ clear }), [clear]);

  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[i]}
          disabled={disabled}
          className={cn(
            "h-12 w-12 rounded-md border text-center text-lg font-medium",
            "border-[var(--border)] bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
            "disabled:opacity-50"
          )}
          onChange={(e) => setValue(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
});
