
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, getDocs, writeBatch, query, where, getDoc, updateDoc, runTransaction, increment, Timestamp, orderBy, addDoc, DocumentReference, DocumentData, DocumentSnapshot, collectionGroup } from "firebase/firestore";
import { useUsers } from './users-context';


export type ItemCategory = string;

export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  unit: string;
  stock: number; // This will now represent total stock across all residences.
  stockByResidence?: { [residenceId: string]: number };
  lifespanDays?: number;
}

export interface InventoryTransaction {
    id: string;
    itemId: string;
    itemNameEn: string;
    itemNameAr: string;
    residenceId: string;
    date: Timestamp;
    type: 'IN' | 'OUT';
    quantity: number;
    referenceDocId: string; // e.g., Order ID or MIV ID
    locationId?: string;
    locationName?: string;
}

export interface LocationWithItems<T> {
    locationId: string;
    locationName: string;
    isFacility: boolean;
    buildingId?: string;
    buildingName?: string;
    floorId?: string;
    floorName?: string;
    roomId?: string;
    roomName?: string;
    facilityId?: string;
    items: T[];
}

export interface MIV {
    id: string;
    date: Timestamp;
    residenceId: string;
    itemCount: number;
}

export interface MIVDetails {
    id: string;
    date: Timestamp;
    residenceId: string;
    locations: {
        [locationName: string]: {
            itemId: string;
            itemNameEn: string;
            itemNameAr: string;
            quantity: number;
        }[];
    }
}


