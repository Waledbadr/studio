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
import { Building, Home, Wrench, Settings, Users, ClipboardList, Move, ListOrdered, ClipboardMinus, AreaChart, History, PackageCheck, TrendingUp, AlertTriangle, FileCheck, GitBranch, LifeBuoy, Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/context/users-context';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, loading } = useUsers();
  const { dict } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  // const [gitInfo, setGitInfo] = useState<ReturnType<typeof getFormattedGitInfo> | null>(null);
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    setIsMounted(true);
  // setGitInfo(getFormattedGitInfo());
  }, []);

  // Close the mobile sidebar immediately after a navigation item is clicked
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

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
              <a href="/accommodation/residences" onClick={() => { if (isMobile) setOpenMobile(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">📋 View residences</a>
              <a href="/accommodation/assign" onClick={() => { if (isMobile) setOpenMobile(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">👥 Assign tenant</a>
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
  external?: boolean;
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
      title: dict.sidebar?.main || 'Main',
      items: [
        { href: '/', label: dict.sidebar?.dashboard || dict.mainPage || 'Dashboard', icon: Home },
  // Moved Service Orders directly under Dashboard
  { href: '/inventory/service-orders', label: dict.sidebar?.serviceOrders || 'Service Orders', icon: GitBranch },
  // Single Maintenance entry (always internal)
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
          { href: '/admin/translations', label: dict.sidebar?.translations || 'Translations Management', icon: Languages },
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
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={handleNavigate}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}{item.abbreviation || ''}</span>
                      </a>
                    ) : (
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}{item.abbreviation || ''}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                  
                  {/* Sub-items for Reports section */}
                  {item.href === '/reports' && section.subItems && (
                    <SidebarMenuSub>
                      {section.subItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href} onClick={handleNavigate}>
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
                          <AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'%3EIMG%3C/text%3E%3C/svg%3E" alt={currentUser.name} data-ai-hint="profile picture" />
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
