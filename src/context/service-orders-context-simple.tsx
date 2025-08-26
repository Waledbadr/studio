'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ServiceOrder { 
  id: string; 
  title: string; 
  status: 'Open' | 'In Progress' | 'Closed' | 'COMPLETED' | 'PARTIAL_RETURN' | 'CANCELLED' | 'DISPATCHED';
  codeShort?: string;
  residenceId?: string;
  residenceName?: string;
  destination?: { name: string };
  items?: any[];
  dateCreated?: { toDate: () => Date };
}

interface ServiceOrdersContextType {
  orders: ServiceOrder[];
  serviceOrders: ServiceOrder[];
  loading: boolean;
  addOrder: (order: Omit<ServiceOrder, 'id'>) => Promise<string>;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => Promise<void>;
  getServiceOrderById: (id: string) => Promise<ServiceOrder | null>;
  getServiceOrderByCode: (code: string) => Promise<ServiceOrder | null>;
  receiveServiceOrder: (id: string, data: any) => Promise<void>;
}

const ServiceOrdersContext = createContext<ServiceOrdersContextType | undefined>(undefined);

export const ServiceOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading] = useState(false);

  const addOrder = async (order: Omit<ServiceOrder, 'id'>) => {
    const id = `so-${Date.now()}`;
    setOrders(prev => [...prev, { ...order, id }]);
    return id;
  };

  const updateOrder = async (id: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const getServiceOrderById = async (id: string) => {
    console.log('Mock: getServiceOrderById', id);
    return orders.find(o => o.id === id) || null;
  };

  const getServiceOrderByCode = async (code: string) => {
    console.log('Mock: getServiceOrderByCode', code);
    return orders.find(o => o.codeShort === code) || null;
  };

  const receiveServiceOrder = async (id: string, data: any, userId?: string) => {
    console.log('Mock: receiveServiceOrder', id, data, userId);
  };

  return (
    <ServiceOrdersContext.Provider value={{ 
      orders, 
      serviceOrders: orders,
      loading, 
      addOrder, 
      updateOrder,
      getServiceOrderById,
      getServiceOrderByCode,
      receiveServiceOrder
    }}>
      {children}
    </ServiceOrdersContext.Provider>
  );
};

export const useServiceOrders = () => {
  const ctx = useContext(ServiceOrdersContext);
  if (!ctx) throw new Error('useServiceOrders must be used within a ServiceOrdersProvider');
  return ctx;
};

console.log('🔧 Simple service orders context loaded');
