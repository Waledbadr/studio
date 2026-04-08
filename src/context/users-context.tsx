'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { deleteDocument, listDocuments, updateDocument } from '@/lib/db-api';

export interface UserThemeSettings {
  colorTheme: string; // theme ID (blue, emerald, purple, etc.)
  mode: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Technician" | "Worker";
  assignedResidences: string[];
  themeSettings?: UserThemeSettings;
  // Optional profile fields
  phone?: string;
  language?: 'en' | 'ar';
  // Worker-specific fields
  employeeId?: string;
  idNumber?: string;
  nationality?: string;
  company?: string;
}

interface UsersContextType {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  loadUsers: () => void;
  saveUser: (user: Omit<User, 'id'> | User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  switchUser: (user: User) => void;
  getUserById: (id: string) => User | null;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isLoaded = useRef(false);
  const lastAuthUidRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const applyTheme = (theme?: UserThemeSettings) => {
    const t = theme || { colorTheme: 'blue', mode: 'system' };
    try {
      localStorage.setItem('colorTheme', t.colorTheme);
      localStorage.setItem('themeMode', t.mode);
      window.dispatchEvent(new CustomEvent('userThemeChanged', { detail: t }));
    } catch {}
  };

  const loadUsers = useCallback(() => {
    if (isLoaded.current) return;

    isLoaded.current = true;
    setLoading(true);

    const fetchUsers = async () => {
      try {
        const [usersData, sessionRes] = await Promise.all([
          listDocuments<User>('users', { orderBy: { field: 'name', direction: 'ASC' } }),
          fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }).catch(() => null),
        ]);

        const usersList = usersData || [];
        setUsers(usersList);

        let activeUser = null as User | null;
        let sessionUser: { id: string; email?: string } | null = null;
        if (sessionRes && sessionRes.ok) {
          sessionUser = await sessionRes.json();
        }

        if (sessionUser) {
          activeUser = usersList.find((u) => u.id === sessionUser!.id) || usersList.find((u) => (u.email || '').toLowerCase() === (sessionUser!.email || '').toLowerCase()) || null;
        }

        const storedUserId = localStorage.getItem('currentUser');
        const byStored = storedUserId ? usersList.find(u => u.id === storedUserId) : null;
        activeUser = activeUser || byStored || (sessionUser ? usersList[0] || null : null);

        if (!currentUser || (activeUser && currentUser.id !== activeUser.id)) {
          setCurrentUser(activeUser);
          if (activeUser) {
            try { localStorage.setItem('currentUser', activeUser.id); } catch {}
            applyTheme(activeUser.themeSettings);
          }
        }
      } catch (error) {
        const message = (error as any)?.message ?? String(error ?? '');
        if (typeof message === 'string' && message.includes('D1 database not configured')) {
          console.warn('UsersContext: D1 database is not configured; skipping users fetch in this environment.');
        } else {
          console.error('Error fetching users:', error);
          toast({ title: 'Data Error', description: 'Could not fetch users data.', variant: 'destructive' });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    pollRef.current = window.setInterval(fetchUsers, 15000);
  }, [toast, currentUser]);

  // Initialize users list depending on environment/auth
  useEffect(() => {
    loadUsers();

    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      isLoaded.current = false;
    };
  }, [loadUsers]);

  const saveUser = async (user: Omit<User, 'id'> | User) => {
    try {
      if ('id' in user && user.id) {
        const { id, ...payload } = user as User;
        const prevUser = users.find(u => u.id === id) || null;
        const prevAssigned = new Set(prevUser?.assignedResidences || []);
        const nextAssigned = new Set(payload.assignedResidences || []);
        const added: string[] = [];
        const removed: string[] = [];
        nextAssigned.forEach(rid => { if (!prevAssigned.has(rid)) added.push(rid); });
        prevAssigned.forEach(rid => { if (!nextAssigned.has(rid)) removed.push(rid); });

        await updateDocument('users', id, { ...payload });

        try {
          for (const rid of added) {
            await updateDocument('residences', rid, { managerId: id });
          }
          for (const rid of removed) {
            await updateDocument('residences', rid, { managerId: '' });
          }
        } catch (e) {
          console.warn('Residences sync from user update failed:', e);
        }

        toast({ title: 'Success', description: 'User updated successfully.' });
      } else {
        const payload = user as Omit<User, 'id'>;
        const emailKey = String(payload.email || '').trim().toLowerCase();
        if (!emailKey) throw new Error('Email is required');

        const res = await fetch('/api/admin/users/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: payload.name,
            email: emailKey,
            role: payload.role,
            assignedResidences: payload.assignedResidences,
            themeSettings: payload.themeSettings,
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to create user');
        }

        toast({ title: 'Success', description: 'User created successfully.' });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const msg = (error as Error)?.message || 'Failed to save user.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDocument('users', id);
      setUsers((current) => current.filter((u) => u.id !== id));
      toast({ title: 'Success', description: 'User deleted successfully.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    }
  };

  const switchUser = (user: User) => {
    // Retained for local mode or admin emulation flows; not used in header anymore.
    setCurrentUser(user);
    try { localStorage.setItem('currentUser', user.id); } catch {}
    applyTheme(user.themeSettings);
    toast({ title: 'Switched User', description: `You are now acting as ${user.name}.` });
  };
  
  const getUserById = (id: string): User | null => {
    if (!id) return null;
    // Try direct ID
    let u = users.find(user => user.id === id) || null;
    if (u) return u;
    // Fallback: if id looks like an email, match by email
    const looksLikeEmail = /@/.test(id);
    if (looksLikeEmail) {
      u = users.find(user => (user.email || '').toLowerCase() === id.toLowerCase()) || null;
      if (u) return u;
    }
    return null;
  }


  return (
    <UsersContext.Provider value={{ users, currentUser, loading, loadUsers, saveUser, deleteUser, switchUser, getUserById }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};


