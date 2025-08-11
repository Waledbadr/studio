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
  approvedById?: string;
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
  receiveOrderItems: (orderId: string, newlyReceivedItems: {id: string, nameAr: string, nameEn: string, quantityReceived: number}[], forceComplete: boolean) => Promise<void>;
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
      console.error(firebaseErrorMessage);
      toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
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
      const newOrderId = await generateNewOrderId();
      const newOrderRef = doc(db, "orders", newOrderId);

      const newOrder: Omit<Order, 'id'> = {
        ...orderData,
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
        const updatePayload: {status: OrderStatus, approvedById?: string} = { status };
        
        let requestedById: string | null = null;
        if (status === 'Approved' && approverId) {
            const orderDoc = await getDoc(orderDocRef);
            if (orderDoc.exists()) {
                requestedById = orderDoc.data().requestedById;
            }
            updatePayload.approvedById = approverId;
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

const receiveOrderItems = async (orderId: string, newlyReceivedItems: {id: string, nameAr: string, nameEn: string, quantityReceived: number}[], forceComplete: boolean) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    setLoading(true);

    const firestore = db;
    const orderRef = doc(firestore, "orders", orderId);

    // Helper to get base id safely (handles variant suffix without breaking random Firestore IDs)
    const toBaseId = (rawId: string) => {
        const idx = rawId.indexOf('-');
        return idx === -1 ? rawId : rawId.slice(0, idx);
    };

    try {
        let skippedItemsNames: string[] = [];
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
            
            // Use a Map to fetch each base item only once
            const itemRefsToFetch = new Map<string, DocumentReference>();
            for (const item of itemsToProcess) {
                const baseItemId = toBaseId(String(item.id));
                if (!itemRefsToFetch.has(baseItemId)) {
                    itemRefsToFetch.set(baseItemId, doc(firestore, "inventory", baseItemId));
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

            // Partition items into valid vs missing
            const validItems: typeof itemsToProcess = [];
            const missingItems: string[] = [];
            for (const receivedItem of itemsToProcess) {
                const baseItemId = toBaseId(String(receivedItem.id));
                if (itemDataMap.has(baseItemId)) {
                    validItems.push(receivedItem);
                } else {
                    missingItems.push(`${receivedItem.nameEn} (ID: ${baseItemId})`);
                }
            }
            skippedItemsNames = missingItems;

            // --- STAGE 3: ALL WRITES ---
            const transactionTime = Timestamp.now();
            
            // 3.a Update inventory stock and log transactions for valid items only
            for (const receivedItem of validItems) {
                const baseItemId = toBaseId(String(receivedItem.id));
                const itemRef = doc(firestore, "inventory", baseItemId);
                transaction.update(itemRef, {
                    [`stockByResidence.${residenceId}`]: increment(receivedItem.quantityReceived)
                });

                const transactionRef = doc(collection(firestore, "inventoryTransactions"));
                transaction.set(transactionRef, {
                    itemId: baseItemId,
                    itemNameEn: receivedItem.nameEn,
                    itemNameAr: receivedItem.nameAr,
                    residenceId: residenceId,
                    date: transactionTime,
                    type: 'IN',
                    quantity: receivedItem.quantityReceived,
                    referenceDocId: orderId,
                } as Omit<InventoryTransaction, 'id'>);
            }

            // 3.b Update order's received items and status using valid items (skip missing)
            const existingReceived = orderData.itemsReceived ? [...orderData.itemsReceived] : [];
            for (const receivedItem of validItems) {
                const idx = existingReceived.findIndex(item => item.id === receivedItem.id);
                if (idx > -1) {
                    const current = Number(existingReceived[idx].quantityReceived) || 0;
                    existingReceived[idx].quantityReceived = current + receivedItem.quantityReceived;
                } else {
                    existingReceived.push({ id: receivedItem.id, quantityReceived: receivedItem.quantityReceived });
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

        if (skippedItemsNames.length > 0) {
            toast({ title: "Some items were skipped", description: `Missing in inventory: ${skippedItemsNames.join(', ')}`, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Stock updated and request status changed." });
        }
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
        return { id: docSnap.id, ...docSnap.data() } as Order;
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
