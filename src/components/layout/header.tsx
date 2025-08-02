
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Globe, UserCircle, Sun, Moon, Check, Monitor, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useUsers } from '@/context/users-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useNotifications } from '@/context/notifications-context';
import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

export function AppHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  const { dict, toggleLanguage } = useLanguage();
  const { currentUser, users, switchUser } = useUsers();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { mode, setMode, resolvedMode, isLoaded } = useTheme();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const handleThemeSettingsClick = () => {
    router.push('/setup#themes');
  };

  const quickToggleMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            {resolvedMode === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Theme settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>إعدادات الثيم</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMode('light')}>
            <Sun className="mr-2 h-4 w-4" />
            الوضع الفاتح
            {mode === 'light' && <Check className="mr-2 h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            الوضع الداكن
            {mode === 'dark' && <Check className="mr-2 h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            حسب النظام
            {mode === 'system' && <Check className="mr-2 h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleThemeSettingsClick}>
            <Palette className="mr-2 h-4 w-4" />
            إعدادات الألوان
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
            <DropdownMenuLabel>{isMounted && currentUser ? currentUser.name : dict.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>{dict.profile}</DropdownMenuItem>
            <DropdownMenuItem>{dict.settings}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch User</DropdownMenuLabel>
            {isMounted && users ? users.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => switchUser(user)}>
                    {user.name} ({user.role})
                </DropdownMenuItem>
            )) : <DropdownMenuItem disabled>{dict.loading}</DropdownMenuItem> }
            <DropdownMenuSeparator />
            <DropdownMenuItem>{dict.logout}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
