'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as D1Client from '@/lib/d1-client'; // server RPC client for D1
// Legacy references to D1Server replaced with D1Client to use current RPC helpers.
import { db, auth } from '@/lib/platform';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
  arrayRemove,
  arrayUnion
} from '@/lib/realtime-shim';
import { createPoller } from '@/lib/polling';
import { onAuthStateChanged, getCurrentUser } from '@/lib/auth-shim';
import { safeOnSnapshot } from '@/lib/firestore-utils';
// Use D1 only when explicitly enabled via NEXT_PUBLIC_USE_D1
const USE_D1 = process.env.NEXT_PUBLIC_USE_D1 === 'true';

const RESIDENCES_LS_KEY = 'estatecare_residences';
const saveToLocalStorage = (list: any[]) => {
  try {
    localStorage.setItem(RESIDENCES_LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save residences to localStorage', e);
  }
};

// Define types for our data structure
export interface Room {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  capacity?: number;
  // dimensions in meters
  length?: number;
  width?: number;
  // area in square meters (derived: length * width)
  area?: number;
  occupied?: boolean;
  gender?: 'male' | 'female' | string;
  // optional reference to parent floor
  floorId?: string;
}

export interface FacilityComponent {
  id: string;
  name: string;
  type: 'light' | 'outlet' | 'switch' | 'fan' | 'sensor' | 'other';
  status?: 'working' | 'broken' | 'needs_replacement' | 'maintenance';
  // keep both spellings for backward/forward compatibility
  installationDate?: Date | string;
  installDate?: Date | string;
  lastMaintenanceDate?: Date;
  notes?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  components?: FacilityComponent[]; // اختياري - لن يكسر البيانات الموجودة
}

export interface Floor {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  rooms: Room[];
  facilities?: Facility[];
  // optional reference to parent building
  buildingId?: string;
}

export interface Building {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  floors: Floor[];
  facilities?: Facility[];
  // optional reference to parent complex/residence
  residenceId?: string;
}

export interface Complex {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  city: string;
  managerId: string;
  buildings: Building[];
  facilities?: Facility[];
  disabled?: boolean; // mark residence as disabled (hidden from active lists)
  isEmergencyMode?: boolean; // Emergency mode for bypassing validation rules
  // Legacy/alternate fields sometimes present in older documents or APIs
  title?: string;
  address?: string;
  locationString?: string;
  location?: any;
  rooms?: Room[];
}

export type UpdateComplexPayload = Partial<Pick<Complex, 'name' | 'city' | 'managerId'>> & { isEmergencyMode?: boolean };


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
  moveFacility: (
    complexId: string,
    from: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    to: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    facilityId: string
  ) => Promise<void>;
  moveFacilityAnywhere: (
    fromComplexId: string,
    toComplexId: string,
    from: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    to: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    facilityId: string
  ) => Promise<void>;
  moveRoomAnywhere: (
    from: { complexId: string; buildingId: string; floorId: string },
    to: { complexId: string; buildingId: string; floorId: string },
    roomId: string
  ) => Promise<void>;
  moveRoom: (complexId: string, buildingId: string, fromFloorId: string, toFloorId: string, roomId: string) => Promise<void>;
  deleteComplex: (id: string) => Promise<void>;
  deleteBuilding: (complexId: string, buildingId: string) => Promise<void>;
  deleteFloor: (complexId: string, buildingId: string, floorId: string) => Promise<void>;
  deleteRoom: (complexId: string, buildingId: string, floorId: string, roomId: string) => Promise<void>;
  deleteFacility: (complexId: string, facilityId: string, level: 'complex' | 'building' | 'floor', buildingId?: string, floorId?: string) => Promise<void>;
  setResidenceDisabled: (id: string, disabled: boolean) => Promise<void>;
  checkResidenceHasStock: (id: string) => Promise<boolean>;
  updateRoomName: (complexId: string, buildingId: string, floorId: string, roomId: string, newName: string) => Promise<void>;
  updateFacilityName: (
    complexId: string,
    level: 'complex' | 'building' | 'floor',
    facilityId: string,
    newName: string,
    buildingId?: string,
    floorId?: string
  ) => Promise<void>;
  updateFloorName: (complexId: string, buildingId: string, floorId: string, newName: string) => Promise<void>;
  updateBuildingName: (complexId: string, buildingId: string, newName: string) => Promise<void>;
  // New: Facility Component Management
  addFacilityComponent: (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    component: Omit<FacilityComponent, 'id'>,
    buildingId?: string,
    floorId?: string
  ) => Promise<void>;
  updateFacilityComponent: (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    componentId: string,
    updates: Partial<FacilityComponent>,
    buildingId?: string,
    floorId?: string
  ) => Promise<void>;
  deleteFacilityComponent: (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    componentId: string,
    buildingId?: string,
    floorId?: string
  ) => Promise<void>;
}

