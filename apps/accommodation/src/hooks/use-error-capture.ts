"use client";

import { useEffect, useRef, useState } from "react";

export interface CapturedError {
  code?: string;
  message: string;
  stack?: string;
  source?: string;
}

/**
 * Captures the last unhandled error or rejection on the page.
 * Returns the last captured error and a reset function.
 */
export function useErrorCapture() {
  const [lastError, setLastError] = useState<CapturedError | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const onError = (event: ErrorEvent) => {
      if (!mounted.current) return;
      setLastError({
        code: (event as any)?.error?.code || undefined,
        message: event.message || (event.error?.message ?? "Unknown error"),
        stack: event.error?.stack,
        source: event.filename,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (!mounted.current) return;
      const reason: any = event.reason || {};
      setLastError({
        code: reason?.code || undefined,
        message: String(reason?.message || reason || "Unhandled rejection"),
        stack: reason?.stack,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      mounted.current = false;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const reset = () => setLastError(null);
  return { lastError, reset } as const;
}
