'use client';

import React from 'react';
import ResidencesView from '@/components/residences/ResidencesView';
import { useLanguage } from '@/context/language-context';

export default function AccommodationResidencesPage() {
  const { dict } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Residences</h1>
      </div>
      {/* Reuse the shared, full-feature ResidencesView used by /accommodation */}
      <ResidencesView showFacilities={true} />
    </div>
  );
}
