"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!isMounted) return;
        if (!res.ok) {
          setAuthenticated(false);
          if (pathname !== '/login') {
            router.replace('/login');
          }
        } else {
          setAuthenticated(true);
          if (pathname === '/login') {
            router.replace('/accommodation');
          }
        }
      } catch (e) {
        if (isMounted) {
          setAuthenticated(false);
          if (pathname !== '/login') {
            router.replace('/login');
          }
        }
      } finally {
        if (isMounted) setReady(true);
      }
    }

    checkSession();
    return () => { isMounted = false; };
  }, [pathname, router]);

  if (!ready) return null;
  if (!authenticated) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-muted-foreground text-sm">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
