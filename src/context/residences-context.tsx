
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion, Unsubscribe, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


// Define types for our data structure
export interface SubFacility {
  id: string;
  name: string;
  number?: string; // e.g., bathroom number
  status: 'Active' | 'Inactive' | 'Maintenance';
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  type: string; // e.g., 'Bathroom', 'Kitchen', 'Laundry', 'Storage'
  category: 'Essential' | 'Amenity' | 'Utility'; // Classification of service
  subFacilities: SubFacility[];
  status: 'Active' | 'Inactive' | 'Maintenance';
  addedDate: Date;
  lastMaintenanceDate?: Date;
  notes?: string;
}

export interface Room {
  id: string;
  name: string;
  services?: Service[]; // Room-level services
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
  services?: Service[]; // Floor-level services
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
  services?: Service[]; // Building-level services
}

export interface Facility {
  id: string;
  name: string;
  type: string; // e.g., Warehouse, Office, Clinic
  services?: Service[]; // Facility-level services
}

export interface Complex {
  id: string;
  name: string;
  city: string;
  managerId: string;
  buildings: Building[];
  facilities?: Facility[];
  services?: Service[];
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
  addRoom: (complexId: string, buildingId: string, floorId: string, name: string) => Promise<void>;
  addMultipleRooms: (complexId: string, buildingId: string, floorId: string, roomNames: string[]) => Promise<void>;
  addFacility: (complexId: string, name: string, type: string) => Promise<void>;
  deleteComplex: (id: string) => Promise<void>;
  deleteBuilding: (complexId: string, buildingId: string) => Promise<void>;
  deleteFloor: (complexId: string, buildingId: string, floorId: string) => Promise<void>;
  deleteRoom: (complexId: string, buildingId: string, floorId: string, roomId: string) => Promise<void>;
  deleteFacility: (complexId: string, facilityId: string) => Promise<void>;
  
  // Service management functions
  addServiceToBuilding: (complexId: string, buildingId: string, service: Omit<Service, 'id' | 'addedDate'>) => Promise<void>;
  addServiceToFloor: (complexId: string, buildingId: string, floorId: string, service: Omit<Service, 'id' | 'addedDate'>) => Promise<void>;
  addServiceToRoom: (complexId: string, buildingId: string, floorId: string, roomId: string, service: Omit<Service, 'id' | 'addedDate'>) => Promise<void>;
  addServiceToFacility: (complexId: string, facilityId: string, service: Omit<Service, 'id' | 'addedDate'>) => Promise<void>;
  
  // Sub-facility management functions
  addSubFacilityToService: (location: ServiceLocation, serviceId: string, subFacility: Omit<SubFacility, 'id'>) => Promise<void>;
  updateSubFacility: (location: ServiceLocation, serviceId: string, subFacilityId: string, updates: Partial<SubFacility>) => Promise<void>;
  deleteSubFacility: (location: ServiceLocation, serviceId: string, subFacilityId: string) => Promise<void>;
  
  // Service operations
  updateService: (location: ServiceLocation, serviceId: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (location: ServiceLocation, serviceId: string) => Promise<void>;
}

export interface ServiceLocation {
  complexId: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  facilityId?: string;
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
    
