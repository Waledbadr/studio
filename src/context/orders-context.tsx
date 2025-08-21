'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDoc, getDocs, query, where, writeBatch, increment, runTransaction, orderBy, limit, getDocFromServer } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import type { InventoryItem, InventoryTransaction } from './inventory-context';
import { useResidences } from './residences-context';
import { useUsers } from './users-context';
import { useNotifications } from './notifications-context';
import type { DocumentReference } from 'firebase/firestore';


export interface OrderItem extends InventoryItem {
  quantity: number;
  notes?: string;
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
}

type NewOrderPayload = Omit<Order, 'id' | 'date' | 'status' | 'itemsReceived' | 'approvedById'>;
type UpdateOrderPayload = Pick<Order, 'items' | 'residence' | 'residenceId' | 'notes'>;


interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  loadOrders: () => void;
  createOrder: (orderData: NewOrderPayload) => Promise<string | null>;
  updateOrder: (id: string, orderData: UpdateOrderPayload) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, approverId?: string) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
  // For receiving, only id and quantity are required; names are optional and resolved from inventory when available
  receiveOrderItems: (orderId: string, newlyReceivedItems: {id: string, quantityReceived: number, nameAr?: string, nameEn?: string}[], forceComplete: boolean) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

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
      console.warn("Firebase not configured, loading mock orders");
      setOrders([]); // Empty orders for now
      setLoading(false);
      return;
    }
    // Defer subscription until signed-in user is available
    if (auth && !auth.currentUser) {
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

  // Ensure we auto-subscribe once the user signs in (in case pages call before auth)
  useEffect(() => {
    if (!auth) return; // local mode; page will call explicitly
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        loadOrders();
      } else {
        // Signed out: stop listener and reset state
        if (unsubscribeRef.current) {
          try { unsubscribeRef.current(); } catch {}
          unsubscribeRef.current = null;
        }
        setOrders([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadOrders]);
  
  const generateNewOrderId = async (): Promise<string> => {
    if (!db) {
      throw new Error("Firebase not initialized");
    }
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // e.g., 25
    const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., 08
    const mmNoPad = (now.getMonth() + 1).toString(); // e.g., 8
    const counterRef = doc(db!, 'counters', `mr-${yy}-${mm}`);

    let nextSeq = 0;
    await runTransaction(db, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
    });

    // New ID format: MR-yy<m><seq>, e.g., MR-25828
    return `MR-${yy}${mmNoPad}${nextSeq}`;
  };

  const createOrder = async (orderData: NewOrderPayload): Promise<string | null> => {
    if (!db || !orderData) {
      toast({ title: "Error", description: !db ? firebaseErrorMessage : "Cannot create order with empty data.", variant: "destructive" });
      return null;
    }
    
    setLoading(true);
    try {
      // Guard: ensure the requester on the document matches the signed-in Firebase Auth UID
      // This avoids Firestore rule failures when users docs don't use auth.uid as ID.
      const authUid = auth?.currentUser?.uid;
      if (!authUid) {
        toast({ title: "Auth required", description: "You must be signed in to create a request.", variant: "destructive" });
        return null;
      }
      const requesterEmail = auth?.currentUser?.email || undefined;
      // Prefer UsersContext name, fallback to Auth displayName, then email
      const requesterName = (currentUser?.id === authUid ? currentUser?.name : (users?.find(u => u.id === authUid)?.name))
        || auth?.currentUser?.displayName
        || requesterEmail
        || '—';
      const safeOrderData: NewOrderPayload = {
        ...orderData,
        // Force requestedById to the real auth uid to satisfy security rules
        requestedById: authUid,
      };

      const newOrderId = await generateNewOrderId();
      const newOrderRef = doc(db, "orders", newOrderId);

      const newOrder: Omit<Order, 'id'> = {
        ...safeOrderData,
        requestedByName: requesterName,
        requestedByEmail: requesterEmail,
        date: Timestamp.now(),
        status: 'Pending'
      }
      
      await setDoc(newOrderRef, { ...newOrder, id: newOrderId });

      // Notify all Admin users about the new order
      try {
        let adminUserIds = users?.filter(u => u.role === 'Admin').map(u => u.id) || [];
        if (adminUserIds.length === 0) {
          // Fallback to Firestore query if users context is not yet loaded
          const adminsQ = query(collection(db, 'users'), where('role', '==', 'Admin'));
          const adminsSnap = await getDocs(adminsQ);
          adminUserIds = adminsSnap.docs.map(d => d.id);
        }

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
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
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

        await updateDoc(orderDocRef, { ...orderData });
        toast({ title: "Success", description: "Order updated successfully." });
    } catch (error) {
        console.error("Error updating order:", error);
        toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, approverId?: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const orderDocRef = doc(db, "orders", id);
  const updatePayload: {status: OrderStatus, approvedById?: string, approvedByName?: string} = { status };
        
        let requestedById: string | null = null;
    if (status === 'Approved' && approverId) {
            const orderDoc = await getDoc(orderDocRef);
            if (orderDoc.exists()) {
                requestedById = orderDoc.data().requestedById;
            }
      updatePayload.approvedById = approverId;
      const approver = (users?.find(u => u.id === approverId)) || (currentUser?.id === approverId ? currentUser : null);
      updatePayload.approvedByName = approver?.name || auth?.currentUser?.displayName || undefined;
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

const receiveOrderItems = async (orderId: string, newlyReceivedItems: {id: string, quantityReceived: number, nameAr?: string, nameEn?: string}[], forceComplete: boolean) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
  // Client-side guard to avoid Firestore permission errors; allow Admin or Supervisor
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
    toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can receive materials and update stock.', variant: 'destructive' });
    throw new Error('Forbidden');
  }
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
        // only attempt when string appears encoded
        if (/%[0-9A-Fa-f]{2}/.test(s)) return decodeURIComponent(s);
      } catch {}
      return s;
    };

    try {
  // We no longer "skip" lines. If any item is missing from inventory, we fail the whole transaction.
        await runTransaction(firestore, async (transaction) => {
            // --- STAGE 1: ALL READS ---
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Order not found");
            }
            const orderData = orderSnap.data() as Order;
            const residenceId = orderData.residenceId;
            if (!residenceId) {
                throw new Error("Residence ID not found on order.");
            }

            // Strict validation & sanitization of inputs
            const itemsToProcess = (newlyReceivedItems || [])
                .filter((item) => item && typeof item.id === 'string' && item.id.trim().length > 0)
                .map((item) => ({ ...item, quantityReceived: Number(item.quantityReceived) }))
                .filter((item) => Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);

            // Allow force-complete even if no new quantities entered
            if (itemsToProcess.length === 0 && !forceComplete) {
                throw new Error('No valid items to receive.');
            }
            
            // Build unique candidate IDs and fetch them once
            const itemRefsToFetch = new Map<string, DocumentReference>();
            for (const item of itemsToProcess) {
              for (const cid of candidateBaseIds(String(item.id))) {
                if (!itemRefsToFetch.has(cid)) itemRefsToFetch.set(cid, doc(firestore, 'inventory', cid));
              }
            }

            const uniqueItemRefs = Array.from(itemRefsToFetch.values());
            const itemSnaps = await Promise.all(uniqueItemRefs.map(ref => transaction.get(ref)));

            // --- STAGE 2: ALL VALIDATION (NO WRITES) ---
            const itemDataMap = new Map<string, any>();
            for (let i = 0; i < itemSnaps.length; i++) {
                const itemSnap = itemSnaps[i];
                if (itemSnap.exists()) {
                    itemDataMap.set(itemSnap.id, itemSnap.data());
                }
            }

            // Resolver: pick the first candidate that exists in inventory
            const resolveBaseId = (id: string): string | null => {
              const candidates = candidateBaseIds(id);
              for (const c of candidates) if (itemDataMap.has(c)) return c;
              return null;
            };

      // Validate: ALL base items must exist; otherwise abort (no skipping)
            for (const receivedItem of itemsToProcess) {
              const baseItemId = resolveBaseId(String(receivedItem.id));
              if (!baseItemId) {
                const label = pretty(receivedItem.nameEn) || String(receivedItem.id);
                throw new Error(`Item not found in inventory: ${label}`);
              }
            }

      const validItems = itemsToProcess;

            // --- STAGE 3: ALL WRITES ---
            const transactionTime = Timestamp.now();
            
      // Aggregate quantities per base item to ensure single atomic stock update per item
      const totalsByBaseItem = new Map<string, number>();
      for (const r of validItems) {
        const baseId = ((): string => {
          const rb = resolveBaseId(String(r.id));
          return rb || String(r.id);
        })();
        totalsByBaseItem.set(baseId, (totalsByBaseItem.get(baseId) || 0) + Number(r.quantityReceived || 0));
      }

      // 3.a Update inventory stock (stockByResidence and total stock) per item
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

      // 3.b Log transactions for each received line (for reporting)
      for (const receivedItem of validItems) {
        const baseItemId = ((): string => {
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
          referenceDocId: orderId,
        } as Omit<InventoryTransaction, 'id'>);
      }

      // 3.c Update order's received items and status, aggregating by base item across variants
            const existingReceived = orderData.itemsReceived ? [...orderData.itemsReceived] : [];

            // Build helper: map of current received per line id for quick lookup
            const currentReceivedById = new Map<string, number>();
            for (const r of existingReceived) currentReceivedById.set(r.id, Number(r.quantityReceived) || 0);

            // Distribute totals per baseId onto the order's lines that share that baseId (resolved)
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
              if (lines.length === 0) {
                // No matching order lines (should not happen). Skip allocation to lines but continue.
                continue;
              }
              // Allocate to each line up to its remaining-to-fulfill amount
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
              // If we still have remaining (over-receipt), add it to the first line
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

            // Determine status
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
                status: newStatus
            });
        });

  toast({ title: "Success", description: "Stock updated and request status changed." });
    } catch (error) {
        console.error("Error receiving order items:", error);
        const err = error as Error;
        toast({ title: "Transaction Error", description: `Failed to process receipt: ${err.message}`, variant: "destructive" });
        throw err;
    } finally {
        setLoading(false);
    }
};


  const getOrderById = async (id: string): Promise<Order | null> => {
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
      return null;
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
