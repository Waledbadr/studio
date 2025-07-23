
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, Unsubscribe, addDoc, updateDoc } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Technician";
  assignedResidences: string[];
}

interface UsersContextType {
  users: User[];
  loading: boolean;
  loadUsers: () => void;
  saveUser: (user: Omit<User, 'id'> | User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadUsers = useCallback(() => {
    if (isLoaded.current) return;
    if (!db) {
      console.error(firebaseErrorMessage);
      toast({ title: "Configuration Error", description: firebaseErrorMessage, variant: "destructive" });
      setLoading(false);
      return;
    }
    
    isLoaded.current = true;
    setLoading(true);

    const usersCollection = collection(db, "users");
    unsubscribeRef.current = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Firestore Error", description: "Could not fetch users data.", variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    loadUsers();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        isLoaded.current = false;
      }
    };
  }, [loadUsers]);

  const saveUser = async (user: Omit<User, 'id'> | User) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }

    try {
        if ('id' in user && user.id) {
            // Update existing user
            const userDocRef = doc(db, "users", user.id);
            await updateDoc(userDocRef, { ...user });
            toast({ title: "Success", description: "User updated successfully." });
        } else {
            // Add new user
            const { id, ...newUser } = user as User;
            await addDoc(collection(db, "users"), newUser);
            toast({ title: "Success", description: "New user added." });
        }
    } catch (error) {
        console.error("Error saving user:", error);
        toast({ title: "Error", description: "Failed to save user.", variant: "destructive" });
    }
  };

  const deleteUser = async (id: string) => {
    if (!db) {
        toast({ title: "Error", description: firebaseErrorMessage, variant: "destructive" });
        return;
    }
    try {
        await deleteDoc(doc(db, "users", id));
        toast({ title: "Success", description: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };


  return (
    <UsersContext.Provider value={{ users, loading, loadUsers, saveUser, deleteUser }}>
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