interface InventoryContextType {
  items: InventoryItem[];
  categories: string[];
  loading: boolean;
  addItem: (item: Omit<InventoryItem, 'id' | 'stock'>) => Promise<InventoryItem | void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadInventory: () => void;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  getStockForResidence: (item: InventoryItem, residenceId: string) => number;
  issueItemsFromStock: (residenceId: string, voucherLocations: LocationWithItems<{id: string, nameEn: string, nameAr: string, issueQuantity: number}>[]) => Promise<void>;
  getInventoryTransactions: (itemId: string, residenceId: string) => Promise<InventoryTransaction[]>;
  getAllIssueTransactions: () => Promise<InventoryTransaction[]>;
  getMIVs: () => Promise<MIV[]>;
  getMIVById: (mivId: string) => Promise<MIVDetails | null>;
  getLastIssueDateForItemAtLocation: (itemId: string, locationId: string) => Promise<Timestamp | null>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";


export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const inventoryUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const categoriesUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadInventory = useCallback(() => {
     if (isLoaded.current) return;
     if (!db) {
        console.error(firebaseErrorMessage);
        toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
        setLoading(false);
        return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const inventoryCollection = collection(db, "inventory");
    inventoryUnsubscribeRef.current = onSnapshot(inventoryCollection, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => {
          const data = doc.data();
          const stockByResidence = data.stockByResidence || {};
          const totalStock = Object.values(stockByResidence).reduce((sum: number, current: any) => sum + (Number(current) || 0), 0);
          return {
              id: doc.id,
              ...data,
              stock: totalStock,
              stockByResidence: stockByResidence,
          } as InventoryItem;
      });
      setItems(inventoryData);
       const uniqueCategories = Array.from(new Set(inventoryData.map(item => item.category)));
       if (categories.length === 0 && uniqueCategories.length > 0) {
           const categoriesDocRef = doc(db, "inventory-categories", "all-categories");
           getDoc(categoriesDocRef).then(docSnap => {
               if (!docSnap.exists()) {
                   setDoc(categoriesDocRef, { names: uniqueCategories });
               }
           });
       }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching inventory:", error);
        toast({ title: "Firestore Error", description: "Could not fetch inventory data. Check your Firebase config and security rules.", variant: "destructive" });
        setLoading(false);
    });

    const categoriesCollection = collection(db, "inventory-categories");
    categoriesUnsubscribeRef.current = onSnapshot(categoriesCollection, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const categoriesData = snapshot.docs[0].data();
        setCategories(categoriesData.names || []);
      }
    }, (error) => {
       console.error("Error fetching categories:", error);
       toast({ title: "Firestore Error", description: "Could not fetch categories data.", variant: "destructive" });
    });


  }, [toast, categories.length]);
  
  useEffect(() => {
    loadInventory();
    return () => {
      if (inventoryUnsubscribeRef.current) {
        inventoryUnsubscribeRef.current();
      }
      if (categoriesUnsubscribeRef.current) {
        categoriesUnsubscribeRef.current();
      }
      isLoaded.current = false;
    };
  }, [loadInventory]);
  
  const getStockForResidence = (item: InventoryItem, residenceId: string) => {
      if (!item.stockByResidence) return 0;
      return item.stockByResidence[residenceId] || 0;
  }

  const addCategory = async (newCategory: string) => {
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
      return;
    }
    const trimmedCategory = newCategory.trim().toLowerCase();
    if (categories.map(c => c.toLowerCase()).includes(trimmedCategory)) {
       toast({ title: "Error", description: "This category already exists.", variant: "destructive" });
       return;
    }
    try {
      const updatedCategories = [...categories, newCategory.trim()];
      const categoriesDocRef = doc(db, "inventory-categories", "all-categories");
      await setDoc(categoriesDocRef, { names: updatedCategories }, { merge: true });
      toast({ title: "Success", description: "Category added." });
    } catch(error) {
      console.error("Error adding category: ", error);
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
    }
  }

  const updateCategory = async (oldName: string, newName: string) => {
     if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
      return;
    }
    const trimmedNewName = newName.trim();
    if (categories.map(c => c.toLowerCase()).includes(trimmedNewName.toLowerCase())) {
        toast({ title: "Error", description: "A category with this name already exists.", variant: "destructive" });
        return;
    }
    try {
      const batch = writeBatch(db);

      // 1. Update categories document
      const updatedCategories = categories.map(c => c === oldName ? trimmedNewName : c);
      const categoriesDocRef = doc(db, "inventory-categories", "all-categories");
      batch.set(categoriesDocRef, { names: updatedCategories });
      
      // 2. Update all items with the old category name
      const itemsToUpdateQuery = query(collection(db, "inventory"), where("category", "==", oldName));
      const itemsToUpdateSnapshot = await getDocs(itemsToUpdateQuery);
      itemsToUpdateSnapshot.forEach(itemDoc => {
        const itemRef = doc(db, "inventory", itemDoc.id);
        batch.update(itemRef, { category: trimmedNewName });
      });

      await batch.commit();
      toast({ title: "Success", description: "Category updated successfully." });
    } catch (error) {
       console.error("Error updating category: ", error);
       toast({ title: "Error", description: "Failed to update category.", variant: "destructive" });
    }
  };

  const addItem = async (newItem: Omit<InventoryItem, 'id' | 'stock'>): Promise<InventoryItem | void> => {
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
      const itemWithId = { ...newItem, id: docRef.id, stock: 0, stockByResidence: {}, lifespanDays: newItem.lifespanDays || 0 };
      await setDoc(docRef, itemWithId);
      
      const newCategory = newItem.category.toLowerCase();
      if (!categories.map(c => c.toLowerCase()).includes(newCategory)) {
        addCategory(newItem.category);
      }

      toast({ title: "Success", description: "New item added to inventory." });
      return itemWithId;
    } catch (error) {
       toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
       console.error("Error adding item:", error);
    }
  };

  const updateItem = async (itemToUpdate: InventoryItem) => {
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
      return;
    }
    try {
      const itemDocRef = doc(db, "inventory", itemToUpdate.id);
      const { stock, ...itemData } = itemToUpdate; // Exclude total stock from being written to DB
      await updateDoc(itemDocRef, { ...itemData });
      toast({ title: "Success", description: "Item updated." });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
    }
  }

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
  
    const generateNewMivId = async (transaction: any): Promise<string> => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `MIV-${year}-${month}-`;

        const mivsCollectionRef = collection(db, 'mivs');
        const q = query(mivsCollectionRef, where('id', '>=', prefix), where('id', '<', prefix + '\uf8ff'));
        
        const querySnapshot = await transaction.get(q);
        
        let maxNum = 0;
        querySnapshot.docs.forEach((docSnap: DocumentSnapshot) => {
            const docId = docSnap.id;
            const numPart = parseInt(docId.substring(prefix.length), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        });

        const nextRequestNumber = (maxNum + 1).toString().padStart(3, '0');
        return `${prefix}${nextRequestNumber}`;
    };

  const issueItemsFromStock = async (residenceId: string, voucherLocations: LocationWithItems<{id: string, nameEn: string, nameAr: string, issueQuantity: number}>[]) => {
    if (!db) {
        throw new Error(firebaseErrorMessage);
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const mivId = await generateNewMivId(transaction);
            const transactionTime = Timestamp.now();
            
            let totalItemsCount = 0;
            voucherLocations.forEach(loc => totalItemsCount += loc.items.length);

            const mivDocRef = doc(db, 'mivs', mivId);
            transaction.set(mivDocRef, { id: mivId, date: transactionTime, residenceId: residenceId, itemCount: totalItemsCount });

            const allIssuedItems = voucherLocations.flatMap(loc => loc.items);
            
            const uniqueItemIds = [...new Set(allIssuedItems.map(item => item.id))];
            
            const itemSnapshots = await Promise.all(
                uniqueItemIds.map(id => transaction.get(doc(db, "inventory", id)))
            );

            for (const location of voucherLocations) {
                let locationName = location.locationName;
                 if (!location.isFacility && location.buildingName && location.floorName && location.roomName) {
                   locationName = `${location.buildingName} -> ${location.floorName} -> ${location.roomName}`;
                }

                for (const issuedItem of location.items) {
                    if (issuedItem.issueQuantity <= 0) continue;

                    const itemDoc = itemSnapshots.find(snap => snap.id === issuedItem.id);
                     if (!itemDoc || !itemDoc.exists()) {
                        throw new Error(`Item with ID ${issuedItem.id} not found.`);
                    }

                    const currentStock = itemDoc.data().stockByResidence?.[residenceId] || 0;
                    if (currentStock < issuedItem.issueQuantity) {
                        throw new Error(`Not enough stock for ${itemDoc.data().nameEn}. Available: ${currentStock}, Required: ${issuedItem.issueQuantity}`);
                    }
                    
                    const stockUpdateKey = `stockByResidence.${residenceId}`;
                    
                     transaction.set(itemDoc.ref, { [stockUpdateKey]: increment(-issuedItem.issueQuantity) }, { merge: true });

                    const transactionRef = doc(collection(db, "inventoryTransactions"));
                    transaction.set(transactionRef, {
                        itemId: issuedItem.id,
                        itemNameEn: issuedItem.nameEn,
                        itemNameAr: issuedItem.nameAr,
                        residenceId: residenceId,
                        date: transactionTime,
                        type: 'OUT',
                        quantity: issuedItem.issueQuantity,
                        referenceDocId: mivId,
                        locationId: location.locationId,
                        locationName: locationName,
                    } as Omit<InventoryTransaction, 'id'>);
                }
            }
        });
        toast({ title: "Success", description: "Voucher submitted successfully." });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
  };


   const getInventoryTransactions = async (itemId: string, residenceId: string): Promise<InventoryTransaction[]> => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
    }
    try {
        const q = query(
            collection(db, "inventoryTransactions"),
            where("itemId", "==", itemId),
            where("residenceId", "==", residenceId)
        );

        const querySnapshot = await getDocs(q);
        const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryTransaction));
        
        transactions.sort((a, b) => a.date.toMillis() - b.date.toMillis());
        
        return transactions;

    } catch (error) {
        console.error("Error fetching inventory transactions:", error);
        toast({ title: "Error", description: "Failed to fetch item history.", variant: "destructive" });
        return [];
    }
  };

  const getAllIssueTransactions = async (): Promise<InventoryTransaction[]> => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
    }
     const q = query(
        collection(db, "inventoryTransactions"), 
        where("type", "==", "OUT")
    );
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryTransaction));

    return transactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }

  const getMIVs = async (): Promise<MIV[]> => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
    }
    const mivsCollection = collection(db, "mivs");
    const q = query(mivsCollection, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as MIV);
  };
  
  const getMIVById = async (mivId: string): Promise<MIVDetails | null> => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return null;
    }
     try {
        const q = query(collection(db, "inventoryTransactions"), where("referenceDocId", "==", mivId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const transactions = querySnapshot.docs.map(doc => doc.data() as InventoryTransaction);
        
        const mivDetails: MIVDetails = {
            id: mivId,
            date: transactions[0].date,
            residenceId: transactions[0].residenceId,
            locations: {},
        };

        transactions.forEach(tx => {
            const locationName = tx.locationName || "Unspecified Location";
            if (!mivDetails.locations[locationName]) {
                mivDetails.locations[locationName] = [];
            }
            mivDetails.locations[locationName].push({
                itemId: tx.itemId,
                itemNameEn: tx.itemNameEn,
                itemNameAr: tx.itemNameAr,
                quantity: tx.quantity
            });
        });
        
        return mivDetails;

    } catch (error) {
        console.error("Error fetching MIV details:", error);
        toast({ title: "Error", description: "Failed to fetch MIV details.", variant: "destructive" });
        return null;
    }
  }

  const getLastIssueDateForItemAtLocation = async (itemId: string, locationId: string): Promise<Timestamp | null> => {
    if (!db) {
        return null;
    }
    const q = query(
        collection(db, "inventoryTransactions"),
        where("itemId", "==", itemId),
        where("locationId", "==", locationId),
        where("type", "==", "OUT")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const transactions = querySnapshot.docs.map(doc => doc.data() as InventoryTransaction);
    transactions.sort((a,b) => b.date.toMillis() - a.date.toMillis());

    return transactions[0].date;
  };



  return (
    <InventoryContext.Provider value={{ items, categories, loading, addItem, updateItem, deleteItem, loadInventory, addCategory, updateCategory, getStockForResidence, issueItemsFromStock, getInventoryTransactions, getMIVs, getMIVById, getLastIssueDateForItemAtLocation, getAllIssueTransactions }}>
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
