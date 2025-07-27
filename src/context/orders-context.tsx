
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDoc, getDocs, query, where } from "firebase/firestore";
import type { InventoryItem } from './inventory-context';

export interface OrderItem extends InventoryItem {
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Approved' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  date: Timestamp;
  supplier: string;
  items: OrderItem[];
  status: OrderStatus;
}

type NewOrderPayload = Omit<Order, 'id' | 'date' | 'status'>;
type UpdateOrderPayload = Pick<Order, 'items' | 'supplier'>;


interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  loadOrders: () => void;
  createOrder: (orderData: NewOrderPayload) => Promise<string | null>;
  updateOrder: (id: string, orderData: UpdateOrderPayload) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
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
  }, []);

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
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const ordersQuery = query(
        collection(db, "orders"),
        where("date", ">=", Timestamp.fromDate(startOfMonth)),
        where("date", "<=", Timestamp.fromDate(endOfMonth))
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
      // Since our new document has a custom ID, we need to add the id field manually
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

   const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        const orderDocRef = doc(db, "orders", id);
        await updateDoc(orderDocRef, { status });
        toast({ title: "Success", description: `Order status changed to ${status}.` });
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
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
    <OrdersContext.Provider value={{ orders, loading, loadOrders, createOrder, updateOrder, updateOrderStatus, getOrderById, deleteOrder }}>
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
