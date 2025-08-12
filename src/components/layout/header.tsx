'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Sun, Moon, Check, Monitor, Palette, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useUsers } from '@/context/users-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/context/notifications-context';
import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';

const FeedbackWidget = dynamic(() => import('@/components/feedback/feedback-widget'), { ssr: false });

export function AppHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  const { currentUser } = useUsers();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { mode, setMode, resolvedMode } = useTheme();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeSettingsClick = () => {
    router.push('/setup#themes');
  };

  const handleProfileClick = () => {
    router.push('/users');
  };

  const handleNotificationClick = (notificationId: string, href: string) => {
    markAsRead(notificationId);
    router.push(href);
  };

  const handleLogout = async () => {
    if (!auth) { router.push('/login'); return; }
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6", className)} {...props}>
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
  {/* Feedback trigger in header */}
  <FeedbackWidget />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            {resolvedMode === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Theme settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMode('light')}>
            <Sun className="mr-2 h-4 w-4" />
            Light
            {mode === 'light' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
            {mode === 'dark' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            System
            {mode === 'system' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleThemeSettingsClick}>
            <Palette className="mr-2 h-4 w-4" />
            Color Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                {isMounted && unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0">{unreadCount}</Badge>
                )}
                <span className="sr-only">Notifications</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {isMounted && unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Mark all as read</Button>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isMounted && notifications.length > 0 ? notifications.slice(0, 5).map(notification => (
                <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification.id, notification.href)} className={cn("flex flex-col items-start gap-1 whitespace-normal", !notification.isRead && "bg-accent")}>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}</p>
                </DropdownMenuItem>
            )) : <DropdownMenuItem disabled><p className="p-2 text-sm text-muted-foreground text-center">No notifications</p></DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              {isMounted && currentUser ? (
                <>
                  <AvatarImage src={`https://placehold.co/100x100.png`} alt={currentUser.name} data-ai-hint="profile picture" />
                  <AvatarFallback>{currentUser.name?.charAt(0) || 'U'}</AvatarFallback>
                </>
              ) : (
                 <AvatarFallback /> 
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>{isMounted && currentUser ? currentUser.name : 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
