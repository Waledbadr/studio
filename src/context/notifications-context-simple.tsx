'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimpleNotificationsContextType {
  notifications: any[];
  loading: boolean;
  addNotification: (payload: any) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<SimpleNotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const addNotification = async (payload: any) => {
    console.log('Mock: Adding notification', payload);
  };

  const markAsRead = async (notificationId: string) => {
    console.log('Mock: Marking notification as read', notificationId);
  };

  const markAllAsRead = async () => {
    console.log('Mock: Marking all notifications as read');
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

console.log('🔧 Simple notifications context loaded');
