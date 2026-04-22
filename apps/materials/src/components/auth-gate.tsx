"use client";

import React, { useEffect, useState } from "react";
import { apiPath } from "@/lib/api-path";

interface Props {
  children: React.ReactNode;
}

export function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      try {
        await fetch(apiPath('/api/auth/me'), { credentials: 'include', cache: 'no-store' });
      } catch (error) {
        // Session check failed; allow the app to render and let client auth guards handle redirect.
      } finally {
        if (mounted) setReady(true);
      }
    }

    verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null; // keep UI clean until auth is ready
  return <>{children}</>;
}
