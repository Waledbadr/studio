'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, doc, updateDoc, writeBatch, Timestamp, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import safeOnSnapshot from '@/lib/firestore-utils';
import { useUsers } from './users-context';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transfer_request' | 'order_approved' | 'new_order' | 'generic' | 'feedback_update';
  href: string;
  referenceId: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export type NewNotificationPayload = Omit<Notification, 'id' | 'isRead' | 'createdAt'>;

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'new_order' | 'order_approved' | 'transfer_request' | 'generic' | 'mrv_request';
  href?: string;
  referenceId?: string;
  createdAt?: Timestamp;
}

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

  useEffect(() => {
    if (!db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (!currentUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const authEmail = auth?.currentUser?.email || null;
    const baseCol = collection(db!, 'notifications');
    const q = authEmail
      ? query(baseCol, where('userEmail', '==', authEmail), orderBy('createdAt', 'desc'))
      : query(baseCol, where('userId', '==', currentUser.id), orderBy('createdAt', 'desc'));

    const unsubscribe = safeOnSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as any;
          const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now();
          return { id: d.id, ...data, createdAt } as Notification;
        });
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        toast({ title: 'Firestore Error', description: 'Could not fetch notifications.', variant: 'destructive' });
        setLoading(false);
      },
      { retryOnClose: true }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, toast]);

  const addNotification = async (payload: NewNotificationPayload) => {
    if (!db) {
      // Silent failure with optional toast for developers
      console.warn(firebaseErrorMessage);
      return;
    }
    try {
      // Attempt to enrich with recipient email for rules-based access
      let userEmail: string | null = null;
      try {
        const userRef = doc(db!, 'users', payload.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const d = userSnap.data() as any;
          userEmail = (d.email && String(d.email)) || null;
        }
      } catch {}
      await addDoc(collection(db!, 'notifications'), {
        ...payload,
        isRead: false,
        createdAt: serverTimestamp(),
        userEmail: userEmail || null,
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      // Silent for end-users
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!db) return;
    try {
      const notifRef = doc(db!, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!db) return;
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db!);
      unreadNotifications.forEach((n) => {
        const notifRef = doc(db!, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
