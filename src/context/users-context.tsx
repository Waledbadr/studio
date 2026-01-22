'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getBackendErrorMessage } from '@/lib/backend-error-messages';
import { db, auth } from '@/lib/platform';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, updateDoc, getDocs, getDoc } from '@/lib/realtime-shim';
import { onAuthStateChanged, refreshMe, getCurrentUser } from '@/lib/auth-shim';
import * as D1Client from '@/lib/d1-client';

// Prefer D1 automatically when Firestore isn't configured.
// NEXT_PUBLIC_USE_D1 can still force D1 when a vendor backend exists.
const USE_D1 =
  String(
    (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
  ).toLowerCase() === 'true' || !db;

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

const backendErrorMessage = getBackendErrorMessage();

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);
  const lastAuthUidRef = useRef<string | null>(null);

  const applyTheme = (theme?: UserThemeSettings) => {
    const t = theme || { colorTheme: 'blue', mode: 'system' };
    try {
      localStorage.setItem('colorTheme', t.colorTheme);
      localStorage.setItem('themeMode', t.mode);
      window.dispatchEvent(new CustomEvent('userThemeChanged', { detail: t }));
    } catch {}
  };

  // Track session-based auth state (auth-shim) and load users after login.
  useEffect(() => {
    let mounted = true;

    const unsub = onAuthStateChanged(null, (u) => {
      if (!mounted) return;
      lastAuthUidRef.current = u?.uid || null;
      if (!u) {
        // Signed out
        if (unsubscribeRef.current) {
          try { unsubscribeRef.current(); } catch {}
          unsubscribeRef.current = null;
        }
        isLoaded.current = false;
        setUsers([]);
        setCurrentUser(null);
        try { localStorage.removeItem('currentUser'); } catch {}
      } else if (!isLoaded.current) {
        loadUsers();
      }
    });

    // Trigger initial /api/auth/me so the shim updates quickly on first load.
    void refreshMe().catch(() => {});

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const loadUsers = useCallback(async () => {
    if (isLoaded.current) return;
    
    if (!db) {
      if (USE_D1) {
        // Avoid calling /api/d1 before we have an authenticated session.
        if (!getCurrentUser()) {
          setLoading(false);
          return;
        }
        try {
          const usersData = await D1Client.getUsers();
          if (usersData && usersData.length > 0) {
            setUsers(usersData);
            const authUid = lastAuthUidRef.current;
            const storedUserId = localStorage.getItem('currentUser');
            const byAuth = authUid ? usersData.find((u: User) => u.id === authUid) : null;
            const byStored = storedUserId ? usersData.find((u: User) => u.id === storedUserId) : null;
            const activeUser = byAuth || byStored || usersData[0] || null;
            setCurrentUser(activeUser || null);
            if (activeUser?.themeSettings) applyTheme(activeUser.themeSettings);
            setLoading(false);
            isLoaded.current = true;
            return;
          } else {
            console.warn('D1 returned no users or binding not available; falling back to local storage');
          }
        } catch (e) {
          console.warn('D1 RPC failed, falling back to local storage:', e);
        }
      }

      console.log("Backend not configured (D1 unavailable), using local storage");
      
      // Load from localStorage
      try {
        const storedUsers = localStorage.getItem('estatecare_users');
        const usersData = storedUsers ? JSON.parse(storedUsers) : [];
        setUsers(usersData);
        
        const storedUserId = localStorage.getItem('currentUser');
        const activeUser = usersData.find((u: User) => u.id === storedUserId) || usersData[0] || null;
        setCurrentUser(activeUser || null);
        if (activeUser?.themeSettings) applyTheme(activeUser.themeSettings);
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        setUsers([]);
      }
      
      setLoading(false);
      isLoaded.current = true;
      return;
    }

    // If auth is enabled but no signed-in user yet, defer until auth is available
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const usersCollection = collection(db!, "users");
    unsubscribeRef.current = onSnapshot(usersCollection, (snapshot: any) => {
      const usersData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      
      const authUid = lastAuthUidRef.current;
      const authEmail = auth?.currentUser?.email?.toLowerCase?.() || null;
      const storedUserId = localStorage.getItem('currentUser');

      const byUid = authUid ? usersData.find((u: any) => u.id === authUid) : null;
      const byEmail = authEmail ? usersData.find((u: any) => (u.email || '').toLowerCase() === authEmail) : null;
      const byStored = storedUserId ? usersData.find((u: any) => u.id === storedUserId) : null;

      const activeUser = byUid || byEmail || byStored || usersData[0] || null;

      // Update current user if missing or changed
      if (!currentUser || (activeUser && currentUser.id !== activeUser.id)) {
        setCurrentUser(activeUser);
        if (activeUser) {
          try { localStorage.setItem('currentUser', activeUser.id); } catch {}
          applyTheme(activeUser.themeSettings);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Firestore Error", description: "Could not fetch users data.", variant: "destructive" });
      setLoading(false);
    });
  }, [toast, currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        try { unsubscribeRef.current(); } catch {}
        unsubscribeRef.current = null;
      }
      isLoaded.current = false;
    };
  }, []);

  const saveUser = async (user: Omit<User, 'id'> | User) => {
    if (!db) {
      // In Cloudflare D1 mode, persist via /api/d1 when authenticated.
      if (USE_D1 && getCurrentUser()) {
        try {
          if ('id' in user && user.id) {
            const { id, ...payload } = user as User;
            // Best-effort normalize email
            const nextPayload: any = { ...payload };
            if (typeof nextPayload.email === 'string') nextPayload.email = nextPayload.email.trim().toLowerCase();
            await D1Client.updateUser(id, nextPayload);
            // Refresh list
            const usersData = await D1Client.getUsers();
            setUsers(usersData || []);
            const authUid = lastAuthUidRef.current;
            const activeUser = (authUid ? (usersData || []).find((u: any) => u.id === authUid) : null) || (usersData || [])[0] || null;
            setCurrentUser(activeUser);
            toast({ title: 'Success', description: 'User updated successfully.' });
            return;
          }

          // Create/link by email: if user exists, update it; otherwise insert.
          const payload = user as Omit<User, 'id'>;
          const emailKey = String(payload.email || '').trim().toLowerCase();
          if (!emailKey) throw new Error('Email is required');
          const existing = await D1Client.getUserByEmail(emailKey).catch(() => null);
          if (existing && (existing as any).id) {
            await D1Client.updateUser((existing as any).id, { ...payload, email: emailKey });
            toast({ title: 'Linked', description: 'Existing user updated.' });
          } else {
            const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            await D1Client.createUser(id, {
              name: payload.name || 'User',
              email: emailKey,
              role: payload.role || 'Technician',
              assignedResidences: payload.assignedResidences || [],
              themeSettings: payload.themeSettings || { colorTheme: 'blue', mode: 'system' },
              createdAt: new Date().toISOString(),
              disabled: false,
            });
            toast({ title: 'Success', description: 'New user added.' });
          }

          const usersData = await D1Client.getUsers();
          setUsers(usersData || []);
          return;
        } catch (error) {
          console.error('Error saving user (D1):', error);
          const msg = (error as Error)?.message || backendErrorMessage;
          toast({ title: 'Error', description: msg, variant: 'destructive' });
          return;
        }
      }

      // Fallback: use localStorage when backend is not available
      try {
        const storedUsers = localStorage.getItem('estatecare_users');
        const usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        const findByEmail = (email: string) => usersData.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;

        if ('id' in user && user.id) {
          // Update existing user by id
          const { id, ...payload } = user as User;
          // Compute diffs for assignedResidences
          const prevLocal = usersData.find(u => u.id === id) as User | undefined;
          const prevAssigned = new Set(prevLocal?.assignedResidences || []);
          const nextAssigned = new Set(payload.assignedResidences || []);
          const added: string[] = []; const removed: string[] = [];
          nextAssigned.forEach(rid => { if (!prevAssigned.has(rid)) added.push(rid); });
          prevAssigned.forEach(rid => { if (!nextAssigned.has(rid)) removed.push(rid); });

          const updatedUsers = usersData.map((u) => u.id === id ? { ...u, ...payload, id } : u);
          localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
          setUsers(updatedUsers);

          // Sync into local residences: set managerId if empty when added; clear if user was manager and removed
          try {
            const storedResidences = localStorage.getItem('estatecare_residences');
            if (storedResidences) {
              const resData = JSON.parse(storedResidences) as Array<{ id: string; managerId?: string }>
              const updatedResidences = resData.map(r => {
                if (added.includes(r.id) && !r.managerId) return { ...r, managerId: id };
                if (removed.includes(r.id) && r.managerId === id) return { ...r, managerId: '' };
                return r;
              });
              localStorage.setItem('estatecare_residences', JSON.stringify(updatedResidences));
            }
          } catch (e) {
            console.warn('Local residences sync from user update failed:', e);
          }

          toast({ title: "Success", description: "User updated successfully (locally)." });
        } else {
          // Create or link by email
          const payload = user as Omit<User, 'id'>;
          const existing = findByEmail(payload.email);
          if (existing) {
            const updatedUsers = usersData.map(u => u.id === existing.id ? { ...existing, ...payload, id: existing.id } : u);
            localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            toast({ title: "Linked", description: "Existing user updated (locally)." });
          } else {
            const newUser: User = { ...payload, id: `user-${Date.now()}` } as User;
            const updatedUsers = [...usersData, newUser];
            localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            toast({ title: "Success", description: "New user added (locally)." });
          }
        }
      } catch (error) {
        console.error("Error saving to localStorage:", error);
        toast({ title: "Error", description: "Failed to save user locally.", variant: "destructive" });
      }
      return;
    }

    try {
      if ('id' in user && user.id) {
        // Update existing user document directly (users/{id})
        const { id, ...payload } = user as User;
        const userRef = doc(db!, 'users', id);
        // Compute diffs for assignedResidences to sync residences.managerId
        const prevUser = users.find(u => u.id === id) || null;
        const prevAssigned = new Set(prevUser?.assignedResidences || []);
        const nextAssigned = new Set(payload.assignedResidences || []);
        const added: string[] = [];
        const removed: string[] = [];
        nextAssigned.forEach(rid => { if (!prevAssigned.has(rid)) added.push(rid); });
        prevAssigned.forEach(rid => { if (!nextAssigned.has(rid)) removed.push(rid); });

        await updateDoc(userRef, { ...payload });

        // Two-way sync: when user gains a residence, set it as manager if empty; when loses and was manager, clear.
        try {
          for (const rid of added) {
            const resRef = doc(db!, 'residences', rid);
            const snap = await getDoc(resRef);
            if (snap.exists()) {
              const data = snap.data() as any;
              if (!data.managerId) {
                await updateDoc(resRef, { managerId: id });
              }
            }
          }
          for (const rid of removed) {
            const resRef = doc(db!, 'residences', rid);
            const snap = await getDoc(resRef);
            if (snap.exists()) {
              const data = snap.data() as any;
              if ((data.managerId || '') === id) {
                await updateDoc(resRef, { managerId: '' });
              }
            }
          }
        } catch (e) {
          console.warn('Residences sync from user update failed:', e);
        }

        toast({ title: "Success", description: "User updated successfully." });
      } else {
        // Create user via Admin API using Auth as source of truth.
        const payload = user as Omit<User, 'id'>;
        const emailKey = String(payload.email || '').trim().toLowerCase();
        if (!emailKey) throw new Error('Email is required');

        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) throw new Error('Not authenticated');

        const res = await fetch('/api/admin/users/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: payload.name,
            email: emailKey,
            role: payload.role,
            assignedResidences: payload.assignedResidences,
            themeSettings: payload.themeSettings,
          })
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to create user');
        }

        toast({ title: "Success", description: "User created and linked to Auth." });
      }
  } catch (error) {
      console.error('Error saving user:', error);
      const msg = (error as Error)?.message || 'Failed to save user.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!db) {
        // In D1 mode, we soft-disable instead of deleting.
        if (USE_D1 && getCurrentUser()) {
          try {
            await D1Client.updateUser(id, { disabled: true } as any);
            const usersData = await D1Client.getUsers();
            setUsers(usersData || []);
            toast({ title: 'Success', description: 'User disabled successfully.' });
            return;
          } catch (error) {
            console.error('Error disabling user (D1):', error);
            const msg = (error as Error)?.message || backendErrorMessage;
            toast({ title: 'Error', description: msg, variant: 'destructive' });
            return;
          }
        }

        // Use localStorage when backend is not available
        try {
            const storedUsers = localStorage.getItem('estatecare_users');
            const usersData = storedUsers ? JSON.parse(storedUsers) : [];
            const updatedUsers = usersData.filter((u: User) => u.id !== id);
            localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            toast({ title: "Success", description: "User deleted successfully (locally)." });
        } catch (error) {
            console.error("Error deleting from localStorage:", error);
            toast({ title: "Error", description: "Failed to delete user locally.", variant: "destructive" });
        }
        return;
    }
    try {
        await deleteDoc(doc(db!, "users", id));
        toast({ title: "Success", description: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
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


