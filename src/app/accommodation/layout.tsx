 'use client';
import React from 'react';
import AccommodationNotifications from '@/components/accommodation/notifications';
import { AccommodationProvider } from '@/context/accommodation-context';
export default function AccommodationLayout({ children }: { children: React.ReactNode }) {
  // Do not re-render AppLayout here — Root layout already wraps pages with AppLayout.
  // Return children directly so there's only one shared header/sidebar.
  return (
    <AccommodationProvider>
      <div className="space-y-4">
        <AccommodationNotifications />
        {children}
      </div>
    </AccommodationProvider>
  );
}
