"use client";
import { useEffect } from 'react';

export default function D1Init() {
  useEffect(() => {
    const isD1 =
      String(
        (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
      ).toLowerCase() === 'true';
    if (!isD1) return;

    const origWarn = console.warn.bind(console);
    const origLog = console.log.bind(console);
    const origError = console.error.bind(console);

    console.warn = (...args: any[]) => {
      try {
        const msg = args[0] || '';
        if (typeof msg === 'string' && /Firebase not configured|Firebase initialization|Firestore|D1 Database binding missing|Cloudflare D1/.test(msg)) return;
      } catch (e) {}
      origWarn(...args);
    };

    console.log = (...args: any[]) => {
      try {
        const msg = args[0] || '';
        if (typeof msg === 'string' && /Firebase initialized|Skipping Firebase initialization/.test(msg)) return;
      } catch (e) {}
      origLog(...args);
    };

    // Global error handler to swallow explicit Firebase config error thrown elsewhere
    function onWindowError(e: ErrorEvent) {
      try {
        if (e.message && /Firebase is not configured/.test(e.message)) {
          e.stopImmediatePropagation();
          e.preventDefault();
          return true;
        }
      } catch (er) {}
      return false;
    }

    window.addEventListener('error', onWindowError as any, true);

    return () => {
      window.removeEventListener('error', onWindowError as any, true);
      console.warn = origWarn;
      console.log = origLog;
      console.error = origError;
    };
  }, []);

  return null;
}
