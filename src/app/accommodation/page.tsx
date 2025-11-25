"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccommodationHomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to overview dashboard
    router.replace('/accommodation/overview');
  }, [router]);
  
  return (
    <div className="p-8">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
