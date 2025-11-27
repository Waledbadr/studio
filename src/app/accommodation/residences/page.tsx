'use client';

import React from 'react';
import AccommodationResidencesView from '@/components/accommodation/AccommodationResidencesView';
import { useLanguage } from '@/context/language-context';

export default function AccommodationResidencesPage() {
  const { dict } = useLanguage();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{dict.sidebar.residences}</h1>
        <p className="text-muted-foreground">
          {dict.sidebar.manageResidences}
        </p>
      </div>
      <AccommodationResidencesView />
    </div>
  );
}
