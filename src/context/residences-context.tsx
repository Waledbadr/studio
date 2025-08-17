'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, arrayUnion, Unsubscribe, getDoc, getDocs } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import safeOnSnapshot from '@/lib/firestore-utils';
import { useToast } from "@/hooks/use-toast";

// Define types for our data structure
export interface Room {
  id: string;
  name: string;
  capacity?: number;
  // dimensions in meters
  length?: number;
  width?: number;
  // area in square meters (derived: length * width)
  area?: number;
  occupied?: boolean;
  // optional reference to parent floor
  floorId?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
  facilities?: Facility[];
  // optional reference to parent building
  buildingId?: string;
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
  facilities?: Facility[];
  // optional reference to parent complex/residence
  residenceId?: string;
}

export interface Complex {
  id: string;
  name: string;
  city: string;
  managerId: string;
  buildings: Building[];
  facilities?: Facility[];
  disabled?: boolean; // mark residence as disabled (hidden from active lists)
  // Legacy/alternate fields sometimes present in older documents or APIs
  title?: string;
  address?: string;
  locationString?: string;
  location?: any;
  rooms?: Room[];
}

export type UpdateComplexPayload = Pick<Complex, 'name' | 'city' | 'managerId'>;


// Define the shape of our context
interface ResidencesContextType {
  residences: Complex[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  loading: boolean;
  loadResidences: () => void;
  addComplex: (name: string, city: string, managerId: string) => Promise<void>;
  updateComplex: (id: string, payload: UpdateComplexPayload) => Promise<void>;
  addBuilding: (complexId: string, name: string) => Promise<void>;
  addFloor: (complexId: string, buildingId: string, name: string) => Promise<void>;
  addRoom: (complexId: string, buildingId: string, floorId: string, name: string, length?: number, width?: number, area?: number) => Promise<void>;
  addMultipleRooms: (complexId: string, buildingId: string, floorId: string, roomNames: string[]) => Promise<void>;
  addFacility: (complexId: string, level: 'complex' | 'building' | 'floor', name: string, type: string, quantity: number, buildingId?: string, floorId?: string) => Promise<void>;
  deleteComplex: (id: string) => Promise<void>;
  deleteBuilding: (complexId: string, buildingId: string) => Promise<void>;
  deleteFloor: (complexId: string, buildingId: string, floorId: string) => Promise<void>;
  deleteRoom: (complexId: string, buildingId: string, floorId: string, roomId: string) => Promise<void>;
  deleteFacility: (complexId: string, facilityId: string, level: 'complex' | 'building' | 'floor', buildingId?: string, floorId?: string) => Promise<void>;
  setResidenceDisabled: (id: string, disabled: boolean) => Promise<void>;
  checkResidenceHasStock: (id: string) => Promise<boolean>;
}

const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

const firebaseErrorMessage = "Firebase is not configured. Using local storage. To enable cloud sync, please configure Firebase in .env.local";

// Helper function to save residences to localStorage
const saveToLocalStorage = (residences: Complex[]) => {
  try {
    localStorage.setItem('estatecare_residences', JSON.stringify(residences));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadResidences = useCallback(() => {
    if (isLoaded.current) return;
    
    if (!db) {
        console.log("Firebase not configured, using local storage");
        
        // Load from localStorage
        try {
            const storedResidences = localStorage.getItem('estatecare_residences');
            const residencesData = storedResidences ? JSON.parse(storedResidences) : [];
            setResidences(residencesData);
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            setResidences([]);
        }
        
        setLoading(false);
        isLoaded.current = true;
        return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const residencesCollection = collection(db, "residences");

    // Use safeOnSnapshot to provide clearer logs and a single retry on transient watch closures
  unsubscribeRef.current = safeOnSnapshot(residencesCollection, (snapshot) => {
    const residencesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Complex));
    setResidences(residencesData);
    setLoading(false);
  }, (error) => {
      console.error("Error fetching residences:", error);
      toast({ title: "Firestore Error", description: "Could not fetch residences data. Check your Firebase config and security rules.", variant: "destructive" });
      setLoading(false);
    }, { retryOnClose: true });
  }, [toast]);

   useEffect(() => {
    loadResidences();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        isLoaded.current = false;
      }
    };
  }, [loadResidences]);

  const addComplex = async (name: string, city: string, managerId: string) => {
    const trimmedName = name.trim();
    if (residences.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A complex with this name already exists.", variant: "destructive" });
        return;
    }
    
    if (!db) {
        // Use localStorage when Firebase is not available
        try {
            const newComplex: Complex = {
                id: `complex-${Date.now()}`,
                name: trimmedName,
                city: city.trim(),
                managerId,
                buildings: [],
                facilities: [],
                disabled: false
            };
            
            const updatedResidences = [...residences, newComplex];
            setResidences(updatedResidences);
            saveToLocalStorage(updatedResidences);
            toast({ title: "Success", description: "New residential complex added (locally)." });
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            toast({ title: "Error", description: "Failed to add complex locally.", variant: "destructive" });
        }
        return;
    }
    
    const docRef = doc(collection(db, "residences"));
    await setDoc(docRef, { id: docRef.id, name: trimmedName, city: city.trim(), managerId, buildings: [], facilities: [], disabled: false });
    toast({ title: "Success", description: "New residential complex added." });
  };
  
  const updateComplex = async (id: string, payload: UpdateComplexPayload) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", id);
        await updateDoc(complexDocRef, payload);
        toast({ title: "Success", description: "Complex details updated." });
    } catch (error) {
        console.error("Error updating complex:", error);
        toast({ title: "Error", description: "Failed to update complex.", variant: "destructive" });
    }
  };

  const addBuilding = async (complexId: string, name: string) => {
    const trimmedName = name.trim();
    
    const targetComplex = residences.find(c => c.id === complexId);
    if (!targetComplex) {
        toast({ title: "Error", description: "Complex not found.", variant: "destructive" });
        return;
    }
    
    if (targetComplex.buildings.some(b => b.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A building with this name already exists in this complex.", variant: "destructive" });
        return;
    }
     
    if (!db) {
        try {
            const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [], facilities: [] };
            const updatedResidences = residences.map(c => 
                c.id === complexId 
                    ? { ...c, buildings: [...c.buildings, newBuilding] }
                    : c
            );
            
            setResidences(updatedResidences);
            saveToLocalStorage(updatedResidences);
            toast({ title: "Success", description: "New building added to the complex (locally)." });
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            toast({ title: "Error", description: "Failed to add building locally.", variant: "destructive" });
        }
        return;
    }

    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) throw new Error("Complex not found");

        const complexData = complexDoc.data() as Complex;
        const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [], facilities: [] };
        const updatedBuildings = [...complexData.buildings, newBuilding];
        
        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "New building added to the complex." });

    } catch (error) {
        console.error("Error adding building:", error);
        toast({ title: "Error", description: "Failed to add building.", variant: "destructive" });
    }
  };
  
  const addFloor = async (complexId: string, buildingId: string, name: string) => {
     if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const trimmedName = name.trim();
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) throw new Error("Complex not found");

        const complexData = complexDoc.data() as Complex;
        const targetBuilding = complexData.buildings.find(b => b.id === buildingId);

        if (targetBuilding?.floors.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A floor with this name already exists in this building.", variant: "destructive" });
            return;
        }

        const newFloor: Floor = { id: `floor-${Date.now()}`, name: trimmedName, rooms: [], facilities: [] };

        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId 
            ? {...b, floors: [...b.floors, newFloor]} 
            : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "New floor added to the building." });

    } catch (error) {
        console.error("Error adding floor:", error);
        toast({ title: "Error", description: "Failed to add floor.", variant: "destructive" });
    }
  };

  const addRoom = async (complexId: string, buildingId: string, floorId: string, name: string, length?: number, width?: number, area?: number) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const trimmedName = name.trim();
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) throw new Error("Complex not found");
        
        const complexData = complexDoc.data() as Complex;
        
        const building = complexData.buildings.find(b => b.id === buildingId);
        const floor = building?.floors.find(f => f.id === floorId);

        if(floor?.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A room with this name already exists on this floor.", variant: "destructive" });
            return;
        }

    const newRoom: Room = { id: `room-${Date.now()}`, name: trimmedName };
    // prefer explicit length/width, else accept area
    if (typeof length === 'number' && typeof width === 'number' && !isNaN(length) && !isNaN(width)) {
      const computedArea = length * width;
      newRoom.length = length;
      newRoom.width = width;
      newRoom.area = computedArea;
      newRoom.capacity = Math.max(1, Math.floor(computedArea / 4));
    } else if (typeof area === 'number' && !isNaN(area)) {
      newRoom.area = area;
      newRoom.capacity = Math.max(1, Math.floor(area / 4));
    }
        
        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f => 
                    f.id === floorId ? {...f, rooms: [...f.rooms, newRoom]} : f
                )
            } : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "New room added to the floor." });

    } catch (error) {
        console.error("Error adding room:", error);
        toast({ title: "Error", description: "Failed to add room.", variant: "destructive" });
    }
  };

  const addMultipleRooms = async (complexId: string, buildingId: string, floorId: string, roomNames: string[]) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) throw new Error("Complex not found");
        
        const complexData = complexDoc.data() as Complex;
        
        const building = complexData.buildings.find(b => b.id === buildingId);
        const floor = building?.floors.find(f => f.id === floorId);

        if (!floor) {
             toast({ title: "Error", description: "Target floor not found.", variant: "destructive" });
             return;
        }

        const existingRoomNames = new Set(floor.rooms.map(r => r.name.toLowerCase()));
        
    const newRooms: Room[] = roomNames
            .map(name => name.trim())
            .filter(name => name)
            .filter(name => !existingRoomNames.has(name.toLowerCase()))
      .map(name => {
        const room: Room = { id: `room-${Date.now()}-${Math.random()}`, name };
        // support creating rooms with optional area or dimensions specified in the name using syntax
        // "Room 101|20" -> area, or "Room 101|5x4" -> length x width
        const parts = name.split('|').map(p => p.trim());
        if (parts.length === 2) {
          const spec = parts[1];
          // dimensions like 5x4 or 5×4
          const dimMatch = spec.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/);
          if (dimMatch) {
            const l = Number(dimMatch[1]);
            const w = Number(dimMatch[2]);
            if (!isNaN(l) && !isNaN(w)) {
              room.name = parts[0];
              room.length = l;
              room.width = w;
              room.area = l * w;
              room.capacity = Math.max(1, Math.floor(room.area / 4));
            }
          } else if (!isNaN(Number(spec))) {
            room.name = parts[0];
            room.area = Number(spec);
            room.capacity = Math.max(1, Math.floor(room.area / 4));
          }
        }
        return room;
      });
        
        const addedCount = newRooms.length;
        const skippedCount = roomNames.length - addedCount;

        if (addedCount === 0) {
            toast({ title: "No rooms added", description: "All specified rooms already exist on this floor.", variant: "default" });
            return;
        }

        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f => 
                    f.id === floorId ? {...f, rooms: [...f.rooms, ...newRooms]} : f
                )
            } : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        
        let toastDescription = `Added ${addedCount} new rooms.`;
        if (skippedCount > 0) {
            toastDescription += ` Skipped ${skippedCount} duplicate rooms.`
        }

        toast({ title: "Success", description: toastDescription });

    } catch (error) {
        console.error("Error adding multiple rooms:", error);
        toast({ title: "Error", description: "Failed to add rooms.", variant: "destructive" });
    }
  };

    const addFacility = async (complexId: string, level: 'complex' | 'building' | 'floor', name: string, type: string, quantity: number, buildingId?: string, floorId?: string) => {
        if (!db) {
            toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
            return;
        }
        try {
            const complexDocRef = doc(db, "residences", complexId);
            const complexDoc = await getDoc(complexDocRef);

            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data() as Complex;
            
            const newFacilities: Facility[] = [];
            for (let i = 1; i <= quantity; i++) {
                const facilityName = quantity > 1 ? `${name} ${i}` : name;
                newFacilities.push({
                    id: `facility-${Date.now()}-${Math.random()}`,
                    name: facilityName,
                    type: type.trim()
                });
            }

            if (level === 'complex') {
                const existingFacilities = complexData.facilities || [];
                const updatedFacilities = [...existingFacilities, ...newFacilities];
                await updateDoc(complexDocRef, { facilities: updatedFacilities });
            } else if (level === 'building' && buildingId) {
                const updatedBuildings = complexData.buildings.map(b => {
                    if (b.id === buildingId) {
                        const existingFacilities = b.facilities || [];
                        return { ...b, facilities: [...existingFacilities, ...newFacilities] };
                    }
                    return b;
                });
                await updateDoc(complexDocRef, { buildings: updatedBuildings });
            } else if (level === 'floor' && buildingId && floorId) {
                const updatedBuildings = complexData.buildings.map(b => {
                    if (b.id === buildingId) {
                        return {
                            ...b,
                            floors: b.floors.map(f => {
                                if (f.id === floorId) {
                                    const existingFacilities = f.facilities || [];
                                    return { ...f, facilities: [...existingFacilities, ...newFacilities] };
                                }
                                return f;
                            })
                        };
                    }
                    return b;
                });
                await updateDoc(complexDocRef, { buildings: updatedBuildings });
            }

            toast({ title: "Success", description: `Added ${quantity} new facility/facilities.` });

        } catch (error) {
            console.error("Error adding facility:", error);
            toast({ title: "Error", description: "Failed to add facility.", variant: "destructive" });
        }
    };

  const deleteComplex = async (id: string) => {
    if (!db) {
        try {
            const updatedResidences = residences.filter(r => r.id !== id);
            setResidences(updatedResidences);
            saveToLocalStorage(updatedResidences);
            toast({ title: "Success", description: "Complex deleted successfully (locally)." });
        } catch (error) {
            console.error("Error deleting from localStorage:", error);
            toast({ title: "Error", description: "Failed to delete complex locally.", variant: "destructive" });
        }
        return;
    }
    await deleteDoc(doc(db, "residences", id));
    toast({ title: "Success", description: "Complex deleted successfully." });
  }

  const deleteBuilding = async (complexId: string, buildingId: string) => {
    if (!db) {
      try {
        const updated = residences.map(c => c.id === complexId ? { ...c, buildings: c.buildings.filter(b => b.id !== buildingId) } : c);
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Building deleted (locally).' });
      } catch (error) {
        console.error('Error deleting building locally:', error);
        toast({ title: 'Error', description: 'Failed to delete building locally.', variant: 'destructive' });
      }
      return;
    }
    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const updatedBuildings = (data.buildings || []).filter(b => b.id !== buildingId);
      await updateDoc(complexRef, { buildings: updatedBuildings });
      toast({ title: 'Success', description: 'Building deleted.' });
    } catch (e) {
      console.error('Error deleting building:', e);
      toast({ title: 'Error', description: 'Failed to delete building.', variant: 'destructive' });
    }
  };

  const deleteFloor = async (complexId: string, buildingId: string, floorId: string) => {
    if (!db) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => b.id === buildingId ? { ...b, floors: b.floors.filter(f => f.id !== floorId) } : b)
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Floor deleted (locally).' });
      } catch (error) {
        console.error('Error deleting floor locally:', error);
        toast({ title: 'Error', description: 'Failed to delete floor locally.', variant: 'destructive' });
      }
      return;
    }
    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const updatedBuildings = data.buildings.map(b => b.id === buildingId ? { ...b, floors: b.floors.filter(f => f.id !== floorId) } : b);
      await updateDoc(complexRef, { buildings: updatedBuildings });
      toast({ title: 'Success', description: 'Floor deleted.' });
    } catch (e) {
      console.error('Error deleting floor:', e);
      toast({ title: 'Error', description: 'Failed to delete floor.', variant: 'destructive' });
    }
  };

  const deleteRoom = async (complexId: string, buildingId: string, floorId: string, roomId: string) => {
    if (!db) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              return {
                ...b,
                floors: b.floors.map(f => f.id === floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
              };
            })
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Room deleted (locally).' });
      } catch (error) {
        console.error('Error deleting room locally:', error);
        toast({ title: 'Error', description: 'Failed to delete room locally.', variant: 'destructive' });
      }
      return;
    }
    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const updatedBuildings = data.buildings.map(b => {
        if (b.id !== buildingId) return b;
        return {
          ...b,
          floors: b.floors.map(f => f.id === floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
        };
      });
      await updateDoc(complexRef, { buildings: updatedBuildings });
      toast({ title: 'Success', description: 'Room deleted.' });
    } catch (e) {
      console.error('Error deleting room:', e);
      toast({ title: 'Error', description: 'Failed to delete room.', variant: 'destructive' });
    }
  };

  const deleteFacility = async (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    buildingId?: string,
    floorId?: string
  ) => {
    if (!db) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          if (level === 'complex') {
            return { ...c, facilities: (c.facilities || []).filter(f => f.id !== facilityId) };
          }
          if (level === 'building' && buildingId) {
            return {
              ...c,
              buildings: c.buildings.map(b => b.id === buildingId ? { ...b, facilities: (b.facilities || []).filter(f => f.id !== facilityId) } : b)
            };
          }
          if (level === 'floor' && buildingId && floorId) {
            return {
              ...c,
              buildings: c.buildings.map(b => b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f => f.id === floorId ? { ...f, facilities: (f.facilities || []).filter(fc => fc.id !== facilityId) } : f)
              } : b)
            };
          }
          return c;
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Facility deleted (locally).' });
      } catch (error) {
        console.error('Error deleting facility locally:', error);
        toast({ title: 'Error', description: 'Failed to delete facility locally.', variant: 'destructive' });
      }
      return;
    }

    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;

      if (level === 'complex') {
        const updatedFacilities = (data.facilities || []).filter(f => f.id !== facilityId);
        await updateDoc(complexRef, { facilities: updatedFacilities });
      } else if (level === 'building' && buildingId) {
        const updatedBuildings = data.buildings.map(b => b.id === buildingId ? { ...b, facilities: (b.facilities || []).filter(f => f.id !== facilityId) } : b);
        await updateDoc(complexRef, { buildings: updatedBuildings });
      } else if (level === 'floor' && buildingId && floorId) {
        const updatedBuildings = data.buildings.map(b => b.id === buildingId ? {
          ...b,
          floors: b.floors.map(f => f.id === floorId ? { ...f, facilities: (f.facilities || []).filter(fc => fc.id !== facilityId) } : f)
        } : b);
        await updateDoc(complexRef, { buildings: updatedBuildings });
      }

      toast({ title: 'Success', description: 'Facility deleted.' });
    } catch (e) {
      console.error('Error deleting facility:', e);
      toast({ title: 'Error', description: 'Failed to delete facility.', variant: 'destructive' });
    }
  };


  // Disable/Enable residence with stock check
  const checkResidenceHasStock = async (residenceId: string): Promise<boolean> => {
    if (!db) {
      // Cannot check without DB; assume no stock
      return false;
    }
    try {
      const invSnap = await getDocs(collection(db, 'inventory'));
      for (const d of invSnap.docs) {
        const data: any = d.data();
        const stockByResidence = data.stockByResidence || {};
        const val = Number(stockByResidence[residenceId] || 0);
        if (!isNaN(val) && val > 0) return true;
      }
      return false;
    } catch (e) {
      console.error('Error checking residence stock:', e);
      return true; // fail-safe: prevent disabling on error
    }
  };

  const setResidenceDisabled = async (id: string, disabled: boolean) => {
    if (disabled) {
      const hasStock = await checkResidenceHasStock(id);
      if (hasStock) {
        toast({ title: 'Cannot disable', description: 'Residence has stock. Please transfer or adjust to zero stock before disabling.', variant: 'destructive' });
        return;
      }
    }

    if (!db) {
      // Local storage path
      const updated = residences.map(r => r.id === id ? { ...r, disabled } : r);
      setResidences(updated);
      saveToLocalStorage(updated);
      toast({ title: 'Success', description: disabled ? 'Residence disabled (local).' : 'Residence enabled (local).' });
      return;
    }

    try {
      const complexDocRef = doc(db, 'residences', id);
      await updateDoc(complexDocRef, { disabled });
      toast({ title: 'Success', description: disabled ? 'Residence disabled.' : 'Residence enabled.' });
    } catch (error) {
      console.error('Error updating residence disabled flag:', error);
      toast({ title: 'Error', description: 'Failed to update residence status.', variant: 'destructive' });
    }
  };

  const buildings = useMemo(() => residences?.flatMap(c => c.buildings) || [], [residences]);
  const floors = useMemo(() => buildings?.flatMap(b => b.floors) || [], [buildings]);
  const rooms = useMemo(() => floors?.flatMap(f => f.rooms) || [], [floors]);


  return (
    <ResidencesContext.Provider value={{ residences, buildings, floors, rooms, loading, loadResidences, addComplex, updateComplex, addBuilding, addFloor, addRoom, addMultipleRooms, addFacility, deleteComplex, deleteBuilding, deleteFloor, deleteRoom, deleteFacility, setResidenceDisabled, checkResidenceHasStock }}>
      {children}
    </ResidencesContext.Provider>
  );
};

export const useResidences = () => {
  const context = useContext(ResidencesContext);
  if (context === undefined) {
    throw new Error('useResidences must be used within a ResidencesProvider');
  }
  return context;
};
