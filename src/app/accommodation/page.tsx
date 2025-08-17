'use client';

import React from 'react';
import ResidencesView from '@/components/residences/ResidencesView';

export default function AccommodationHomePage() {
  // Reuse the shared ResidencesView but hide facilities/services
  return <ResidencesView showFacilities={false} />;
}
