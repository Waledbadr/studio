
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

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
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
}

const initialItems: InventoryItem[] = [
  { id: 'item-1', name: 'Floor Cleaner', nameAr: 'منظف أرضيات', nameEn: 'Floor Cleaner', category: 'cleaning', unit: 'Bottle', stock: 50 },
  { id: 'item-2', name: 'Light Bulbs', nameAr: 'مصابيح كهربائية', nameEn: 'Light Bulbs', category: 'electrical', unit: 'Pack of 4', stock: 120 },
  { id: 'item-3', name: 'PVC Pipe (1m)', nameAr: 'أنبوب PVC (1م)', nameEn: 'PVC Pipe (1m)', category: 'plumbing', unit: 'Piece', stock: 30 },
  { id: 'item-4', name: 'Glass Wipes', nameAr: 'مناديل زجاج', nameEn: 'Glass Wipes', category: 'cleaning', unit: 'Pack', stock: 75 },
  { id: 'item-5', name: 'Wire Connector', nameAr: 'موصل أسلاك', nameEn: 'Wire Connector', category: 'electrical', unit: 'Box', stock: 200 },
  { id: 'item-6', name: 'Faucet Washer', nameAr: 'حلقة صنبور', nameEn: 'Faucet Washer', category: 'plumbing', unit: 'Bag', stock: 150 },
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
     if (typeof window === 'undefined') {
      return initialItems;
    }
    try {
      const storedItems = window.localStorage.getItem('inventory');
      return storedItems ? JSON.parse(storedItems) : initialItems;
    } catch (error) {
      console.error("Error reading inventory from localStorage", error);
      return initialItems;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('inventory', JSON.stringify(items));
    } catch(error) {
      console.error("Error writing inventory to localStorage", error);
    }
  }, [items]);

  const { toast } = useToast();

  const addItem = (newItem: Omit<InventoryItem, 'id'>) => {
    setItems((prevItems) => {
      const isDuplicate = prevItems.some(item => item.nameEn.toLowerCase() === newItem.nameEn.toLowerCase() || item.nameAr === newItem.nameAr);
      if (isDuplicate) {
        toast({ title: "Error", description: "An item with this name already exists.", variant: "destructive" });
        return prevItems;
      }
      const itemWithId = { ...newItem, id: `item-${Date.now()}` };
      toast({ title: "Success", description: "New item added to inventory." });
      return [...prevItems, itemWithId];
    });
  };

  return (
    <InventoryContext.Provider value={{ items, setItems, addItem }}>
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
