'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Sun, Moon, Check, Monitor, Palette, LogOut, Package, CheckCircle2, ArrowLeftRight, MessageSquare, Info, PackageCheck, BellRing } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useUsers } from '@/context/users-context';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const atAccommodation = pathname?.startsWith('/accommodation');

  const toggleApp = () => {
    if (atAccommodation) router.push('/');
    else router.push('/accommodation');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeSettingsClick = () => {
    router.push('/setup#themes');
  };

  const handleProfileClick = () => {
  router.push('/profile');
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

  const { locale, toggleLanguage } = useLanguage();
  const { dict } = useLanguage();

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

  const headerClass = cn(
    // Glassmorphism header
    'sticky top-0 z-20 flex h-16 items-center gap-4 border-b px-4 sm:px-6',
    'bg-white/60 dark:bg-white/10 backdrop-blur-xl border-white/30 dark:border-white/10',
    className,
  );

  return (
    <header className={headerClass} {...props}>
      <SidebarTrigger className="md:hidden" />
      <button
        onClick={toggleApp}
        className="ml-3 inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted"
        title={atAccommodation ? `الرجوع لتطبيق ${dict.ui.materialsApp}` : `فتح ${dict.ui.accommodationApp}`}
      >
        {atAccommodation ? dict.ui.materialsApp : dict.ui.accommodationApp}
      </button>

      <div className="flex-1" />
  {/* Feedback trigger in header */}
  <FeedbackWidget />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            {resolvedMode === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">{dict.ui.theme}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{dict.ui.theme}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMode('light')}>
            <Sun className="mr-2 h-4 w-4" />
            {dict.ui.light}
            {mode === 'light' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            {dict.ui.dark}
            {mode === 'dark' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            {dict.ui.system}
            {mode === 'system' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleThemeSettingsClick}>
            <Palette className="mr-2 h-4 w-4" />
            {dict.ui.colorSettings}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language switch */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeftRight className="h-5 w-5" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{dict.changeLanguage}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { if (locale !== 'en') toggleLanguage(); }}>
            English {locale === 'en' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { if (locale !== 'ar') toggleLanguage(); }}>
            العربية {locale === 'ar' && <Check className="ml-auto h-4 w-4" />}
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
                <span className="font-semibold">{dict.notifications}</span>
                {isMounted && unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>{dict.viewAll}</Button>}
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
                <p className="p-2 text-sm text-muted-foreground text-center w-full">{dict.notifications}</p>
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
                  <AvatarImage src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'%3EIMG%3C/text%3E%3C/svg%3E`} alt={currentUser.name} data-ai-hint="profile picture" />
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
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> {dict.logout}
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
