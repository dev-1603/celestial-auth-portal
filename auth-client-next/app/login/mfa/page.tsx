"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestGuard } from "@/routes/guards/guestGuard";
import { useAuthMachine } from "@/auth/state/authMachine";
import { MfaForm } from "@/components/auth/MfaForm";

export default function MfaPage() {
  const router = useRouter();
  const [snapshot, send] = useAuthMachine("default");

  const handleSubmit = (data: { code: string }) => {
    send({ type: "VERIFY_MFA", payload: { code: data.code, tenantId: snapshot.context.tenantId } });
  };

  if (snapshot.value === "authenticated") router.push("/app");

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <MfaForm onSubmit={handleSubmit} error={snapshot.context.error} />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="#" className="text-[var(--primary)] hover:underline">
              Having trouble?
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
