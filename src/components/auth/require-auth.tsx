"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User, hasFetchedAuthOnce, hasSessionHint } from '@/lib/auth-shim';
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Subscribe to auth state changes; onAuthStateChanged already calls fetchMe() once
    const unsub = onAuthStateChanged(null, (u) => {
      if (!isMounted) return;
      setUser(u);
      const fetched = hasFetchedAuthOnce();
      const sessionHint = hasSessionHint();
      // Mark ready only after we've fetched auth once, or if there's no session hint
      if (!hasCheckedInitial) {
        setHasCheckedInitial(true);
      }
      if (fetched || !sessionHint || u) {
        setReady(true);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [hasCheckedInitial]);

  useEffect(() => {
    if (!ready || !hasCheckedInitial) return;
    // Only redirect after initial check is complete and we're sure there's no user
    if (!user && pathname !== "/login") {
      const qs = (() => {
        try {
          const s = searchParams?.toString();
          return s ? `?${s}` : '';
        } catch {
          return '';
        }
      })();
      const next = `${pathname}${qs}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
  }, [ready, user, pathname, router, searchParams, hasCheckedInitial]);

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
