'use client';

import React from 'react';
import AccommodationResidencesView from '@/components/accommodation/AccommodationResidencesView';
import { useLanguage } from '@/context/language-context';

export default function AccommodationResidencesPage() {
  const { dict } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Residences</h1>
        <p className="text-muted-foreground">
          View and manage all residences and rooms with occupancy information
        </p>
      </div>
      <AccommodationResidencesView />
    </div>
  );
}
