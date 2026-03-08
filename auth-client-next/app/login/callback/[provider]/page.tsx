"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuthMachine } from "@/auth/state/authMachine";
import { useEffect } from "react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const provider = params.provider as string;
  const [snapshot, send] = useAuthMachine("default");

  useEffect(() => {
    if (!provider) return;
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    send({ type: "OAUTH_CALLBACK", payload: { provider, query } });
  }, [provider, searchParams, send]);

  useEffect(() => {
    if (snapshot.value === "authenticated") router.replace("/app");
    if (snapshot.value === "mfaRequired") router.replace("/login/mfa");
    if (snapshot.context.error && snapshot.value === "primaryLogin") {
      router.replace(`/login?error=OAUTH_FAILED`);
    }
  }, [snapshot.value, snapshot.context.error, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center text-muted-foreground">Completing sign in…</div>
    </div>
  );
}
