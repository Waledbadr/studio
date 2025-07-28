
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDoc, getDocs, query, where, writeBatch, increment, runTransaction } from "firebase/firestore";
import type { InventoryItem, InventoryTransaction } from './inventory-context';
import { useResidences } from './residences-context';
import { useUsers } from './users-context';

export interface OrderItem extends InventoryItem {
  quantity: number;
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
}

type NewOrderPayload = Omit<Order, 'id' | 'date' | 'status' | 'itemsReceived' | 'approvedById'>;
type UpdateOrderPayload = Pick<Order, 'items' | 'residence' | 'residenceId'>;


interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  loadOrders: () => void;
  createOrder: (orderData: NewOrderPayload) => Promise<string | null>;
  updateOrder: (id: string, orderData: UpdateOrderPayload) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, approverId?: string) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
  receiveOrderItems: (orderId: string, newlyReceivedItems: OrderItem[]) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadOrders = useCallback(() => {
    if (isLoaded.current) return;
    if (!db) {
      console.error(firebaseErrorMessage);
      setTimeout(() => {
        toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
      }, 100)
      setLoading(false);
      return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const ordersCollection = collection(db, "orders");
    unsubscribeRef.current = onSnapshot(ordersCollection, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      ordersData.sort((a, b) => b.date.toMillis() - a.date.toMillis());
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
        unsubscribeRef.current();
        isLoaded.current = false;
      }
    };
  }, [loadOrders]);
  
  const generateNewOrderId = async (): Promise<string> => {
    if (!db) {
        throw new Error("Firebase not initialized");
    }
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Firestore timestamps for querying
    const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
    
    const ordersQuery = query(
        collection(db, "orders"),
        where("date", ">=", startOfMonth),
        where("date", "<=", endOfMonth)
    );

    const querySnapshot = await getDocs(ordersQuery);
    const orderCount = querySnapshot.size;
    const nextOrderNumber = (orderCount + 1).toString().padStart(3, '0');
    
    return `${year}-${month}-${nextOrderNumber}`;
  };

  const createOrder = async (orderData: NewOrderPayload): Promise<string | null> => {
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
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
        if (status === 'Approved' && approverId) {
            updatePayload.approvedById = approverId;
        }

        await updateDoc(orderDocRef, updatePayload);
        toast({ title: "Success", description: `Order status changed to ${status}.` });
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

  const receiveOrderItems = async (orderId: string, newlyReceivedItems: {id: string, nameAr: string, nameEn: string, quantityReceived: number}[]) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    setLoading(true);

    const orderRef = doc(db, "orders", orderId);

    try {
        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Order not found");
            }

            const orderData = orderSnap.data() as Order;
            const residenceId = orderData.residenceId;
            if (!residenceId) {
                throw new Error("Residence ID not found on order.");
            }
            
            const transactionTime = Timestamp.now();

            // Update inventory stock for each item and log transaction
            for (const receivedItem of newlyReceivedItems) {
                if (receivedItem.quantityReceived > 0) {
                    const itemRef = doc(db, "inventory", receivedItem.id);
                    const stockUpdateKey = `stockByResidence.${residenceId}`;
                    
                    // Increment stock
                    transaction.set(itemRef, 
                        { stockByResidence: { [residenceId]: increment(receivedItem.quantityReceived) } }, 
                        { merge: true }
                    );

                    // Log the transaction
                    const transactionRef = doc(collection(db, "inventoryTransactions"));
                    const newTransaction: Omit<InventoryTransaction, 'id'> = {
                        itemId: receivedItem.id,
                        itemNameEn: receivedItem.nameEn,
                        itemNameAr: receivedItem.nameAr,
                        residenceId: residenceId,
                        date: transactionTime,
                        type: 'IN',
                        quantity: receivedItem.quantityReceived,
                        referenceDocId: orderId,
                    };
                    transaction.set(transactionRef, newTransaction);
                }
            }
            
            // Update the order's received items and status
            const existingReceived = orderData.itemsReceived ? [...orderData.itemsReceived] : [];
            for (const receivedItem of newlyReceivedItems) {
                const existingItemIndex = existingReceived.findIndex(item => item.id === receivedItem.id);
                if (existingItemIndex > -1) {
                    existingReceived[existingItemIndex].quantityReceived += receivedItem.quantityReceived;
                } else {
                    existingReceived.push({ id: receivedItem.id, quantityReceived: receivedItem.quantityReceived });
                }
            }

            // Determine the new status
            let allItemsDelivered = true;
            for (const requestedItem of orderData.items) {
                const totalReceived = existingReceived.find(ri => ri.id === requestedItem.id)?.quantityReceived || 0;
                if (totalReceived < requestedItem.quantity) {
                    allItemsDelivered = false;
                    break;
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
        toast({ title: "Transaction Error", description: `Failed to process receipt: ${error}`, variant: "destructive" });
    } finally {
        setLoading(false);
    }
};



  const getOrderById = async (id: string): Promise<Order | null> => {
    if (!db) {
      toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
      return null;
    }
    try {
        const orderDocRef = doc(db, "orders", id);
        const docSnap = await getDoc(orderDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Order;
        } else {
            toast({ title: "Error", description: "Order not found.", variant: "destructive" });
            return null;
        }
    } catch(error) {
        console.error("Error fetching order:", error);
        toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
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