    unsubscribeRef.current = onSnapshot(residencesCollection, (snapshot) => {
        const residencesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complex));
        setResidences(residencesData);
        setLoading(false);
    }, (error) => {
      console.error("Error fetching residences:", error);
      toast({ title: "Firestore Error", description: "Could not fetch residences data. Check your Firebase config and security rules.", variant: "destructive" });
      setLoading(false);
    });
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
                facilities: []
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
    await setDoc(docRef, { id: docRef.id, name: trimmedName, city: city.trim(), managerId, buildings: [], facilities: [] });
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
    
    // Find the complex first
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
        // Use localStorage when Firebase is not available
        try {
            const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [] };
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

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [] };
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

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const targetBuilding = complexData.buildings.find(b => b.id === buildingId);

        if (targetBuilding?.floors.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A floor with this name already exists in this building.", variant: "destructive" });
            return;
        }

        const newFloor: Floor = { id: `floor-${Date.now()}`, name: trimmedName, rooms: [] };

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

  const addRoom = async (complexId: string, buildingId: string, floorId: string, name: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const trimmedName = name.trim();
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }
        
        const complexData = complexDoc.data() as Complex;
        
        const building = complexData.buildings.find(b => b.id === buildingId);
        const floor = building?.floors.find(f => f.id === floorId);

        if(floor?.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A room with this name already exists on this floor.", variant: "destructive" });
            return;
        }

        const newRoom: Room = { id: `room-${Date.now()}`, name: trimmedName };
        
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

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }
        
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
            .map(name => ({ id: `room-${Date.now()}-${Math.random()}`, name: name }));
        
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

  const addFacility = async (complexId: string, name: string, type: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const trimmedName = name.trim();
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }
        
        const complexData = complexDoc.data() as Complex;
        const facilities = complexData.facilities || [];

        if (facilities.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A facility with this name already exists in this complex.", variant: "destructive" });
            return;
        }

        const newFacility: Facility = { id: `facility-${Date.now()}`, name: trimmedName, type };
        const updatedFacilities = [...facilities, newFacility];
        
        await updateDoc(complexDocRef, { facilities: updatedFacilities });
        toast({ title: "Success", description: "New facility added to the complex." });

    } catch (error) {
        console.error("Error adding facility:", error);
        toast({ title: "Error", description: "Failed to add facility.", variant: "destructive" });
    }
  };

  const deleteComplex = async (id: string) => {
    if (!db) {
        // Use localStorage when Firebase is not available
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
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complexDocRef = doc(db, "residences", complexId);
    const complexDoc = await getDoc(complexDocRef);
     if (!complexDoc.exists()) {
        throw new Error("Complex not found");
    }
    const complexData = complexDoc.data() as Complex;
    const updatedBuildings = complexData.buildings.filter(b => b.id !== buildingId);
    await updateDoc(complexDocRef, { buildings: updatedBuildings });
    toast({ title: "Success", description: "Building deleted successfully." });
  };

  const deleteFloor = async (complexId: string, buildingId: string, floorId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complexDocRef = doc(db, "residences", complexId);
    const complexDoc = await getDoc(complexDocRef);
     if (!complexDoc.exists()) {
        throw new Error("Complex not found");
    }
    const complexData = complexDoc.data() as Complex;
    const updatedBuildings = complexData.buildings.map(b => 
        b.id === buildingId ? {
            ...b,
            floors: b.floors.filter(f => f.id !== floorId)
        } : b
    );
    await updateDoc(complexDocRef, { buildings: updatedBuildings });
    toast({ title: "Success", description: "Floor deleted successfully." });
  };

  const deleteRoom = async (complexId: string, buildingId: string, floorId: string, roomId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complexDocRef = doc(db, "residences", complexId);
    const complexDoc = await getDoc(complexDocRef);
     if (!complexDoc.exists()) {
        throw new Error("Complex not found");
    }
    const complexData = complexDoc.data() as Complex;
    const updatedBuildings = complexData.buildings.map(b => 
        b.id === buildingId ? {
            ...b,
            floors: b.floors.map(f => 
                f.id === floorId ? {...f, rooms: f.rooms.filter(r => r.id !== roomId)} : f
            )
        } : b
    );
    await updateDoc(complexDocRef, { buildings: updatedBuildings });
    toast({ title: "Success", description: "Room deleted successfully." });
  };

  const deleteFacility = async (complexId: string, facilityId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complexDocRef = doc(db, "residences", complexId);
    const complexDoc = await getDoc(complexDocRef);
     if (!complexDoc.exists()) {
        throw new Error("Complex not found");
    }
    const complexData = complexDoc.data() as Complex;
    const updatedFacilities = (complexData.facilities || []).filter(f => f.id !== facilityId);
    await updateDoc(complexDocRef, { facilities: updatedFacilities });
    toast({ title: "Success", description: "Facility deleted successfully." });
  };

  // Service management functions
  const addServiceToBuilding = async (complexId: string, buildingId: string, service: Omit<Service, 'id' | 'addedDate'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newService: Service = { 
            ...service, 
            id: `service-${Date.now()}`, 
            addedDate: new Date(),
            subFacilities: service.subFacilities || []
        };

        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId 
                ? { ...b, services: [...(b.services || []), newService] }
                : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "Service added to building successfully." });

    } catch (error) {
        console.error("Error adding service to building:", error);
        toast({ title: "Error", description: "Failed to add service to building.", variant: "destructive" });
    }
  };

  const addServiceToFloor = async (complexId: string, buildingId: string, floorId: string, service: Omit<Service, 'id' | 'addedDate'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newService: Service = { 
            ...service, 
            id: `service-${Date.now()}`, 
            addedDate: new Date(),
            subFacilities: service.subFacilities || []
        };

        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f => 
                    f.id === floorId 
                        ? { ...f, services: [...(f.services || []), newService] }
                        : f
                )
            } : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "Service added to floor successfully." });

    } catch (error) {
        console.error("Error adding service to floor:", error);
        toast({ title: "Error", description: "Failed to add service to floor.", variant: "destructive" });
    }
  };

  const addServiceToRoom = async (complexId: string, buildingId: string, floorId: string, roomId: string, service: Omit<Service, 'id' | 'addedDate'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newService: Service = { 
            ...service, 
            id: `service-${Date.now()}`, 
            addedDate: new Date(),
            subFacilities: service.subFacilities || []
        };

        const updatedBuildings = complexData.buildings.map(b => 
            b.id === buildingId ? {
                ...b,
                floors: b.floors.map(f => 
                    f.id === floorId ? {
                        ...f,
                        rooms: f.rooms.map(r => 
                            r.id === roomId 
                                ? { ...r, services: [...(r.services || []), newService] }
                                : r
                        )
                    } : f
                )
            } : b
        );

        await updateDoc(complexDocRef, { buildings: updatedBuildings });
        toast({ title: "Success", description: "Service added to room successfully." });

    } catch (error) {
        console.error("Error adding service to room:", error);
        toast({ title: "Error", description: "Failed to add service to room.", variant: "destructive" });
    }
  };

  const addServiceToFacility = async (complexId: string, facilityId: string, service: Omit<Service, 'id' | 'addedDate'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newService: Service = { 
            ...service, 
            id: `service-${Date.now()}`, 
            addedDate: new Date(),
            subFacilities: service.subFacilities || []
        };

        const updatedFacilities = (complexData.facilities || []).map(f => 
            f.id === facilityId 
                ? { ...f, services: [...(f.services || []), newService] }
                : f
        );

        await updateDoc(complexDocRef, { facilities: updatedFacilities });
        toast({ title: "Success", description: "Service added to facility successfully." });

    } catch (error) {
        console.error("Error adding service to facility:", error);
        toast({ title: "Error", description: "Failed to add service to facility.", variant: "destructive" });
    }
  };

  // Sub-facility management functions
  const addSubFacilityToService = async (location: ServiceLocation, serviceId: string, subFacility: Omit<SubFacility, 'id'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", location.complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        const newSubFacility: SubFacility = { 
            ...subFacility, 
            id: `subfacility-${Date.now()}`
        };

        let updated = false;

        if (location.facilityId) {
            // Add to facility service
            const updatedFacilities = (complexData.facilities || []).map(f => 
                f.id === location.facilityId ? {
                    ...f,
                    services: (f.services || []).map(s => 
                        s.id === serviceId 
                            ? { ...s, subFacilities: [...s.subFacilities, newSubFacility] }
                            : s
                    )
                } : f
            );
            await updateDoc(complexDocRef, { facilities: updatedFacilities });
            updated = true;
        } else if (location.buildingId) {
            const updatedBuildings = complexData.buildings.map(b => {
                if (b.id !== location.buildingId) return b;
                
                if (location.roomId && location.floorId) {
                    // Add to room service
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                rooms: f.rooms.map(r => 
                                    r.id === location.roomId ? {
                                        ...r,
                                        services: (r.services || []).map(s => 
                                            s.id === serviceId 
                                                ? { ...s, subFacilities: [...s.subFacilities, newSubFacility] }
                                                : s
                                        )
                                    } : r
                                )
                            } : f
                        )
                    };
                } else if (location.floorId) {
                    // Add to floor service
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                services: (f.services || []).map(s => 
                                    s.id === serviceId 
                                        ? { ...s, subFacilities: [...s.subFacilities, newSubFacility] }
                                        : s
                                )
                            } : f
                        )
                    };
                } else {
                    // Add to building service
                    return {
                        ...b,
                        services: (b.services || []).map(s => 
                            s.id === serviceId 
                                ? { ...s, subFacilities: [...s.subFacilities, newSubFacility] }
                                : s
                        )
                    };
                }
            });
            await updateDoc(complexDocRef, { buildings: updatedBuildings });
            updated = true;
        }

        if (updated) {
            toast({ title: "Success", description: "Sub-facility added successfully." });
        } else {
            throw new Error("Invalid location provided");
        }

    } catch (error) {
        console.error("Error adding sub-facility:", error);
        toast({ title: "Error", description: "Failed to add sub-facility.", variant: "destructive" });
    }
  };

  const updateSubFacility = async (location: ServiceLocation, serviceId: string, subFacilityId: string, updates: Partial<SubFacility>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", location.complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        let updated = false;

        if (location.facilityId) {
            const updatedFacilities = (complexData.facilities || []).map(f => 
                f.id === location.facilityId ? {
                    ...f,
                    services: (f.services || []).map(s => 
                        s.id === serviceId ? {
                            ...s,
                            subFacilities: s.subFacilities.map(sf => 
                                sf.id === subFacilityId ? { ...sf, ...updates } : sf
                            )
                        } : s
                    )
                } : f
            );
            await updateDoc(complexDocRef, { facilities: updatedFacilities });
            updated = true;
        } else if (location.buildingId) {
            const updatedBuildings = complexData.buildings.map(b => {
                if (b.id !== location.buildingId) return b;
                
                if (location.roomId && location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                rooms: f.rooms.map(r => 
                                    r.id === location.roomId ? {
                                        ...r,
                                        services: (r.services || []).map(s => 
                                            s.id === serviceId ? {
                                                ...s,
                                                subFacilities: s.subFacilities.map(sf => 
                                                    sf.id === subFacilityId ? { ...sf, ...updates } : sf
                                                )
                                            } : s
                                        )
                                    } : r
                                )
                            } : f
                        )
                    };
                } else if (location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                services: (f.services || []).map(s => 
                                    s.id === serviceId ? {
                                        ...s,
                                        subFacilities: s.subFacilities.map(sf => 
                                            sf.id === subFacilityId ? { ...sf, ...updates } : sf
                                        )
                                    } : s
                                )
                            } : f
                        )
                    };
                } else {
                    return {
                        ...b,
                        services: (b.services || []).map(s => 
                            s.id === serviceId ? {
                                ...s,
                                subFacilities: s.subFacilities.map(sf => 
                                    sf.id === subFacilityId ? { ...sf, ...updates } : sf
                                )
                            } : s
                        )
                    };
                }
            });
            await updateDoc(complexDocRef, { buildings: updatedBuildings });
            updated = true;
        }

        if (updated) {
            toast({ title: "Success", description: "Sub-facility updated successfully." });
        } else {
            throw new Error("Invalid location provided");
        }

    } catch (error) {
        console.error("Error updating sub-facility:", error);
        toast({ title: "Error", description: "Failed to update sub-facility.", variant: "destructive" });
    }
  };

  const deleteSubFacility = async (location: ServiceLocation, serviceId: string, subFacilityId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", location.complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        let updated = false;

        if (location.facilityId) {
            const updatedFacilities = (complexData.facilities || []).map(f => 
                f.id === location.facilityId ? {
                    ...f,
                    services: (f.services || []).map(s => 
                        s.id === serviceId ? {
                            ...s,
                            subFacilities: s.subFacilities.filter(sf => sf.id !== subFacilityId)
                        } : s
                    )
                } : f
            );
            await updateDoc(complexDocRef, { facilities: updatedFacilities });
            updated = true;
        } else if (location.buildingId) {
            const updatedBuildings = complexData.buildings.map(b => {
                if (b.id !== location.buildingId) return b;
                
                if (location.roomId && location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                rooms: f.rooms.map(r => 
                                    r.id === location.roomId ? {
                                        ...r,
                                        services: (r.services || []).map(s => 
                                            s.id === serviceId ? {
                                                ...s,
                                                subFacilities: s.subFacilities.filter(sf => sf.id !== subFacilityId)
                                            } : s
                                        )
                                    } : r
                                )
                            } : f
                        )
                    };
                } else if (location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                services: (f.services || []).map(s => 
                                    s.id === serviceId ? {
                                        ...s,
                                        subFacilities: s.subFacilities.filter(sf => sf.id !== subFacilityId)
                                    } : s
                                )
                            } : f
                        )
                    };
                } else {
                    return {
                        ...b,
                        services: (b.services || []).map(s => 
                            s.id === serviceId ? {
                                ...s,
                                subFacilities: s.subFacilities.filter(sf => sf.id !== subFacilityId)
                            } : s
                        )
                    };
                }
            });
            await updateDoc(complexDocRef, { buildings: updatedBuildings });
            updated = true;
        }

        if (updated) {
            toast({ title: "Success", description: "Sub-facility deleted successfully." });
        } else {
            throw new Error("Invalid location provided");
        }

    } catch (error) {
        console.error("Error deleting sub-facility:", error);
        toast({ title: "Error", description: "Failed to delete sub-facility.", variant: "destructive" });
    }
  };

  const updateService = async (location: ServiceLocation, serviceId: string, updates: Partial<Service>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", location.complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        let updated = false;

        if (location.facilityId) {
            const updatedFacilities = (complexData.facilities || []).map(f => 
                f.id === location.facilityId ? {
                    ...f,
                    services: (f.services || []).map(s => 
                        s.id === serviceId ? { ...s, ...updates } : s
                    )
                } : f
            );
            await updateDoc(complexDocRef, { facilities: updatedFacilities });
            updated = true;
        } else if (location.buildingId) {
            const updatedBuildings = complexData.buildings.map(b => {
                if (b.id !== location.buildingId) return b;
                
                if (location.roomId && location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                rooms: f.rooms.map(r => 
                                    r.id === location.roomId ? {
                                        ...r,
                                        services: (r.services || []).map(s => 
                                            s.id === serviceId ? { ...s, ...updates } : s
                                        )
                                    } : r
                                )
                            } : f
                        )
                    };
                } else if (location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                services: (f.services || []).map(s => 
                                    s.id === serviceId ? { ...s, ...updates } : s
                                )
                            } : f
                        )
                    };
                } else {
                    return {
                        ...b,
                        services: (b.services || []).map(s => 
                            s.id === serviceId ? { ...s, ...updates } : s
                        )
                    };
                }
            });
            await updateDoc(complexDocRef, { buildings: updatedBuildings });
            updated = true;
        }

        if (updated) {
            toast({ title: "Success", description: "Service updated successfully." });
        } else {
            throw new Error("Invalid location provided");
        }

    } catch (error) {
        console.error("Error updating service:", error);
        toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
    }
  };

  const deleteService = async (location: ServiceLocation, serviceId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const complexDocRef = doc(db, "residences", location.complexId);
        const complexDoc = await getDoc(complexDocRef);

        if (!complexDoc.exists()) {
            throw new Error("Complex not found");
        }

        const complexData = complexDoc.data() as Complex;
        let updated = false;

        if (location.facilityId) {
            const updatedFacilities = (complexData.facilities || []).map(f => 
                f.id === location.facilityId ? {
                    ...f,
                    services: (f.services || []).filter(s => s.id !== serviceId)
                } : f
            );
            await updateDoc(complexDocRef, { facilities: updatedFacilities });
            updated = true;
        } else if (location.buildingId) {
            const updatedBuildings = complexData.buildings.map(b => {
                if (b.id !== location.buildingId) return b;
                
                if (location.roomId && location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                rooms: f.rooms.map(r => 
                                    r.id === location.roomId ? {
                                        ...r,
                                        services: (r.services || []).filter(s => s.id !== serviceId)
                                    } : r
                                )
                            } : f
                        )
                    };
                } else if (location.floorId) {
                    return {
                        ...b,
                        floors: b.floors.map(f => 
                            f.id === location.floorId ? {
                                ...f,
                                services: (f.services || []).filter(s => s.id !== serviceId)
                            } : f
                        )
                    };
                } else {
                    return {
                        ...b,
                        services: (b.services || []).filter(s => s.id !== serviceId)
                    };
                }
            });
            await updateDoc(complexDocRef, { buildings: updatedBuildings });
            updated = true;
        }

        if (updated) {
            toast({ title: "Success", description: "Service deleted successfully." });
        } else {
            throw new Error("Invalid location provided");
        }

    } catch (error) {
        console.error("Error deleting service:", error);
        toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
    }
  };
  
  const buildings = useMemo(() => residences?.flatMap(c => c.buildings) || [], [residences]);
  const floors = useMemo(() => buildings?.flatMap(b => b.floors) || [], [buildings]);
  const rooms = useMemo(() => floors?.flatMap(f => f.rooms) || [], [floors]);


  return (
    <ResidencesContext.Provider value={{ 
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
      deleteComplex, 
      deleteBuilding, 
      deleteFloor, 
      deleteRoom, 
      deleteFacility,
      addServiceToBuilding,
      addServiceToFloor,
      addServiceToRoom,
      addServiceToFacility,
      addSubFacilityToService,
      updateSubFacility,
      deleteSubFacility,
      updateService,
      deleteService
    }}>
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
