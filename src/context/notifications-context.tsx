'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, doc, updateDoc, writeBatch, Timestamp, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData, Query } from 'firebase/firestore';
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
  userEmail?: string;
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
  const authUid = auth?.currentUser?.uid || null;
    const baseCol = collection(db!, 'notifications');

    // Subscribe by email when available AND also by userId to cover docs missing userEmail
  const queries: Query<DocumentData, DocumentData>[] = [];
    // Prefer email when available (most flexible with current rules)
    if (authEmail) {
      queries.push(query(baseCol, where('userEmail', '==', authEmail), orderBy('createdAt', 'desc')));
    }
    // Also add UID-based query strictly using auth.uid to satisfy rules
    if (authUid) {
      queries.push(query(baseCol, where('userId', '==', authUid), orderBy('createdAt', 'desc')));
    }
    if (queries.length === 0) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const unsubscribers = queries.map((qry) =>
      safeOnSnapshot(
        qry,
        (snapshot) => {
          // Merge results from multiple listeners by id
          const all = new Map<string, Notification>();
          // Include existing to avoid flicker when second stream arrives later
          for (const n of notifications) all.set(n.id, n);
          for (const d of snapshot.docs) {
            const data = d.data() as any;
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now();
            all.set(d.id, { id: d.id, ...data, createdAt } as Notification);
          }
          // Sort by createdAt desc
          const merged = Array.from(all.values()).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setNotifications(merged);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          toast({ title: 'Firestore Error', description: 'Could not fetch notifications.', variant: 'destructive' });
          setLoading(false);
        },
        { retryOnClose: true }
      )
    );

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [currentUser, toast]);

  const addNotification = async (payload: NewNotificationPayload) => {
    if (!db) {
      // Silent failure with optional toast for developers
      console.warn(firebaseErrorMessage);
      return;
    }
    try {
      // If payload already has userEmail, prefer it; otherwise attempt to look it up
      let userEmail: string | null = (payload as any).userEmail || null;
      if (!userEmail) {
        try {
          const userRef = doc(db!, 'users', payload.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const d = userSnap.data() as any;
            userEmail = (d.email && String(d.email)) || null;
          }
        } catch {}
      }
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
