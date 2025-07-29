
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useUsers } from '@/context/users-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function AppHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  const { currentUser } = useUsers();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleProfileClick = () => {
    router.push('/users');
  };

  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6", className)} {...props}>
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Can add breadcrumbs here */}
      </div>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              {isClient ? (
                <>
                  <AvatarImage src={`https://placehold.co/100x100.png`} alt={currentUser?.name || ''} data-ai-hint="profile picture" />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleProfileClick}>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
