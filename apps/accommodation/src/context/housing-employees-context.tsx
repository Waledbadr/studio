'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listDocuments, updateDocument } from '@/lib/db-api';
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
        const emps = await listDocuments<HousingEmployee>('housingEmployees', {
          orderBy: { field: 'createdAt', direction: 'DESC' },
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
      const now = new Date().toISOString();
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const payload: HousingEmployee = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };

      await updateDocument('housingEmployees', id, payload as any);
      setEmployees((prev) => [payload, ...prev]);
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
      const now = new Date().toISOString();

      await updateDocument('housingEmployees', id, {
        ...data,
        updatedAt: now,
      } as any);

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, ...data, updatedAt: now } : emp)),
      );
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
