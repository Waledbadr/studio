'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';

export interface HousingEmployee {
  id: string; // Firestore document ID
  employeeId: string; // Internal ID or Badge ID
  name: string;
  nameAr: string;
  profession: string;
  professionAr: string;
  dailyHours: number;
  monthlySalary: number;
  status: 'Active' | 'On Leave' | 'Transferred' | 'Inactive';
  residenceStatus: 'Inside' | 'Outside';
  residenceLocation?: string;
  createdAt: any;
  updatedAt: any;
}

interface HousingEmployeesContextType {
  employees: HousingEmployee[];
  loading: boolean;
  addEmployee: (data: Omit<HousingEmployee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<HousingEmployee>) => Promise<void>;
}

const HousingEmployeesContext = createContext<HousingEmployeesContextType | undefined>(undefined);

export function HousingEmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<HousingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUsers();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return; // Wait for authentication

    const fetchEmployees = async () => {
      try {
        const employeesRef = collection(db as any, 'housingEmployees');
        const q = query(employeesRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        const emps: HousingEmployee[] = [];
        snapshot.forEach((doc) => {
          emps.push({ id: doc.id, ...doc.data() } as HousingEmployee);
        });
        setEmployees(emps);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching housing employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employees data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentUser, toast]);

  const addEmployee = async (data: Omit<HousingEmployee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const employeesRef = collection(db, 'housingEmployees');
      await addDoc(employeesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Success',
        description: 'Employee added successfully.',
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to add employee.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, data: Partial<HousingEmployee>) => {
    try {
      const empRef = doc(db, 'housingEmployees', id);
      await updateDoc(empRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Success',
        description: 'Employee updated successfully.',
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <HousingEmployeesContext.Provider
      value={{
        employees,
        loading,
        addEmployee,
        updateEmployee,
      }}
    >
      {children}
    </HousingEmployeesContext.Provider>
  );
}

export function useHousingEmployees() {
  const context = useContext(HousingEmployeesContext);
  if (context === undefined) {
    throw new Error('useHousingEmployees must be used within a HousingEmployeesProvider');
  }
  return context;
}
