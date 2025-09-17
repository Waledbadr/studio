"use client";

import React from 'react';
import Link from 'next/link';

export default function AccommodationHomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Accommodation</h1>
      <p className="text-sm text-muted-foreground mt-2">This page is intentionally left blank. Use the sidebar to access the full Residences view.</p>
      <div className="mt-4">
        <Link href="/accommodation/residences" className="text-primary underline">Go to Residences</Link>
      </div>
    </div>
  );
}
