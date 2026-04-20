

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDoc, getDocs, query, where, writeBatch, increment, runTransaction, orderBy, limit } from "firebase/firestore";
import type { InventoryItem, InventoryTransaction } from './inventory-context';
import { useResidences } from './residences-context';
import { useUsers } from './users-context';
import { useNotifications } from './notifications-context';


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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const { addNotification } = useNotifications();


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
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${year}-${month}-`;

    const q = query(
        collection(db, 'orders'),
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

    try {
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

            const itemsToProcess = newlyReceivedItems.filter(item => item.quantityReceived > 0);
            
             // Use a Map to fetch each base item only once
            const itemRefsToFetch = new Map<string, DocumentReference>();
            for (const item of itemsToProcess) {
                const baseItemId = item.id.split('-')[0]; // Extract base ID
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

            const missingItems: string[] = [];
            for (const receivedItem of itemsToProcess) {
                const baseItemId = receivedItem.id.split('-')[0];
                if (!itemDataMap.has(baseItemId)) {
                    missingItems.push(`${receivedItem.nameEn} (ID: ${baseItemId})`);
                }
            }
            
            if(missingItems.length > 0) {
                 throw new Error(`The following items were not found in inventory: ${missingItems.join(', ')}. Please add them first.`);
            }

            // --- STAGE 3: ALL WRITES ---
            const transactionTime = Timestamp.now();
            
            // Update inventory stock and log transactions
            for (const receivedItem of itemsToProcess) {
                 const baseItemId = receivedItem.id.split('-')[0];
                const itemData = itemDataMap.get(baseItemId);
                if (itemData) {
                    const itemRef = doc(firestore, "inventory", baseItemId);
                    // Use increment for atomic updates
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
            }

            // Update order's received items and status
            const existingReceived = orderData.itemsReceived ? [...orderData.itemsReceived] : [];
            for (const receivedItem of newlyReceivedItems) {
                const existingItemIndex = existingReceived.findIndex(item => item.id === receivedItem.id);
                if (existingItemIndex > -1) {
                    existingReceived[existingItemIndex].quantityReceived += receivedItem.quantityReceived;
                } else {
                    existingReceived.push({ id: receivedItem.id, quantityReceived: receivedItem.quantityReceived });
                }
            }

            let allItemsDelivered = true;
            if (!forceComplete) {
                for (const requestedItem of orderData.items) {
                    const totalReceived = existingReceived.find(ri => ri.id === requestedItem.id)?.quantityReceived || 0;
                    if (totalReceived < requestedItem.quantity) {
                        allItemsDelivered = false;
                        break;
                    }
                }
            }
            const newStatus: OrderStatus = allItemsDelivered || forceComplete ? 'Delivered' : 'Partially Delivered';

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
        throw err; // Re-throw to prevent routing if transaction fails
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
    const docSnap = await getDoc(orderDocRef);
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
