'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Room { id: string; name: string; occupied?: boolean; area?: number; }
export interface Floor { id: string; name: string; rooms: Room[]; }
export interface Building { id: string; name: string; floors: Floor[]; }
export interface Complex { id: string; name: string; city: string; buildings: Building[]; disabled?: boolean; }

interface ResidencesContextType {
  residences: Complex[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  loading: boolean;
  loadResidences: () => void;
  addComplex: (name: string, city: string, managerId: string) => Promise<void>;
  addBuilding: (complexId: string, name: string) => Promise<void>;
  addFloor: (complexId: string, buildingId: string, name: string) => Promise<void>;
  addRoom: (complexId: string, buildingId: string, floorId: string, name: string, length?: number, width?: number, area?: number) => Promise<void>;
  deleteComplex: (id: string) => Promise<void>;
}

const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

const mockResidences: Complex[] = [
  { id: 'res-1', name: 'Sunrise Complex', city: 'Riyadh', buildings: [] },
];

export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>(mockResidences);
  const [loading] = useState(false);

  const buildings = residences.flatMap(r => r.buildings);
  const floors = buildings.flatMap(b => b.floors || []);
  const rooms = floors.flatMap(f => f.rooms || []);

  const loadResidences = () => { /* no-op in simple mode */ };
  const addComplex = async () => { /* no-op */ };
  const addBuilding = async () => { /* no-op */ };
  const addFloor = async () => { /* no-op */ };
  const addRoom = async () => { /* no-op */ };
  const deleteComplex = async () => { /* no-op */ };

  return (
    <ResidencesContext.Provider value={{
      residences,
      buildings,
      floors,
      rooms,
      loading,
      loadResidences,
      addComplex,
      addBuilding,
      addFloor,
      addRoom,
      deleteComplex,
    }}>
      {children}
    </ResidencesContext.Provider>
  );
};

export const useResidences = () => {
  const ctx = useContext(ResidencesContext);
  if (!ctx) throw new Error('useResidences must be used within a ResidencesProvider');
  return ctx;
};

console.log('🔧 Simple residences context loaded');
