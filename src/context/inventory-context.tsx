
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, getDocs, writeBatch } from "firebase/firestore";


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
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadInventory: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

const seedInventoryData = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    const sampleItems: Omit<InventoryItem, 'id'>[] = [
        { name: "Light Bulb", nameAr: "لمبة إضاءة", nameEn: "Light Bulb", category: "electrical", unit: "Piece", stock: 150 },
        { name: "Cleaning Spray", nameAr: "بخاخ تنظيف", nameEn: "Cleaning Spray", category: "cleaning", unit: "Bottle", stock: 80 },
        { name: "Water Tap", nameAr: "صنبور ماء", nameEn: "Water Tap", category: "plumbing", unit: "Piece", stock: 50 },
        { name: "Power Socket", nameAr: "مقبس كهربائي", nameEn: "Power Socket", category: "electrical", unit: "Piece", stock: 120 },
        { name: "Trash Bags", nameAr: "أكياس قمامة", nameEn: "Trash Bags", category: "cleaning", unit: "Roll", stock: 200 },
    ];
    sampleItems.forEach(item => {
        const docRef = doc(collection(db, "inventory"));
        batch.set(docRef, {...item, id: docRef.id });
    });
    await batch.commit();
    console.log("Firestore inventory seeded with sample data.");
}

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const loadInventory = useCallback(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    if (unsubscribeRef.current) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const inventoryCollection = collection(db, "inventory");

    unsubscribeRef.current = onSnapshot(inventoryCollection, async (snapshot) => {
      if (snapshot.empty) {
        console.log("Inventory collection is empty, seeding data...");
        await seedInventoryData();
      } else {
        const inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        setItems(inventoryData);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching inventory:", error);
        toast({ title: "Firestore Error", description: "Could not fetch inventory data. Check your Firebase config and security rules.", variant: "destructive" });
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

  const addItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
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
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
      await deleteDoc(doc(db, "inventory", id));
      toast({ title: "Success", description: "Item has been deleted." });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
       console.error("Error deleting item:", error);
    }
  }

  return (
    <InventoryContext.Provider value={{ items, setItems, loading, addItem, deleteItem, loadInventory }}>
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
