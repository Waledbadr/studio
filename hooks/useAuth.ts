/**
 * Hook مخصص لإدارة المصادقة
 */

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'user' | 'maintenance';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthToken {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (requiredRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تسجيل الدخول
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تسجيل الدخول');
      }

  const result = await response.json();
  const authData: Partial<AuthToken> & { user?: any } = result.data ?? { token: result.token, user: result.user };
  if (!authData?.user) throw new Error('استجابة غير متوقعة من الخادم');

  setUser(authData.user);
  // token may be missing when server uses HttpOnly cookie; handle gracefully
  const tok = authData.token ?? null;
  setToken(tok);
  // Persist only when available
  if (tok) localStorage.setItem('auth_token', tok); else localStorage.removeItem('auth_token');
  localStorage.setItem('user_data', JSON.stringify(authData.user));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تسجيل الدخول');
      console.error('خطأ في تسجيل الدخول:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // تسجيل الخروج
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      } else {
        // still attempt cookie-based logout
        await fetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.error('خطأ في تسجيل الخروج:', err);
    } finally {
      // مسح البيانات المحلية
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }, [token]);

  // التحقق من صحة التوكن
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('user_data');

      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      // Verify session with server; prefer cookie-based /api/auth/me (works on Next and Cloudflare)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch('/api/auth/me', { headers });

      if (response.ok) {
        const result = await response.json();
        const usr = result?.data?.user ?? result?.user;
        if (usr) {
          setUser(usr);
        } else {
          throw new Error('Invalid auth verify response');
        }
        setToken(storedToken);
      } else {
        // التوكن غير صالح، مسح البيانات
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    } catch (err) {
      console.error('خطأ في التحقق من المصادقة:', err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setLoading(false);
    }
  }, []);

  // التحقق من الدور
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  // التحقق من الصلاحيات
  const hasPermission = useCallback((requiredRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'maintenance': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }, [user]);

  // التحميل الأولي للمصادقة
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user && !!token,
    hasRole,
    hasPermission,
  };
}

// Hook للحصول على المستخدم الحالي
export function useCurrentUser() {
  const { user, loading, error } = useAuth();
  return { user, loading, error };
}

// Hook للتحقق من الصلاحيات
export function usePermissions() {
  const { user, hasRole, hasPermission } = useAuth();
  
  return {
    isAdmin: hasRole('admin'),
    isManager: hasPermission('manager'),
    isMaintenance: hasRole('maintenance'),
    isUser: hasRole('user'),
    hasRole,
    hasPermission,
    userRole: user?.role,
  };
}

// Hook لتتطلب المصادقة
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, loading, redirectTo]);

  return { isAuthenticated, loading };
}

// Hook لتطلب صلاحية معينة
export function useRequirePermission(requiredRole: string, redirectTo: string = '/unauthorized') {
  const { hasPermission, loading, isAuthenticated } = useAuth();
  const hasRequiredPermission = hasPermission(requiredRole);
  
  useEffect(() => {
    if (!loading && isAuthenticated && !hasRequiredPermission) {
      window.location.href = redirectTo;
    }
  }, [hasRequiredPermission, loading, isAuthenticated, redirectTo]);

  return { hasPermission: hasRequiredPermission, loading };
}

// مكون AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();
  // File is .ts (not .tsx), avoid JSX by using createElement
  return React.createElement(
    AuthContext.Provider as any,
    { value: auth, children }
  );
}

// Hook للتحقق من حالة تسجيل الدخول مع إعادة المحاولة
export function useAuthWithRetry(maxRetries: number = 3) {
  const auth = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  const retryAuth = useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      await auth.checkAuth();
    }
  }, [auth, retryCount, maxRetries]);

  return {
    ...auth,
    retryAuth,
    canRetry: retryCount < maxRetries,
    retryCount,
  };
}
