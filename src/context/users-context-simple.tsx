'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id?: string;
  name: string;
  nameEn?: string;
  email: string;
  role: string;
  assignedResidences: string[];
  themeSettings?: {
    colorTheme: string;
    mode: string;
  };
}

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'أحمد محمد',
    nameEn: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    role: 'Admin',
    assignedResidences: ['res-1'],
    themeSettings: {
      colorTheme: 'blue',
      mode: 'dark'
    }
  }
];

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
  const [users, setUsers] = useState(mockUsers);
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [loading, setLoading] = useState(false);

  const loadUsers = () => {
    console.log('Mock: Loading users');
  };

  const switchUser = (user: any) => {
    console.log('Mock: Switching user', user);
    setCurrentUser(user);
  };

  const addUser = async (user: any) => {
    console.log('Mock: Adding user', user);
  };

  const updateUser = async (userId: string, updates: any) => {
    console.log('Mock: Updating user', userId, updates);
  };

  const deleteUser = async (userId: string) => {
    console.log('Mock: Deleting user', userId);
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id) || null;
  };

  const saveUser = async (user: any) => {
    console.log('Mock: Saving user', user);
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
