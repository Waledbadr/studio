'use client';

import React from 'react';
import AccommodationResidencesView from '@/components/accommodation/AccommodationResidencesView';
import { useLanguage } from '@/context/language-context';

export default function AccommodationResidencesPage() {
  const { dict } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">المساكن</h1>
      </div>
      <AccommodationResidencesView />
    </div>
  );
}
