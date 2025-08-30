'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Service {
  id: string;
  name: string;
  type?: string;
  category: 'Essential' | 'Amenity' | 'Utility' | string;
  status: 'Active' | 'Inactive' | 'Maintenance' | string;
  subFacilities: SubFacility[];
  notes?: string;
  addedDate?: Date;
}

export interface SubFacility {
  id: string;
  name: string;
  number?: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | string;
}

export type ServiceLocation = {
  complexId: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  facilityId?: string;
};

export interface Facility {
  id: string;
  name: string;
  type: string;
  quantity: number;
  services?: Service[];
}

export interface Room { 
  id: string; 
  name: string; 
  occupied?: boolean; 
  area?: number; 
  services?: Service[]; 
  capacity?: number;
  floorId?: string; // Parent floor ID
}

export interface Floor { 
  id: string; 
  name: string; 
  rooms: Room[]; 
  facilities?: Facility[]; 
  services?: Service[];
  buildingId?: string; // Parent building ID
}

export interface Building { 
  id: string; 
  name: string; 
  floors: Floor[]; 
  facilities?: Facility[]; 
  services?: Service[];
  residenceId?: string; // Parent residence ID
}

export interface Complex { 
  id: string; 
  name: string; 
  city: string; 
  buildings: Building[]; 
  disabled?: boolean; 
  facilities?: Facility[]; 
  managerId?: string; 
  // Legacy properties for backward compatibility
  title?: string;
  address?: string;
  locationString?: string;
  location?: any;
  rooms?: Room[];
}

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
  // Additional methods used by enhanced UI (no-op in simple mode)
  addFacility?: (...args: any[]) => Promise<void>;
  deleteFacility?: (...args: any[]) => Promise<void>;
  setResidenceDisabled?: (id: string, disabled: boolean) => Promise<void>;
  checkResidenceHasStock?: (id: string) => Promise<boolean>;
  moveRoom?: (...args: any[]) => Promise<void>;
  moveRoomAnywhere?: (...args: any[]) => Promise<void>;
  moveFacility?: (...args: any[]) => Promise<void>;
  moveFacilityAnywhere?: (...args: any[]) => Promise<void>;
  updateRoomName?: (...args: any[]) => Promise<void>;
  updateFacilityName?: (...args: any[]) => Promise<void>;
  updateFloorName?: (...args: any[]) => Promise<void>;
  // Service management methods
  addServiceToBuilding?: (...args: any[]) => Promise<void>;
  addServiceToFloor?: (...args: any[]) => Promise<void>;
  addServiceToRoom?: (...args: any[]) => Promise<void>;
  addServiceToFacility?: (...args: any[]) => Promise<void>;
  addSubFacilityToService?: (...args: any[]) => Promise<void>;
  updateSubFacility?: (...args: any[]) => Promise<void>;
  deleteSubFacility?: (...args: any[]) => Promise<void>;
  updateService?: (...args: any[]) => Promise<void>;
  deleteService?: (...args: any[]) => Promise<void>;
  // Additional missing methods
  deleteBuilding?: (...args: any[]) => Promise<void>;
  deleteFloor?: (...args: any[]) => Promise<void>;
  deleteRoom?: (...args: any[]) => Promise<void>;
  updateComplex?: (...args: any[]) => Promise<void>;
  addMultipleRooms?: (...args: any[]) => Promise<void>;
}

const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

const mockResidences: Complex[] = [
  { id: 'res-1', name: 'Sunrise Complex', city: 'Riyadh', buildings: [] },
];

export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>(mockResidences);
  const [loading] = useState(false);

  const buildings = residences.flatMap(r => 
    r.buildings.map(b => ({ ...b, residenceId: r.id }))
  );
  const floors = buildings.flatMap(b => 
    (b.floors || []).map(f => ({ ...f, buildingId: b.id }))
  );
  const rooms = floors.flatMap(f => 
    (f.rooms || []).map(r => ({ ...r, floorId: f.id }))
  );

  const loadResidences = useCallback(() => { /* no-op in simple mode */ }, []);
  const addComplex = async () => { /* no-op */ };
  const addBuilding = async () => { /* no-op */ };
  const addFloor = async () => { /* no-op */ };
  const addRoom = async () => { /* no-op */ };
  const deleteComplex = async () => { /* no-op */ };
  const noOp = async (..._args: any[]) => { /* no-op */ };

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
      addFacility: noOp,
      deleteFacility: noOp,
      setResidenceDisabled: noOp,
      checkResidenceHasStock: async () => false,
      moveRoom: noOp,
      moveRoomAnywhere: noOp,
      moveFacility: noOp,
      moveFacilityAnywhere: noOp,
      updateRoomName: noOp,
      updateFacilityName: noOp,
      updateFloorName: noOp,
      // Service management methods
      addServiceToBuilding: noOp,
      addServiceToFloor: noOp,
      addServiceToRoom: noOp,
      addServiceToFacility: noOp,
      addSubFacilityToService: noOp,
      updateSubFacility: noOp,
      deleteSubFacility: noOp,
      updateService: noOp,
      deleteService: noOp,
      // Additional missing methods
      deleteBuilding: noOp,
      deleteFloor: noOp,
      deleteRoom: noOp,
      updateComplex: noOp,
      addMultipleRooms: noOp,
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
