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
import { useLanguage } from '@/context/language-context';
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

  // When inside the accommodation app, render an intentionally empty sidebar
  const isAccommodation = pathname?.startsWith('/accommodation');
  if (isAccommodation) {
    return (
      <>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <span className="text-lg font-semibold text-amber-600">Accommodation</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2">
            <nav className="space-y-2">
              <a href="/accommodation/residences" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">📋 View residences</a>
              <a href="/accommodation/assign" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">👥 Assign tenant</a>
            </nav>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2" />
        </SidebarFooter>
      </>
    );
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
  const { dict } = useLanguage();

  const menuStructure: MenuSection[] = [
    // Main Section
    {
      title: dict.sidebar?.main || 'Main',
      items: [
        { href: '/', label: dict.sidebar?.dashboard || 'Dashboard', icon: Home },
        { href: '/maintenance', label: dict.sidebar?.maintenance || 'Maintenance', icon: Wrench },
      ]
    },
    // Stock Management Section
    {
      title: dict.sidebar?.stockManagement || 'Stock Management',
      items: [
        { href: '/inventory', label: dict.sidebar?.inventory || 'Inventory', icon: ClipboardList, exact: true },
        { href: '/inventory/inventory-audit', label: dict.sidebar?.stockReconciliation || 'Stock Reconciliation', icon: FileCheck },
        { href: '/inventory/depreciation', label: dict.sidebar?.depreciation || 'Depreciation', icon: AlertTriangle },
        { href: '/inventory/transfer', label: dict.sidebar?.stockTransfer || 'Stock Transfer', icon: Move },
      ]
    },
    // Material Movement Section
    {
      title: dict.sidebar?.materialMovement || 'Material Movement',
      items: [
        { href: '/inventory/orders', label: dict.sidebar?.materialRequests || 'Material Requests', abbreviation: ' (MR)', icon: ListOrdered },
        { href: '/inventory/receive', label: dict.sidebar?.receiveMaterials || 'Receive Materials', abbreviation: ' (MRV)', icon: PackageCheck },
        { href: '/inventory/issue', label: dict.sidebar?.issueMaterials || 'Issue Materials', abbreviation: ' (MIV)', icon: ClipboardMinus, exact: true },
      ]
    },
    // Reports Section
    {
      title: dict.sidebar?.reports || 'Reports',
      items: [
        { href: '/reports', label: dict.sidebar?.reports || 'Reports', icon: AreaChart },
      ],
      subItems: [
        { href: '/inventory/reports/stock-movement', label: dict.sidebar?.stockMovementReport || 'Stock Movement Report', icon: TrendingUp },
        { href: '/inventory/reports/lifespan', label: dict.sidebar?.lifespanReport || 'Lifespan Report', icon: History },
        { href: '/inventory/reports/reconciliations', label: dict.sidebar?.reconciliations || 'Reconciliations', icon: FileCheck },
      ]
    },
    // Settings Section
    {
      title: dict.sidebar?.settings || 'Settings',
      items: [
  { href: '/residences', label: dict.sidebar?.residences || 'Residences', icon: Building },
        ...(currentUser?.role === 'Admin' ? [
          { href: '/users', label: dict.sidebar?.users || 'Users', icon: Users },
          { href: '/setup', label: dict.sidebar?.setup || 'Setup', icon: Settings },
        ] : [] as any),
      ] as any
    },
    // Feedback Section
    {
      title: dict.feedback || 'Feedback',
      items: [
        { href: '/feedback', label: dict.myFeedback || 'My Feedback', icon: LifeBuoy },
        ...(currentUser?.role === 'Admin' ? [
          { href: '/admin/feedback', label: dict.feedbackBoard || 'Feedback Board', icon: ClipboardList },
          { href: '/admin/feedback/stats', label: dict.feedbackAnalytics || 'Feedback Analytics', icon: AreaChart },
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
            {/* Environment badge and git info removed per request */}
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