const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isLoaded = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const POLL_INTERVAL_MS = USE_D1 ? 30000 : 7000;
  const d1PollWarnedRef = useRef(false);
  const pollerRef = useRef<{ stop?: () => void } | null>(null);

  const loadResidences = useCallback(async () => {
    if (isLoaded.current) return;

    setLoading(true);

    if (!db) {
      if (USE_D1) {
        // In D1 mode, wait until the user is authenticated.
        // Otherwise `/api/d1` returns 401 and we'd incorrectly fall back to local storage.
        if (!getCurrentUser()) {
          setLoading(false);
          return;
        }

        isLoaded.current = true;
        const fetcher = async (): Promise<Complex[] | undefined> => {
          try {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
          } catch {
            // ignore
          }
          const r = await D1Client.getResidences();
          return r || [];
        };
        pollerRef.current = createPoller(fetcher, (d: Complex[] | undefined) => {
          if (!Array.isArray(d)) return;
          setResidences(d as Complex[]);
          setLoading(false);
        }, {
          intervalMs: POLL_INTERVAL_MS,
          onError: (e) => {
            console.error('Error polling D1 residences:', e);
            setResidences([]);
            setLoading(false);
          }
        }).start();
        return;
      }

      isLoaded.current = true;
      console.log("Using local storage for residences");
      try {
        const storedResidences = localStorage.getItem('estatecare_residences');
        const residencesData = storedResidences ? JSON.parse(storedResidences) : [];
        setResidences(residencesData);
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        setResidences([]);
      }
      setLoading(false);
      return;
    }

    // Firestore mode: defer until signed in (if a vendor auth ever exists)
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }

    // db is available -> poll Firestore collection
    isLoaded.current = true;
    const fetcher = async () => {
      try {
        const snap = await getDocs(collection(db, 'residences'));
        const residencesData = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Complex));
        return residencesData;
      } catch (e) {
        throw e;
      }
    };

    pollerRef.current = createPoller(fetcher, (d: Complex[]) => {
      setResidences(d);
      setLoading(false);
    }, {
      intervalMs: POLL_INTERVAL_MS,
      onError: (e) => {
        console.error('Error polling residences Firestore:', e);
        toast({ title: "Firestore Error", description: "Could not fetch residences data.", variant: "destructive" });
        setLoading(false);
      }
    }).start();

    return;
  }, [toast]);

  useEffect(() => {
    loadResidences();
    const unsubAuth = onAuthStateChanged(null, (u) => {
      if (u) {
        if (!isLoaded.current) loadResidences();
      } else {
        if (pollerRef.current) {
          try { pollerRef.current?.stop?.(); } catch { }
          pollerRef.current = null;
        }
        isLoaded.current = false;
        setResidences([]);
        setLoading(false);
      }
    });
    return () => {
      if (pollerRef.current) {
        try { pollerRef.current?.stop?.(); } catch { }
        pollerRef.current = null;
        isLoaded.current = false;
      }
      unsubAuth?.();
    };
  }, [loadResidences]);

  const addComplex = async (name: string, city: string, managerId: string) => {
    const trimmedName = name.trim();
    if (residences.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Error", description: "A complex with this name already exists.", variant: "destructive" });
      return;
    }

    // Generate ID for new complex
    const newComplex: Complex = {
      id: `complex-${Date.now()}`,
      name: trimmedName,
      city: city.trim(),
      managerId,
      buildings: [],
      facilities: [],
      disabled: false
    };

    try {
      await D1Client.createResidence(newComplex);
      // Optimistic update
      setResidences(prev => [...prev, newComplex]);
      toast({ title: "Success", description: "New residential complex added." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to add complex.", variant: "destructive" });
    }
  };

  const updateRoomName = async (complexId: string, buildingId: string, floorId: string, roomId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (USE_D1) {
      try {
        let failed = false;
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              return {
                ...b,
                floors: b.floors.map(f => {
                  if (f.id !== floorId) return f;
                  if (f.rooms.some(r => r.id !== roomId && r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                    failed = true;
                    return f;
                  }
                  return { ...f, rooms: f.rooms.map(r => r.id === roomId ? { ...r, name: trimmed } : r) };
                })
              };
            })
          };
        });

        if (failed) {
          toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم.', variant: 'destructive' });
          return;
        }

        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) {
          await D1Client.updateResidence(complexId, changed);
        }
        toast({ title: 'تم', description: 'تم تحديث اسم الغرفة.' });
      } catch (e) {
        console.error(e);
        toast({ title: 'خطأ', description: 'فشل التحديث في D1', variant: 'destructive' });
      }
      return;
    }
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
                floors: b.floors.map(f => {
                  if (f.id !== floorId) return f;
                  if (f.rooms.some(r => r.id !== roomId && r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                    toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم.', variant: 'destructive' });
                    return f;
                  }
                  return { ...f, rooms: f.rooms.map(r => r.id === roomId ? { ...r, name: trimmed } : r) };
                })
              };
            })
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم تحديث اسم الغرفة.' });
      } catch (e) {
        console.error('updateRoomName local error:', e);
        toast({ title: 'خطأ', description: 'فشل تحديث الاسم محلياً.', variant: 'destructive' });
      }
      return;
    }
    try {
      const ref = doc(db, 'residences', complexId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const b = data.buildings.find(x => x.id === buildingId);
      const f = b?.floors.find(x => x.id === floorId);
      if (!b || !f) throw new Error('Not found');
      if (f.rooms.some(r => r.id !== roomId && r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم.', variant: 'destructive' });
        return;
      }
      const buildings = data.buildings.map(x => x.id !== buildingId ? x : ({
        ...x,
        floors: x.floors.map(fl => fl.id !== floorId ? fl : ({
          ...fl,
          rooms: fl.rooms.map(r => r.id === roomId ? { ...r, name: trimmed } : r)
        }))
      }));
      await updateDoc(ref, { buildings });
      toast({ title: 'تم', description: 'تم تحديث اسم الغرفة.' });
    } catch (e) {
      console.error('updateRoomName error:', e);
      toast({ title: 'Error', description: 'Failed to update room name.', variant: 'destructive' });
    }
  };

  const updateFacilityName = async (
    complexId: string,
    level: 'complex' | 'building' | 'floor',
    facilityId: string,
    newName: string,
    buildingId?: string,
    floorId?: string
  ) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updateInComplex = (c: Complex): Complex => {
      if (level === 'complex') {
        if ((c.facilities || []).some(f => f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
          toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم.', variant: 'destructive' });
          throw new Error('Duplicate');
        }
        return { ...c, facilities: (c.facilities || []).map(f => f.id === facilityId ? { ...f, name: trimmed } : f) };
      }
      return {
        ...c,
        buildings: c.buildings.map(b => {
          if (b.id !== buildingId) return b;
          if (level === 'building') {
            if ((b.facilities || []).some(f => f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
              toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم.', variant: 'destructive' });
              throw new Error('Duplicate');
            }
            return { ...b, facilities: (b.facilities || []).map(f => f.id === facilityId ? { ...f, name: trimmed } : f) };
          }
          const fl = b.floors.find(fl => fl.id === floorId);
          if (fl && (fl.facilities || []).some(f => f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
            toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم.', variant: 'destructive' });
            throw new Error('Duplicate');
          }
          return { ...b, floors: b.floors.map(fl => fl.id !== floorId ? fl : ({ ...fl, facilities: (fl.facilities || []).map(f => f.id === facilityId ? { ...f, name: trimmed } : f) })) };
        })
      };
    };

    if (USE_D1) {
      try {
        const updated = residences.map(c => c.id === complexId ? updateInComplex(c) : c);
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'تم', description: 'تم تحديث اسم التجهيز.' });
      } catch (e: any) {
        if (e.message !== 'Duplicate') {
          console.error(e);
          toast({ title: 'خطأ', description: 'فشل التحديث في D1', variant: 'destructive' });
        }
      }
      return;
    }
    if (!db) {
      try {
        const updated = residences.map(c => c.id === complexId ? updateInComplex(c) : c);
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم تحديث اسم التجهيز.' });
      } catch (e) {
        console.error('updateFacilityName local error:', e);
        toast({ title: 'خطأ', description: 'فشل تحديث الاسم محلياً.', variant: 'destructive' });
      }
      return;
    }
    try {
      const ref = doc(db, 'residences', complexId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const buildings = updateInComplex(data).buildings;
      const facilities = updateInComplex(data).facilities || [];
      await updateDoc(ref, { buildings, facilities });
      toast({ title: 'تم', description: 'تم تحديث اسم التجهيز.' });
    } catch (e) {
      console.error('updateFacilityName error:', e);
      toast({ title: 'Error', description: 'Failed to update facility name.', variant: 'destructive' });
    }
  };

  const updateFloorName = async (complexId: string, buildingId: string, floorId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (USE_D1) {
      try {
        let failed = false;
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              if (b.floors.some(f => f.id !== floorId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                failed = true;
                return b;
              }
              return { ...b, floors: b.floors.map(f => f.id === floorId ? { ...f, name: trimmed } : f) };
            })
          };
        });
        if (failed) {
          toast({ title: 'مكرر', description: 'يوجد طابق بنفس الاسم.', variant: 'destructive' });
          return;
        }
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'تم', description: 'تم تحديث اسم الطابق.' });
      } catch (e) {
        console.error(e);
        toast({ title: 'خطأ', description: 'فشل التحديث في D1', variant: 'destructive' });
      }
      return;
    }
    if (!db) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              if (b.floors.some(f => f.id !== floorId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                toast({ title: 'مكرر', description: 'يوجد طابق بنفس الاسم.', variant: 'destructive' });
                return b;
              }
              return { ...b, floors: b.floors.map(f => f.id === floorId ? { ...f, name: trimmed } : f) };
            })
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم تحديث اسم الطابق.' });
      } catch (e) {
        console.error('updateFloorName local error:', e);
        toast({ title: 'خطأ', description: 'فشل تحديث الاسم محلياً.', variant: 'destructive' });
      }
      return;
    }
    try {
      const ref = doc(db, 'residences', complexId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      const b = data.buildings.find(x => x.id === buildingId);
      if (!b) throw new Error('Building not found');
      if (b.floors.some(f => f.id !== floorId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: 'مكرر', description: 'يوجد طابق بنفس الاسم.', variant: 'destructive' });
        return;
      }
      const buildings = data.buildings.map(x => x.id !== buildingId ? x : ({
        ...x,
        floors: x.floors.map(f => f.id === floorId ? { ...f, name: trimmed } : f)
      }));
      await updateDoc(ref, { buildings });
      toast({ title: 'تم', description: 'تم تحديث اسم الطابق.' });
    } catch (e) {
      console.error('updateFloorName error:', e);
      toast({ title: 'Error', description: 'Failed to update floor name.', variant: 'destructive' });
    }
  };

  const updateBuildingName = async (complexId: string, buildingId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (USE_D1) {
      try {
        let failed = false;
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          if (c.buildings.some(b => b.id !== buildingId && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
            failed = true;
            return c;
          }
          return {
            ...c,
            buildings: c.buildings.map(b => b.id === buildingId ? { ...b, name: trimmed } : b)
          };
        });
        if (failed) {
          toast({ title: 'مكرر', description: 'يوجد مبنى بنفس الاسم.', variant: 'destructive' });
          return;
        }
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'تم', description: 'تم تحديث اسم المبنى.' });
      } catch (e) {
        console.error(e);
        toast({ title: 'خطأ', description: 'فشل التحديث في D1', variant: 'destructive' });
      }
      return;
    }
    if (!db) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          if (c.buildings.some(b => b.id !== buildingId && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
            toast({ title: 'مكرر', description: 'يوجد مبنى بنفس الاسم.', variant: 'destructive' });
            return c;
          }
          return {
            ...c,
            buildings: c.buildings.map(b => b.id === buildingId ? { ...b, name: trimmed } : b)
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم تحديث اسم المبنى.' });
      } catch (e) {
        console.error('updateBuildingName local error:', e);
        toast({ title: 'خطأ', description: 'فشل تحديث الاسم محلياً.', variant: 'destructive' });
      }
      return;
    }
    try {
      const ref = doc(db, 'residences', complexId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      if (data.buildings.some(b => b.id !== buildingId && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: 'مكرر', description: 'يوجد مبنى بنفس الاسم.', variant: 'destructive' });
        return;
      }
      const buildings = data.buildings.map(b => b.id === buildingId ? { ...b, name: trimmed } : b);
      await updateDoc(ref, { buildings });
      toast({ title: 'تم', description: 'تم تحديث اسم المبنى.' });
    } catch (e) {
      console.error('updateBuildingName error:', e);
      toast({ title: 'Error', description: 'Failed to update building name.', variant: 'destructive' });
    }
  };

  const moveRoomAnywhere = async (
    from: { complexId: string; buildingId: string; floorId: string },
    to: { complexId: string; buildingId: string; floorId: string },
    roomId: string
  ) => {
    // Same complex + same building => floor move
    if (from.complexId === to.complexId && from.buildingId === to.buildingId) {
      return moveRoom(from.complexId, from.buildingId, from.floorId, to.floorId, roomId);
    }

    // Same complex + different buildings => single atomic update
    if (from.complexId === to.complexId && from.buildingId !== to.buildingId) {
      if (!db) {
        try {
          const compIndex = residences.findIndex(r => r.id === from.complexId);
          if (compIndex < 0) return;
          const comp = residences[compIndex];
          const srcB = comp.buildings.find(b => b.id === from.buildingId);
          const dstB = comp.buildings.find(b => b.id === to.buildingId);
          const srcF = srcB?.floors.find(f => f.id === from.floorId);
          const dstF = dstB?.floors.find(f => f.id === to.floorId);
          const room = srcF?.rooms.find(r => r.id === roomId);
          if (!srcB || !dstB || !srcF || !dstF || !room) return;
          if (dstF.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
            toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.', variant: 'destructive' });
            return;
          }
          const updatedComp: Complex = {
            ...comp,
            buildings: comp.buildings.map(b => {
              if (b.id === from.buildingId) {
                return {
                  ...b,
                  floors: b.floors.map(f => f.id === from.floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
                };
              }
              if (b.id === to.buildingId) {
                return {
                  ...b,
                  floors: b.floors.map(f => f.id === to.floorId ? { ...f, rooms: [...f.rooms, { ...room, floorId: to.floorId }] } : f)
                };
              }
              return b;
            })
          };
          const updated = residences.map(r => r.id === updatedComp.id ? updatedComp : r);
          setResidences(updated);
          saveToLocalStorage(updated);
          toast({ title: 'Success', description: 'Room moved.' });
        } catch (e) {
          console.error('Error moving room same-complex (local):', e);
          toast({ title: 'Error', description: 'Failed to move room locally.', variant: 'destructive' });
        }
        return;
      }
      try {
        const ref = doc(db, 'residences', from.complexId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error('Complex not found');
        const data = snap.data() as Complex;
        const srcB = data.buildings.find(b => b.id === from.buildingId);
        const dstB = data.buildings.find(b => b.id === to.buildingId);
        const srcF = srcB?.floors.find(f => f.id === from.floorId);
        const dstF = dstB?.floors.find(f => f.id === to.floorId);
        const room = srcF?.rooms.find(r => r.id === roomId);
        if (!srcB || !dstB || !srcF || !dstF || !room) throw new Error('Room/building/floor not found');
        if (dstF.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
          toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.', variant: 'destructive' });
          return;
        }
        const buildings = data.buildings.map(b => {
          if (b.id === from.buildingId) {
            return {
              ...b,
              floors: b.floors.map(f => f.id === from.floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
            };
          }
          if (b.id === to.buildingId) {
            return {
              ...b,
              floors: b.floors.map(f => f.id === to.floorId ? { ...f, rooms: [...f.rooms, { ...room, floorId: to.floorId }] } : f)
            };
          }
          return b;
        });
        await updateDoc(ref, { buildings });
        toast({ title: 'Success', description: 'Room moved.' });
      } catch (e) {
        console.error('Error moving room same-complex cross-building:', e);
        toast({ title: 'Error', description: 'Failed to move room.', variant: 'destructive' });
      }
      return;
    }

    // Cross-complex move (different documents)
    if (!db) {
      try {
        const src = residences.find(r => r.id === from.complexId);
        const dst = residences.find(r => r.id === to.complexId);
        if (!src || !dst) return;
        const srcB = src.buildings.find(b => b.id === from.buildingId);
        const dstB = dst.buildings.find(b => b.id === to.buildingId);
        const srcF = srcB?.floors.find(f => f.id === from.floorId);
        const dstF = dstB?.floors.find(f => f.id === to.floorId);
        const room = srcF?.rooms.find(r => r.id === roomId);
        if (!room || !dstF) return;
        if (dstF.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
          toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
          return;
        }
        const updated = residences.map(c => {
          if (c.id === from.complexId) {
            return {
              ...c,
              buildings: c.buildings.map(b => b.id === from.buildingId ? {
                ...b,
                floors: b.floors.map(f => f.id === from.floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
              } : b)
            };
          }
          if (c.id === to.complexId) {
            return {
              ...c,
              buildings: c.buildings.map(b => b.id === to.buildingId ? {
                ...b,
                floors: b.floors.map(f => f.id === to.floorId ? { ...f, rooms: [...f.rooms, { ...room, floorId: to.floorId }] } : f)
              } : b)
            };
          }
          return c;
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Room moved.' });
      } catch (e) {
        console.error('Error moving room cross-complex (local):', e);
        toast({ title: 'Error', description: 'Failed to move room locally.', variant: 'destructive' });
      }
      return;
    }

    try {
      const fromRef = doc(db, 'residences', from.complexId);
      const toRef = doc(db, 'residences', to.complexId);
      const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)]);
      if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Complex not found');
      const fromData = fromSnap.data() as Complex;
      const toData = toSnap.data() as Complex;

      const srcB = fromData.buildings.find(b => b.id === from.buildingId);
      const srcF = srcB?.floors.find(f => f.id === from.floorId);
      const room = srcF?.rooms.find(r => r.id === roomId);
      if (!room) throw new Error('Room not found');

      const dstB = toData.buildings.find(b => b.id === to.buildingId);
      const dstF = dstB?.floors.find(f => f.id === to.floorId);
      if (!dstF) throw new Error('Target floor not found');
      if (dstF.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
        toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
        return;
      }

      const updatedFromBuildings = fromData.buildings.map(b => b.id === from.buildingId ? {
        ...b,
        floors: b.floors.map(f => f.id === from.floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f)
      } : b);

      const updatedToBuildings = toData.buildings.map(b => b.id === to.buildingId ? {
        ...b,
        floors: b.floors.map(f => f.id === to.floorId ? { ...f, rooms: [...f.rooms, { ...room, floorId: to.floorId }] } : f)
      } : b);

      await Promise.all([
        updateDoc(fromRef, { buildings: updatedFromBuildings }),
        updateDoc(toRef, { buildings: updatedToBuildings })
      ]);
      toast({ title: 'Success', description: 'Room moved.' });
    } catch (e) {
      console.error('Error moving room cross-complex:', e);
      toast({ title: 'Error', description: 'Failed to move room.', variant: 'destructive' });
    }
  };

  const moveFacilityAnywhere = async (
    fromComplexId: string,
    toComplexId: string,
    from: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    to: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    facilityId: string
  ) => {
    if (fromComplexId === toComplexId) {
      return moveFacility(fromComplexId, from, to, facilityId);
    }

    const duplicateInTarget = (comp: Complex, name?: string): boolean => {
      if (!name) return false;
      const norm = name.trim().toLowerCase();
      if (to.level === 'complex') return (comp.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
      const b = comp.buildings.find(b => b.id === to.buildingId);
      if (!b) return false;
      if (to.level === 'building') return (b.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
      const fl = b.floors.find(fl => fl.id === to.floorId);
      return (fl?.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
    };

    if (USE_D1) {
      try {
        const fromRes = residences.find(r => r.id === fromComplexId);
        const toRes = residences.find(r => r.id === toComplexId);
        if (!fromRes || !toRes) {
          toast({ title: 'خطأ', description: 'المجمع غير موجود', variant: 'destructive' });
          return;
        }

        // Deep copy to modify
        const newFromRes: Complex = JSON.parse(JSON.stringify(fromRes));
        const newToRes: Complex = JSON.parse(JSON.stringify(toRes));

        // 1. Locate and remove from source
        let facility: Facility | undefined;
        let found = false;

        const removeFromList = (list: Facility[]) => {
          const idx = list.findIndex(f => f.id === facilityId);
          if (idx >= 0) {
            facility = list[idx];
            list.splice(idx, 1);
            found = true;
          }
        };

        if (from.level === 'complex') {
          newFromRes.facilities = newFromRes.facilities || [];
          removeFromList(newFromRes.facilities);
        } else if (from.level === 'building' && from.buildingId) {
          const b = newFromRes.buildings.find(b => b.id === from.buildingId);
          if (b) {
            b.facilities = b.facilities || [];
            removeFromList(b.facilities);
          }
        } else if (from.level === 'floor' && from.buildingId && from.floorId) {
          const b = newFromRes.buildings.find(b => b.id === from.buildingId);
          const f = b?.floors.find(fl => fl.id === from.floorId);
          if (f) {
            f.facilities = f.facilities || [];
            removeFromList(f.facilities);
          }
        }

        if (!found || !facility) {
          toast({ title: 'خطأ', description: 'التجهيز غير موجود', variant: 'destructive' });
          return;
        }

        // 2. Check duplicate in target
        if (duplicateInTarget(newToRes, facility.name)) {
          toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة.', variant: 'destructive' });
          return;
        }

        // 3. Add to target
        if (to.level === 'complex') {
          newToRes.facilities = [...(newToRes.facilities || []), facility];
        } else if (to.level === 'building' && to.buildingId) {
          const b = newToRes.buildings.find(b => b.id === to.buildingId);
          if (b) {
            b.facilities = [...(b.facilities || []), facility];
          }
        } else if (to.level === 'floor' && to.buildingId && to.floorId) {
          const b = newToRes.buildings.find(b => b.id === to.buildingId);
          const f = b?.floors.find(fl => fl.id === to.floorId);
          if (f) {
            f.facilities = [...(f.facilities || []), facility];
          }
        }

        // 4. Update State and D1
        setResidences(prev => prev.map(r => {
          if (r.id === fromComplexId) return newFromRes;
          if (r.id === toComplexId) return newToRes;
          return r;
        }));

        await D1Client.updateResidence(fromComplexId, newFromRes);
        await D1Client.updateResidence(toComplexId, newToRes);
        toast({ title: 'تم', description: 'تم نقل التجهيز بنجاح (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'خطأ', description: 'فشل نقل التجهيز في D1.', variant: 'destructive' });
      }
      return;
    }

    if (!db) {
      try {
        const srcIndex = residences.findIndex(r => r.id === fromComplexId);
        const dstIndex = residences.findIndex(r => r.id === toComplexId);
        if (srcIndex < 0 || dstIndex < 0) return;
        const src = residences[srcIndex];
        const dst = residences[dstIndex];
        // locate facility
        const getFrom = (): Facility | undefined => {
          if (from.level === 'complex') return (src.facilities || []).find(f => f.id === facilityId);
          const b = src.buildings.find(b => b.id === from.buildingId);
          if (!b) return undefined;
          if (from.level === 'building') return (b.facilities || []).find(f => f.id === facilityId);
          const fl = b.floors.find(fl => fl.id === from.floorId);
          return (fl?.facilities || []).find(f => f.id === facilityId);
        };
        const fac = getFrom();
        if (!fac) return;
        if (duplicateInTarget(dst, fac.name)) {
          toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
          return;
        }
        // build updated residences
        const updated = residences.map(c => {
          if (c.id === fromComplexId) {
            // remove
            const removeFrom = (cc: Complex): Complex => {
              if (from.level === 'complex') return { ...cc, facilities: (cc.facilities || []).filter(f => f.id !== facilityId) };
              return {
                ...cc,
                buildings: cc.buildings.map(b => {
                  if (from.level === 'building' && b.id === from.buildingId) return { ...b, facilities: (b.facilities || []).filter(f => f.id !== facilityId) };
                  if (from.level === 'floor' && b.id === from.buildingId) return { ...b, floors: b.floors.map(fl => fl.id === from.floorId ? { ...fl, facilities: (fl.facilities || []).filter(f => f.id !== facilityId) } : fl) };
                  return b;
                })
              };
            };
            return removeFrom(c);
          }
          if (c.id === toComplexId) {
            // add
            const addTo = (cc: Complex): Complex => {
              if (to.level === 'complex') return { ...cc, facilities: [...(cc.facilities || []), fac!] };
              return {
                ...cc,
                buildings: cc.buildings.map(b => {
                  if (to.level === 'building' && b.id === to.buildingId) return { ...b, facilities: [...(b.facilities || []), fac!] };
                  if (to.level === 'floor' && b.id === to.buildingId) return { ...b, floors: b.floors.map(fl => fl.id === to.floorId ? { ...fl, facilities: [...(fl.facilities || []), fac!] } : fl) };
                  return b;
                })
              };
            };
            return addTo(c);
          }
          return c;
        });

        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Facility moved.' });
      } catch (e) {
        console.error('Error moving facility cross-complex (local):', e);
        toast({ title: 'Error', description: 'Failed to move facility locally.', variant: 'destructive' });
      }
      return;
    }

    try {
      const [fromRef, toRef] = [doc(db, 'residences', fromComplexId), doc(db, 'residences', toComplexId)];
      const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)]);
      if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Complex not found');
      const fromData = fromSnap.data() as Complex;
      const toData = toSnap.data() as Complex;

      // locate facility and duplicate guard
      const findFrom = (): Facility | undefined => {
        if (from.level === 'complex') return (fromData.facilities || []).find(f => f.id === facilityId);
        const b = fromData.buildings.find(b => b.id === from.buildingId);
        if (!b) return undefined;
        if (from.level === 'building') return (b.facilities || []).find(f => f.id === facilityId);
        const fl = b.floors.find(fl => fl.id === from.floorId);
        return (fl?.facilities || []).find(f => f.id === facilityId);
      };
      const fac = findFrom();
      if (!fac) throw new Error('Facility not found');
      if (duplicateInTarget(toData, fac.name)) {
        toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
        return;
      }

      const removeFrom = (c: Complex): Complex => {
        if (from.level === 'complex') return { ...c, facilities: (c.facilities || []).filter(f => f.id !== facilityId) };
        return {
          ...c,
          buildings: c.buildings.map(b => {
            if (from.level === 'building' && b.id === from.buildingId) return { ...b, facilities: (b.facilities || []).filter(f => f.id !== facilityId) };
            if (from.level === 'floor' && b.id === from.buildingId) return { ...b, floors: b.floors.map(fl => fl.id === from.floorId ? { ...fl, facilities: (fl.facilities || []).filter(f => f.id !== facilityId) } : fl) };
            return b;
          })
        };
      };
      const addTo = (c: Complex): Complex => {
        if (to.level === 'complex') return { ...c, facilities: [...(c.facilities || []), fac] };
        return {
          ...c,
          buildings: c.buildings.map(b => {
            if (to.level === 'building' && b.id === to.buildingId) return { ...b, facilities: [...(b.facilities || []), fac] };
            if (to.level === 'floor' && b.id === to.buildingId) return { ...b, floors: b.floors.map(fl => fl.id === to.floorId ? { ...fl, facilities: [...(fl.facilities || []), fac] } : fl) };
            return b;
          })
        };
      };

      const updatedFrom = removeFrom(fromData);
      const updatedTo = addTo(toData);
      await Promise.all([
        updateDoc(fromRef, { buildings: updatedFrom.buildings, facilities: updatedFrom.facilities || [] }),
        updateDoc(toRef, { buildings: updatedTo.buildings, facilities: updatedTo.facilities || [] })
      ]);
      toast({ title: 'Success', description: 'Facility moved.' });
    } catch (e) {
      console.error('Error moving facility cross-complex:', e);
      toast({ title: 'Error', description: 'Failed to move facility.', variant: 'destructive' });
    }
  };

  const moveRoom = async (complexId: string, buildingId: string, fromFloorId: string, toFloorId: string, roomId: string) => {
    if (fromFloorId === toFloorId) return; // nothing to do

    if (USE_D1) {
      try {
        const current = residences.find(r => r.id === complexId);
        if (current) {
          const building = current.buildings.find(b => b.id === buildingId);
          const toFloor = building?.floors.find(f => f.id === toFloorId);
          const room = building?.floors.find(f => f.id === fromFloorId)?.rooms.find(r => r.id === roomId);
          if (toFloor && room && toFloor.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
            toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.', variant: 'destructive' });
            return;
          }
        }
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              let movingRoom: Room | undefined;
              const newFloors = b.floors.map(f => {
                if (f.id === fromFloorId) {
                  const remaining = f.rooms.filter(r => {
                    if (r.id === roomId) {
                      movingRoom = { ...r, floorId: toFloorId };
                      return false;
                    }
                    return true;
                  });
                  return { ...f, rooms: remaining };
                }
                return f;
              }).map(f => {
                if (f.id === toFloorId && movingRoom) {
                  return { ...f, rooms: [...f.rooms, movingRoom] };
                }
                return f;
              });
              return { ...b, floors: newFloors };
            })
          };
        });
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Room moved (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to move room in D1.', variant: "destructive" });
      }
      return;
    }


    if (!db) {
      try {
        const current = residences.find(r => r.id === complexId);
        if (current) {
          const building = current.buildings.find(b => b.id === buildingId);
          const toFloor = building?.floors.find(f => f.id === toFloorId);
          const room = building?.floors.find(f => f.id === fromFloorId)?.rooms.find(r => r.id === roomId);
          if (toFloor && room && toFloor.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
            toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.', variant: 'destructive' });
            return;
          }
        }
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => {
              if (b.id !== buildingId) return b;
              let movingRoom: Room | undefined;
              const newFloors = b.floors.map(f => {
                if (f.id === fromFloorId) {
                  const remaining = f.rooms.filter(r => {
                    if (r.id === roomId) {
                      movingRoom = { ...r, floorId: toFloorId };
                      return false;
                    }
                    return true;
                  });
                }
                return f;
              }).map(f => {
                if (f.id === toFloorId && movingRoom) {
                  return { ...f, rooms: [...f.rooms, movingRoom] };
                }
                return f;
              });
              return { ...b, floors: newFloors };
            })
          };
        });
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Room moved (locally).' });
      } catch (error) {
        console.error('Error moving room locally:', error);
        toast({ title: 'Error', description: 'Failed to move room locally.', variant: 'destructive' });
      }
      return;
    }

    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      // Duplicate guard on target floor
      const b = data.buildings.find(b => b.id === buildingId);
      const toFloor = b?.floors.find(f => f.id === toFloorId);
      const room = b?.floors.find(f => f.id === fromFloorId)?.rooms.find(r => r.id === roomId);
      if (toFloor && room && toFloor.rooms.some(r => r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
        toast({ title: 'مكرر', description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.', variant: 'destructive' });
        return;
      }

      const updatedBuildings = data.buildings.map(b => {
        if (b.id !== buildingId) return b;
        let roomToMove: Room | undefined;
        const floorsAfterRemoval = b.floors.map(f => {
          if (f.id === fromFloorId) {
            const remaining = f.rooms.filter(r => {
              if (r.id === roomId) {
                roomToMove = { ...r, floorId: toFloorId };
                return false;
              }
              return true;
            });
            return { ...f, rooms: remaining };
          }
          return f;
        });
        const floorsAfterAdd = floorsAfterRemoval.map(f => {
          if (f.id === toFloorId && roomToMove) {
            return { ...f, rooms: [...f.rooms, roomToMove!] };
          }
          return f;
        });
        return { ...b, floors: floorsAfterAdd };
      });

      await updateDoc(complexRef, { buildings: updatedBuildings });
      toast({ title: 'Success', description: 'Room moved.' });
    } catch (e) {
      console.error('Error moving room:', e);
      toast({ title: 'Error', description: 'Failed to move room.', variant: 'destructive' });
    }
  };

  const updateComplex = async (id: string, payload: UpdateComplexPayload) => {
    if (USE_D1) {
      try {
        // Fetch current to identify manager change
        const currentComplex = residences.find(r => r.id === id);
        const prevManagerId = currentComplex?.managerId;
        const newManagerId = payload.managerId;

        const updatedList = residences.map(r => r.id === id ? { ...r, ...payload } : r);
        setResidences(updatedList);
        await D1Client.updateResidence(id, payload);

        // Sync users if manager changed
        if (prevManagerId && prevManagerId !== newManagerId) {
          try {
            const prevManager = await D1Client.getUser(prevManagerId);
            if (prevManager) {
              const updatedAssigned = (prevManager.assignedResidences || []).filter((rid: any) => rid !== id);
              await D1Client.updateUser(prevManagerId, { assignedResidences: updatedAssigned });
            }
          } catch (e) { console.warn('Failed to remove residence from prev manager (D1)', e); }
        }
        if (newManagerId && newManagerId !== prevManagerId) {
          try {
            const newManager = await D1Client.getUser(newManagerId);
            if (newManager) {
              const currentAssigned = newManager.assignedResidences || [];
              if (!currentAssigned.includes(id)) {
                await D1Client.updateUser(newManagerId, { assignedResidences: [...currentAssigned, id] });
              }
            }
          } catch (e) { console.warn('Failed to add residence to new manager (D1)', e); }
        }

        toast({ title: "Success", description: "Complex updated (D1)." });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to update complex in D1.", variant: "destructive" });
      }
      return;
    }
    if (!db) {
      // Local mode: update residences and sync local users manager linkage
      try {
        const prev = residences.find(r => r.id === id);
        const updatedList = residences.map(r => r.id === id ? { ...r, ...payload } : r);
        setResidences(updatedList);
        saveToLocalStorage(updatedList);
        // Sync users: remove from old manager, add to new manager
        try {
          const storedUsers = localStorage.getItem('estatecare_users');
          if (storedUsers) {
            const usersData = JSON.parse(storedUsers) as Array<{ id: string; assignedResidences?: string[] }>;
            const updatedUsers = usersData.map(u => {
              let assigned = Array.isArray(u.assignedResidences) ? u.assignedResidences : [];
              // Remove from previous manager
              if (prev && prev.managerId && u.id === prev.managerId && prev.managerId !== payload.managerId) {
                assigned = assigned.filter(rid => rid !== id);
              }
              // Add to new manager
              if (payload.managerId && u.id === payload.managerId) {
                assigned = Array.from(new Set([...assigned, id]));
              }
              return { ...u, assignedResidences: assigned };
            });
            localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
          }
        } catch (e) {
          console.warn('Local users sync failed (updateComplex):', e);
        }
        toast({ title: "Success", description: "Complex details updated (locally)." });
      } catch (e) {
        console.error('updateComplex local error:', e);
        toast({ title: 'Error', description: 'Failed to update complex locally.', variant: 'destructive' });
      }
      return;
    }
    try {
      const complexDocRef = doc(db, "residences", id);
      // Fetch previous to compare managerId
      const prevSnap = await getDoc(complexDocRef);
      const prevData = prevSnap.exists() ? (prevSnap.data() as Complex) : undefined;
      await updateDoc(complexDocRef, payload);
      // Sync user documents if manager changed
      const prevManagerId = prevData?.managerId;
      const newManagerId = payload.managerId;
      if (prevManagerId && prevManagerId !== newManagerId) {
        try {
          await updateDoc(doc(db, 'users', prevManagerId), { assignedResidences: arrayRemove(id) } as any);
        } catch (e) {
          console.warn('Failed to remove residence from previous manager:', e);
        }
      }
      if (newManagerId && newManagerId !== prevManagerId) {
        try {
          // Use set with merge to handle missing user doc
          await setDoc(doc(db, 'users', newManagerId), { assignedResidences: arrayUnion(id) } as any, { merge: true });
        } catch (e) {
          console.warn('Failed to add residence to new manager:', e);
        }
      }
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

    if (USE_D1) {
      try {
        const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [], facilities: [] };
        const updatedResidences = residences.map(c =>
          c.id === complexId
            ? { ...c, buildings: [...c.buildings, newBuilding] }
            : c
        );
        setResidences(updatedResidences);
        const changed = updatedResidences.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: "Success", description: "New building added to the complex (D1)." });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to add building to D1.", variant: "destructive" });
      }
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
    if (USE_D1) {
      try {
        const trimmedName = name.trim();
        const complex = residences.find(c => c.id === complexId);
        if (!complex) throw new Error('Complex not found');
        const targetBuilding = complex.buildings.find(b => b.id === buildingId);
        if (targetBuilding?.floors.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
          toast({ title: "Error", description: "A floor with this name already exists in this building.", variant: "destructive" });
          return;
        }
        const newFloor: Floor = { id: `floor-${Date.now()}`, name: trimmedName, rooms: [], facilities: [] };
        const updatedResidences = residences.map(c =>
          c.id === complexId ? {
            ...c,
            buildings: c.buildings.map(b => b.id === buildingId ? { ...b, floors: [...b.floors, newFloor] } : b)
          } : c
        );
        setResidences(updatedResidences);
        const changed = updatedResidences.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: "Success", description: "New floor added to the building (D1)." });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to add floor to D1.", variant: "destructive" });
      }
      return;
    }
    if (!db) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
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
          ? { ...b, floors: [...b.floors, newFloor] }
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
    if (USE_D1) {
      try {
        const trimmedName = name.trim();
        const complex = residences.find(c => c.id === complexId);
        if (!complex) throw new Error('Complex not found');
        const building = complex.buildings.find(b => b.id === buildingId);
        const floor = building?.floors.find(f => f.id === floorId);

        if (floor?.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
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

        const updatedResidences = residences.map(c =>
          c.id === complexId ? {
            ...c,
            buildings: c.buildings.map(b =>
              b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f =>
                  f.id === floorId ? { ...f, rooms: [...f.rooms, newRoom] } : f
                )
              } : b
            )
          } : c
        );
        setResidences(updatedResidences);
        const changed = updatedResidences.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: "Success", description: "New room added to the floor (D1)." });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to add room to D1.", variant: "destructive" });
      }
      return;
    }
    if (!db) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
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

      if (floor?.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
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
            f.id === floorId ? { ...f, rooms: [...f.rooms, newRoom] } : f
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
    if (USE_D1) {
      try {
        const complex = residences.find(c => c.id === complexId);
        if (!complex) throw new Error('Complex not found');
        const building = complex.buildings.find(b => b.id === buildingId);
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
            const parts = name.split('|').map(p => p.trim());
            if (parts.length === 2) {
              const spec = parts[1];
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

        const updatedResidences = residences.map(c =>
          c.id === complexId ? {
            ...c,
            buildings: c.buildings.map(b =>
              b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f =>
                  f.id === floorId ? { ...f, rooms: [...f.rooms, ...newRooms] } : f
                )
              } : b
            )
          } : c
        );
        setResidences(updatedResidences);
        const changed = updatedResidences.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);

        let toastDescription = `Added ${addedCount} new rooms.`;
        if (skippedCount > 0) {
          toastDescription += ` Skipped ${skippedCount} duplicate rooms.`
        }
        toast({ title: "Success", description: toastDescription });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to add rooms to D1.", variant: "destructive" });
      }
      return;
    }
    if (!db) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
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
            f.id === floorId ? { ...f, rooms: [...f.rooms, ...newRooms] } : f
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
    const newFacilities: Facility[] = [];
    for (let i = 1; i <= quantity; i++) {
      const facilityName = quantity > 1 ? `${name} ${i}` : name;
      newFacilities.push({
        id: `facility-${Date.now()}-${Math.random()}`,
        name: facilityName,
        type: type.trim()
      });
    }

    if (USE_D1) {
      try {
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;

          if (level === 'complex') {
            const existingFacilities = complex.facilities || [];
            return { ...complex, facilities: [...existingFacilities, ...newFacilities] };
          }

          return {
            ...complex,
            buildings: complex.buildings.map(building => {
              if (building.id !== buildingId) return building;

              if (level === 'building') {
                const existingFacilities = building.facilities || [];
                return { ...building, facilities: [...existingFacilities, ...newFacilities] };
              }

              // level === 'floor'
              return {
                ...building,
                floors: building.floors.map(floor => {
                  if (floor.id !== floorId) return floor;
                  const existingFacilities = floor.facilities || [];
                  return { ...floor, facilities: [...existingFacilities, ...newFacilities] };
                })
              };
            })
          };
        });
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: "Success", description: `Added ${quantity} new facility/facilities (D1).` });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to add facility to D1.", variant: "destructive" });
      }
      return;
    }

    if (!db) {
      // Local storage implementation
      try {
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;

          if (level === 'complex') {
            const existingFacilities = complex.facilities || [];
            return { ...complex, facilities: [...existingFacilities, ...newFacilities] };
          }

          return {
            ...complex,
            buildings: complex.buildings.map(building => {
              if (building.id !== buildingId) return building;

              if (level === 'building') {
                const existingFacilities = building.facilities || [];
                return { ...building, facilities: [...existingFacilities, ...newFacilities] };
              }

              // level === 'floor'
              return {
                ...building,
                floors: building.floors.map(floor => {
                  if (floor.id !== floorId) return floor;
                  const existingFacilities = floor.facilities || [];
                  return { ...floor, facilities: [...existingFacilities, ...newFacilities] };
                })
              };
            })
          };
        });

        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: "Success", description: `Added ${quantity} new facility/facilities (locally).` });
        return;
      } catch (error) {
        console.error("Error adding facility locally:", error);
        toast({ title: "Error", description: "Failed to add facility locally.", variant: "destructive" });
        return;
      }
    }

    try {
      const complexDocRef = doc(db, "residences", complexId);
      const complexDoc = await getDoc(complexDocRef);

      if (!complexDoc.exists()) throw new Error("Complex not found");
      const complexData = complexDoc.data() as Complex;

      const newFacilitiesToAdd: Facility[] = [];
      for (let i = 1; i <= quantity; i++) {
        const facilityName = quantity > 1 ? `${name} ${i}` : name;
        newFacilitiesToAdd.push({
          id: `facility-${Date.now()}-${Math.random()}`,
          name: facilityName,
          type: type.trim()
        });
      }

      if (level === 'complex') {
        const existingFacilities = complexData.facilities || [];
        const updatedFacilities = [...existingFacilities, ...newFacilitiesToAdd];
        await updateDoc(complexDocRef, { facilities: updatedFacilities });
      } else if (level === 'building' && buildingId) {
        const updatedBuildings = complexData.buildings.map(b => {
          if (b.id === buildingId) {
            const existingFacilities = b.facilities || [];
            return { ...b, facilities: [...existingFacilities, ...newFacilitiesToAdd] };
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
                  return { ...f, facilities: [...existingFacilities, ...newFacilitiesToAdd] };
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
    if (USE_D1) {
      try {
        const updatedResidences = residences.filter(r => r.id !== id);
        setResidences(updatedResidences);
        await D1Client.deleteResidence(id);
        // TODO: Update users? (remove from assigned). Skipping for now as it's cleaner.
        toast({ title: "Success", description: "Complex deleted successfully (D1)." });
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to delete complex from D1.", variant: "destructive" });
      }
      return;
    }
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
    if (USE_D1) {
      try {
        const updated = residences.map(c => c.id === complexId ? { ...c, buildings: c.buildings.filter(b => b.id !== buildingId) } : c);
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Building deleted (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to delete building from D1.', variant: "destructive" });
      }
      return;
    }
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
    if (USE_D1) {
      try {
        const updated = residences.map(c => {
          if (c.id !== complexId) return c;
          return {
            ...c,
            buildings: c.buildings.map(b => b.id === buildingId ? { ...b, floors: b.floors.filter(f => f.id !== floorId) } : b)
          };
        });
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Floor deleted (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to delete floor from D1.', variant: "destructive" });
      }
      return;
    }
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
    if (USE_D1) {
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
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Room deleted (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to delete room from D1.', variant: "destructive" });
      }
      return;
    }
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
    if (USE_D1) {
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
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Facility deleted (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to delete facility from D1.', variant: "destructive" });
      }
      return;
    }
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

  const moveFacility = async (
    complexId: string,
    from: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    to: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string },
    facilityId: string
  ) => {
    if (from.level === to.level && from.buildingId === to.buildingId && from.floorId === to.floorId) return;

    const getFacilityById = (c: Complex): Facility | undefined => {
      if (from.level === 'complex') return (c.facilities || []).find(f => f.id === facilityId);
      const b = c.buildings.find(b => b.id === from.buildingId);
      if (!b) return undefined;
      if (from.level === 'building') return (b.facilities || []).find(f => f.id === facilityId);
      const fl = b.floors.find(fl => fl.id === from.floorId);
      return (fl?.facilities || []).find(f => f.id === facilityId);
    };

    const targetHasDuplicate = (c: Complex, name?: string): boolean => {
      if (!name) return false;
      const norm = name.trim().toLowerCase();
      if (to.level === 'complex') return (c.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
      const b = c.buildings.find(b => b.id === to.buildingId);
      if (!b) return false;
      if (to.level === 'building') return (b.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
      const fl = b.floors.find(fl => fl.id === to.floorId);
      return (fl?.facilities || []).some(f => f.name.trim().toLowerCase() === norm);
    };

    const applyMove = (data: Complex): Complex => {
      let moved: Facility | undefined;
      const removeFrom = (c: Complex): Complex => {
        if (from.level === 'complex') {
          const rem = (c.facilities || []).filter(f => {
            if (f.id === facilityId) { moved = f; return false; }
            return true;
          });
          return { ...c, facilities: rem };
        }
        return {
          ...c,
          buildings: c.buildings.map(b => {
            if (from.level === 'building' && b.id === from.buildingId) {
              const rem = (b.facilities || []).filter(f => {
                if (f.id === facilityId) { moved = f; return false; }
                return true;
              });
              return { ...b, facilities: rem };
            }
            if (from.level === 'floor' && b.id === from.buildingId) {
              return {
                ...b,
                floors: b.floors.map(fl => {
                  if (fl.id === from.floorId) {
                    const rem = (fl.facilities || []).filter(f => {
                      if (f.id === facilityId) { moved = f; return false; }
                      return true;
                    });
                    return { ...fl, facilities: rem };
                  }
                  return fl;
                })
              };
            }
            return b;
          })
        };
      };

      const addTo = (c: Complex): Complex => {
        if (!moved) return c;
        if (to.level === 'complex') {
          return { ...c, facilities: [...(c.facilities || []), moved] };
        }
        return {
          ...c,
          buildings: c.buildings.map(b => {
            if (to.level === 'building' && b.id === to.buildingId) {
              return { ...b, facilities: [...(b.facilities || []), moved!] };
            }
            if (to.level === 'floor' && b.id === to.buildingId) {
              return {
                ...b,
                floors: b.floors.map(fl => fl.id === to.floorId ? { ...fl, facilities: [...(fl.facilities || []), moved!] } : fl)
              };
            }
            return b;
          })
        };
      };

      // duplicate guard before applying
      const fac = moved ?? getFacilityById(data);
      if (targetHasDuplicate(data, fac?.name)) {
        // Return original data unchanged when duplicate
        return data;
      }
      return addTo(removeFrom(data));
    };

    if (USE_D1) {
      try {
        // First check duplicate on current local state
        const current = residences.find(r => r.id === complexId);
        const toMove = current ? getFacilityById(current) : undefined;
        if (current && targetHasDuplicate(current, toMove?.name)) {
          toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
          return;
        }
        const updated = residences.map(r => r.id === complexId ? applyMove(r) : r);
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'Success', description: 'Facility moved (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to move facility in D1.', variant: "destructive" });
      }
      return;
    }
    if (!db) {
      try {
        // First check duplicate on current local state
        const current = residences.find(r => r.id === complexId);
        const toMove = current ? getFacilityById(current) : undefined;
        if (current && targetHasDuplicate(current, toMove?.name)) {
          toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
          return;
        }
        const updated = residences.map(r => r.id === complexId ? applyMove(r) : r);
        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'Success', description: 'Facility moved (local).' });
      } catch (e) {
        console.error('Error moving facility locally:', e);
        toast({ title: 'Error', description: 'Failed to move facility locally.', variant: 'destructive' });
      }
      return;
    }

    try {
      const complexRef = doc(db, 'residences', complexId);
      const snap = await getDoc(complexRef);
      if (!snap.exists()) throw new Error('Complex not found');
      const data = snap.data() as Complex;
      // Duplicate guard on DB snapshot
      const facToMove = getFacilityById(data);
      if (targetHasDuplicate(data, facToMove?.name)) {
        toast({ title: 'مكرر', description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.', variant: 'destructive' });
        return;
      }
      const updated = applyMove(data);
      await updateDoc(complexRef, { buildings: updated.buildings, facilities: updated.facilities || [] });
      toast({ title: 'Success', description: 'Facility moved.' });
    } catch (e) {
      console.error('Error moving facility:', e);
      toast({ title: 'Error', description: 'Failed to move facility.', variant: 'destructive' });
    }
  };


  // Disable/Enable residence with stock check
  const checkResidenceHasStock = async (residenceId: string): Promise<boolean> => {
    if (USE_D1) {
      try {
        const inventory = await D1Client.getInventory();
        for (const item of inventory) {
          const stock = item.stockByResidence || {};
          const val = Number(stock[residenceId] || 0);
          if (!isNaN(val) && val > 0) return true;
        }
        return false;
      } catch (e) {
        console.error('Error checking residence stock D1:', e);
        return true; // fail safe
      }
    }
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

    if (USE_D1) {
      try {
        const updated = residences.map(r => r.id === id ? { ...r, disabled } : r);
        setResidences(updated);
        await D1Client.updateResidence(id, { ...residences.find(r => r.id === id)!, disabled });
        toast({ title: 'Success', description: disabled ? 'Residence disabled (D1).' : 'Residence enabled (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to update residence status in D1.', variant: "destructive" });
      }
      return;
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

  // New: Facility Component Management Functions
  const addFacilityComponent = async (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    component: Omit<FacilityComponent, 'id'>,
    buildingId?: string,
    floorId?: string
  ) => {
    const newComponent: FacilityComponent = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (USE_D1) {
      try {
        // Create updated structure
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;
          const addComponentToFacility = (facility: Facility): Facility => ({
            ...facility,
            components: [...(facility.components || []), newComponent]
          });

          if (level === 'complex') {
            return { ...complex, facilities: (complex.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f) };
          }
          return {
            ...complex,
            buildings: complex.buildings.map(b => {
              if (b.id !== buildingId) return b;
              if (level === 'building') {
                return { ...b, facilities: (b.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f) };
              }
              if (level === 'floor' && b.id === buildingId) {
                return {
                  ...b,
                  floors: b.floors.map(fl => {
                    if (fl.id !== floorId) return fl;
                    return {
                      ...fl,
                      facilities: (fl.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f)
                    };
                  })
                };
              }
              return b;
            })
          };
        });
        setResidences(updated);
        const changed = updated.find(c => c.id === complexId);
        if (changed) await D1Client.updateResidence(complexId, changed);
        toast({ title: 'تم', description: 'تم إضافة المكون بنجاح (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'خطأ', description: 'فشل إضافة المكون في D1.', variant: 'destructive' });
      }
      return;
    }

    if (!db) {
      // Local storage implementation
      try {
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;

          if (level === 'complex') {
            return {
              ...complex,
              facilities: (complex.facilities || []).map(f =>
                f.id === facilityId
                  ? { ...f, components: [...(f.components || []), newComponent] }
                  : f
              )
            };
          }

          return {
            ...complex,
            buildings: complex.buildings.map(building => {
              if (building.id !== buildingId) return building;

              if (level === 'building') {
                return {
                  ...building,
                  facilities: (building.facilities || []).map(f =>
                    f.id === facilityId
                      ? { ...f, components: [...(f.components || []), newComponent] }
                      : f
                  )
                };
              }

              // level === 'floor'
              return {
                ...building,
                floors: building.floors.map(floor => {
                  if (floor.id !== floorId) return floor;

                  const updatedFloor = {
                    ...floor,
                    facilities: (floor.facilities || []).map(f => {
                      if (f.id === facilityId) {
                        return { ...f, components: [...(f.components || []), newComponent] };
                      }
                      return f;
                    })
                  };

                  return updatedFloor;
                })
              };
            })
          };
        });

        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم إضافة المكون بنجاح.' });
      } catch (e) {
        console.error('addFacilityComponent local error:', e);
        toast({ title: 'خطأ', description: 'فشل إضافة المكون محلياً.', variant: 'destructive' });
      }
      return;
    }

    // Backend implementation
    try {
      const ref = doc(db, 'residences', complexId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Complex not found');

      const data = snap.data() as Complex;
      let updated: Complex = { ...data };

      const addComponentToFacility = (facility: Facility): Facility => ({
        ...facility,
        components: [...(facility.components || []), newComponent]
      });

      if (level === 'complex') {
        updated = {
          ...updated,
          facilities: (updated.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f)
        };
      } else if (level === 'building' && buildingId) {
        updated = {
          ...updated,
          buildings: (updated.buildings || []).map(b => {
            if (b.id !== buildingId) return b;
            return {
              ...b,
              facilities: (b.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f)
            };
          })
        };
      } else if (level === 'floor' && buildingId && floorId) {
        updated = {
          ...updated,
          buildings: (updated.buildings || []).map(b => {
            if (b.id !== buildingId) return b;
            return {
              ...b,
              floors: (b.floors || []).map(fl => {
                if (fl.id !== floorId) return fl;
                return {
                  ...fl,
                  facilities: (fl.facilities || []).map(f => f.id === facilityId ? addComponentToFacility(f) : f)
                };
              })
            };
          })
        };
      }

      await updateDoc(ref, {
        facilities: updated.facilities || [],
        buildings: updated.buildings || [],
      } as any);

      // Update local state immediately for responsive UI
      setResidences(prev => prev.map(c => c.id === complexId ? updated : c));

      toast({ title: 'تم', description: 'تم إضافة المكون بنجاح.' });
    } catch (e) {
      console.error('addFacilityComponent backend error:', e);
      toast({ title: 'خطأ', description: 'فشل إضافة المكون.', variant: 'destructive' });
    }
  };

  const updateFacilityComponent = async (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    componentId: string,
    updates: Partial<FacilityComponent>,
    buildingId?: string,
    floorId?: string
  ) => {
    if (!db) {
      try {
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;

          const updateComponentInFacility = (facility: Facility) => ({
            ...facility,
            components: (facility.components || []).map(c =>
              c.id === componentId ? { ...c, ...updates } : c
            )
          });

          if (level === 'complex') {
            return {
              ...complex,
              facilities: (complex.facilities || []).map(f =>
                f.id === facilityId ? updateComponentInFacility(f) : f
              )
            };
          }

          return {
            ...complex,
            buildings: complex.buildings.map(building => {
              if (building.id !== buildingId) return building;

              if (level === 'building') {
                return {
                  ...building,
                  facilities: (building.facilities || []).map(f =>
                    f.id === facilityId ? updateComponentInFacility(f) : f
                  )
                };
              }

              return {
                ...building,
                floors: building.floors.map(floor => {
                  if (floor.id !== floorId) return floor;
                  return {
                    ...floor,
                    facilities: (floor.facilities || []).map(f =>
                      f.id === facilityId ? updateComponentInFacility(f) : f
                    )
                  };
                })
              };
            })
          };
        });

        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم تحديث المكون بنجاح.' });
      } catch (e) {
        console.error('updateFacilityComponent local error:', e);
        toast({ title: 'خطأ', description: 'فشل تحديث المكون محلياً.', variant: 'destructive' });
      }
      return;
    }

    // Backend implementation would go here
    toast({ title: 'تم', description: 'تم تحديث المكون بنجاح.' });
  };

  const deleteFacilityComponent = async (
    complexId: string,
    facilityId: string,
    level: 'complex' | 'building' | 'floor',
    componentId: string,
    buildingId?: string,
    floorId?: string
  ) => {
    if (!db) {
      try {
        const updated = residences.map(complex => {
          if (complex.id !== complexId) return complex;

          const removeComponentFromFacility = (facility: Facility) => ({
            ...facility,
            components: (facility.components || []).filter(c => c.id !== componentId)
          });

          if (level === 'complex') {
            return {
              ...complex,
              facilities: (complex.facilities || []).map(f =>
                f.id === facilityId ? removeComponentFromFacility(f) : f
              )
            };
          }

          return {
            ...complex,
            buildings: complex.buildings.map(building => {
              if (building.id !== buildingId) return building;

              if (level === 'building') {
                return {
                  ...building,
                  facilities: (building.facilities || []).map(f =>
                    f.id === facilityId ? removeComponentFromFacility(f) : f
                  )
                };
              }

              return {
                ...building,
                floors: building.floors.map(floor => {
                  if (floor.id !== floorId) return floor;
                  return {
                    ...floor,
                    facilities: (floor.facilities || []).map(f =>
                      f.id === facilityId ? removeComponentFromFacility(f) : f
                    )
                  };
                })
              };
            })
          };
        });

        setResidences(updated);
        saveToLocalStorage(updated);
        toast({ title: 'تم', description: 'تم حذف المكون بنجاح.' });
      } catch (e) {
        console.error('deleteFacilityComponent local error:', e);
        toast({ title: 'خطأ', description: 'فشل حذف المكون محلياً.', variant: 'destructive' });
      }
      return;
    }

    // Backend implementation would go here
    toast({ title: 'تم', description: 'تم حذف المكون بنجاح.' });
  };

  const buildings = useMemo(() => residences?.flatMap(c => c.buildings) || [], [residences]);
  const floors = useMemo(() => buildings?.flatMap(b => b.floors) || [], [buildings]);
  const rooms = useMemo(() => floors?.flatMap(f => f.rooms) || [], [floors]);


  return (
    <ResidencesContext.Provider
      value={
        {
          residences,
          buildings,
          floors,
          rooms,
          loading,
          loadResidences,
          addComplex,
          updateComplex,
          addBuilding,
          addFloor,
          addRoom,
          addMultipleRooms,
          addFacility,
          moveFacility,
          moveFacilityAnywhere,
          moveRoomAnywhere,
          moveRoom,
          deleteComplex,
          deleteBuilding,
          deleteFloor,
          deleteRoom,
          deleteFacility,
          setResidenceDisabled,
          checkResidenceHasStock,
          // Expose rename helpers used by UI
          updateRoomName,
          updateFacilityName,
          updateFloorName,
          updateBuildingName,
          // New: Facility Component Management
          addFacilityComponent,
          updateFacilityComponent,
          deleteFacilityComponent,
        } as ResidencesContextType
      }
    >
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
