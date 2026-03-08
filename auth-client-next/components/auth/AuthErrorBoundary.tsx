"use client";

import React from "react";
import { clearSession } from "@/auth/store/authStore";

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, State> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Auth error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AuthErrorFallback
          onRetry={() => {
            clearSession();
            window.location.href = "/login";
          }}
        />
      );
    }
    return this.props.children;
  }
}

function AuthErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground">Please try again.</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
        >
          Return to login
        </button>
      </div>
    </div>
  );
}
