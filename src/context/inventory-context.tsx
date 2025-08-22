'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, getDocs, writeBatch, query, where, getDoc, updateDoc, runTransaction, increment, Timestamp, orderBy, addDoc, DocumentReference, DocumentData, DocumentSnapshot, collectionGroup, limit } from "firebase/firestore";
import type { Firestore } from 'firebase/firestore';
import { useUsers } from './users-context';
import { onAuthStateChanged } from 'firebase/auth';
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
  variants?: string[];
  // Optional: item-level search keywords (synonyms/aliases)
  keywordsAr?: string[];
  keywordsEn?: string[];
}

export interface InventoryTransaction {
    id: string;
    itemId: string;
    itemNameEn: string;
    itemNameAr: string;
    residenceId: string;
    date: Timestamp;
    type: 'RECEIVE' | 'ISSUE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN' | 'IN' | 'OUT' | 'DEPRECIATION' | 'AUDIT';
    quantity: number;
    referenceDocId: string; // e.g., Order ID or MIV ID
    locationId?: string;
    locationName?: string;
    relatedResidenceId?: string; // For transfers
    depreciationReason?: string; // For depreciation transactions
  // Optional legacy fields used by some reports
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  movementType?: string;
  timestamp?: number | string | Date;
}

export interface DepreciationRequest {
    itemId: string;
    residenceId: string;
    locationId: string;
    locationName: string;
    quantity: number;
    reason: string;
    notes?: string;
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

// MRV (Material Receipt Voucher) types
export interface MRV {
  id: string;
  date: Timestamp;
  residenceId: string;
  itemCount: number;
  supplierName?: string;
  invoiceNo?: string;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  codeShort?: string | null;
}

export interface MRVDetails {
  id: string;
  date: Timestamp;
  residenceId: string;
  items: {
    itemId: string;
    itemNameEn: string;
    itemNameAr: string;
    quantity: number;
  }[];
  supplierName?: string;
  invoiceNo?: string;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  codeShort?: string | null;
}

// MRV Request (needs admin approval before posting)
export interface MRVRequest {
  id: string;
  residenceId: string;
  items: { id: string; nameEn: string; nameAr: string; quantity: number }[];
  supplierName: string | null;
  invoiceNo: string | null;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  notes?: string | null;
  status: 'Pending' | 'Processing' | 'Approved' | 'Rejected';
  requestedById?: string | null;
  requestedAt: Timestamp;
  approvedById?: string;
  approvedAt?: Timestamp;
  rejectedById?: string;
  rejectedAt?: Timestamp;
  mrvId?: string; // linked posted MRV id when approved
  mrvShort?: string; // short code MRV-YYMSEQ
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
  // Optional short formatted code for the transfer (TRS-YYM#)
  codeShort?: string;
}

export type NewStockTransferPayload = Omit<StockTransfer, 'id' | 'date' | 'status'>;

// Inventory Audit interfaces
export interface InventoryAudit {
  id: string;
  name: string;
  description?: string;
  residenceId: string;
  residenceName: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: Timestamp;
  startDate?: Timestamp;
  endDate?: Timestamp;
  scope: {
    locations: string[]; // locationId:locationName format
    categories: string[];
    includeAllItems: boolean;
    specificItems: string[];
  };
  settings: {
    requireDoubleCheck: boolean;
    requirePhotos: boolean;
    autoGenerateReport: boolean;
    emailReport: boolean;
  };
  summary?: {
    totalItems: number;
    completedItems: number;
    discrepanciesCount: number;
    adjustmentsMade: number;
  };
}

export interface AuditItem {
  id: string;
  auditId: string;
  itemId: string;
  itemName: string;
  itemNameAr: string;
  category: string;
  unit: string;
  locationId: string;
  locationName: string;
  systemStock: number;
  physicalStock: number | null;
  difference: number;
  status: 'PENDING' | 'COUNTED' | 'VERIFIED' | 'DISCREPANCY' | 'ADJUSTED';
  notes: string;
  countedBy?: string;
  countedAt?: Timestamp;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  adjustmentAction?: 'APPROVE' | 'REJECT' | 'MODIFY';
  adjustmentReason?: string;
  newPhysicalCount?: number;
}

export interface AuditAdjustment {
  id: string;
  auditId: string;
  itemId: string;
  itemNameAr: string;
  locationId: string;
  locationName: string;
  oldStock: number;
  newStock: number;
  difference: number;
  unit: string;
  reason: string;
  adjustedBy: string;
  adjustedAt: Timestamp;
}

export interface StockReconciliation {
  id: string; // same as referenceId
  residenceId: string;
  date: Timestamp;
  itemCount: number;
  totalIncrease: number;
  totalDecrease: number;
  performedById?: string;
}

// Reconciliation approval workflow
export interface ReconciliationRequest {
  id: string;
  residenceId: string;
  adjustments: { itemId: string; newStock: number; reason?: string }[];
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedById: string;
  requestedAt: Timestamp;
  approvedById?: string;
  approvedAt?: Timestamp;
  rejectedById?: string;
  rejectedAt?: Timestamp;
  rejectReason?: string | null;
  referenceId?: string; // linked reconciliation id when approved
  reservedId?: string; // pre-reserved reconciliation id/code for display while pending
}


interface InventoryContextType {
  items: InventoryItem[];
  // compatibility alias expected by some pages
  inventoryItems?: InventoryItem[];
  categories: string[];
  transfers: StockTransfer[];
  audits: InventoryAudit[];
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
  // For issuing, only id and quantity are required; names are optional and resolved from inventory when available
  issueItemsFromStock: (residenceId: string, voucherLocations: LocationWithItems<{id: string, issueQuantity: number, nameEn?: string, nameAr?: string}>[]) => Promise<void>;
  getInventoryTransactions: (itemId: string, residenceId: string) => Promise<InventoryTransaction[]>;
  getAllInventoryTransactions: () => Promise<InventoryTransaction[]>;
  getAllInventoryTransactionsRaw?: () => Promise<any[]>;
  getAllIssueTransactions: () => Promise<InventoryTransaction[]>;
  getMIVs: () => Promise<MIV[]>;
  getMIVById: (mivId: string) => Promise<MIVDetails | null>;
  getLastIssueDateForItemAtLocation: (itemId: string, locationId: string) => Promise<Timestamp | null>;
  depreciateItems: (depreciationRequest: DepreciationRequest) => Promise<void>;
  // Audit functions
  createAudit: (audit: Omit<InventoryAudit, 'id' | 'createdAt' | 'summary'>) => Promise<string>;
  getAudits: () => Promise<InventoryAudit[]>;
  getAuditById: (auditId: string) => Promise<InventoryAudit | null>;
  updateAuditStatus: (auditId: string, status: InventoryAudit['status']) => Promise<void>;
  getAuditItems: (auditId: string) => Promise<AuditItem[]>;
  updateAuditItem: (auditItem: AuditItem) => Promise<void>;
  submitAuditCount: (auditId: string, itemId: string, physicalStock: number, notes: string, countedBy: string) => Promise<void>;
  completeAudit: (auditId: string, adjustments: AuditAdjustment[], generalNotes: string) => Promise<void>;
  // Simplified stock reconciliation for residences
  reconcileStock: (
    residenceId: string,
    adjustments: { itemId: string; newStock: number; reason?: string }[],
  performedById?: string,
  overrideReferenceId?: string
  ) => Promise<string | void>;
  getReconciliations: (residenceId: string) => Promise<StockReconciliation[]>;
  // New: admin/all and details helpers
  getAllReconciliations: () => Promise<StockReconciliation[]>;
  getReconciliationById: (id: string) => Promise<StockReconciliation | null>;
  getReconciliationItems: (referenceId: string) => Promise<InventoryTransaction[]>;
  // Transfer helpers
  getTransferItems: (referenceId: string) => Promise<InventoryTransaction[]>;
  // Maintenance tools
  fixNegativeStocks: () => Promise<{ fixedCount: number; affectedItems: string[] }>;
  // Reconciliation approval workflow
  getReconciliationRequests: (residenceId?: string, status?: ReconciliationRequest['status']) => Promise<ReconciliationRequest[]>;
  createReconciliationRequest: (residenceId: string, adjustments: { itemId: string; newStock: number; reason?: string }[], requestedById: string) => Promise<string>;
  approveReconciliationRequest: (requestId: string, approverId: string) => Promise<string>;
  rejectReconciliationRequest: (requestId: string, rejecterId: string, reason?: string) => Promise<void>;
  // MRV helpers
  createMRV: (payload: { residenceId: string; items: { id: string; nameEn: string; nameAr: string; quantity: number }[]; meta?: { supplierName?: string; invoiceNo?: string; notes?: string; attachmentUrl?: string | null; attachmentPath?: string | null; mrvId?: string; mrvShort?: string } }) => Promise<string>;
  getMRVs: () => Promise<MRV[]>;
  getMRVById: (mrvId: string) => Promise<MRVDetails | null>;
  // MRV Requests (approval flow)
  getMRVRequests: (status?: MRVRequest['status']) => Promise<MRVRequest[]>;
  approveMRVRequest: (requestId: string, approverId: string) => Promise<string>;
  rejectMRVRequest: (requestId: string, rejecterId: string, reason?: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";


export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const inventoryUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const categoriesUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const transfersUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const auditsUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);
  const { residences } = useResidences();
  const { addNotification } = useNotifications();
  const { users, currentUser } = useUsers();


