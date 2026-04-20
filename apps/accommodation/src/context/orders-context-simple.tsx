'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimpleOrdersContextType {
  orders: any[];
  loading: boolean;
  addOrder: (order: any) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  updateOrder: (orderId: string, updates: any) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const OrdersContext = createContext<SimpleOrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const addOrder = async (order: any) => {
    console.log('Mock: Adding order', order);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    console.log('Mock: Updating order status', orderId, status);
  };

  const updateOrder = async (orderId: string, updates: any) => {
    console.log('Mock: Updating order', orderId, updates);
  };

  const deleteOrder = async (orderId: string) => {
    console.log('Mock: Deleting order', orderId);
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      loading,
      addOrder,
      updateOrderStatus,
      updateOrder,
      deleteOrder
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
