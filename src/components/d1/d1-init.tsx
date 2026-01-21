"use client";
import { useEffect } from 'react';

export default function D1Init() {
  useEffect(() => {
    const isD1 =
      String(
        (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
      ).toLowerCase() === 'true';
    if (!isD1) return;

    // Cloudflare/D1-only mode; no vendor log suppression needed.
    return;
  }, []);

  return null;
}
