
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, getDocs, writeBatch, query, where, getDoc, updateDoc, runTransaction, increment, Timestamp, orderBy, addDoc, DocumentReference, DocumentData, DocumentSnapshot, collectionGroup, limit } from "firebase/firestore";
import type { Firestore } from 'firebase/firestore';
import { useUsers } from './users-context';
import type { User } from './users-context';
import { useResidences } from './residences-context';
import { useNotifications } from './notifications-context';


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
    type: 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
    quantity: number;
    referenceDocId: string; // e.g., Order ID or MIV ID
    locationId?: string;
    locationName?: string;
    relatedResidenceId?: string; // For transfers
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
    locationName: string;
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

export interface StockTransfer {
  id: string;
  date: Timestamp;
  fromResidenceId: string;
  fromResidenceName: string;
  toResidenceId: string;
  toResidenceName: string;
  requestedById: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  items: { id: string; nameEn: string; nameAr: string; quantity: number; }[];
  approvedById?: string;
  approvedAt?: Timestamp;
  rejectedById?: string;
  rejectedAt?: Timestamp;
}

export type NewStockTransferPayload = Omit<StockTransfer, 'id' | 'date' | 'status'>;


interface InventoryContextType {
  items: InventoryItem[];
  categories: string[];
  transfers: StockTransfer[];
  loading: boolean;
  addItem: (item: Omit<InventoryItem, 'id' | 'stock'>) => Promise<InventoryItem | void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadInventory: () => void;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  getStockForResidence: (item: InventoryItem, residenceId: string) => number;
  createTransferRequest: (payload: NewStockTransferPayload, currentUser: User) => Promise<void>;
  approveTransfer: (transferId: string, approverId: string) => Promise<void>;
  rejectTransfer: (transferId: string, rejecterId: string) => Promise<void>;
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
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const inventoryUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const categoriesUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const transfersUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);
  const { residences } = useResidences();
  const { addNotification } = useNotifications();


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

    inventoryUnsubscribeRef.current = onSnapshot(collection(db, "inventory"), (snapshot) => {
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

    categoriesUnsubscribeRef.current = onSnapshot(collection(db, "inventory-categories"), (snapshot) => {
      if (snapshot.docs.length > 0) {
        const categoriesData = snapshot.docs[0].data();
        setCategories(categoriesData.names || []);
      }
    }, (error) => {
       console.error("Error fetching categories:", error);
       toast({ title: "Firestore Error", description: "Could not fetch categories data.", variant: "destructive" });
    });
    
    transfersUnsubscribeRef.current = onSnapshot(query(collection(db, 'stockTransfers'), orderBy('date', 'desc')), (snapshot) => {
        const transfersData = snapshot.docs.map(doc => doc.data() as StockTransfer);
        setTransfers(transfersData);
    }, (error) => {
        console.error("Error fetching transfers:", error);
        toast({ title: "Firestore Error", description: "Could not fetch stock transfers.", variant: "destructive" });
    });


  }, [toast, categories.length]);
  
  useEffect(() => {
    loadInventory();
    return () => {
      if (inventoryUnsubscribeRef.current) inventoryUnsubscribeRef.current();
      if (categoriesUnsubscribeRef.current) categoriesUnsubscribeRef.current();
      if (transfersUnsubscribeRef.current) transfersUnsubscribeRef.current();
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
  
    const generateNewMivId = async (): Promise<string> => {
        if (!db) throw new Error("Firebase not initialized");
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `MIV-${year}-${month}-`;

        // This query is simpler and less likely to require a composite index
        const q = query(
            collection(db, 'mivs'),
            where('id', '>=', prefix),
            where('id', '<', prefix + '\uf8ff'),
            orderBy('id', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        let lastNum = 0;
        if (!querySnapshot.empty) {
            const lastId = querySnapshot.docs[0].id;
            const numPart = parseInt(lastId.substring(prefix.length), 10);
            if (!isNaN(numPart)) {
                lastNum = numPart;
            }
        }

        const nextRequestNumber = (lastNum + 1).toString().padStart(3, '0');
        return `${prefix}${nextRequestNumber}`;
    };

  const issueItemsFromStock = async (residenceId: string, voucherLocations: LocationWithItems<{id: string, nameEn: string, nameAr: string, issueQuantity: number}>[]) => {
    if (!db) {
        throw new Error(firebaseErrorMessage);
    }

    try {
        const mivId = await generateNewMivId();
        
        await runTransaction(db, async (transaction) => {
            const allIssuedItems = voucherLocations.flatMap(loc => loc.items);
            const uniqueItemIds = [...new Set(allIssuedItems.map(item => item.id))];
            
            const itemSnapshots = new Map<string, DocumentSnapshot>();
            for (const id of uniqueItemIds) {
                const itemRef = doc(db, "inventory", id);
                const itemSnap = await transaction.get(itemRef);
                if (!itemSnap.exists()) {
                    throw new Error(`Item with ID ${id} not found.`);
                }
                itemSnapshots.set(id, itemSnap);
            }

            for (const item of allIssuedItems) {
                const itemSnap = itemSnapshots.get(item.id);
                const currentStock = itemSnap?.data()?.stockByResidence?.[residenceId] || 0;
                if (currentStock < item.issueQuantity) {
                    throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentStock}, Required: ${item.issueQuantity}`);
                }
                 // Update stock
                const itemRef = doc(db, "inventory", item.id);
                const stockUpdateKey = `stockByResidence.${residenceId}`;
                transaction.update(itemRef, { [stockUpdateKey]: increment(-item.issueQuantity) });
            }
            
            // All reads and stock checks are done, now do all writes
            const transactionTime = Timestamp.now();
            let totalItemsCount = 0;
            let firstLocationName = voucherLocations[0]?.locationName || 'N/A';
            
            const mivDocRef = doc(db, 'mivs', mivId);
            
            for (const location of voucherLocations) {
                for (const issuedItem of location.items) {
                    if (issuedItem.issueQuantity <= 0) continue;
                    totalItemsCount += issuedItem.issueQuantity;

                    // Log transaction
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
                        locationName: location.locationName,
                    } as Omit<InventoryTransaction, 'id'>);
                }
            }
            
            // Write MIV master record
            transaction.set(mivDocRef, { 
                id: mivId, 
                date: transactionTime, 
                residenceId, 
                itemCount: totalItemsCount,
                locationName: firstLocationName, // Storing main location for overview
            });
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
    try {
        const q = query(
            collection(db, "inventoryTransactions"),
            where("itemId", "==", itemId),
            where("locationId", "==", locationId),
            where("type", "==", "OUT"),
            orderBy("date", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        return querySnapshot.docs[0].data().date as Timestamp;

    } catch (error) {
        console.error("Error fetching last issue date:", error);
        return null;
    }
  };

    const createTransferRequest = async (payload: NewStockTransferPayload, currentUser: User) => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        const { fromResidenceId, toResidenceId, items: itemsToTransfer } = payload;
        
        const isInternalTransfer = currentUser.assignedResidences.includes(fromResidenceId) &&
                                   currentUser.assignedResidences.includes(toResidenceId);

        if (isInternalTransfer) {
            // Direct transfer, no approval needed
            try {
                await runTransaction(db, async (transaction) => {
                    for (const item of itemsToTransfer) {
                        const itemRef = doc(db, 'inventory', item.id);
                        const itemDoc = await transaction.get(itemRef);
                        if (!itemDoc.exists()) throw new Error(`Item ${item.nameEn} not found.`);
                        
                        const currentFromStock = itemDoc.data().stockByResidence?.[fromResidenceId] || 0;
                        if (currentFromStock < item.quantity) {
                            throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentFromStock}, Required: ${item.quantity}`);
                        }
                        
                        transaction.update(itemRef, { 
                            [`stockByResidence.${fromResidenceId}`]: increment(-item.quantity)
                        });
                        
                        // Ensure 'to' residence has a stock entry before incrementing
                        const toStockUpdate = {
                             [`stockByResidence.${toResidenceId}`]: increment(item.quantity)
                        };

                        transaction.set(itemRef, toStockUpdate, { merge: true });
                    }
                     // Create a completed transfer record
                    const transferDocRef = doc(collection(db, 'stockTransfers'));
                    const newTransfer: StockTransfer = {
                        ...payload,
                        id: transferDocRef.id,
                        date: Timestamp.now(),
                        status: 'Completed',
                        approvedById: currentUser.id,
                        approvedAt: Timestamp.now()
                    };
                    transaction.set(transferDocRef, newTransfer);
                });
                toast({ title: "Success", description: "Internal transfer completed successfully." });
            } catch (error) {
                 console.error("Failed to execute direct transfer:", error);
                 toast({ title: "Error", description: `Transfer failed: ${error}`, variant: "destructive" });
                 throw error;
            }
        } else {
            // External transfer, requires approval
            try {
                const transferDocRef = doc(collection(db, 'stockTransfers'));
                const newTransfer: StockTransfer = {
                    ...payload,
                    id: transferDocRef.id,
                    date: Timestamp.now(),
                    status: 'Pending'
                };
                await setDoc(transferDocRef, newTransfer);

                // Create notification for the destination residence manager
                const toResidence = residences.find(r => r.id === toResidenceId);
                if (toResidence && toResidence.managerId && addNotification) {
                     await addNotification({
                        userId: toResidence.managerId,
                        title: 'New Stock Transfer Request',
                        message: `You have a new transfer request from ${payload.fromResidenceName}.`,
                        type: 'transfer_request',
                        href: `/inventory/transfer`,
                        referenceId: newTransfer.id,
                    });
                }

                toast({ title: "Success", description: "Transfer request created and pending approval." });
            } catch (error) {
                console.error("Failed to create transfer request:", error);
                throw error;
            }
        }
    };

    const approveTransfer = async (transferId: string, approverId: string) => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        const transferRef = doc(db, 'stockTransfers', transferId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const transferDoc = await transaction.get(transferRef);
                if (!transferDoc.exists() || transferDoc.data().status !== 'Pending') {
                    throw new Error("Transfer request not found or already processed.");
                }
                const transferData = transferDoc.data() as StockTransfer;

                const { fromResidenceId, toResidenceId, items: itemsToTransfer } = transferData;

                for (const item of itemsToTransfer) {
                    const itemRef = doc(db, 'inventory', item.id);
                    const itemDoc = await transaction.get(itemRef);
                    if (!itemDoc.exists()) throw new Error(`Item ${item.nameEn} not found.`);
                    
                    const currentStock = itemDoc.data().stockByResidence?.[fromResidenceId] || 0;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentStock}, Required: ${item.quantity}`);
                    }
                    
                    // Decrement from source
                    transaction.update(itemRef, { [`stockByResidence.${fromResidenceId}`]: increment(-item.quantity) });
                    // Increment at destination
                    transaction.set(itemRef, { [`stockByResidence.${toResidenceId}`]: increment(item.quantity) }, { merge: true });
                }

                transaction.update(transferRef, {
                    status: 'Completed',
                    approvedById: approverId,
                    approvedAt: Timestamp.now()
                });
            });
            toast({ title: "Success", description: "Transfer approved and stock updated." });
        } catch (error) {
            console.error("Failed to approve transfer:", error);
            toast({ title: "Error", description: `Approval failed: ${error}`, variant: "destructive" });
        }
    };
    
    const rejectTransfer = async (transferId: string, rejecterId: string) => {
         if (!db) throw new Error(firebaseErrorMessage);
         const transferRef = doc(db, 'stockTransfers', transferId);
         await updateDoc(transferRef, {
             status: 'Rejected',
             rejectedById: rejecterId,
             rejectedAt: Timestamp.now()
         });
         toast({ title: "Success", description: "Transfer request has been rejected." });
    };


  return (
    <InventoryContext.Provider value={{ items, categories, transfers, loading, addItem, updateItem, deleteItem, loadInventory, addCategory, updateCategory, getStockForResidence, issueItemsFromStock, getInventoryTransactions, getMIVs, getMIVById, getLastIssueDateForItemAtLocation, getAllIssueTransactions, createTransferRequest, approveTransfer, rejectTransfer }}>
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