  const loadInventory = useCallback(() => {
     if (isLoaded.current) return;
     if (!db) {
        console.error(firebaseErrorMessage);
        toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
        setLoading(false);
        return;
    }
    
    // Defer subscribing until signed in
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }

    isLoaded.current = true;
    setLoading(true);

  inventoryUnsubscribeRef.current = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => {
          const data = doc.data();
          const stockByResidence = data.stockByResidence || {};
          // Ensure totalStock is a valid number, defaulting to 0 if not.
      // Clamp any negative values when computing totals for safety/display
      const totalStock = Object.values(stockByResidence).reduce((sum: number, current) => {
        const num = Number(current);
        const safe = isNaN(num) ? 0 : Math.max(0, num);
        return sum + safe;
      }, 0);
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
           const categoriesDocRef = doc(db!, "inventory-categories", "all-categories");
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

    auditsUnsubscribeRef.current = onSnapshot(query(collection(db, 'inventoryAudits'), orderBy('createdAt', 'desc')), (snapshot) => {
        const auditsData = snapshot.docs.map(doc => doc.data() as InventoryAudit);
        setAudits(auditsData);
    }, (error) => {
        console.error("Error fetching audits:", error);
        toast({ title: "Firestore Error", description: "Could not fetch audits.", variant: "destructive" });
    });


  }, [toast, categories.length]);
  
  useEffect(() => {
    loadInventory();
    const unsub = auth ? onAuthStateChanged(auth, (u) => {
      if (u) {
        if (!isLoaded.current) loadInventory();
      } else {
        // Signed out: unsubscribe and reset
        if (inventoryUnsubscribeRef.current) { try { inventoryUnsubscribeRef.current(); } catch {} inventoryUnsubscribeRef.current = null; }
        if (categoriesUnsubscribeRef.current) { try { categoriesUnsubscribeRef.current(); } catch {} categoriesUnsubscribeRef.current = null; }
        if (transfersUnsubscribeRef.current) { try { transfersUnsubscribeRef.current(); } catch {} transfersUnsubscribeRef.current = null; }
        if (auditsUnsubscribeRef.current) { try { auditsUnsubscribeRef.current(); } catch {} auditsUnsubscribeRef.current = null; }
        isLoaded.current = false;
        setItems([]);
        setCategories([]);
        setTransfers([]);
        setAudits([]);
        setLoading(false);
      }
    }) : undefined;
    return () => {
      if (inventoryUnsubscribeRef.current) inventoryUnsubscribeRef.current();
      if (categoriesUnsubscribeRef.current) categoriesUnsubscribeRef.current();
      if (transfersUnsubscribeRef.current) transfersUnsubscribeRef.current();
      if (auditsUnsubscribeRef.current) auditsUnsubscribeRef.current();
      isLoaded.current = false;
      unsub?.();
    };
  }, [loadInventory]);
  
  const getStockForResidence = (item: InventoryItem, residenceId: string) => {
      if (!item.stockByResidence) return 0;
      const v = Number(item.stockByResidence[residenceId] || 0);
      return isNaN(v) ? 0 : Math.max(0, v);
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
      const categoriesDocRef = doc(db!, "inventory-categories", "all-categories");
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
      const categoriesDocRef = doc(db!, "inventory-categories", "all-categories");
      batch.set(categoriesDocRef, { names: updatedCategories });
      
      // 2. Update all items with the old category name
      const itemsToUpdateQuery = query(collection(db!, "inventory"), where("category", "==", oldName));
      const itemsToUpdateSnapshot = await getDocs(itemsToUpdateQuery);
      itemsToUpdateSnapshot.forEach(itemDoc => {
        const itemRef = doc(db!, "inventory", itemDoc.id);
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
      const itemWithId = { ...newItem, id: docRef.id, stock: 0, stockByResidence: {}, lifespanDays: newItem.lifespanDays || 0, variants: newItem.variants || [] };
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
      const itemDocRef = doc(db!, "inventory", itemToUpdate.id);
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
    // Enforce admin-only deletion in the client as a first line of defense
    if (!currentUser || currentUser.role !== 'Admin') {
      toast({ title: "Forbidden", description: "Only admins can delete items.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db!, "inventory", id));
      toast({ title: "Success", description: "Item has been deleted." });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
       console.error("Error deleting item:", error);
    }
  }
  
    const generateNewMivId = async (): Promise<string> => {
        if (!db) throw new Error("Firebase not initialized");
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const mmNoPad = (now.getMonth() + 1).toString();
        const counterRef = doc(db!, 'counters', `miv-${yy}-${mm}`);

        let nextSeq = 0;
        await runTransaction(db!, async (trx) => {
          const snap = await trx.get(counterRef);
          const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
          nextSeq = current + 1;
          trx.set(counterRef, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
        });

        return `MIV-${yy}${mmNoPad}${nextSeq}`; // e.g., MIV-25814
    };

    // MRV ID generator: MRV-YY-MM-###
    const generateNewMrvId = async (): Promise<string> => {
      if (!db) throw new Error("Firebase not initialized");
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = `MRV-${year}-${month}-`;

      const qRef = query(
        collection(db, 'mrvs'),
        where('id', '>=', prefix),
        where('id', '<', prefix + '\uf8ff'),
        orderBy('id', 'desc'),
        limit(1)
      );

      const snap = await getDocs(qRef);
      let lastNum = 0;
      if (!snap.empty) {
        const lastId = snap.docs[0].id;
        const numPart = parseInt(lastId.substring(prefix.length), 10);
        if (!isNaN(numPart)) lastNum = numPart;
      }
      const next = (lastNum + 1).toString().padStart(3, '0');
      return `${prefix}${next}`;
    };

  // Reserve reconciliation id via counters: CON-<YY><M><seq>
  const reserveNewReconciliationId = async (): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterRef = doc(db!, 'counters', `recon-${yy}-${mmNoPad}`);

    let nextSeq = 0;
    await runTransaction(db!, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm: mmNoPad, updatedAt: Timestamp.now() }, { merge: true });
    });
    return `CON-${yy}${mmNoPad}${nextSeq}`;
  };

  // Reserve a monthly TRS code: TRS-<YY><M><seq>
  const reserveNewTrsId = async (): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterRef = doc(db!, 'counters', `trs-${yy}-${mm}`);

    let nextSeq = 0;
    await runTransaction(db!, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
    });
    return `TRS-${yy}${mmNoPad}${nextSeq}`;
  };

