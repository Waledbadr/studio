
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Globe, UserCircle, Sun, Moon, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useUsers } from '@/context/users-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useNotifications } from '@/context/notifications-context';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

export function AppHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  const { dict, toggleLanguage } = useLanguage();
  const { currentUser, users, switchUser } = useUsers();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };


  const handleProfileClick = () => {
    router.push('/users');
  };

  const handleNotificationClick = (notificationId: string, href: string) => {
    markAsRead(notificationId);
    router.push(href);
  };

  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6", className)} {...props}>
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Can add breadcrumbs here */}
      </div>
       <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
        {isMounted ? (theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />) : <Skeleton className="h-5 w-5" />}
        <span className="sr-only">Toggle theme</span>
      </Button>
       <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleLanguage}>
        <Globe className="h-5 w-5" />
        <span className="sr-only">{dict.changeLanguage}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                {isMounted && unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0">{unreadCount}</Badge>
                )}
                <span className="sr-only">{dict.notifications}</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
                <span>{dict.notifications}</span>
                {isMounted && unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Mark all as read</Button>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isMounted && notifications.length > 0 ? notifications.slice(0, 5).map(notification => (
                <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification.id, notification.href)} className={cn("flex flex-col items-start gap-1 whitespace-normal", !notification.isRead && "bg-accent")}>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}</p>
                </DropdownMenuItem>
            )) : <p className="p-2 text-sm text-muted-foreground text-center">No notifications</p>}
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
                <Skeleton className="h-full w-full rounded-full" />
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <>
              <DropdownMenuLabel>{isMounted ? dict.myAccount : <Skeleton className="h-4 w-20" />}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>{dict.profile}</DropdownMenuItem>
              <DropdownMenuItem>{dict.settings}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Switch User</DropdownMenuLabel>
              {isMounted && users ? users.map(user => (
                  <DropdownMenuItem key={user.id} onClick={() => switchUser(user)}>
                      {user.name} ({user.role})
                  </DropdownMenuItem>
              )) : <div className="px-2 py-1.5"><Skeleton className="h-4 w-full" /></div> }
              <DropdownMenuSeparator />
              <DropdownMenuItem>{dict.logout}</DropdownMenuItem>
            </>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
