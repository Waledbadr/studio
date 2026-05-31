'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDoc, getDocs, query, where, writeBatch, increment, runTransaction, orderBy, limit, getDocFromServer } from "firebase/firestore";
import type { InventoryItem, InventoryTransaction } from './inventory-context';
import { useResidences } from './residences-context';
import { useUsers } from './users-context';
import { useNotifications } from './notifications-context';
import type { DocumentReference } from 'firebase/firestore';


export interface OrderItem extends InventoryItem {
  quantity: number;
  notes?: string;
  // New: optional target location metadata for planned installation
  targetLocationId?: string;
  targetLocationName?: string;
  // Optional: if this line is intended to override lifespan policy (for audit)
  overrideReason?: string | null;
  // Admin review fields for per-line justification
  justificationDecision?: 'approved' | 'rejected';
  justificationReviewNote?: string;
  // Admin can approve partial quantity per line
  approvedQuantity?: number;
}

// Optional planned distribution to reuse during issuing (MIV)
export interface PlannedDistributionItem {
  id: string;
  detail?: string;
  quantity: number;
  overrideReason?: string | null;
}

export interface PlannedDistributionLocation {
  locationId: string;
  locationName: string;
  isFacility: boolean;
  items: PlannedDistributionItem[];
}

export interface ReceivedOrderItem {
  id: string; // Storing only ID and quantity to keep it lean
  quantityReceived: number;
}

export type OrderStatus = 'Pending' | 'Approved' | 'Partially Delivered' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  date: Timestamp;
  residence: string; // This is the residence name
  residenceId: string; // This is the residence ID
  requestedById: string;
  requestedByName?: string;
  requestedByEmail?: string;
  approvedById?: string;
  approvedByName?: string;
  items: OrderItem[];
  itemsReceived?: ReceivedOrderItem[]; // Tracks total received quantities per item
  status: OrderStatus;
  notes?: string;
  // Optional: Saved distribution plan for later issuing steps
  plannedDistribution?: PlannedDistributionLocation[];
  // Optional: General Manager approval attachment
  approvalAttachmentUrl?: string | null;
  approvalAttachmentPath?: string | null;
  approvalAttachmentName?: string | null;
  approvalAttachmentUploadedAt?: Timestamp;
  approvalAttachmentUploadedById?: string | null;
}

type NewOrderPayload = Omit<Order, 'id' | 'date' | 'status' | 'itemsReceived' | 'approvedById'>;
type UpdateOrderPayload = Pick<Order, 'items' | 'residence' | 'residenceId' | 'notes'> & {
  // Allow editing the saved distribution plan when the order was created via request-issue
  plannedDistribution?: PlannedDistributionLocation[];
};


interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  loadOrders: () => void;
  createOrder: (orderData: NewOrderPayload) => Promise<string | null>;
  updateOrder: (id: string, orderData: UpdateOrderPayload) => Promise<void>;
  updateOrderStatus: (
    id: string, 
    status: OrderStatus, 
    approverId?: string,
    attachmentData?: {
      url: string;
      path: string;
      filename: string;
    } | null
  ) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
  // For receiving, only id and quantity are required; names are optional and resolved from inventory when available
  // Returns the MRV id created for this receipt when items were posted to stock; null if none created
  receiveOrderItems: (orderId: string, newlyReceivedItems: {id: string, quantityReceived: number, nameAr?: string, nameEn?: string}[], forceComplete: boolean) => Promise<{ mrvId: string | null }>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

const ORDERS_LOCAL_STORAGE_KEY = 'estatecare_orders';

const loadOrdersFromLocalStorage = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((order) => ({
      ...order,
      date: order.date && typeof order.date === 'object' && 'seconds' in order.date ? Timestamp.fromMillis((order.date as any).seconds * 1000) : (order.date instanceof Timestamp ? order.date : Timestamp.now()),
    }));
  } catch (error) {
    console.error('Failed to load orders from localStorage', error);
    return [];
  }
};

const INVENTORY_LOCAL_STORAGE_KEY = 'estatecare_inventory_items';
const MRV_DETAILS_LOCAL_STORAGE_KEY = 'estatecare_mrv_details';

