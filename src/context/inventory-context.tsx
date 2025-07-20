
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

export type ItemCategory = 'cleaning' | 'electrical' | 'plumbing' | string;

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  stock: number;
}

interface InventoryContextType {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: InventoryItem) => void;
}

const initialItems: InventoryItem[] = [
  { id: 'item-1', name: 'Floor Cleaner', category: 'cleaning', unit: 'Bottle', stock: 50 },
  { id: 'item-2', name: 'Light Bulbs', category: 'electrical', unit: 'Pack of 4', stock: 120 },
  { id: 'item-3', name: 'PVC Pipe (1m)', category: 'plumbing', unit: 'Piece', stock: 30 },
  { id: 'item-4', name: 'Glass Wipes', category: 'cleaning', unit: 'Pack', stock: 75 },
  { id: 'item-5', name: 'Wire Connector', category: 'electrical', unit: 'Box', stock: 200 },
  { id: 'item-6', name: 'Faucet Washer', category: 'plumbing', unit: 'Bag', stock: 150 },
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const { toast } = useToast();

  const addItem = (newItem: InventoryItem) => {
    setItems((prevItems) => {
      const isDuplicate = prevItems.some(item => item.name.toLowerCase() === newItem.name.toLowerCase());
      if (isDuplicate) {
        toast({ title: "Error", description: "An item with this name already exists.", variant: "destructive" });
        return prevItems;
      }
      toast({ title: "Success", description: "New item added to inventory." });
      return [...prevItems, newItem];
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
