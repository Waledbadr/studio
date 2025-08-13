"use client";

import React, { useEffect, useState } from "react";
import { auth, authReady } from "@/lib/firebase";

interface Props {
  children: React.ReactNode;
}

export function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const p = auth ? authReady : Promise.resolve();
    p.catch(() => {}).finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null; // keep UI clean until auth is ready
  return <>{children}</>;
}