const loadInventoryFromLocalStorage = (): InventoryItem[] => {
  try {
    const raw = localStorage.getItem(INVENTORY_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InventoryItem[];
  } catch (error) {
    console.error('Failed to load inventory from localStorage', error);
    return [];
  }
};

const saveInventoryToLocalStorage = (items: InventoryItem[]) => {
  try {
    localStorage.setItem(INVENTORY_LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save inventory to localStorage', error);
  }
};

const loadMRVDetailsFromLocalStorage = (): { id: string; date: string; residenceId: string; items: { itemId: string; itemNameEn: string; itemNameAr: string; quantity: number; }[]; supplierName?: string; invoiceNo?: string; attachmentUrl?: string | null; attachmentPath?: string | null; codeShort?: string | null; orderId?: string | null; receivedBy?: string; receivedByName?: string; }[] => {
  try {
    const raw = localStorage.getItem(MRV_DETAILS_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as any[];
  } catch (error) {
    console.error('Failed to load MRVs from localStorage', error);
    return [];
  }
};

const saveMRVDetailsToLocalStorage = (mrvs: any[]) => {
  try {
    localStorage.setItem(MRV_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(mrvs));
  } catch (error) {
    console.error('Failed to save MRVs to localStorage', error);
  }
};

const saveOrdersToLocalStorage = (orders: Order[]) => {
  try {
    localStorage.setItem(ORDERS_LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders to localStorage', error);
  }
};

const formatOrderSequenceId = (yy: string, mmNoPad: string, seq: number) => `MR-${yy}${mmNoPad}${String(seq).padStart(2, '0')}`;

const generateLocalOrderId = (): string => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mmNoPad = (now.getMonth() + 1).toString();
  const counterKey = `estatecare_order_counter_${yy}-${mmNoPad}`;
  let nextSeq = 1;
  try {
    const raw = localStorage.getItem(counterKey);
    const current = raw ? parseInt(raw, 10) : 0;
    nextSeq = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  } catch (error) {
    console.warn('Failed to read local order counter:', error);
  }
  try {
    localStorage.setItem(counterKey, String(nextSeq));
  } catch (error) {
    console.warn('Failed to persist local order counter:', error);
  }
  return formatOrderSequenceId(yy, mmNoPad, nextSeq);
};

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  // Initialize as false so UI doesn’t show saving/submitting states until an action starts
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const { addNotification } = useNotifications();
  const { users, currentUser } = useUsers();


  const loadOrders = useCallback(() => {
    if (unsubscribeRef.current) {
        unsubscribeRef.current(); // Unsubscribe from previous listener
    }
    
    if (!db) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Firebase not configured, loading orders from localStorage");
      }
      setOrders(loadOrdersFromLocalStorage());
      setLoading(false);
      return;
    }
    setLoading(true);

    const ordersCollection = collection(db, "orders");
    unsubscribeRef.current = onSnapshot(query(ordersCollection, orderBy("date", "desc")), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast({ title: "Firestore Error", description: "Could not fetch orders data.", variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    loadOrders();
    return () => {
      if (unsubscribeRef.current) {
        try { unsubscribeRef.current(); } catch {}
        unsubscribeRef.current = null;
      }
    };
  }, [loadOrders]);
  
  const generateNewOrderId = async (): Promise<string> => {
    if (!db) {
      throw new Error("Firebase not initialized");
    }
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // e.g., 25
    const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., 08
    const mmNoPad = (now.getMonth() + 1).toString(); // e.g., 8
    const counterRef = doc(db!, 'counters', `mr-${yy}-${mmNoPad}`);

    let nextSeq = 0;
    await runTransaction(db, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm: mmNoPad, updatedAt: Timestamp.now() }, { merge: true });
    });

    return formatOrderSequenceId(yy, mmNoPad, nextSeq);
  };

  const createOrder = async (orderData: NewOrderPayload): Promise<string | null> => {
    if (!orderData) {
      toast({ title: "Error", description: "Cannot create order with empty data.", variant: "destructive" });
      return null;
    }
    
    setLoading(true);
    try {
      // Guard: ensure the requester on the document matches the signed-in session user ID.
      const authUid = currentUser?.id;
      if (!authUid) {
        toast({ title: "Auth required", description: "You must be signed in to create a request.", variant: "destructive" });
        return null;
      }
      const requesterEmail = currentUser?.email || undefined;
      const requesterName = currentUser?.name || users?.find(u => u.id === authUid)?.name || requesterEmail || '—';
      const safeOrderData: NewOrderPayload = {
        ...orderData,
        requestedById: authUid,
      };

      let newOrderId = generateLocalOrderId();
      let newOrder: Omit<Order, 'id'> = {
        ...safeOrderData,
        requestedByName: requesterName,
        requestedByEmail: requesterEmail,
        date: Timestamp.now(),
        status: 'Pending'
      };

      if (db) {
        newOrderId = await generateNewOrderId();
        const newOrderRef = doc(db, "orders", newOrderId);
        await setDoc(newOrderRef, { ...newOrder, id: newOrderId });
      } else {
        const localOrder: Order = { id: newOrderId, ...newOrder };
        const nextOrders = [...orders, localOrder];
        setOrders(nextOrders);
        saveOrdersToLocalStorage(nextOrders);
      }

      // Notify all Admin users about the new order when possible.
      try {
        let adminUserIds = users?.filter(u => u.role === 'Admin').map(u => u.id) || [];
        if (db && adminUserIds.length === 0) {
          const adminsQ = query(collection(db, 'users'), where('role', '==', 'Admin'));
          const adminsSnap = await getDocs(adminsQ);
          adminUserIds = adminsSnap.docs.map(d => d.id);
        }

        if (adminUserIds.length > 0) {
          await Promise.all(
            adminUserIds.map((adminId) =>
              addNotification?.({
                userId: adminId,
                title: 'New Material Request',
                message: `Request #${newOrderId} • ${orderData.residence}`,
                type: 'new_order',
                href: `/inventory/orders/${newOrderId}`,
                referenceId: newOrderId,
              })
            )
          );
        }
      } catch (notifyErr) {
        console.warn('Failed to send admin notifications for new order:', notifyErr);
      }

      return newOrderId;
    } catch (error) {
      console.error("Error creating order:", error);
      toast({ title: "Error", description: "Failed to create order.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrder = async (id: string, orderData: UpdateOrderPayload) => {
    if (!db) {
        const nextOrders = orders.map((order) => order.id === id ? { ...order, ...orderData } : order);
        setOrders(nextOrders);
        saveOrdersToLocalStorage(nextOrders);
        toast({ title: "Success", description: "Order updated locally." });
        return;
    }
    setLoading(true);
    try {
        const orderDocRef = doc(db, "orders", id);
        // Fetch existing order to enforce permissions
        const existingSnap = await getDoc(orderDocRef);
        if (!existingSnap.exists()) {
          toast({ title: "Error", description: "Order not found.", variant: "destructive" });
          return;
        }
        const existing = existingSnap.data() as Order;
        const isAdmin = currentUser?.role === 'Admin';
        const allowed = existing.status === 'Pending'
          ? (isAdmin || currentUser?.id === existing.requestedById)
          : isAdmin;
        if (!allowed) {
          toast({ title: "Not allowed", description: "You cannot edit this request at its current status.", variant: "destructive" });
          return;
        }

  // Remove undefined fields to avoid Firestore update errors or unintended clears
  const sanitized = Object.fromEntries(Object.entries(orderData).filter(([, v]) => v !== undefined));
  await updateDoc(orderDocRef, sanitized as any);
        toast({ title: "Success", description: "Order updated successfully." });
    } catch (error) {
        console.error("Error updating order:", error);
        toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const updateOrderStatus = async (
    id: string, 
    status: OrderStatus, 
    approverId?: string,
    attachmentData?: {
      url: string;
      path: string;
      filename: string;
    } | null
  ) => {
    if (!db) {
        const nextOrders = orders.map((order) => order.id === id ? { ...order, status, approvedById: approverId || order.approvedById } : order);
        setOrders(nextOrders);
        saveOrdersToLocalStorage(nextOrders);
        toast({ title: "Success", description: "Order status updated locally." });
        return;
    }
    try {
        const orderDocRef = doc(db, "orders", id);
  const updatePayload: {
    status: OrderStatus;
    approvedById?: string;
    approvedByName?: string;
    approvalAttachmentUrl?: string | null;
    approvalAttachmentPath?: string | null;
    approvalAttachmentName?: string | null;
    approvalAttachmentUploadedAt?: Timestamp;
    approvalAttachmentUploadedById?: string | null;
  } = { status };
        
        let requestedById: string | null = null;
    if (status === 'Approved' && approverId) {
            const orderDoc = await getDoc(orderDocRef);
            if (orderDoc.exists()) {
                requestedById = orderDoc.data().requestedById;
            }
      updatePayload.approvedById = approverId;
      const approver = (users?.find(u => u.id === approverId)) || (currentUser?.id === approverId ? currentUser : null);
      updatePayload.approvedByName = approver?.name || undefined;
      
      // Add attachment data if provided
      if (attachmentData) {
        updatePayload.approvalAttachmentUrl = attachmentData.url;
        updatePayload.approvalAttachmentPath = attachmentData.path;
        updatePayload.approvalAttachmentName = attachmentData.filename;
        updatePayload.approvalAttachmentUploadedAt = Timestamp.now();
        updatePayload.approvalAttachmentUploadedById = approverId;
      }
        }

        await updateDoc(orderDocRef, updatePayload);

        // Send notification if the order was approved
        if (status === 'Approved' && requestedById && addNotification) {
            await addNotification({
                userId: requestedById,
                title: 'Material Request Approved',
                message: `Your request #${id} has been approved.`,
                type: 'order_approved',
                href: `/inventory/orders/${id}`,
                referenceId: id,
            });
        }
        
        toast({ title: "Success", description: `Order status changed to ${status}.` });
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

const receiveOrderItems = async (orderId: string, newlyReceivedItems: {id: string, quantityReceived: number, nameAr?: string, nameEn?: string}[], forceComplete: boolean): Promise<{ mrvId: string | null }> => {
  // Client-side guard to avoid permission errors; allow Admin or Supervisor
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
    toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can receive materials and update stock.', variant: 'destructive' });
    throw new Error('Forbidden');
  }

  const findLocalOrder = (): Order | null => {
    return orders.find((o) => o.id === orderId) || loadOrdersFromLocalStorage().find((o) => o.id === orderId) || null;
  };

  const updateLocalOrder = async (updatedOrder: Order) => {
    const nextOrders = orders.map((order) => order.id === updatedOrder.id ? updatedOrder : order);
    setOrders(nextOrders);
    saveOrdersToLocalStorage(nextOrders);
  };

  const generateLocalMrvId = (): string => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterKey = `estatecare_mrv_counter_${yy}-${mmNoPad}`;
    let nextSeq = 1;
    try {
      const raw = localStorage.getItem(counterKey);
      const current = raw ? parseInt(raw, 10) : 0;
      if (Number.isFinite(current) && current > 0) nextSeq = current + 1;
    } catch (error) {
      console.warn('Failed to read local MRV counter', error);
    }
    try { localStorage.setItem(counterKey, String(nextSeq)); } catch (error) {
      console.warn('Failed to write local MRV counter', error);
    }
    return `MRV-${yy}${mmNoPad}${String(nextSeq).padStart(2, '0')}`;
  };

  setLoading(true);
  try {
    if (!db) {
      const localOrder = findLocalOrder();
      if (!localOrder) {
        throw new Error('Order not found');
      }

      const validItems = (newlyReceivedItems || [])
        .filter((item) => item && typeof item.id === 'string' && item.id.trim().length > 0)
        .map((item) => ({ ...item, quantityReceived: Number(item.quantityReceived) }))
        .filter((item) => Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);

      if (validItems.length === 0 && !forceComplete) {
        throw new Error('No valid items to receive.');
      }

      const residenceId = localOrder.residenceId;
      if (!residenceId) {
        throw new Error('Residence ID not found on order.');
      }

      const localInventory = loadInventoryFromLocalStorage();
      const inventoryMap = new Map(localInventory.map(item => [item.id, item]));

      for (const receivedItem of validItems) {
        const inventoryItem = inventoryMap.get(receivedItem.id);
        if (!inventoryItem) {
          throw new Error(`Item not found in inventory: ${receivedItem.id}`);
        }
        const existingStock = Math.max(0, Number(inventoryItem.stockByResidence?.[residenceId] || 0));
        const nextStock = existingStock + receivedItem.quantityReceived;
        const updatedStockByResidence = { ...inventoryItem.stockByResidence, [residenceId]: nextStock };
        inventoryMap.set(receivedItem.id, {
          ...inventoryItem,
          stockByResidence: updatedStockByResidence,
          stock: Object.values(updatedStockByResidence).reduce((sum, v: any) => {
            const n = Number(v);
            return sum + (isNaN(n) ? 0 : Math.max(0, n));
          }, 0),
        });
      }
      saveInventoryToLocalStorage(Array.from(inventoryMap.values()));

      const existingReceived = localOrder.itemsReceived ? [...localOrder.itemsReceived] : [];
      for (const receivedItem of validItems) {
        const idx = existingReceived.findIndex((ri) => ri.id === receivedItem.id);
        if (idx > -1) {
          existingReceived[idx].quantityReceived += receivedItem.quantityReceived;
        } else {
          existingReceived.push({ id: receivedItem.id, quantityReceived: receivedItem.quantityReceived });
        }
      }

      const allItemsDelivered = forceComplete || localOrder.items.every((requestedItem) => {
        const totalReceived = existingReceived.find((ri) => ri.id === requestedItem.id)?.quantityReceived || 0;
        return totalReceived >= requestedItem.quantity;
      });

      const updatedOrder: Order = {
        ...localOrder,
        itemsReceived: existingReceived,
        status: allItemsDelivered ? 'Delivered' : 'Partially Delivered',
      };

      await updateLocalOrder(updatedOrder);

      let localMrvId: string | null = null;
      if (validItems.length > 0) {
        localMrvId = generateLocalMrvId();
        const existingMrvs = loadMRVDetailsFromLocalStorage();
        saveMRVDetailsToLocalStorage([
          {
            id: localMrvId,
            date: new Date().toISOString(),
            residenceId,
            items: validItems.map((item) => ({ itemId: item.id, itemNameEn: item.nameEn || '', itemNameAr: item.nameAr || '', quantity: item.quantityReceived })),
            supplierName: null,
            invoiceNo: null,
            attachmentUrl: null,
            attachmentPath: null,
            codeShort: localMrvId,
            orderId,
            receivedBy: currentUser.id,
            receivedByName: currentUser.name,
          },
          ...existingMrvs,
        ]);
      }

      toast({ title: 'Success', description: 'Local stock updated and request status changed.' });
      return { mrvId: localMrvId };
    }

    // Firebase path remains unchanged
    setLoading(true);
    const firestore = db;
    const orderRef = doc(firestore, "orders", orderId);

    // Candidate generator: try raw, before '::', before '-' (to support multiple variant schemes)
    const candidateBaseIds = (rawId: string): string[] => {
      const out: string[] = [];
      const push = (v?: string) => { if (v && !out.includes(v)) out.push(v); };
      const s = String(rawId);
      push(s);
      if (s.includes('::')) push(s.split('::')[0]);
      if (s.includes('-')) push(s.split('-')[0]);
      return out;
    };

    // Best-effort decode of possibly URL-encoded labels
    const pretty = (s?: string) => {
      if (!s) return s;
      try {
        if (/%[0-9A-Fa-f]{2}/.test(s)) return decodeURIComponent(s);
      } catch {}
      return s;
    };

    let outMrvId: string | null = null;
    await runTransaction(firestore, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }
      const orderData = orderSnap.data() as Order;
      const residenceId = orderData.residenceId;
      if (!residenceId) {
        throw new Error("Residence ID not found on order.");
      }

      const nowDate = new Date();
      const yy = nowDate.getFullYear().toString().slice(-2);
      const mm = (nowDate.getMonth() + 1).toString().padStart(2, '0');
      const mmNoPad = (nowDate.getMonth() + 1).toString();
      const counterRef = doc(firestore, 'counters', `mrv-${yy}-${mm}`);
      let reservedMrvShort: string | null = null;
      let nextSeqFromCounter = 0;

      const itemsToProcess = (newlyReceivedItems || [])
        .filter((item) => item && typeof item.id === 'string' && item.id.trim().length > 0)
        .map((item) => ({ ...item, quantityReceived: Number(item.quantityReceived) }))
        .filter((item) => Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);

      if (itemsToProcess.length === 0 && !forceComplete) {
        throw new Error('No valid items to receive.');
      }

      if (itemsToProcess.length > 0) {
        const counterSnap = await transaction.get(counterRef);
        const currentSeq = (counterSnap.exists() ? (counterSnap.data() as any).seq : 0) || 0;
        nextSeqFromCounter = currentSeq + 1;
        reservedMrvShort = `MRV-${yy}${mmNoPad}${nextSeqFromCounter}`;
        outMrvId = reservedMrvShort;
      }

      const itemRefsToFetch = new Map<string, DocumentReference>();
      for (const item of itemsToProcess) {
        for (const cid of candidateBaseIds(String(item.id))) {
          if (!itemRefsToFetch.has(cid)) itemRefsToFetch.set(cid, doc(firestore, 'inventory', cid));
        }
      }

      const uniqueItemRefs = Array.from(itemRefsToFetch.values());
      const itemSnaps = await Promise.all(uniqueItemRefs.map(ref => transaction.get(ref)));

      const itemDataMap = new Map<string, any>();
      for (const itemSnap of itemSnaps) {
        if (itemSnap.exists()) {
          itemDataMap.set(itemSnap.id, itemSnap.data());
        }
      }

      const resolveBaseId = (id: string): string | null => {
        const candidates = candidateBaseIds(id);
        for (const c of candidates) if (itemDataMap.has(c)) return c;
        return null;
      };

      for (const receivedItem of itemsToProcess) {
        const baseItemId = resolveBaseId(String(receivedItem.id));
        if (!baseItemId) {
          const label = pretty(receivedItem.nameEn) || String(receivedItem.id);
          throw new Error(`Item not found in inventory: ${label}`);
        }
      }

      const validItems = itemsToProcess;
      const transactionTime = Timestamp.now();
      const totalsByBaseItem = new Map<string, number>();
      for (const r of validItems) {
        const baseId = (() => {
          const rb = resolveBaseId(String(r.id));
          return rb || String(r.id);
        })();
        totalsByBaseItem.set(baseId, (totalsByBaseItem.get(baseId) || 0) + Number(r.quantityReceived || 0));
      }

      if (itemsToProcess.length > 0 && reservedMrvShort) {
        transaction.set(counterRef, { seq: nextSeqFromCounter, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
      }

      for (const [baseItemId, totalQty] of totalsByBaseItem.entries()) {
        const prevData = itemDataMap.get(baseItemId) || {};
        const prevSbr = { ...(prevData.stockByResidence || {}) } as Record<string, number>;
        const prevAtResidence = Math.max(0, Number(prevSbr[residenceId] || 0));
        const nextAtResidence = prevAtResidence + totalQty;
        const newSbr = { ...prevSbr, [residenceId]: nextAtResidence };
        const newTotal = Object.values(newSbr).reduce((sum, v: any) => {
          const n = Number(v);
          return sum + (isNaN(n) ? 0 : Math.max(0, n));
        }, 0);
        const itemRef = doc(firestore, 'inventory', baseItemId);
        transaction.update(itemRef, { stockByResidence: newSbr, stock: newTotal });
      }

      for (const receivedItem of validItems) {
        const baseItemId = (() => {
          const rb = resolveBaseId(String(receivedItem.id));
          return rb || String(receivedItem.id);
        })();
        const inv = itemDataMap.get(baseItemId) || {};
        const transactionRef = doc(collection(firestore, 'inventoryTransactions'));
        transaction.set(transactionRef, {
          itemId: baseItemId,
          itemNameEn: inv.nameEn || pretty(receivedItem.nameEn) || inv.name || '',
          itemNameAr: inv.nameAr || pretty(receivedItem.nameAr) || inv.name || '',
          residenceId: residenceId,
          date: transactionTime,
          type: 'IN',
          quantity: receivedItem.quantityReceived,
          referenceDocId: reservedMrvShort || orderId,
        } as Omit<InventoryTransaction, 'id'>);
      }

      if (reservedMrvShort) {
        let totalItemsCount = 0;
        for (const [, qty] of totalsByBaseItem.entries()) totalItemsCount += Number(qty) || 0;
        const mrvRef = doc(firestore, 'mrvs', reservedMrvShort);
        transaction.set(mrvRef, {
          id: reservedMrvShort,
          date: transactionTime,
          residenceId,
          itemCount: totalItemsCount,
          supplierName: null,
          invoiceNo: null,
          notes: `From MR ${orderId}`,
          attachmentUrl: null,
          attachmentPath: null,
          attachmentRef: null,
          codeShort: reservedMrvShort,
          orderId: orderId,
          receivedBy: currentUser?.id || null,
          receivedByName: currentUser?.name || null,
        } as any);
      }

      const existingReceived = orderData.itemsReceived ? [...orderData.itemsReceived] : [];
      const currentReceivedById = new Map<string, number>();
      for (const r of existingReceived) currentReceivedById.set(r.id, Number(r.quantityReceived) || 0);
      const linesByBaseId = new Map<string, { id: string; requestedQty: number }[]>();
      for (const line of orderData.items) {
        const rb = resolveBaseId(String(line.id));
        const key = rb || String(line.id);
        const arr = linesByBaseId.get(key) || [];
        arr.push({ id: line.id, requestedQty: Number(line.quantity) || 0 });
        linesByBaseId.set(key, arr);
      }

      for (const [baseItemId, totalQty] of totalsByBaseItem.entries()) {
        let remaining = Number(totalQty) || 0;
        const lines = (linesByBaseId.get(baseItemId) || []).slice();
        if (lines.length === 0) continue;
        for (const line of lines) {
          if (remaining <= 0) break;
          const already = currentReceivedById.get(line.id) || 0;
          const remainingForLine = Math.max(0, line.requestedQty - already);
          const allocate = remainingForLine > 0 ? Math.min(remaining, remainingForLine) : 0;
          if (allocate > 0) {
            const newVal = already + allocate;
            currentReceivedById.set(line.id, newVal);
            const idx = existingReceived.findIndex(it => it.id === line.id);
            if (idx > -1) {
              existingReceived[idx].quantityReceived = newVal;
            } else {
              existingReceived.push({ id: line.id, quantityReceived: newVal });
            }
            remaining -= allocate;
          }
        }
        if (remaining > 0 && lines.length > 0) {
          const first = lines[0];
          const already = currentReceivedById.get(first.id) || 0;
          const newVal = already + remaining;
          currentReceivedById.set(first.id, newVal);
          const idx = existingReceived.findIndex(it => it.id === first.id);
          if (idx > -1) {
            existingReceived[idx].quantityReceived = newVal;
          } else {
            existingReceived.push({ id: first.id, quantityReceived: newVal });
          }
          remaining = 0;
        }
      }

      let allItemsDelivered = forceComplete ? true : true;
      if (!forceComplete) {
        for (const requestedItem of orderData.items) {
          const totalReceived = existingReceived.find(ri => ri.id === requestedItem.id)?.quantityReceived || 0;
          if (totalReceived < requestedItem.quantity) {
            allItemsDelivered = false;
            break;
          }
        }
      }
      const newStatus: OrderStatus = allItemsDelivered ? 'Delivered' : 'Partially Delivered';
      transaction.update(orderRef, {
        itemsReceived: existingReceived,
        status: newStatus,
      });
    });

    toast({ title: 'Success', description: 'Stock updated and request status changed.' });
    return { mrvId: outMrvId };
  } catch (error) {
    console.error('Error receiving order items:', error);
    const err = error as Error;
    toast({ title: 'Transaction Error', description: `Failed to process receipt: ${err.message}`, variant: 'destructive' });
    throw err;
  } finally {
    setLoading(false);
  }
};


  const getOrderById = async (id: string): Promise<Order | null> => {
    if (!db) {
      const localOrder = orders.find((o) => o.id === id) || loadOrdersFromLocalStorage().find((o) => o.id === id) || null;
      return localOrder;
    }
    const orderDocRef = doc(db, "orders", id);
    const docSnap = await getDocFromServer(orderDocRef as any);
    if (docSnap.exists()) {
      const data = docSnap.data() as Record<string, any>;
      return { id: docSnap.id, ...data } as Order;
    } else {
      return null;
    }
  }

  const deleteOrder = async (id: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        await deleteDoc(doc(db, "orders", id));
        toast({ title: "Success", description: "Order deleted successfully." });
    } catch (error) {
        console.error("Error deleting order:", error);
        toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
    }
  };


  return (
  <OrdersContext.Provider value={{ orders, loading, loadOrders, createOrder, updateOrder, updateOrderStatus, getOrderById, deleteOrder, receiveOrderItems }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
