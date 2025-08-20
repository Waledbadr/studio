'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, Unsubscribe, addDoc, updateDoc, Timestamp, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';


export interface MaintenanceRequest {
  id: string;
  date: Timestamp;
  requestedById: string;
  
  complexId: string;
  complexName: string;
  buildingId: string;
  buildingName: string;
  roomId: string;
  roomName: string;

  issueTitle: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
}

export type NewRequestPayload = Omit<MaintenanceRequest, 'id' | 'date' | 'status'>;

interface MaintenanceContextType {
  requests: MaintenanceRequest[];
  loading: boolean;
  loadRequests: () => void;
  createRequest: (payload: NewRequestPayload) => Promise<string | null>;
  updateRequestStatus: (id: string, status: MaintenanceStatus) => Promise<void>;
  getRequestById: (id: string) => Promise<MaintenanceRequest | null>;
  deleteRequest: (id: string) => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";
const LS_KEY = 'estatecare_maintenance_requests';

// Helpers for localStorage fallback
const loadFromLocalStorage = (): MaintenanceRequest[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    // Ensure Timestamp shape
    return parsed.map((r) => ({
      ...r,
      date: r.date?.seconds ? new Timestamp(r.date.seconds, r.date.nanoseconds || 0) : Timestamp.now(),
    })) as MaintenanceRequest[];
  } catch (e) {
    console.error('Failed to parse local maintenance data', e);
    return [];
  }
};

const saveToLocalStorage = (requests: MaintenanceRequest[]) => {
  try {
    const serializable = requests.map((r) => ({
      ...r,
      // Firestore Timestamp can't be stringified directly; store as seconds/nanos
      date: { seconds: r.date.seconds, nanoseconds: r.date.nanoseconds },
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error('Failed to save maintenance data locally', e);
  }
};

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isLoaded = useRef(false);

  const loadRequests = useCallback(() => {
    if (isLoaded.current) return;

    if (!db) {
      // Local fallback
      const localData = loadFromLocalStorage();
      setRequests(localData);
      setLoading(false);
      isLoaded.current = true;
      return;
    }
    
    // Defer until user is signed in to satisfy security rules
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }

    isLoaded.current = true;
    setLoading(true);

    const requestsCollection = collection(db, "maintenanceRequests");
    unsubscribeRef.current = onSnapshot(requestsCollection, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
      requestsData.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching maintenance requests:", error);
      toast({ title: "Firestore Error", description: "Could not fetch maintenance requests data.", variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    // Automatically load requests when the provider mounts
    loadRequests();
    // and when auth changes to signed-in
    let unsubAuth: (() => void) | undefined;
    if (auth) {
      unsubAuth = onAuthStateChanged(auth, (u) => {
        if (u) {
          if (!isLoaded.current) loadRequests();
        } else {
          if (unsubscribeRef.current) {
            try { unsubscribeRef.current(); } catch {}
            unsubscribeRef.current = null;
          }
          isLoaded.current = false;
          setRequests([]);
          setLoading(false);
        }
      });
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        isLoaded.current = false;
      }
      unsubAuth?.();
    };
  }, [loadRequests]);

  const generateNewRequestId = async (): Promise<string> => {
    if (!db) {
      // Local ID pattern when offline
      const now = new Date();
      return `REQ-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    }
    const now = new Date();
    const prefix = `REQ-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-`;
    
    const requestsQuery = query(collection(db, "maintenanceRequests"), where("id", ">=", prefix));
    const querySnapshot = await getDocs(requestsQuery);
    
    let maxNum = 0;
    querySnapshot.forEach(doc => {
        const docId = doc.id;
        if (docId.startsWith(prefix)) {
            const numPart = parseInt(docId.substring(prefix.length), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    });

    const nextRequestNumber = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${nextRequestNumber}`;
  };

  const createRequest = async (payload: NewRequestPayload): Promise<string | null> => {
    if (!db) {
      // Local fallback create
      const newId = await generateNewRequestId();
      const newReq: MaintenanceRequest = {
        ...payload,
        id: newId,
        date: Timestamp.now(),
        status: 'Pending',
      };
      const updated = [newReq, ...requests];
      setRequests(updated);
      saveToLocalStorage(updated);
      return newId;
    }
    setLoading(true);
    try {
      const newId = await generateNewRequestId();
      const newRequestRef = doc(db, "maintenanceRequests", newId);
      
      const newRequest: Omit<MaintenanceRequest, 'id'> = {
          ...payload,
          date: Timestamp.now(),
          status: 'Pending'
      };
      
      await setDoc(newRequestRef, newRequest);
      return newId;

    } catch (error) {
      console.error("Error creating maintenance request:", error);
      toast({ title: "Error", description: "Failed to create maintenance request.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateRequestStatus = async (id: string, status: MaintenanceStatus) => {
      if (!db) {
        // Local fallback update
        const updated = requests.map(r => r.id === id ? { ...r, status } : r);
        setRequests(updated);
        saveToLocalStorage(updated);
        toast({ title: "Success", description: `Request status updated to ${status}.` });
        return;
      }
      try {
          const requestDocRef = doc(db, "maintenanceRequests", id);
          await updateDoc(requestDocRef, { status });
          toast({ title: "Success", description: `Request status updated to ${status}.` });
      } catch (error) {
          console.error("Error updating request status:", error);
          toast({ title: "Error", description: "Failed to update request status.", variant: "destructive" });
      }
  };

  const getRequestById = async (id: string): Promise<MaintenanceRequest | null> => {
    if (!db) {
      const found = requests.find(r => r.id === id) || null;
      return found;
    }
    // Could be implemented if needed with getDoc
    return null;
  };

  const deleteRequest = async (id: string) => {
    if (!db) {
        const updated = requests.filter(r => r.id !== id);
        setRequests(updated);
        saveToLocalStorage(updated);
        toast({ title: "Success", description: "Maintenance request deleted (local)." });
        return;
    }
    try {
        await deleteDoc(doc(db, "maintenanceRequests", id));
        toast({ title: "Success", description: "Maintenance request deleted." });
    } catch (error) {
        console.error("Error deleting request:", error);
        toast({ title: "Error", description: "Failed to delete request.", variant: "destructive" });
    }
  };

  return (
    <MaintenanceContext.Provider value={{ requests, loading, loadRequests, createRequest, updateRequestStatus, getRequestById, deleteRequest }}>
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
