'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type OrderStatus = 'Pending' | 'Approved' | 'Partially Delivered' | 'Delivered' | 'Rejected' | 'Cancelled';
export interface OrderItem { 
  id: string; 
  nameAr?: string; 
  nameEn?: string; 
  category?: string; 
  unit?: string; 
  quantity: number;
  notes?: string;
}
export interface Order {
  id: string;
  residenceId: string;
  residence?: string; // For backward compatibility
  status: OrderStatus;
  date?: { toDate?: () => Date } | Date;
  items: OrderItem[];
  itemsReceived?: Array<{ id: string; quantityReceived: number }>;
  notes?: string;
}

interface SimpleOrdersContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: any) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, userId?: string) => Promise<void>;
  updateOrder: (orderId: string, updates: any) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  receiveOrderItems?: (orderId: string, items: Array<{ id: string; quantityReceived: number }>, forceComplete?: boolean) => Promise<{ mrvId?: string }>;
  loadOrders?: () => void;
}

const OrdersContext = createContext<SimpleOrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const addOrder = async (order: any) => {
    console.log('Mock: Adding order', order);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, userId?: string) => {
    console.log('Mock: Updating order status', orderId, status, userId);
  };

  const updateOrder = async (orderId: string, updates: any) => {
    console.log('Mock: Updating order', orderId, updates);
  };

  const deleteOrder = async (orderId: string) => {
    console.log('Mock: Deleting order', orderId);
  };

  const receiveOrderItems = async (orderId: string, items: Array<{ id: string; quantityReceived: number }>, forceComplete?: boolean) => {
    console.log('Mock: receiveOrderItems', { orderId, items, forceComplete });
    return { mrvId: `mrv-${orderId}` };
  };

  const loadOrders = () => {
    console.log('Mock: loadOrders');
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      loading,
      addOrder,
      updateOrderStatus,
      updateOrder,
  deleteOrder,
  receiveOrderItems,
  loadOrders
    }}>
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

console.log('🔧 Simple orders context loaded');
