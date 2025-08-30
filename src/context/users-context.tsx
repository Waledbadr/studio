'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface User {
  id?: string;
  name: string;
  nameEn?: string;
  email: string;
  phone?: string;
  role: string;
  assignedResidences: string[];
  themeSettings?: {
    colorTheme: string;
    mode: string;
  };
}

const mockUsers: User[] = [];

interface SimpleUsersContextType {
  users: User[];
  currentUser: User;
  loading: boolean;
  loadUsers: () => void;
  switchUser: (user: User) => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  saveUser: (user: User) => Promise<void>;
  getUserById: (id: string) => User | null;
}

const UsersContext = createContext<SimpleUsersContextType | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const defaultCurrentUser: User = {
    id: 'temp-current',
    name: 'Current User',
    email: 'current@example.com',
    role: 'Admin',
    assignedResidences: [],
    themeSettings: { colorTheme: 'blue', mode: 'system' }
  };
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User>(defaultCurrentUser);
  const [loading, setLoading] = useState(false);

  // Helpers to map role between UI (Admin/Supervisor/Technician) and DB (admin/manager/maintenance)
  const toUiRole = (role: string): 'Admin' | 'Supervisor' | 'Technician' => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'manager') return 'Supervisor';
    if (r === 'maintenance' || r === 'technician' || r === 'tech') return 'Technician';
    return 'Technician';
  };
  const toDbRole = (role: string): 'admin' | 'manager' | 'maintenance' | 'user' => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'supervisor' || r === 'manager') return 'manager';
    if (r === 'technician' || r === 'tech' || r === 'maintenance') return 'maintenance';
    return 'user';
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load users');
      const data: any[] = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: toUiRole(u.role),
        assignedResidences: Array.isArray(u.assigned_residences) ? u.assigned_residences : [],
        themeSettings: u.theme_settings || { colorTheme: 'blue', mode: 'system' },
      } as User));
      setUsers(normalized);
      if (normalized[0]) setCurrentUser(normalized[0]);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const switchUser = (user: any) => {
    setCurrentUser(user);
  };

  const addUser = async (user: any) => {
    // POST /api/users
    const payload = {
      name: user.name,
      email: user.email,
      role: toDbRole(user.role),
      phone: user.phone ?? undefined,
      avatar_url: user.avatar_url ?? undefined,
      is_active: user.is_active !== false,
      // assignedResidences/themeSettings are UI-only for now
    };
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add user');
    await loadUsers();
  };

  const updateUser = async (userId: string, updates: any) => {
    const payload: any = { ...updates };
    if (typeof updates.role !== 'undefined') payload.role = toDbRole(updates.role);
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update user');
    await loadUsers();
  };

  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
    await loadUsers();
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id) || null;
  };

  const saveUser = async (user: any) => {
    if (user.id) {
      await updateUser(user.id, user);
    } else {
      await addUser(user);
    }
  };

  return (
    <UsersContext.Provider value={{
      users,
      currentUser,
      loading,
      loadUsers,
      switchUser,
      addUser,
      updateUser,
      deleteUser,
      saveUser,
      getUserById
    }}>
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

console.log('🔧 Simple users context loaded');
