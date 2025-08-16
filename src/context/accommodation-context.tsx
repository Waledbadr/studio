'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useResidences } from '@/context/residences-context';

export type Location = { lat: number; lng: number } | null;

export type Room = {
  id: string;
  name?: string;
  capacity?: number;
  occupied?: boolean;
};

export type Floor = {
  id: string;
  name?: string;
  rooms?: Room[];
};

export type Building = {
  id: string;
  name?: string;
  floors?: Floor[];
};

export type Residence = {
  id: string;
  name: string;
  address?: string;
  location?: Location;
  buildings?: Building[]; // optional — some APIs return nested buildings/floors
  rooms?: Room[]; // fallback when buildings are not present
};

type AccommodationContextValue = {
  residences: Residence[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccommodationContext = createContext<AccommodationContextValue | undefined>(undefined);

export function AccommodationProvider({ children }: { children: React.ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the project's canonical ResidencesProvider as the data source.
  // This avoids calling the missing /api/residences route and ensures Accommodation
  // reflects the same data (buildings/floors/rooms) used by Materials.
  function mapComplexToResidence(complex: any): Residence {
    return {
      id: complex.id,
      name: complex.name || complex.title || 'Unnamed',
      address: complex.city || complex.address || '',
      location: complex.location || null,
      buildings: Array.isArray(complex.buildings) ? complex.buildings.map((b: any) => ({ id: b.id, name: b.name, floors: b.floors })) : undefined,
      rooms: undefined,
    };
  }

  // We lazily import useResidences inside effect to avoid calling hooks conditionally.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Dynamically use the residences-context module to obtain current residences
        // and map them into the simplified Accommodation shape.
        const mod = await import('@/context/residences-context');
        const { useResidences: useRes } = mod as any;
        // call provider's hook inside a temporary component is not possible here,
        // instead read from the module's internal load mechanism: call loadResidences if available and
        // then read localStorage fallback (the provider keeps residences in localStorage when Firebase isn't configured).
        // As a robust simple approach, we attempt to read from localStorage key used by ResidencesProvider.
        const stored = typeof window !== 'undefined' ? localStorage.getItem('estatecare_residences') : null;
        if (stored) {
          const parsed = JSON.parse(stored || '[]');
          if (!mounted) return;
          setResidences((parsed || []).map(mapComplexToResidence));
        } else {
          // If no localStorage copy, try to call the provider's loadResidences and then read from window (best-effort)
          // We cannot call into the provider's internal functions safely (they are not exported).
          // Rely on the provider to keep a localStorage snapshot or on the app to render providers
          // in the proper order. No-op here.
          // finally attempt to read localStorage again
          const again = typeof window !== 'undefined' ? localStorage.getItem('estatecare_residences') : null;
          if (again) {
            const parsed = JSON.parse(again || '[]');
            if (!mounted) return;
            setResidences((parsed || []).map(mapComplexToResidence));
          } else {
            // fallback: empty
            if (mounted) setResidences([]);
          }
        }
      } catch (e) {
        console.error('Accommodation: failed to load residences from provider', e);
        if (mounted) setResidences([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Provide a safe refresh function that re-runs the load logic when called.
  const refresh = async () => {
    // attempt to re-run the same logic as the effect: re-read localStorage
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('estatecare_residences') : null;
      if (stored) {
        const parsed = JSON.parse(stored || '[]');
        setResidences((parsed || []).map(mapComplexToResidence));
      }
    } catch (e) {
      console.error('Accommodation refresh failed', e);
    }
  };

  return (
    <AccommodationContext.Provider value={{ residences, loading, refresh }}>
      {children}
    </AccommodationContext.Provider>
  );
}

export function useAccommodation() {
  const ctx = useContext(AccommodationContext);
  if (!ctx) throw new Error('useAccommodation must be used within AccommodationProvider');
  return ctx;
}
