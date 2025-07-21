
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, setDoc } from "firebase/firestore";


export type ItemCategory = 'cleaning' | 'electrical' | 'plumbing' | string;

export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  unit: string;
  stock: number;
}

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  deleteItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const firebaseErrorMessage = "Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      console.warn("Firebase (db) is not initialized. App will not connect to Firestore.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching inventory:", error);
        toast({ title: "Firestore Error", description: "Could not fetch inventory data. Check your Firebase config and security rules.", variant: "destructive" });
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  const addItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    if (!db) return toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
    const isDuplicate = items.some(item => item.nameEn.toLowerCase() === newItem.nameEn.toLowerCase() || item.nameAr === newItem.nameAr);
    if (isDuplicate) {
      toast({ title: "Error", description: "An item with this name already exists.", variant: "destructive" });
      return;
    }
    try {
      const docRef = doc(collection(db, "inventory"));
      await setDoc(docRef, {...newItem, id: docRef.id});
      toast({ title: "Success", description: "New item added to inventory." });
    } catch (error) {
       toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
       console.error("Error adding item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!db) return toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
    try {
      await deleteDoc(doc(db, "inventory", id));
      toast({ title: "Success", description: "Item has been deleted." });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
       console.error("Error deleting item:", error);
    }
  }

  return (
    <InventoryContext.Provider value={{ items, setItems, loading, addItem, deleteItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
