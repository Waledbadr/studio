
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
import { Building, Home, Wrench, Bot, Settings, Users, ClipboardList, Move, ListOrdered, ClipboardMinus, AreaChart, History, PackageCheck, TrendingUp, AlertTriangle, FileCheck, Boxes, ArrowUpDown, Package2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUsers } from '@/context/users-context';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';

export function AppSidebar() {
  const { dict, locale } = useLanguage();
  const pathname = usePathname();
  const { currentUser, loading } = useUsers();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      title: dict.sidebar.main,
      items: [
        { href: '/', label: dict.sidebar.dashboard, icon: Home },
        { href: '/maintenance', label: dict.sidebar.maintenance, icon: Wrench },
      ]
    },
    // Stock Management Section
    {
      title: dict.sidebar.stockManagement,
      items: [
        { href: '/inventory', label: dict.sidebar.inventory, icon: ClipboardList, exact: true },
        { href: '/inventory/inventory-audit', label: dict.sidebar.stockReconciliation, icon: FileCheck },
        { href: '/inventory/depreciation', label: dict.sidebar.depreciation, icon: AlertTriangle },
        { href: '/inventory/transfer', label: dict.sidebar.stockTransfer, icon: Move },
      ]
    },
    // Material Movement Section
    {
      title: dict.sidebar.materialMovement,
      items: [
        { href: '/inventory/orders', label: dict.sidebar.materialRequests, abbreviation: ' (MR)', icon: ListOrdered },
        { href: '/inventory/receive', label: dict.sidebar.receiveMaterials, abbreviation: ' (MRV)', icon: PackageCheck },
        { href: '/inventory/issue', label: dict.sidebar.issueMaterials, abbreviation: ' (MIV)', icon: ClipboardMinus, exact: true },
      ]
    },
    // Reports Section
    {
      title: dict.sidebar.reports,
      items: [
        { href: '/reports', label: dict.sidebar.reports, icon: AreaChart },
      ],
      subItems: [
        { href: '/inventory/reports/stock-movement', label: dict.sidebar.stockMovementReport, icon: TrendingUp },
        { href: '/inventory/reports/lifespan', label: dict.sidebar.lifespanReport, icon: History }
      ]
    },
    // Settings Section
    {
      title: dict.sidebar.settings,
      items: [
        { href: '/residences', label: dict.sidebar.residences, icon: Building },
        { href: '/users', label: dict.sidebar.users, icon: Users },
        { href: '/tools', label: dict.sidebar.aiTools, icon: Bot },
        { href: '/setup', label: dict.sidebar.setup, icon: Settings },
      ]
    },
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
        <SidebarMenu key={locale}>
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
                      {isMounted && <span className="group-data-[collapsible=icon]:hidden">{item.label}{item.abbreviation || ''}</span>}
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
                       {isMounted && currentUser ? (
                         <>
                          <AvatarImage src="https://placehold.co/100x100.png" alt={currentUser.name} data-ai-hint="profile picture" />
                          <AvatarFallback>{currentUser.name?.charAt(0) || 'U'}</AvatarFallback>
                         </>
                       ) : (
                        <AvatarFallback />
                       )}
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden text-left">
                        <p className="font-semibold text-sm">{loading || !isMounted ? dict.loading : currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground">{loading || !isMounted ? '' : currentUser?.role}</p>
                    </div>
                 </div>
            </div>
        </div>
      </SidebarFooter>
    </>
  );
}
