"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export function AuthGate({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  console.log('AuthGate: Rendering - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('AuthGate: useEffect triggered, calling checkAuth');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AuthGate: Starting auth check...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      console.log('AuthGate: Response status:', response.status);
      if (response.ok) {
        const user = await response.json();
        console.log('AuthGate: User data:', user);
        setIsAuthenticated(!!user);
      } else {
        console.log('AuthGate: Response not ok, user not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('AuthGate: Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('AuthGate: Auth check completed');
    }
  };

  useEffect(() => {
    if (isAuthenticated === false) {
      // إعادة توجيه لصفحة تسجيل الدخول
      console.log('AuthGate: Redirecting to login...');
      router.push('/login');
    } else if (isAuthenticated === true) {
      console.log('AuthGate: User is authenticated, showing content');
    }
  }, [isAuthenticated, router]);

  // عرض شاشة التحميل أثناء فحص المصادقة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن مصادق، لا نعرض شيئاً (سيتم إعادة التوجيه)
  if (isAuthenticated === false) {
    return null;
  }

  // إذا كان مصادق، عرض المحتوى
  return <>{children}</>;
}
