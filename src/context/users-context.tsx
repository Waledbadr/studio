'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc, getDocs, getDoc, query, where, limit, runTransaction, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

export interface UserThemeSettings {
  colorTheme: string; // theme ID (blue, emerald, purple, etc.)
  mode: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Technician";
  assignedResidences: string[];
  themeSettings?: UserThemeSettings;
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

  // Track Firebase Auth state to prefer the signed-in UID and trigger loading
  useEffect(() => {
    if (!auth) return; // local mode
    const unsub = onAuthStateChanged(auth, (u) => {
      lastAuthUidRef.current = u?.uid || null;
      if (!u) {
        // Signed out
        setCurrentUser(null);
        try { localStorage.removeItem('currentUser'); } catch {}
      } else if (!isLoaded.current) {
        // First time we see a signed-in user, load users
        loadUsers();
      }
    });
    return () => unsub();
  }, []);

  const loadUsers = useCallback(() => {
    if (isLoaded.current) return;
    
    if (!db) {
      console.log("Firebase not configured, using local storage");
      
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

    // If Firebase is configured but no signed-in user yet, defer until auth is available
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const usersCollection = collection(db!, "users");
    unsubscribeRef.current = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      
      const authUid = lastAuthUidRef.current;
      const authEmail = auth?.currentUser?.email?.toLowerCase?.() || null;
      const storedUserId = localStorage.getItem('currentUser');

      const byUid = authUid ? usersData.find(u => u.id === authUid) : null;
      const byEmail = authEmail ? usersData.find(u => (u.email || '').toLowerCase() === authEmail) : null;
      const byStored = storedUserId ? usersData.find(u => u.id === storedUserId) : null;

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

  // Initialize users list depending on environment/auth
  useEffect(() => {
    if (!auth) {
      // local-only mode
      loadUsers();
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          isLoaded.current = false;
        }
      };
    }

    // If already signed in at load time
    if (auth.currentUser && !isLoaded.current) {
      loadUsers();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        isLoaded.current = false;
      }
    };
  }, [loadUsers]);

  const saveUser = async (user: Omit<User, 'id'> | User) => {
    if (!db) {
      // Use localStorage when Firebase is not available
      try {
        const storedUsers = localStorage.getItem('estatecare_users');
        const usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        const findByEmail = (email: string) => usersData.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;

        if ('id' in user && user.id) {
          // Update existing user by id
          const { id, ...payload } = user as User;
          const updatedUsers = usersData.map((u) => u.id === id ? { ...u, ...payload, id } : u);
          localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
          setUsers(updatedUsers);
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
        // Update existing user with unique email enforcement (including email change)
        const { id, ...payload } = user as User;
        const userRef = doc(db!, 'users', id);
        const emailKeyNew = String(payload.email || '').trim().toLowerCase();
        if (!emailKeyNew) throw new Error('Email is required');

        await runTransaction(db!, async (trx) => {
          const snap = await trx.get(userRef);
          if (!snap.exists()) throw new Error('User not found');
          const prevEmail = String((snap.data() as any).email || '').trim().toLowerCase();

          if (prevEmail !== emailKeyNew) {
            const newMapRef = doc(db!, 'unique_users_emails', emailKeyNew);
            const newMapSnap = await trx.get(newMapRef);
            if (newMapSnap.exists() && (newMapSnap.data() as any).userId !== id) {
              throw new Error('Email already in use by another user.');
            }
            // Remove old mapping if present
            if (prevEmail) {
              const oldMapRef = doc(db!, 'unique_users_emails', prevEmail);
              const oldMapSnap = await trx.get(oldMapRef);
              if (oldMapSnap.exists() && (oldMapSnap.data() as any).userId === id) {
                trx.delete(oldMapRef);
              }
            }
            // Set new mapping
            trx.set(newMapRef, { userId: id, updatedAt: Timestamp.now() });
          }
          trx.update(userRef, { ...payload });
        });

        toast({ title: "Success", description: "User updated successfully." });
      } else {
        // Create new user with unique email enforcement via mapping doc
        const payload = user as Omit<User, 'id'>;
        const emailKey = String(payload.email || '').trim().toLowerCase();
        if (!emailKey) throw new Error('Email is required');

        await runTransaction(db!, async (trx) => {
          const mapRef = doc(db!, 'unique_users_emails', emailKey);
          const mapSnap = await trx.get(mapRef);

          if (mapSnap.exists()) {
            // Link to existing user by email
            const existingUserId = (mapSnap.data() as any).userId;
            const existingUserRef = doc(db!, 'users', existingUserId);
            const existingUserSnap = await trx.get(existingUserRef);
            if (existingUserSnap.exists()) {
              trx.update(existingUserRef, { ...payload });
            } else {
              // Mapping stale: create the user now with mapped id
              trx.set(existingUserRef, { ...payload, id: existingUserId });
            }
          } else {
            // Create new user, prefer auth UID if matching email
            const currentAuth = auth?.currentUser || null;
            const preferUid = currentAuth && currentAuth.email && currentAuth.email.toLowerCase() === emailKey ? currentAuth.uid : null;
            const newUserRef = preferUid ? doc(db!, 'users', preferUid) : doc(collection(db!, 'users'));
            trx.set(newUserRef, { ...payload, id: newUserRef.id });
            trx.set(mapRef, { userId: newUserRef.id, createdAt: Timestamp.now() });
          }
        });

        toast({ title: "Success", description: "User saved." });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const msg = (error as Error)?.message || 'Failed to save user.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!db) {
        // Use localStorage when Firebase is not available
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
    return users.find(user => user.id === id) || null;
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


