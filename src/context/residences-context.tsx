
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion, Unsubscribe, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


// Define types for our data structure
export interface Room {
  id: string;
  name: string;
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

export interface Complex {
  id: string;
  name: string;
  city: string;
  managerId: string;
  buildings: Building[];
}

export type UpdateComplexPayload = Pick<Complex, 'name' | 'city' | 'managerId'>;


// Define the shape of our context
interface ResidencesContextType {
  residences: Complex[];
  loading: boolean;
  loadResidences: () => void;
  addComplex: (name: string, city: string, managerId: string) => Promise<void>;
  updateComplex: (id: string, payload: UpdateComplexPayload) => Promise<void>;
  addBuilding: (complexId: string, name: string) => Promise<void>;
  addFloor: (complexId: string, buildingId: string, name: string) => Promise<void>;
  addRoom: (complexId: string, buildingId: string, floorId: string, name: string) => Promise<void>;
  deleteComplex: (id: string) => Promise<void>;
  deleteBuilding: (complexId: string, buildingId: string) => Promise<void>;
  deleteFloor: (complexId: string, buildingId: string, floorId: string) => Promise<void>;
  deleteRoom: (complexId: string, buildingId: string, floorId: string, roomId: string) => Promise<void>;
}

const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadResidences = useCallback(() => {
    if (isLoaded.current) return;
    if (!db) {
        console.error(firebaseErrorMessage);
        toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
        setLoading(false);
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
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const trimmedName = name.trim();
    if (residences.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A complex with this name already exists.", variant: "destructive" });
        return;
    }
    const docRef = doc(collection(db, "residences"));
    await setDoc(docRef, { id: docRef.id, name: trimmedName, city: city.trim(), managerId, buildings: [] });
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
        if (complexData.buildings.some(b => b.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "A building with this name already exists in this complex.", variant: "destructive" });
            return;
        }

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

  const deleteComplex = async (id: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
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


  return (
    <ResidencesContext.Provider value={{ residences, loading, loadResidences, addComplex, updateComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom }}>
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

