 'use client';
import React from 'react';
import { AccommodationProvider } from '@/context/accommodation-context';

export default function AccommodationLayout({ children }: { children: React.ReactNode }) {
  // Do not re-render AppLayout here — Root layout already wraps pages with AppLayout.
  // Return children directly so there's only one shared header/sidebar.
  // Notifications are now handled via the bell icon in the main header
  return (
    <AccommodationProvider>
      {children}
    </AccommodationProvider>
  );
}
