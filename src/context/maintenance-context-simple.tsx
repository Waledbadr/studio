'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimpleMaintenanceContextType {
  requests: any[];
  loading: boolean;
  addRequest: (request: any) => Promise<void>;
  updateRequestStatus: (requestId: string, status: string) => Promise<void>;
  updateRequest: (requestId: string, updates: any) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
}

const MaintenanceContext = createContext<SimpleMaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const addRequest = async (request: any) => {
    console.log('Mock: Adding maintenance request', request);
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    console.log('Mock: Updating request status', requestId, status);
  };

  const updateRequest = async (requestId: string, updates: any) => {
    console.log('Mock: Updating request', requestId, updates);
  };

  const deleteRequest = async (requestId: string) => {
    console.log('Mock: Deleting request', requestId);
  };

  return (
    <MaintenanceContext.Provider value={{
      requests,
      loading,
      addRequest,
      updateRequestStatus,
      updateRequest,
      deleteRequest
    }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

console.log('🔧 Simple maintenance context loaded');