  const issueItemsFromStock = async (residenceId: string, voucherLocations: LocationWithItems<{id: string, issueQuantity: number, nameEn?: string, nameAr?: string}>[]) => {
    if (!db) {
        throw new Error(firebaseErrorMessage);
    }

    try {
        const mivId = await generateNewMivId();
        
    await runTransaction(db, async (transaction) => {
      const allIssuedItems = voucherLocations.flatMap(loc => loc.items);
      const uniqueItemIds = [...new Set(allIssuedItems.map(item => item.id))];

      // Step 1: Read all items first
      const itemSnapshots = new Map<string, DocumentSnapshot>();
  for (const id of uniqueItemIds) {
        const itemRef = doc(db!, "inventory", id);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) {
          throw new Error(`Item with ID ${id} not found.`);
        }
        itemSnapshots.set(id, itemSnap);
      }

      // Step 2: Aggregate quantities per item and validate against current stock
      const totalsByItem = new Map<string, number>();
      for (const line of allIssuedItems) {
        const prev = totalsByItem.get(line.id) || 0;
        totalsByItem.set(line.id, prev + (Number(line.issueQuantity) || 0));
      }

      for (const [itemId, totalToIssue] of totalsByItem.entries()) {
        const snap = itemSnapshots.get(itemId);
        const data: any = snap?.data() || {};
  const currentStock = Math.max(0, Number(data.stockByResidence?.[residenceId] || 0));
        if (currentStock < totalToIssue) {
          // Get item name for better message
          const nameEn = data.nameEn || data.name || itemId;
          throw new Error(`Not enough stock for ${nameEn}. Available: ${currentStock}, Required: ${totalToIssue}`);
        }
      }

      // Step 3: Perform stock decrements once per item (atomic and aggregated)
      for (const [itemId, totalToIssue] of totalsByItem.entries()) {
        const itemRef = doc(db!, "inventory", itemId);
        const stockUpdateKey = `stockByResidence.${residenceId}`;
        // Decrement safely via read-modify-write to avoid underflow if another adjustment snuck in
        const snap = itemSnapshots.get(itemId);
        const cur = Math.max(0, Number((snap?.data() as any)?.stockByResidence?.[residenceId] || 0));
        const next = Math.max(0, cur - totalToIssue);
        const newSbr = { ...((snap?.data() as any)?.stockByResidence || {}) };
        newSbr[residenceId] = next;
        const newTotal = Object.values(newSbr).reduce((sum: number, v: any) => {
          const n = Number(v);
          return sum + (isNaN(n) ? 0 : Math.max(0, n));
        }, 0);
        transaction.update(itemRef, { stockByResidence: newSbr, stock: newTotal });
      }
            
            const transactionTime = Timestamp.now();
            let totalItemsCount = 0;
            let firstLocationName = voucherLocations[0]?.locationName || 'N/A';
            
            const mivDocRef = doc(db!, 'mivs', mivId);
            
            // Best-effort decode helper
            const pretty = (s?: string) => {
              if (!s) return s as any;
              try { if (/%[0-9A-Fa-f]{2}/.test(String(s))) return decodeURIComponent(String(s)); } catch {}
              return s;
            };

            for (const location of voucherLocations) {
                for (const issuedItem of location.items) {
                    if (issuedItem.issueQuantity <= 0) continue;
                    totalItemsCount += issuedItem.issueQuantity;

                    // Log transaction
                    const transactionRef = doc(collection(db!, "inventoryTransactions"));
                    const snap = itemSnapshots.get(issuedItem.id);
                    const inv: any = snap?.data() || {};
                    transaction.set(transactionRef, {
                        itemId: issuedItem.id,
                        itemNameEn: inv.nameEn || inv.name || pretty(issuedItem.nameEn) || '',
                        itemNameAr: inv.nameAr || inv.name || pretty(issuedItem.nameAr) || '',
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

  // Create MRV (manual receipt without order)
  const createMRV = async (payload: { residenceId: string; items: { id: string; nameEn: string; nameAr: string; quantity: number }[]; meta?: { supplierName?: string; invoiceNo?: string; notes?: string; attachmentUrl?: string | null; attachmentPath?: string | null; mrvId?: string; mrvShort?: string } }): Promise<string> => {
    // Note: If meta.mrvId is not provided, we reserve an MRV id using monthly counters (reserveNewMrvId)
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "Destructive" as any });
      throw new Error(firebaseErrorMessage);
    }
    // Client-side guard: only Admin or Supervisor can post MRVs
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
      toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can post MRVs.', variant: 'destructive' });
      throw new Error('Forbidden');
    }
    const validItems = (payload.items || []).filter(i => i.quantity && i.quantity > 0);
    if (!payload.residenceId || validItems.length === 0) {
      throw new Error('Residence and at least one item with quantity > 0 are required.');
    }

    // Use reserved MRV id if provided; otherwise reserve a new one
    let mrvId = payload.meta?.mrvId || '';
    let mrvShort = payload.meta?.mrvShort || '';
    if (!mrvId) {
      const r = await reserveNewMrvId();
      // Use short format as the official MRV ID
      mrvId = r.short;
      mrvShort = r.short;
    }

    await runTransaction(db, async (transaction) => {
      // Read all item documents first
      const uniqueItemIds = [...new Set(validItems.map(i => i.id))];
      const itemRefs = uniqueItemIds.map(id => doc(db!, 'inventory', id));
      const itemSnaps = await Promise.all(itemRefs.map(r => transaction.get(r)));

      // Validate items existence and build lookup
      const existingById = new Map<string, any>();
      for (let i = 0; i < itemSnaps.length; i++) {
        const snap = itemSnaps[i];
        if (!snap.exists()) {
          throw new Error(`Item not found (ID: ${uniqueItemIds[i]})`);
        }
        existingById.set(snap.id, snap.data());
      }

      // Aggregate quantities per item for a single atomic update per item
      const totalsByItem = new Map<string, number>();
      for (const line of validItems) {
        totalsByItem.set(line.id, (totalsByItem.get(line.id) || 0) + Number(line.quantity || 0));
      }

      const now = Timestamp.now();
      let totalItemCount = 0;

      // Update stock (stockByResidence and total stock) per item
      for (const [itemId, totalQty] of totalsByItem.entries()) {
        const prev = existingById.get(itemId) || {};
        const prevSbr = { ...(prev.stockByResidence || {}) } as Record<string, number>;
        const prevAtRes = Math.max(0, Number(prevSbr[payload.residenceId] || 0));
        const nextAtRes = prevAtRes + totalQty;
        const newSbr = { ...prevSbr, [payload.residenceId]: nextAtRes };
        const newTotal = Object.values(newSbr).reduce((sum, v: any) => {
          const n = Number(v);
          return sum + (isNaN(n) ? 0 : Math.max(0, n));
        }, 0);
        const itemRef = doc(db!, 'inventory', itemId);
        transaction.update(itemRef, { stockByResidence: newSbr, stock: newTotal });
        totalItemCount += totalQty;
      }

      // Log transactions for each line
      for (const line of validItems) {
        const txRef = doc(collection(db!, 'inventoryTransactions'));
        transaction.set(txRef, {
          itemId: line.id,
          itemNameEn: line.nameEn,
          itemNameAr: line.nameAr,
          residenceId: payload.residenceId,
          date: now,
          type: 'IN',
          quantity: line.quantity,
          referenceDocId: mrvId,
          locationName: 'Receiving'
        } as Omit<InventoryTransaction, 'id'>);
      }

      // Write MRV master record
      const mrvRef = doc(db!, 'mrvs', mrvId);
      transaction.set(mrvRef, {
        id: mrvId,
        date: now,
        residenceId: payload.residenceId,
        itemCount: totalItemCount,
        supplierName: payload.meta?.supplierName || null,
        invoiceNo: payload.meta?.invoiceNo || null,
        notes: payload.meta?.notes || null,
        attachmentUrl: payload.meta?.attachmentUrl || null,
        attachmentPath: payload.meta?.attachmentPath || null,
        codeShort: mrvShort || null,
      } as any);
    });

    toast({ title: 'Success', description: 'Materials received and added to stock.' });
    return mrvId;
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
        
  transactions.sort((a, b) => (a.date?.toMillis?.() || 0) - (b.date?.toMillis?.() || 0));
        
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

  return transactions.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
  }

  // Fetch all transfer transactions (IN/OUT) by reference code (e.g., TRS-2582)
  const getTransferItems = async (referenceDocId: string): Promise<InventoryTransaction[]> => {
    if (!db) throw new Error(firebaseErrorMessage);
    const qRef = query(
      collection(db!, 'inventoryTransactions'),
      where('referenceDocId', '==', referenceDocId),
      where('type', 'in', ['TRANSFER_IN', 'TRANSFER_OUT'] as any)
    );
    const snap = await getDocs(qRef);
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InventoryTransaction[];
    // Sort by item name for nicer display
    return rows.sort((a, b) => (a.itemNameEn || '').localeCompare(b.itemNameEn || ''));
  };

 const getAllInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
    }

    try {
        // Previously used collectionGroup which requires subcollections of the same name.
        // Our transactions are stored in a top-level collection "inventoryTransactions",
        const q = query(collection(db, "inventoryTransactions"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryTransaction));
    } catch (error) {
        console.error("Error fetching all inventory transactions:", error);
        toast({ title: "Error", description: "Failed to fetch all transactions.", variant: "destructive" });
        return [];
    }
  };

  // Helper: last issue date for an item at a specific location
  const getLastIssueDateForItemAtLocation = async (itemId: string, locationId: string): Promise<Timestamp | null> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return null;
    }
    try {
      const qRef = query(
        collection(db, 'inventoryTransactions'),
        where('itemId', '==', itemId),
        where('locationId', '==', locationId),
        where('type', '==', 'OUT')
      );
      const snap = await getDocs(qRef);
      if (snap.empty) return null;
      const txs = snap.docs.map(d => d.data() as any);
      txs.sort((a: any, b: any) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
      return txs[0]?.date || null;
    } catch (error) {
      console.error('Error fetching last issue date:', error);
      toast({ title: 'Error', description: 'Failed to fetch last issue date.', variant: 'destructive' });
      return null;
    }
  };

