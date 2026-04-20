'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

const mockUsers = [
  {
    id: 'user-1',
    name: 'أحمد محمد',
    nameEn: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    role: 'Admin',
    themeSettings: {
      colorTheme: 'blue',
      mode: 'dark'
    }
  }
];

interface SimpleUsersContextType {
  users: any[];
  currentUser: any;
  loading: boolean;
  loadUsers: () => void;
  switchUser: (user: any) => void;
  addUser: (user: any) => Promise<void>;
  updateUser: (userId: string, updates: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (id: string) => any;
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
