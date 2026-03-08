"use client";

import { useEffect, useState } from "react";
import { getTenantConfig } from "@/auth/services/tenantConfigService";
import { getSession } from "@/auth/services/authService";
import { setConfig, setLoading } from "@/auth/store/authConfigStore";
import { setSession } from "@/auth/store/authStore";
import { buildTheme, getCssVars } from "@/design/theme";

export function AuthBoot({ children }: { children: React.ReactNode }) {
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    const tenantId =
      typeof window !== "undefined" && window.location.hostname.startsWith("app.")
        ? window.location.hostname.split(".")[0]
        : "default";

    Promise.all([
      getTenantConfig(tenantId).then((config) => {
        setConfig(config);
        const theme = buildTheme(config.theme);
        const vars = getCssVars(theme);
        if (typeof document !== "undefined") {
          Object.entries(vars).forEach(([k, v]) =>
            document.documentElement.style.setProperty(k, v)
          );
        }
      }),
      getSession().then((resp) => {
        if (resp.user != null) setSession(resp);
      }),
    ]).finally(() => {
      setLoading(false);
      setBootDone(true);
    });
  }, []);

  if (!bootDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
