'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createDocument, getDocument, listDocuments, updateDocument } from '@/lib/db-api';
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
  createdAt: string | Date;
  userEmail?: string;
}

function toDate(value: unknown) {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
  return new Date(String(value));
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
  createdAt?: string | Date;
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
    if (!currentUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const authEmail = currentUser.email?.toLowerCase() || null;
        const authUid = currentUser.id;
        const rows: Notification[] = [];

        if (authEmail) {
          const emailRows = await listDocuments<Notification>('notifications', {
            where: [{ field: 'userEmail', op: '=', value: authEmail }],
            orderBy: { field: 'createdAt', direction: 'DESC' },
          });
          rows.push(...emailRows);
        }

        if (authUid) {
          const uidRows = await listDocuments<Notification>('notifications', {
            where: [{ field: 'userId', op: '=', value: authUid }],
            orderBy: { field: 'createdAt', direction: 'DESC' },
          });
          rows.push(...uidRows);
        }

        if (cancelled) return;

        const mergedMap = new Map<string, Notification>();
        for (const row of rows) {
          mergedMap.set(row.id, {
            ...row,
            createdAt: toDate(row.createdAt),
          });
        }

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
        );

        setNotifications(merged);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({ title: 'Data Error', description: 'Could not fetch notifications.', variant: 'destructive' });
        setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [currentUser, toast]);

  const addNotification = async (payload: NewNotificationPayload) => {
    if (!currentUser?.id) {
      console.warn('Cannot add notification without current user');
      return;
    }

    try {
      let userEmail: string | null = (payload as any).userEmail || null;
      if (!userEmail) {
        const user = await getDocument<{ email?: string }>('users', payload.userId);
        userEmail = user?.email ? String(user.email).toLowerCase() : null;
      }

      await createDocument('notifications', {
        ...payload,
        isRead: false,
        createdAt: new Date().toISOString(),
        userEmail: userEmail || null,
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!notificationId) return;
    try {
      await updateDocument('notifications', notificationId, { isRead: true });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((n) => updateDocument('notifications', n.id, { isRead: true }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
