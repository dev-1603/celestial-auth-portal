"use client";

import { AuthGuard } from "@/routes/guards/authGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
