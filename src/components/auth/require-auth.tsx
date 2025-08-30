"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setReady(true);
        if (pathname !== "/login") {
          router.replace("/login");
        }
        return;
      }

      try {
        // Validate token with API
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json() as { user: any };
          setUser(userData.user);
          if (pathname === "/login") {
            router.replace("/");
          }
        } else {
          // Token invalid, remove it
          localStorage.removeItem('auth_token');
          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('auth_token');
        if (pathname !== "/login") {
          router.replace("/login");
        }
      }

      setReady(true);
    };

    checkAuth();
  }, [router, pathname]);

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
