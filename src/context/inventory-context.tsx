
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

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching inventory:", error);
        toast({ title: "Error", description: "Could not fetch inventory data.", variant: "destructive" });
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  const addItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    const isDuplicate = items.some(item => item.nameEn.toLowerCase() === newItem.nameEn.toLowerCase() || item.nameAr === newItem.nameAr);
    if (isDuplicate) {
      toast({ title: "Error", description: "An item with this name already exists.", variant: "destructive" });
      return;
    }
    const docRef = doc(collection(db, "inventory"));
    await setDoc(docRef, {...newItem, id: docRef.id});
    toast({ title: "Success", description: "New item added to inventory." });
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, "inventory", id));
    toast({ title: "Success", description: "Item has been deleted." });
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
