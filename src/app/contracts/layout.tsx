'use client';

import React from 'react';
import { ContractsProvider } from '@/context/contracts-context';
import { AccommodationProvider } from '@/context/accommodation-context';

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccommodationProvider>
      <ContractsProvider>
        {children}
      </ContractsProvider>
    </AccommodationProvider>
  );
}
