
'use client';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Building, Home, Wrench, Bot, Settings, Users, ClipboardList, ChevronsUpDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUsers } from '@/context/users-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, users, switchUser, loading } = useUsers();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/residences', label: 'Residences', icon: Building },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/inventory', label: 'Inventory', icon: ClipboardList },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/tools', label: 'AI Tools', icon: Bot },
    { href: '/setup', label: 'Setup', icon: Settings },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Building className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">EstateCare</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2">
                         <div className="flex items-center gap-2">
                             <Avatar className="size-8">
                                <AvatarImage src="https://placehold.co/100x100.png" alt={currentUser?.name} data-ai-hint="profile picture" />
                                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="group-data-[collapsible=icon]:hidden text-left">
                                <p className="font-semibold text-sm">{loading ? 'Loading...' : currentUser?.name}</p>
                                <p className="text-xs text-muted-foreground">{loading ? '' : currentUser?.role}</p>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                         </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--sidebar-width)] mb-2" side="top" align="start">
                    {users.map(user => (
                        <DropdownMenuItem key={user.id} onClick={() => switchUser(user)}>
                            {user.name} ({user.role})
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </SidebarFooter>
    </>
  );
}

    