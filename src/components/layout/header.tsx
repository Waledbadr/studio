'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Sun, Moon, Check, Monitor, Palette, LogOut, Package, CheckCircle2, ArrowLeftRight, MessageSquare, Info, PackageCheck, BellRing } from 'lucide-react';
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

  // Visual mapping for notification types
  const getNotificationMeta = (type: string) => {
    switch (type) {
      case 'new_order':
        return { Icon: Package, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/60', ring: 'ring-blue-200 dark:ring-blue-900/50' };
      case 'order_approved':
        return { Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/60', ring: 'ring-emerald-200 dark:ring-emerald-900/50' };
      case 'transfer_request':
        return { Icon: ArrowLeftRight, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/60', ring: 'ring-amber-200 dark:ring-amber-900/50' };
      case 'feedback_update':
        return { Icon: MessageSquare, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/60', ring: 'ring-purple-200 dark:ring-purple-900/50' };
      case 'mrv_request':
        return { Icon: PackageCheck, color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/60', ring: 'ring-cyan-200 dark:ring-cyan-900/50' };
      case 'generic':
      default:
        return { Icon: BellRing, color: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/70', ring: 'ring-slate-200 dark:ring-slate-800' };
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
        <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
                <span className="font-semibold">Notifications</span>
                {isMounted && unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Mark all as read</Button>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isMounted && notifications.length > 0 ? notifications.slice(0, 8).map(notification => {
                const meta = getNotificationMeta(notification.type);
                const { Icon } = meta;
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    onSelect={() => handleNotificationClick(notification.id, notification.href)}
                    className={cn(
                      'flex items-start gap-3 whitespace-normal py-3',
                      'focus:bg-accent/60',
                      !notification.isRead ? 'bg-accent/40' : ''
                    )}
                  >
                    <div className={cn('mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ring-1', meta.color, meta.ring)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug truncate">{notification.title}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    </div>
                    {!notification.isRead && <span className="ml-1 mt-1 inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />}
                  </DropdownMenuItem>
                );
            }) : (
              <DropdownMenuItem disabled>
                <p className="p-2 text-sm text-muted-foreground text-center w-full">No notifications</p>
              </DropdownMenuItem>
            )}
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
