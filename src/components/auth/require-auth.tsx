"use client";

import { ReactNode, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      // If auth isn't configured, let the app load (local mode)
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      if (!u && pathname !== "/login") {
        router.replace("/login");
      }
      if (u && pathname === "/login") {
        router.replace("/");
      }
    });
    return () => unsub();
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
