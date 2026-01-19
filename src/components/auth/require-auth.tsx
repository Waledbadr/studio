"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, refreshMe, User } from '@/lib/auth-shim';
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Subscribe once; changes propagate via polling inside the shim.
    const unsub = onAuthStateChanged(null, (u) => {
      if (!isMounted) return;
      setUser(u);
    });

    // Initial check: wait for /api/auth/me so we don't redirect based on the initial null.
    setReady(false);
    void refreshMe()
      .then((u) => {
        if (!isMounted) return;
        setUser(u);
      })
      .finally(() => {
        if (!isMounted) return;
        setReady(true);
      });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [ready, user, pathname, router]);

  // While determining auth state, render nothing to avoid layout shift
  if (!ready) return null;

  // If auth is ready but no user, don't render protected UI
  if (!user) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-muted-foreground text-sm">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
