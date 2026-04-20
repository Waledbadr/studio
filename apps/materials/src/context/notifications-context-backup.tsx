
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, writeBatch, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUsers } from './users-context';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transfer_request' | 'order_approved';
  href: string;
  referenceId: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export type NewNotificationPayload = Omit<Notification, 'id' | 'isRead' | 'createdAt'>;

interface NotificationsContextType {
  notifications: Notification[];
  loading: boolean;
  addNotification: (payload: NewNotificationPayload) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured.";

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (!db) {
        console.warn("Firebase not configured, using empty notifications");
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', currentUser.id),
          orderBy('createdAt', 'desc')
        );

        unsubscribeRef.current = onSnapshot(q, 
          (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notificationsData);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error setting up notifications listener:", error);
        setNotifications([]);
        setLoading(false);
      }
    } else {
      // No user logged in, clear notifications
      if (unsubscribeRef.current) unsubscribeRef.current();
      setNotifications([]);
      setLoading(false);
    }
    
    return () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
    };
  }, [currentUser, toast]);
  
  const addNotification = async (payload: NewNotificationPayload) => {
    if (!db) {
        console.warn("Firebase not configured, notification add skipped");
        return;
    }
    try {
        await addDoc(collection(db, 'notifications'), {
            ...payload,
            isRead: false,
            createdAt: serverTimestamp(),
        });
    } catch(error) {
        console.error("Error adding notification:", error);
        // Don't toast this error to the user, as it's a background process
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!db) {
      console.warn("Firebase not configured, mark as read skipped");
      return;
    }
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!db) {
      console.warn("Firebase not configured, mark all as read skipped");
      return;
    }
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
        const batch = writeBatch(db);
        unreadNotifications.forEach(n => {
            const notifRef = doc(db!, 'notifications', n.id);
            batch.update(notifRef, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
  };


  return (
    <NotificationsContext.Provider value={{ notifications, loading, addNotification, markAsRead, markAllAsRead }}>
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
