/**
 * app/app/page.tsx
 * Purpose: Protected app home — wrapped by AuthGuard in layout.
 */

"use client";

import { AuthGuard } from "@/routes/guards/authGuard";

export default function AppPage() {
  return (
    <AuthGuard>
      <div className="p-4">
        <h1 className="text-xl font-semibold text-foreground">App</h1>
        <p className="text-muted-foreground">You are signed in.</p>
      </div>
    </AuthGuard>
  );
}
