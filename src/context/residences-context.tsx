
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion, Unsubscribe } from "firebase/firestore";
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
  buildings: Building[];
}

// Define the shape of our context
interface ResidencesContextType {
  residences: Complex[];
  loading: boolean;
  loadResidences: () => void;
  addComplex: (name: string) => Promise<void>;
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

  const loadResidences = useCallback(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    if (unsubscribeRef.current) {
        setLoading(false);
        return;
    }

    setLoading(true);
    unsubscribeRef.current = onSnapshot(collection(db, "residences"), (snapshot) => {
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
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);


  const addComplex = async (name: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const trimmedName = name.trim();
    if (residences.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A complex with this name already exists.", variant: "destructive" });
        return;
    }
    const id = `complex-${Date.now()}`;
    await setDoc(doc(db, "residences", id), { id, name: trimmedName, buildings: [] });
    toast({ title: "Success", description: "New residential complex added." });
  };

  const addBuilding = async (complexId: string, name: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const trimmedName = name.trim();
    const complex = residences.find(c => c.id === complexId);
    if (complex?.buildings.some(b => b.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A building with this name already exists in this complex.", variant: "destructive" });
        return;
    }
    const newBuilding: Building = { id: `building-${Date.now()}`, name: trimmedName, floors: [] };
    const complexDocRef = doc(db, "residences", complexId);
    await updateDoc(complexDocRef, {
      buildings: arrayUnion(newBuilding)
    });
    toast({ title: "Success", description: "New building added to the complex." });
  };
  
  const addFloor = async (complexId: string, buildingId: string, name: string) => {
     if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const trimmedName = name.trim();
    const complex = residences.find(c => c.id === complexId);
    const building = complex?.buildings.find(b => b.id === buildingId);
     if (building?.floors.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A floor with this name already exists in this building.", variant: "destructive" });
        return;
    }

    const newFloor: Floor = { id: `floor-${Date.now()}`, name: trimmedName, rooms: [] };

    const updatedBuildings = complex?.buildings.map(b => 
        b.id === buildingId ? {...b, floors: [...b.floors, newFloor]} : b
    );

    if (updatedBuildings) {
        await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
        toast({ title: "Success", description: "New floor added to the building." });
    }
  };

  const addRoom = async (complexId: string, buildingId: string, floorId: string, name: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const trimmedName = name.trim();
    const complex = residences.find(c => c.id === complexId);
    const building = complex?.buildings.find(b => b.id === buildingId);
    const floor = building?.floors.find(f => f.id === floorId);
    if(floor?.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: "A room with this name already exists on this floor.", variant: "destructive" });
        return;
    }
    const newRoom: Room = { id: `room-${Date.now()}`, name: trimmedName };
    const updatedBuildings = complex?.buildings.map(b => 
        b.id === buildingId ? {
            ...b,
            floors: b.floors.map(f => 
                f.id === floorId ? {...f, rooms: [...f.rooms, newRoom]} : f
            )
        } : b
    );

    if (updatedBuildings) {
        await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
        toast({ title: "Success", description: "New room added to the floor." });
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
    const complex = residences.find(c => c.id === complexId);
    if (!complex) return;
    const updatedBuildings = complex.buildings.filter(b => b.id !== buildingId);
    await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
    toast({ title: "Success", description: "Building deleted successfully." });
  };

  const deleteFloor = async (complexId: string, buildingId: string, floorId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complex = residences.find(c => c.id === complexId);
    if (!complex) return;
    const updatedBuildings = complex?.buildings.map(b => 
        b.id === buildingId ? {
            ...b,
            floors: b.floors.filter(f => f.id !== floorId)
        } : b
    );
    await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
    toast({ title: "Success", description: "Floor deleted successfully." });
  };

  const deleteRoom = async (complexId: string, buildingId: string, floorId: string, roomId: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    const complex = residences.find(c => c.id === complexId);
    if (!complex) return;
    const updatedBuildings = complex?.buildings.map(b => 
        b.id === buildingId ? {
            ...b,
            floors: b.floors.map(f => 
                f.id === floorId ? {...f, rooms: f.rooms.filter(r => r.id !== roomId)} : f
            )
        } : b
    );
    await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
    toast({ title: "Success", description: "Room deleted successfully." });
  };


  return (
    <ResidencesContext.Provider value={{ residences, loading, loadResidences, addComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom }}>
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
