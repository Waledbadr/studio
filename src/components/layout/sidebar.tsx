'use client';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Building, Home, Wrench, Settings, Users, ClipboardList, Move, ListOrdered, ClipboardMinus, AreaChart, History, PackageCheck, TrendingUp, AlertTriangle, FileCheck, Boxes, ArrowUpDown, Package2, GitBranch, Clock, LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUsers } from '@/context/users-context';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { getFormattedGitInfo } from '@/lib/git-info';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, loading } = useUsers();
  const [isMounted, setIsMounted] = useState(false);
  const [gitInfo, setGitInfo] = useState<ReturnType<typeof getFormattedGitInfo> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setGitInfo(getFormattedGitInfo());
  }, []);

  // Prevent hydration mismatches by rendering only after mount
  if (!isMounted) {
    return null;
  }

  // Define menu item types
  interface MenuItem {
    href: string;
    label: string;
    icon: any;
    exact?: boolean;
    abbreviation?: string;
  }

  interface MenuSection {
    title: string;
    items: MenuItem[];
    subItems?: MenuItem[];
  }

  // Menu structure with groupings
  const menuStructure: MenuSection[] = [
    // Main Section
    {
      title: 'Main',
      items: [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/maintenance', label: 'Maintenance', icon: Wrench },
      ]
    },
    // Stock Management Section
    {
      title: 'Stock Management',
      items: [
        { href: '/inventory', label: 'Inventory', icon: ClipboardList, exact: true },
        { href: '/inventory/inventory-audit', label: 'Stock Reconciliation', icon: FileCheck },
        { href: '/inventory/depreciation', label: 'Depreciation', icon: AlertTriangle },
        { href: '/inventory/transfer', label: 'Stock Transfer', icon: Move },
      ]
    },
    // Material Movement Section
    {
      title: 'Material Movement',
      items: [
        { href: '/inventory/orders', label: 'Material Requests', abbreviation: ' (MR)', icon: ListOrdered },
        { href: '/inventory/receive', label: 'Receive Materials', abbreviation: ' (MRV)', icon: PackageCheck },
        { href: '/inventory/issue', label: 'Issue Materials', abbreviation: ' (MIV)', icon: ClipboardMinus, exact: true },
      ]
    },
    // Reports Section
    {
      title: 'Reports',
      items: [
        { href: '/reports', label: 'Reports', icon: AreaChart },
      ],
      subItems: [
        { href: '/inventory/reports/stock-movement', label: 'Stock Movement Report', icon: TrendingUp },
        { href: '/inventory/reports/lifespan', label: 'Lifespan Report', icon: History },
        { href: '/inventory/reports/reconciliations', label: 'Reconciliations', icon: FileCheck },
      ]
    },
    // Settings Section
    {
      title: 'Settings',
      items: [
        { href: '/residences', label: 'Residences', icon: Building },
        ...(currentUser?.role === 'Admin' ? [
          { href: '/users', label: 'Users', icon: Users },
          { href: '/setup', label: 'Setup', icon: Settings },
        ] : [] as any),
      ] as any
    },
    // Feedback Section
    {
      title: 'Feedback',
      items: [
        { href: '/feedback', label: 'My Feedback', icon: LifeBuoy },
        ...(currentUser?.role === 'Admin' ? [
          { href: '/admin/feedback', label: 'Feedback Board', icon: ClipboardList },
          { href: '/admin/feedback/stats', label: 'Feedback Analytics', icon: AreaChart },
        ] : [] as any),
      ] as any,
    },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col gap-1 p-2">
            <div className="flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">EstateCare</span>
            </div>
             <div className="group-data-[collapsible=icon]:hidden text-sm pl-1">
              <Badge variant={process.env.NODE_ENV === 'development' ? "outline" : "default"}>
                {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
              </Badge>
            </div>
            {/* Git Info */}
            {gitInfo && (
              <div className="group-data-[collapsible=icon]:hidden space-y-1 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span className="text-primary font-medium">{gitInfo.branch}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium" title={gitInfo.lastUpdateWithTime}>{gitInfo.lastUpdateRelative}</span>
                </div>
              </div>
            )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuStructure.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`}>
              {/* Section Title */}
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {section.title}
              </div>
              
              {/* Section Items */}
              {section.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}{item.abbreviation || ''}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  {/* Sub-items for Reports section */}
                  {item.href === '/reports' && section.subItems && (
                    <SidebarMenuSub>
                      {section.subItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href}>
                              <subItem.icon />
                              <span className="group-data-[collapsible=icon]:hidden">{subItem.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
              
              {/* Add spacing between sections */}
              {sectionIndex < menuStructure.length - 1 && (
                <div className="h-2"></div>
              )}
            </div>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
             <div className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2 border rounded-md">
                 <div className="flex items-center gap-2">
                     <Avatar className="size-8">
                       {currentUser ? (
                         <>
                          <AvatarImage src="https://placehold.co/100x100.png" alt={currentUser.name} data-ai-hint="profile picture" />
                          <AvatarFallback>{currentUser.name?.charAt(0) || 'U'}</AvatarFallback>
                         </>
                       ) : (
                        <AvatarFallback />
                       )}
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden text-left">
                        <p className="font-semibold text-sm">{loading ? 'Loading...' : currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground">{loading ? '' : currentUser?.role}</p>
                    </div>
                 </div>
            </div>
        </div>
      </SidebarFooter>
    </>
  );
}