  // List recent MIVs
  const getMIVs = async (): Promise<MIV[]> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return [];
    }
    try {
      const qRef = query(collection(db, 'mivs'), orderBy('date', 'desc'), limit(20));
      const snap = await getDocs(qRef);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MIV[];
    } catch (error) {
      console.error('Error fetching MIVs:', error);
      toast({ title: 'Error', description: 'Failed to fetch MIVs.', variant: 'destructive' });
      return [];
    }
  };

  // Get MIV details by ID
  const getMIVById = async (mivId: string): Promise<MIVDetails | null> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return null;
    }
    try {
      const txQ = query(collection(db, 'inventoryTransactions'), where('referenceDocId', '==', mivId));
      const txSnap = await getDocs(txQ);
      if (txSnap.empty) return null;
      const txs = txSnap.docs.map(d => d.data() as InventoryTransaction);

      const locations: MIVDetails['locations'] = {};
      for (const tx of txs) {
        const locName = tx.locationName || 'Unknown';
        if (!locations[locName]) locations[locName] = [];
        locations[locName].push({
          itemId: tx.itemId,
          itemNameEn: tx.itemNameEn,
          itemNameAr: tx.itemNameAr,
          quantity: tx.quantity,
        });
      }

      const detail: MIVDetails = {
        id: mivId,
        date: txs[0].date,
        residenceId: txs[0].residenceId,
        locations,
      };
      return detail;
    } catch (e) {
      console.error('Error fetching MIV details:', e);
      toast({ title: 'Error', description: 'Failed to fetch MIV details.', variant: 'destructive' });
      return null;
    }
  };

  // List recent MRVs
  const getMRVs = async (): Promise<MRV[]> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return [];
    }
    try {
      const qRef = query(collection(db, 'mrvs'), orderBy('date', 'desc'), limit(20));
      const snap = await getDocs(qRef);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MRV[];
    } catch (error) {
      console.error('Error fetching MRVs:', error);
      toast({ title: 'Error', description: 'Failed to fetch MRVs.', variant: 'destructive' });
      return [];
    }
  };

  // Get MRV details by ID
  const getMRVById = async (mrvId: string): Promise<MRVDetails | null> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return null;
    }
    try {
      const txQ = query(collection(db, 'inventoryTransactions'), where('referenceDocId', '==', mrvId));
      const txSnap = await getDocs(txQ);
      if (txSnap.empty) return null;
      const items = txSnap.docs.map(d => d.data() as InventoryTransaction);
      // Fetch MRV master for meta
      const mrvRef = doc(db, 'mrvs', mrvId);
      const mrvSnap = await getDoc(mrvRef);
      const meta = mrvSnap.exists() ? (mrvSnap.data() as any) : {};

      return {
        id: mrvId,
        date: items[0].date,
        residenceId: items[0].residenceId,
        items: items.map(tx => ({
          itemId: tx.itemId,
          itemNameEn: tx.itemNameEn,
          itemNameAr: tx.itemNameAr,
          quantity: tx.quantity
        })),
        supplierName: meta?.supplierName || undefined,
        invoiceNo: meta?.invoiceNo || undefined,
        attachmentUrl: meta?.attachmentUrl || null,
        attachmentPath: meta?.attachmentPath || null,
        codeShort: meta?.codeShort || null,
      } as MRVDetails;
    } catch (e) {
      console.error('Error fetching MRV details:', e);
      toast({ title: 'Error', description: 'Failed to fetch MRV details.', variant: 'destructive' });
      return null;
    }
  };

  const reserveNewMrvId = async (): Promise<{ id: string; short: string }> => {
    if (!db) throw new Error("Firebase not initialized");
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // e.g., 25
    const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., 08
    const mmNoPad = (now.getMonth() + 1).toString(); // e.g., 8
    const counterId = `mrv-${yy}-${mm}`; // counters/mrv-25-08
    const counterRef = doc(db!, 'counters', counterId);

    let nextSeq = 0;
    await runTransaction(db, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
    });
    const seqPadded = nextSeq.toString().padStart(3, '0');
    const fullId = `MRV-${yy}-${mm}-${seqPadded}`; // MRV-25-08-027
    const shortId = `MRV-${yy}${mmNoPad}${nextSeq}`; // MRV-25827
    return { id: fullId, short: shortId };
  };

  // MRV Requests (Admin approval flow)
  const getMRVRequests = async (status?: MRVRequest['status']): Promise<MRVRequest[]> => {
    if (!db) {
      toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
      return [];
    }
    try {
      let qRef: any = collection(db, 'mrvRequests');
      if (status) {
        qRef = query(qRef, where('status', '==', status));
      }
      const snap = await getDocs(qRef);
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MRVRequest[];
      // Sort by requestedAt desc if available
      arr.sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
      return arr;
    } catch (e) {
      console.error('Error fetching MRV requests:', e);
      toast({ title: 'Error', description: 'Failed to fetch MRV requests.', variant: 'destructive' });
      return [];
    }
  };

  const approveMRVRequest = async (requestId: string, approverId: string): Promise<string> => {
    if (!db) throw new Error(firebaseErrorMessage);
    const reqRef = doc(db!, 'mrvRequests', requestId);

    // Step 1: Atomically move Pending -> Processing to prevent double approvals
    await runTransaction(db, async (trx) => {
      const snap = await trx.get(reqRef);
      if (!snap.exists()) throw new Error('Request not found');
      const data = snap.data() as MRVRequest;
      if (data.status === 'Approved' && data.mrvId) {
        // Already approved earlier: short-circuit
        throw Object.assign(new Error('ALREADY_APPROVED'), { code: 'ALREADY_APPROVED', mrvId: data.mrvId });
      }
      if (data.status !== 'Pending') {
        throw new Error('Request already processed');
      }
      // Mark as Processing to lock it
      trx.update(reqRef, { status: 'Processing', processingAt: Timestamp.now(), processingById: approverId } as any);
    });

    // Step 2: Read the fresh data and proceed to create MRV
    const freshSnap = await getDoc(reqRef);
    const reqData = freshSnap.data() as MRVRequest;

    // Reserve an MRV id/code to ensure consistent monthly sequence
    const reserved = await reserveNewMrvId();
    // Create posted MRV and update request status
    const mrvId = await createMRV({
      residenceId: reqData.residenceId,
      items: reqData.items.map(i => ({ id: i.id, nameEn: i.nameEn, nameAr: i.nameAr, quantity: i.quantity })),
      meta: { supplierName: reqData.supplierName || undefined, invoiceNo: reqData.invoiceNo || undefined, notes: reqData.notes || undefined, attachmentUrl: reqData.attachmentUrl || null, attachmentPath: reqData.attachmentPath || null, mrvId: reserved.short, mrvShort: reserved.short }
    });

    await updateDoc(reqRef, {
      status: 'Approved',
      approvedById: approverId,
      approvedAt: Timestamp.now(),
      mrvId,
      mrvShort: reserved.short
    });

    // Notify requester and all Admins
    try {
      const requesterId = reqData.requestedById || null;
      if (requesterId) {
        await addNotification?.({
          userId: requesterId,
          title: 'MRV Approved',
          message: `Your MRV request has been approved and posted (${mrvId}).`,
          type: 'generic',
          href: `/inventory/receive/receipts/${mrvId}`,
          referenceId: mrvId,
        } as any);
      }
      const admins = (users || []).filter(u => u.role === 'Admin');
      for (const admin of admins) {
        await addNotification?.({
          userId: admin.id,
          title: 'MRV Posted',
          message: `MRV ${mrvId} has been posted to stock.`,
          type: 'generic',
          href: `/inventory/receive/receipts/${mrvId}`,
          referenceId: mrvId,
        } as any);
      }
    } catch {}

    toast({ title: 'Approved', description: `MRV request approved and posted (${mrvId}).` });
    return mrvId;
  };

  const rejectMRVRequest = async (requestId: string, rejecterId: string, reason?: string) => {
    if (!db) throw new Error(firebaseErrorMessage);
    const reqRef = doc(db!, 'mrvRequests', requestId);
    const snap = await getDoc(reqRef);
    if (!snap.exists()) throw new Error('Request not found');
    const data = snap.data() as MRVRequest;
    if (data.status !== 'Pending') throw new Error('Request already processed');
    await updateDoc(reqRef, { status: 'Rejected', rejectedById: rejecterId, rejectedAt: Timestamp.now(), rejectReason: reason || null });
    // Notify requester
    try {
      const requesterId = data.requestedById || null;
      if (requesterId) {
        await addNotification?.({
          userId: requesterId,
          title: 'MRV Rejected',
          message: `Your MRV request was rejected${reason ? `: ${reason}` : ''}.`,
          type: 'generic',
          href: `/inventory/receive`,
          referenceId: requestId,
        } as any);
      }
    } catch {}
    toast({ title: 'Rejected', description: 'MRV request has been rejected.' });
  };

    const createTransferRequest = async (payload: NewStockTransferPayload, currentUser: User) => {
        if (!db || !payload) {
            const msg = !db ? firebaseErrorMessage : "Transfer payload is missing.";
            toast({ title: "Error", description: msg, variant: "destructive" });
            throw new Error(msg);
        }
        
        const { fromResidenceId, toResidenceId, items: itemsToTransfer } = payload;
        
        const isInternalTransfer = currentUser.assignedResidences.includes(fromResidenceId) &&
                                   currentUser.assignedResidences.includes(toResidenceId);

  if (isInternalTransfer) {
            // Direct transfer, no approval needed
            try {
    // Reserve a TRS code for this completed transfer
    const trsId = await reserveNewTrsId();
                await runTransaction(db, async (transaction) => {
                    // Step 1: Read all items first
                    const itemRefs = itemsToTransfer.map(item => doc(db!, 'inventory', item.id));
                    const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));
                    
                    // Validate all items and prepare updates
                    const updates: Array<{ ref: any, updates: any }> = [];
                    
                    for (let i = 0; i < itemsToTransfer.length; i++) {
                        const item = itemsToTransfer[i];
                        const itemDoc = itemDocs[i];
                        
                        if (!itemDoc.exists()) {
                            throw new Error(`Item ${item.nameEn} not found.`);
                        }
                        
                        const data = itemDoc.data();
                        const currentFromStock = Math.max(0, Number(data.stockByResidence?.[fromResidenceId] || 0));
                        const currentToStock = Math.max(0, Number(data.stockByResidence?.[toResidenceId] || 0));
                        if (currentFromStock < item.quantity) {
                            throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentFromStock}, Required: ${item.quantity}`);
                        }
                        
                        // Prepare read-modify-write updates with clamping
                        const newSbr = { ...(data.stockByResidence || {}) } as Record<string, number>;
                        newSbr[fromResidenceId] = Math.max(0, currentFromStock - item.quantity);
                        newSbr[toResidenceId] = Math.max(0, currentToStock + item.quantity);
                        const newTotal = Object.values(newSbr).reduce((sum: number, v: any) => {
                          const n = Number(v);
                          return sum + (isNaN(n) ? 0 : Math.max(0, n));
                        }, 0);
                        
                        updates.push({
                            ref: itemRefs[i],
                            updates: { stockByResidence: newSbr, stock: newTotal }
                        });
                    }
                    
                    // Step 2: Perform all writes after all reads are complete
                    const transactionTime = Timestamp.now();
                    
                    // Update stock for all items
                    for (const update of updates) {
                        transaction.update(update.ref, update.updates);
                    }
                    
                    // Log transfer transactions for each item
                    for (let i = 0; i < itemsToTransfer.length; i++) {
                        const item = itemsToTransfer[i];
                        
                        // Create TRANSFER_OUT transaction for source residence
                        const transferOutRef = doc(collection(db!, "inventoryTransactions"));
                        transaction.set(transferOutRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameAr,
                            residenceId: fromResidenceId,
                            date: transactionTime,
                            type: 'TRANSFER_OUT',
                            quantity: item.quantity,
              referenceDocId: trsId,
                            relatedResidenceId: toResidenceId,
                            locationName: `Internal transfer to residence (${toResidenceId})`
                        } as Omit<InventoryTransaction, 'id'>);

                        // Create TRANSFER_IN transaction for destination residence
                        const transferInRef = doc(collection(db!, "inventoryTransactions"));
                        transaction.set(transferInRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameAr,
                            residenceId: toResidenceId,
                            date: transactionTime,
                            type: 'TRANSFER_IN',
                            quantity: item.quantity,
              referenceDocId: trsId,
                            relatedResidenceId: fromResidenceId,
                            locationName: `Internal transfer from residence (${fromResidenceId})`
                        } as Omit<InventoryTransaction, 'id'>);
                    }
                    
                    // Create a completed transfer record
                    const transferDocRef = doc(collection(db!, 'stockTransfers'));
                    const newTransfer: StockTransfer = {
                        ...payload,
                        id: transferDocRef.id,
                        date: transactionTime,
                        status: 'Completed',
                        approvedById: currentUser.id,
            approvedAt: transactionTime,
            // store the TRS short code for reference/display
            // @ts-ignore - optional property added below on the interface
            codeShort: trsId
                    };
                    transaction.set(transferDocRef, newTransfer);
                });
                toast({ title: "Success", description: "Internal transfer completed successfully." });
            } catch (error) {
                 const err = error as Error;
                 console.error("Failed to execute direct transfer:", err);
                 toast({ title: "Error", description: `Transfer failed: ${err.message}`, variant: "destructive" });
                 throw err;
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
        
        const transferRef = doc(db!, 'stockTransfers', transferId);
        
        try {
            // Reserve TRS code for this approved transfer
            const trsId = await reserveNewTrsId();
            await runTransaction(db, async (transaction) => {
                // Step 1: Read all data first
                const transferDoc = await transaction.get(transferRef);
                if (!transferDoc.exists()) {
                    throw new Error("Transfer request not found or already processed.");
                }
                
                const transferData = transferDoc.data() as StockTransfer;
                if (!transferData) {
                    throw new Error("Transfer data is missing.");
                }

                if (transferData.status !== 'Pending') {
                    throw new Error("Transfer request already processed.");
                }

                const { fromResidenceId, toResidenceId, items: itemsToTransfer } = transferData;
                
                if(!fromResidenceId || !toResidenceId || !itemsToTransfer) {
                     throw new Error("Transfer data is incomplete.");
                }

                // Read all items first
                const itemRefs = itemsToTransfer.map(item => doc(db!, 'inventory', item.id));
                const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

                // Validate all items and stock levels
                const updates: Array<{ ref: any, updates: any }> = [];
                
                for (let i = 0; i < itemsToTransfer.length; i++) {
                    const item = itemsToTransfer[i];
                    const itemDoc = itemDocs[i];
                    
                    if (!itemDoc.exists()) {
                        throw new Error(`Item ${item.nameEn} not found.`);
                    }
                    
                    const data = itemDoc.data();
                    const currentFromStock = Math.max(0, Number(data.stockByResidence?.[fromResidenceId] || 0));
                    const currentToStock = Math.max(0, Number(data.stockByResidence?.[toResidenceId] || 0));
                    if (currentFromStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentFromStock}, Required: ${item.quantity}`);
                    }
                    
                    // Prepare updates for later using read-modify-write with clamping
                    const newSbr = { ...(data.stockByResidence || {}) } as Record<string, number>;
                    newSbr[fromResidenceId] = Math.max(0, currentFromStock - item.quantity);
                    newSbr[toResidenceId] = Math.max(0, currentToStock + item.quantity);
                    const newTotal = Object.values(newSbr).reduce((sum: number, v: any) => {
                      const n = Number(v);
                      return sum + (isNaN(n) ? 0 : Math.max(0, n));
                    }, 0);
                    updates.push({
                        ref: itemRefs[i],
                        updates: { stockByResidence: newSbr, stock: newTotal }
                    });
                }

                // Step 2: Perform all writes after all reads are complete
                const transactionTime = Timestamp.now();
                
                // Update stock for all items
                for (const update of updates) {
                    transaction.update(update.ref, update.updates);
                }

                // Log transfer transactions for each item
                for (let i = 0; i < itemsToTransfer.length; i++) {
                    const item = itemsToTransfer[i];
                    
                    // Create TRANSFER_OUT transaction for source residence
                    const transferOutRef = doc(collection(db!, "inventoryTransactions"));
                    transaction.set(transferOutRef, {
                        itemId: item.id,
                        itemNameEn: item.nameEn,
                        itemNameAr: item.nameAr,
                        residenceId: fromResidenceId,
                        date: transactionTime,
                        type: 'TRANSFER_OUT',
                        quantity: item.quantity,
            referenceDocId: trsId,
                        relatedResidenceId: toResidenceId,
                        locationName: `Transfer to residence`
                    } as Omit<InventoryTransaction, 'id'>);

                    // Create TRANSFER_IN transaction for destination residence
                    const transferInRef = doc(collection(db!, "inventoryTransactions"));
                    transaction.set(transferInRef, {
                        itemId: item.id,
                        itemNameEn: item.nameEn,
                        itemNameAr: item.nameAr,
                        residenceId: toResidenceId,
                        date: transactionTime,
                        type: 'TRANSFER_IN',
                        quantity: item.quantity,
            referenceDocId: trsId,
                        relatedResidenceId: fromResidenceId,
                        locationName: `Transfer from residence`
                    } as Omit<InventoryTransaction, 'id'>);
                }

                transaction.update(transferRef, {
                    status: 'Completed',
                    approvedById: approverId,
          approvedAt: Timestamp.now(),
          // store TRS short code for reference/display on the transfer
          // @ts-ignore - optional property added below on the interface
          codeShort: trsId
                });
            });
            toast({ title: "Success", description: "Transfer approved and stock updated." });
        } catch (error) {
            console.error("Failed to approve transfer:", error);
            const err = error as Error;
            toast({ title: "Error", description: `Approval failed: ${err.message}`, variant: "destructive" });
        }
    };
    
    const rejectTransfer = async (transferId: string, rejecterId: string) => {
         if (!db) throw new Error(firebaseErrorMessage);
         const transferRef = doc(db!, 'stockTransfers', transferId);
         await updateDoc(transferRef, {
             status: 'Rejected',
             rejectedById: rejecterId,
             rejectedAt: Timestamp.now()
         });
         toast({ title: "Success", description: "Transfer request has been rejected." });
    };

    const depreciateItems = async (depreciationRequest: DepreciationRequest) => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            await runTransaction(db, async (transaction) => {
                // Get the item to verify it exists and get its names
                const itemRef = doc(db!, "inventory", depreciationRequest.itemId);
                const itemSnap = await transaction.get(itemRef);
                
                if (!itemSnap.exists()) {
                    throw new Error("Item not found");
                }
                
                const itemData = itemSnap.data() as InventoryItem;
                
                // Check if there's enough stock
        const currentStock = Math.max(0, Number(itemData.stockByResidence?.[depreciationRequest.residenceId] || 0));
                if (currentStock < depreciationRequest.quantity) {
                    throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${depreciationRequest.quantity}`);
                }
                
                // Update stock for the residence
        const newStockByResidence = { ...(itemData.stockByResidence || {}) } as Record<string, number>;
        newStockByResidence[depreciationRequest.residenceId] = Math.max(0, currentStock - depreciationRequest.quantity);
                
                // Calculate new total stock
                const newTotalStock = Object.values(newStockByResidence).reduce((sum: number, stock: any) => {
          const num = Number(stock);
          return sum + (isNaN(num) ? 0 : Math.max(0, num));
                }, 0);
                
                // Update item document
                transaction.update(itemRef, {
                    stock: newTotalStock,
                    stockByResidence: newStockByResidence
                });
                
                // Create depreciation transaction
                const depreciationTransactionRef = doc(collection(db!, "inventoryTransactions"));
                const transactionData: Omit<InventoryTransaction, 'id'> = {
                    itemId: depreciationRequest.itemId,
                    itemNameEn: itemData.nameEn,
                    itemNameAr: itemData.nameAr,
                    residenceId: depreciationRequest.residenceId,
                    date: Timestamp.now(),
                    type: 'DEPRECIATION',
                    quantity: depreciationRequest.quantity,
                    referenceDocId: `DEP-${Date.now()}`,
                    locationId: depreciationRequest.locationId,
                    locationName: depreciationRequest.locationName,
                    depreciationReason: depreciationRequest.reason
                };
                
                transaction.set(depreciationTransactionRef, transactionData);
            });
            
            toast({ 
                title: "Success", 
                description: `Successfully depreciated ${depreciationRequest.quantity} items. Reason: ${depreciationRequest.reason}` 
            });
        } catch (error) {
            console.error("Failed to depreciate items:", error);
            const err = error as Error;
            toast({ 
                title: "Error", 
                description: `Depreciation failed: ${err.message}`, 
                variant: "destructive" 
            });
            throw error;
        }
    };

    // Audit functions
    const createAudit = async (auditData: Omit<InventoryAudit, 'id' | 'createdAt' | 'summary'>): Promise<string> => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            const auditRef = doc(collection(db, 'inventoryAudits'));
            const audit: InventoryAudit = {
                ...auditData,
                id: auditRef.id,
                createdAt: Timestamp.now(),
                summary: {
                    totalItems: 0,
                    completedItems: 0,
                    discrepanciesCount: 0,
                    adjustmentsMade: 0
                }
            };
            
            await setDoc(auditRef, audit);
            toast({ title: "Success", description: "Audit created successfully." });
            return audit.id;
        } catch (error) {
            console.error("Error creating audit:", error);
            toast({ title: "Error", description: "Failed to create audit.", variant: "destructive" });
            throw error;
        }
    };

    const getAudits = async (): Promise<InventoryAudit[]> => {
        if (!db) {
            toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
            return [];
        }
        
        try {
            const q = query(collection(db, 'inventoryAudits'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as InventoryAudit);
        } catch (error) {
            console.error('Error fetching audits:', error);
            toast({ title: "Error", description: "Failed to fetch audits.", variant: "destructive" });
            return [];
        }
    };

    const getAuditById = async (auditId: string): Promise<InventoryAudit | null> => {
        if (!db) {
            toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
            return null;
        }
        
        try {
            const auditRef = doc(db!, 'inventoryAudits', auditId);
            const auditSnap = await getDoc(auditRef);
            
            if (!auditSnap.exists()) {
                return null;
            }
            
            return auditSnap.data() as InventoryAudit;
        } catch (error) {
            console.error('Error fetching audit:', error);
            toast({ title: "Error", description: "Failed to fetch audit.", variant: "destructive" });
            return null;
        }
    };

    const updateAuditStatus = async (auditId: string, status: InventoryAudit['status']): Promise<void> => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            const auditRef = doc(db!, 'inventoryAudits', auditId);
            const updateData: any = { status };
            
            if (status === 'IN_PROGRESS') {
                updateData.startDate = Timestamp.now();
            } else if (status === 'COMPLETED') {
                updateData.endDate = Timestamp.now();
            }
            
            await updateDoc(auditRef, updateData);
            toast({ title: "Success", description: "Audit status updated." });
        } catch (error) {
            console.error('Error updating audit status:', error);
            toast({ title: "Error", description: "Failed to update audit status.", variant: "destructive" });
            throw error;
        }
    };

    const getAuditItems = async (auditId: string): Promise<AuditItem[]> => {
        if (!db) {
            toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
            return [];
        }
        
        try {
            const q = query(collection(db, 'auditItems'), where('auditId', '==', auditId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as AuditItem);
        } catch (error) {
            console.error('Error fetching audit items:', error);
            toast({ title: "Error", description: "Could not fetch audit items.", variant: "destructive" });
            return [];
        }
    };

    const updateAuditItem = async (auditItem: AuditItem): Promise<void> => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            const itemRef = doc(db!, 'auditItems', auditItem.id);
            await updateDoc(itemRef, { ...auditItem });
        } catch (error) {
            console.error('Error updating audit item:', error);
            toast({ title: "Error", description: "Failed to update audit item.", variant: "destructive" });
            throw error;
        }
    };

    const submitAuditCount = async (
        auditId: string, 
        itemId: string, 
        physicalStock: number, 
        notes: string, 
        countedBy: string
    ): Promise<void> => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            const q = query(
                collection(db, 'auditItems'), 
                where('auditId', '==', auditId),
                where('itemId', '==', itemId)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error('Audit item not found');
            }
            
            const auditItemDoc = querySnapshot.docs[0];
            const auditItem = auditItemDoc.data() as AuditItem;
            
            const difference = physicalStock - auditItem.systemStock;
            const status = difference === 0 ? 'VERIFIED' : 'DISCREPANCY';
            
            await updateDoc(auditItemDoc.ref, {
                physicalStock,
                difference,
                status,
                notes,
                countedBy,
                countedAt: Timestamp.now()
            });
            
            toast({ title: "Success", description: "Count submitted successfully." });
        } catch (error) {
            console.error('Error submitting audit count:', error);
            toast({ title: "Error", description: "Failed to submit count.", variant: "destructive" });
            throw error;
        }
    };

    const completeAudit = async (
        auditId: string, 
        adjustments: AuditAdjustment[], 
        generalNotes: string
    ): Promise<void> => {
        if (!db) throw new Error(firebaseErrorMessage);
        
        try {
            await runTransaction(db, async (transaction) => {
                const now = Timestamp.now();

                // 1) Read all required docs first (no writes yet)
                const auditRef = doc(db!, 'inventoryAudits', auditId);
                const itemRefs = adjustments.map((a) => doc(db!, 'inventory', a.itemId));
                const itemSnaps = await Promise.all(itemRefs.map((r) => transaction.get(r)));

                // 2) Prepare all writes after reads
                type PlannedWrite = {
                  type: 'itemUpdate' | 'txSet' | 'adjSet' | 'auditUpdate';
                  ref: any;
                  data?: any;
                  updates?: any;
                };
                const writes: PlannedWrite[] = [];

                // Update audit status at the end
                writes.push({
                  type: 'auditUpdate',
                  ref: auditRef,
                  updates: {
                    status: 'COMPLETED',
                    endDate: now,
                    'summary.adjustmentsMade': adjustments.length,
                  },
                });

                for (let i = 0; i < adjustments.length; i++) {
                  const adjustment = adjustments[i];
                  const itemRef = itemRefs[i];
                  const itemSnap = itemSnaps[i];
                  if (!itemSnap.exists()) continue;

                  const itemData = itemSnap.data() as InventoryItem;
                  const currentResidenceStock = Math.max(0, Number(itemData.stockByResidence?.[adjustment.locationId] || 0));
                  const newResidenceStock = Math.max(0, Number(adjustment.newStock));

                  // Compute new stockByResidence and total
                  const newStockByResidence = { ...(itemData.stockByResidence || {}) } as Record<string, number>;
                  newStockByResidence[adjustment.locationId] = newResidenceStock;
                  const newTotalStock = Object.values(newStockByResidence).reduce((sum: number, stock: any) => {
                    const num = Number(stock);
                    return sum + (isNaN(num) ? 0 : Math.max(0, num));
                  }, 0);

                  // Queue item update
                  writes.push({ type: 'itemUpdate', ref: itemRef, updates: { stock: newTotalStock, stockByResidence: newStockByResidence } });

                  // Queue adjustment transaction
                  const adjustmentTransactionRef = doc(collection(db!, 'inventoryTransactions'));
                  const diffAbs = Math.abs(newResidenceStock - currentResidenceStock);
                  const txData: Omit<InventoryTransaction, 'id'> & { adjustmentDirection?: 'INCREASE' | 'DECREASE' } = {
                    itemId: adjustment.itemId,
                    itemNameEn: (itemData as any).nameEn,
                    itemNameAr: (itemData as any).nameAr,
                    residenceId: adjustment.locationId,
                    date: now,
                    type: 'ADJUSTMENT',
                    quantity: diffAbs,
                    referenceDocId: auditId,
                    locationId: adjustment.locationId,
                    locationName: adjustment.locationName,
                  };
                  if (diffAbs > 0) {
                    txData.adjustmentDirection = newResidenceStock >= currentResidenceStock ? 'INCREASE' : 'DECREASE';
                  }
                  writes.push({ type: 'txSet', ref: adjustmentTransactionRef, data: txData });

                  // Queue audit adjustment record storage
                  const adjustmentRef = doc(collection(db!, 'auditAdjustments'));
                  writes.push({ type: 'adjSet', ref: adjustmentRef, data: { ...adjustment, id: adjustmentRef.id, adjustedAt: now } });
                }

                // 3) Execute all queued writes
                for (const w of writes) {
                  if (w.type === 'itemUpdate') {
                    transaction.update(w.ref, w.updates);
                  } else if (w.type === 'txSet') {
                    transaction.set(w.ref, w.data);
                  } else if (w.type === 'adjSet') {
                    transaction.set(w.ref, w.data);
                  } else if (w.type === 'auditUpdate') {
                    transaction.update(w.ref, w.updates);
                  }
                }
            });
            
            toast({ 
                title: 'Success', 
                description: `Audit completed successfully. ${adjustments.length} adjustments applied.` 
            });
        } catch (error) {
            console.error('Error completing audit:', error);
            toast({ title: 'Error', description: 'Failed to complete audit.', variant: 'destructive' });
            throw error;
        }
    };

    // Simplified stock reconciliation: update per-residence stock directly and log adjustments in inventoryTransactions
    const reconcileStock = async (
      residenceId: string,
      adjustments: { itemId: string; newStock: number; reason?: string }[],
      performedById?: string,
      overrideReferenceId?: string
    ): Promise<string | void> => {
      if (!db) {
        toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
        return;
      }
      if (!residenceId) {
        toast({ title: 'Error', description: 'Residence is required.', variant: 'destructive' });
        return;
      }
      const filtered = adjustments
        .map((a) => ({ ...a, newStock: Math.max(0, Number(a.newStock) || 0) }))
        .filter((a) => !!a.itemId);
      if (filtered.length === 0) return;

  const referenceId = overrideReferenceId || await reserveNewReconciliationId();
      try {
        let totalIncrease = 0;
        let totalDecrease = 0;
        let itemCount = 0;

        await runTransaction(db, async (transaction) => {
          const now = Timestamp.now();

          // 1) Read all required documents first (no writes yet)
          const itemRefs = filtered.map((adj) => doc(db!, 'inventory', adj.itemId));
          const itemSnaps = await Promise.all(itemRefs.map((r) => transaction.get(r)));

          // 2) Compute all updates and prepare write payloads
          type PlannedWrite = {
            itemRef: any;
            itemUpdate: Record<string, any>;
            txRef: any;
            txData: Omit<InventoryTransaction, 'id'> & { adjustmentReason?: string; adjustmentDirection?: 'INCREASE' | 'DECREASE' };
          };
          const plannedWrites: PlannedWrite[] = [];

          for (let i = 0; i < filtered.length; i++) {
            const adj = filtered[i];
            const itemRef = itemRefs[i];
            const itemSnap = itemSnaps[i];
            if (!itemSnap.exists()) continue;

            const itemData = itemSnap.data() as InventoryItem;
            const current = Number(itemData.stockByResidence?.[residenceId] || 0);
            const next = Math.max(0, Number(adj.newStock) || 0);
            const diff = next - current;
            if (diff === 0) continue;

            // Track summary
            itemCount += 1;
            if (diff > 0) totalIncrease += diff; else totalDecrease += Math.abs(diff);

            // Prepare item update
            const newStockByResidence = { ...(itemData.stockByResidence || {}) } as Record<string, number>;
            newStockByResidence[residenceId] = next;
            const newTotal = Object.values(newStockByResidence).reduce((sum: number, v: any) => {
              const n = Number(v);
              return sum + (isNaN(n) ? 0 : n);
            }, 0);
            const itemUpdate = {
              stockByResidence: newStockByResidence,
              stock: newTotal,
            };

            // Prepare transaction log
            const txRef = doc(collection(db!, 'inventoryTransactions'));
            const txData: any = {
              itemId: adj.itemId,
              itemNameEn: (itemData as any).nameEn,
              itemNameAr: (itemData as any).nameAr,
              residenceId,
              date: now,
              type: 'ADJUSTMENT',
              quantity: Math.abs(diff),
              referenceDocId: referenceId,
              locationName: 'Stock reconciliation',
              adjustmentDirection: diff > 0 ? 'INCREASE' : 'DECREASE',
            };
            if (adj.reason && adj.reason.trim() !== '') {
              txData.adjustmentReason = adj.reason.trim();
            }

            plannedWrites.push({ itemRef, itemUpdate, txRef, txData });
          }

          // 3) Perform writes after all reads are complete
          for (const w of plannedWrites) {
            transaction.update(w.itemRef, w.itemUpdate);
            transaction.set(w.txRef, w.txData);
          }

          // Write master reconciliation record last
          const reconRef = doc(db!, 'stockReconciliations', referenceId);
          const reconData: any = {
            id: referenceId,
            residenceId,
            date: now,
            itemCount,
            totalIncrease,
            totalDecrease,
          };
          if (performedById && performedById.trim() !== '') {
            reconData.performedById = performedById.trim();
          }
          transaction.set(reconRef, reconData as StockReconciliation);
        });
        toast({ title: 'Success', description: 'Stock reconciliation applied and logged to item movements.' });
        return referenceId;
      } catch (e) {
        console.error('Failed to reconcile stock:', e);
        toast({ title: 'Error', description: 'Failed to apply reconciliation.', variant: 'destructive' });
        throw e;
      }
    };

    // Reconciliation query helpers
    const getReconciliations = async (residenceId: string): Promise<StockReconciliation[]> => {
      if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
      }
      try {
        const qRef = query(
          collection(db, 'stockReconciliations'),
          where('residenceId', '==', residenceId)
        );
        const snap = await getDocs(qRef);
        const recs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as StockReconciliation[];
        // Sort client-side by date desc to avoid composite indexes

        recs.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
        return recs;
      } catch (error) {
        console.error('Error fetching reconciliations:', error);
        toast({ title: 'Error', description: 'Failed to fetch reconciliations.', variant: 'destructive' });
        return [];
      }
    };

    // Maintenance: scan and fix any negative stock values at the residence level
    const fixNegativeStocks = async (): Promise<{ fixedCount: number; affectedItems: string[] }> => {
      if (!db) throw new Error(firebaseErrorMessage);
      // Read all inventory docs
      const snap = await getDocs(collection(db!, 'inventory'));
      if (snap.empty) return { fixedCount: 0, affectedItems: [] };
      let fixedCount = 0;
      const affected: string[] = [];
      // We'll run in batches of transactions for safety and to log corrections
      const now = Timestamp.now();
      for (const d of snap.docs) {
        const item = d.data() as any;
        const sbr = { ...(item.stockByResidence || {}) } as Record<string, number>;
        const original = { ...sbr };
        let changed = false;
        for (const key of Object.keys(sbr)) {
          const val = Number(sbr[key] ?? 0);
          if (!isNaN(val) && val < 0) {
            sbr[key] = 0; // clamp to zero
            changed = true;
          }
        }
        if (!changed) continue;
        // Recompute total
        const newTotal = Object.values(sbr).reduce((sum, v: any) => {
          const n = Number(v);
          return sum + (isNaN(n) ? 0 : Math.max(0, n));
        }, 0);

        await runTransaction(db!, async (trx) => {
          const itemRef = doc(db!, 'inventory', d.id);
          const fresh = await trx.get(itemRef);
          if (!fresh.exists()) return;
          // Update stockByResidence and stock
          trx.update(itemRef, { stockByResidence: sbr, stock: newTotal });
          // For every negative that was clamped, log an ADJUSTMENT with reason
          for (const rid of Object.keys(original)) {
            const before = Number(original[rid] ?? 0);
            const after = Number(sbr[rid] ?? 0);
            if (before < 0 && after === 0) {
              const diff = Math.abs(before); // amount removed to reach 0
              const txRef = doc(collection(db!, 'inventoryTransactions'));
              trx.set(txRef, {
                itemId: d.id,
                itemNameEn: item.nameEn || item.name || d.id,
                itemNameAr: item.nameAr || '',
                residenceId: rid,
                date: now,
                type: 'ADJUSTMENT',
                quantity: diff,
                referenceDocId: 'AUTO-FIX-NEGATIVE',
                locationName: 'System auto-fix',
                adjustmentReason: 'Clamped negative stock to zero',
                adjustmentDirection: 'INCREASE',
              } as any);
            }
          }
        });
        fixedCount++;
        affected.push(d.id);
      }
      if (fixedCount > 0) {
        toast({ title: 'Inventory corrected', description: `Fixed ${fixedCount} item(s) with negative stock values.` });
      }
      return { fixedCount, affectedItems: affected };
    };

    const getAllReconciliations = async (): Promise<StockReconciliation[]> => {
      if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
      }
      try {
        const snap = await getDocs(collection(db, 'stockReconciliations'));
        const recs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as StockReconciliation[];
        recs.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
        return recs;
      } catch (error) {
        console.error('Error fetching all reconciliations:', error);
        toast({ title: 'Error', description: 'Failed to fetch all reconciliations.', variant: 'destructive' });
        return [];
      }
    };

   

   

    const getReconciliationById = async (id: string): Promise<StockReconciliation | null> => {
      if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return null;
      }
      try {
        const ref = doc(db, 'stockReconciliations', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...(snap.data() as any) } as StockReconciliation;
      } catch (error) {
        console.error('Error fetching reconciliation by id:', error);
        toast({ title: 'Error', description: 'Failed to fetch reconciliation.', variant: 'destructive' });
        return null;
      }
    };

    const getReconciliationItems = async (referenceDocId: string): Promise<InventoryTransaction[]> => {
      if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return [];
      }
      try {
        const qRef = query(
          collection(db, 'inventoryTransactions'),
          where('referenceDocId', '==', referenceDocId)
               );
        const snap = await getDocs(qRef);
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InventoryTransaction[];
        // Sort by date desc for display
        items.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
        return items;
      } catch (error) {
        console.error('Error fetching reconciliation items:', error);
        toast({ title: 'Error', description: 'Failed to fetch reconciliation items.', variant: 'destructive' });
        return [];
      }
    };

    // Reconciliation approval workflow implementations
  const getReconciliationRequests = async (resId?: string, status?: ReconciliationRequest['status']): Promise<ReconciliationRequest[]> => {
      if (!db) {
        toast({ title: 'Error', description: firebaseErrorMessage, variant: 'destructive' });
        return [];
      }
      try {
        let qRef: any = collection(db, 'reconciliationRequests');
        const clauses: any[] = [];
        if (resId) clauses.push(where('residenceId', '==', resId));
        if (status) clauses.push(where('status', '==', status));
        if (clauses.length > 0) {
          qRef = query(qRef, ...clauses);
        }
        const snap = await getDocs(qRef);
        const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ReconciliationRequest[];
        arr.sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
        return arr;
      } catch (e) {
        console.error('Error fetching reconciliation requests:', e);
        toast({ title: 'Error', description: 'Failed to fetch reconciliation requests.', variant: 'destructive' });
        return [];
      }
    };

    const createReconciliationRequest = async (resId: string, adjustments: { itemId: string; newStock: number; reason?: string }[], requestedById: string): Promise<string> => {
      if (!db) throw new Error(firebaseErrorMessage);
      if (!resId || !adjustments || adjustments.length === 0) throw new Error('Residence and at least one adjustment are required');
      // Reserve a reconciliation code for display
      const reservedId = await reserveNewReconciliationId();
      const reqRef = doc(collection(db, 'reconciliationRequests'));
      const payload: ReconciliationRequest = {
        id: reqRef.id,
        residenceId: resId,
        adjustments,
        status: 'Pending',
        requestedById,
        requestedAt: Timestamp.now(),
        reservedId,
      } as ReconciliationRequest;
      await setDoc(reqRef, payload);
      toast({ title: 'Submitted', description: 'Reconciliation request submitted for admin approval.' });
      // Notify all admins
      try {
        const admins = (users || []).filter(u => u.role === 'Admin');
        for (const admin of admins) {
          await addNotification?.({
            userId: admin.id,
            title: 'Reconciliation Request',
            message: `New reconciliation request for residence ${resId}.`,
            type: 'generic',
            href: '/inventory/inventory-audit',
            referenceId: reqRef.id,
          } as any);
        }
      } catch {}
      return reqRef.id;
    };

    const approveReconciliationRequest = async (requestId: string, approverId: string): Promise<string> => {
      if (!db) throw new Error(firebaseErrorMessage);
      const reqRef = doc(db, 'reconciliationRequests', requestId);
      const snap = await getDoc(reqRef);
      if (!snap.exists()) throw new Error('Request not found');
      const data = snap.data() as ReconciliationRequest;
      if (data.status !== 'Pending') throw new Error('Request already processed');
      // Apply reconciliation using reserved id if present
      const refId = await reconcileStock(data.residenceId, data.adjustments, approverId, data.reservedId) as string | void;
      const finalRef = typeof refId === 'string' ? refId : undefined;
      await updateDoc(reqRef, {
        status: 'Approved',
        approvedById: approverId,
        approvedAt: Timestamp.now(),
        referenceId: finalRef || null,
      });
      toast({ title: 'Approved', description: 'Reconciliation request approved and applied.' });
      // Notify requester
      try {
        if (data.requestedById) {
          await addNotification?.({
            userId: data.requestedById,
            title: 'Reconciliation Approved',
            message: `Your reconciliation was approved (${finalRef || data.reservedId || ''}).`,
            type: 'generic',
            href: '/inventory/inventory-audit',
            referenceId: finalRef || requestId,
          } as any);
        }
      } catch {}
      return finalRef || '';
    };

    const rejectReconciliationRequest = async (requestId: string, rejecterId: string, reason?: string) => {
      if (!db) throw new Error(firebaseErrorMessage);
      const reqRef = doc(db, 'reconciliationRequests', requestId);
      const snap = await getDoc(reqRef);
      if (!snap.exists()) throw new Error('Request not found');
      const data = snap.data() as ReconciliationRequest;
      if (data.status !== 'Pending') throw new Error('Request already processed');
      await updateDoc(reqRef, { status: 'Rejected', rejectedById: rejecterId, rejectedAt: Timestamp.now(), rejectReason: reason || null });
      toast({ title: 'Rejected', description: 'Reconciliation request has been rejected.' });
      // Notify requester
      try {
        if (data.requestedById) {
          await addNotification?.({
            userId: data.requestedById,
            title: 'Reconciliation Rejected',
            message: `Your reconciliation was rejected${reason ? `: ${reason}` : ''}.`,
            type: 'generic',
            href: '/inventory/inventory-audit',
            referenceId: requestId,
          } as any);
        }
      } catch {}
    };

  return (
    <InventoryContext.Provider value={{ 
      items, 
  inventoryItems: items,
      categories, 
      transfers, 
      audits, 
      loading, 
      addItem, 
      updateItem, 
 
      deleteItem, 
      loadInventory, 
      addCategory, 
      updateCategory, 
      getStockForResidence, 
      issueItemsFromStock, 
      getInventoryTransactions, 
      getAllInventoryTransactions, 
      getAllInventoryTransactionsRaw: async () => {
        // provide raw typed-any transactions if callers expect different shape
        const rows = await getAllInventoryTransactions();
        return rows as any;
      },
      getMIVs, 
      getMIVById, 
      getLastIssueDateForItemAtLocation, 
      getAllIssueTransactions, 
      createTransferRequest, 
      approveTransfer, 
      rejectTransfer, 
      depreciateItems,
  fixNegativeStocks,
      createAudit,
      getAudits,
      getAuditById,
      updateAuditStatus,
      getAuditItems,
      updateAuditItem,
      submitAuditCount,
      completeAudit,
      reconcileStock,
      getReconciliations,
      getAllReconciliations,
      getReconciliationById,
      getReconciliationItems,
  getTransferItems,
  getReconciliationRequests,
  createReconciliationRequest,
  approveReconciliationRequest,
  rejectReconciliationRequest,
      // expose MRV helpers
      createMRV,
      getMRVs,
      getMRVById,
      // MRV requests
      getMRVRequests,
      approveMRVRequest,
      rejectMRVRequest,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
