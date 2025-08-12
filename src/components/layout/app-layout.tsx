'use client';

import type { PropsWithChildren } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { AppHeader } from './header';
import RequireAuth from '@/components/auth/require-auth';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useUsers } from '@/context/users-context';
import { enablePushIfGranted } from '@/lib/messaging';

const FeedbackWidget = dynamic(() => import('@/components/feedback/feedback-widget'), { ssr: false });

export function AppLayout({ children }: PropsWithChildren) {
  const { currentUser } = useUsers();

  useEffect(() => {
    enablePushIfGranted(currentUser?.id);
  }, [currentUser?.id]);
  const pathname = usePathname();

  // Render bare page for login route (no sidebar/header/guard)
  if (pathname === '/login') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        {children}
      </main>
    );
  }

  return (
    <RequireAuth>
      <SidebarProvider defaultOpen>
        <Sidebar className="no-print">
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <AppHeader className="no-print" />
           <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
             {children}
           </main>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  );
}
