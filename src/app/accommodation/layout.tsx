'use client';
import React from 'react';
export default function AccommodationLayout({ children }: { children: React.ReactNode }) {
  // Do not re-render AppLayout here — Root layout already wraps pages with AppLayout.
  // Return children directly so there's only one shared header/sidebar.
  return <>{children}</>;
}
