
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Wrench, CheckCircle2, Loader2, Truck, Package, PackageOpen, ListOrdered, ClipboardMinus } from 'lucide-react';
import Link from 'next/link';
import { useMaintenance } from "@/context/maintenance-context";
import { useOrders, type Order } from "@/context/orders-context";
import { useInventory, type MIV } from "@/context/inventory-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useUsers } from "@/context/users-context";

export default function DashboardPage() {
  const { requests, loading: maintenanceLoading, loadRequests } = useMaintenance();
  const { orders, loading: ordersLoading, loadOrders } = useOrders();
  const { getMIVs, loading: inventoryLoading } = useInventory();
  const { currentUser, loading: usersLoading } = useUsers();
  
  const [mivs, setMivs] = useState<MIV[]>([]);
  const isAdmin = currentUser?.role === 'Admin';


  useEffect(() => {
    loadRequests();
    loadOrders();
    getMIVs().then(setMivs);
  }, [loadRequests, loadOrders, getMIVs]);
  
  const filteredMaintenance = useMemo(() => {
    if (!currentUser || isAdmin) return requests;
    return requests.filter(r => currentUser.assignedResidences.includes(r.complexId));
  }, [requests, currentUser, isAdmin]);

  const filteredOrders = useMemo(() => {
    if (!currentUser || isAdmin) return orders;
    return orders.filter(o => currentUser.assignedResidences.includes(o.residenceId));
  }, [orders, currentUser, isAdmin]);
  
  const filteredMIVs = useMemo(() => {
    if (!currentUser || isAdmin) return mivs;
    return mivs.filter(miv => currentUser.assignedResidences.includes(miv.residenceId));
  }, [mivs, currentUser, isAdmin]);

  const recentMaintenance = filteredMaintenance.slice(0, 5);
  const recentMaterialRequests = filteredOrders.slice(0, 5);
  const recentReceipts = filteredOrders.filter(o => o.status === 'Delivered' || o.status === 'Partially Delivered').slice(0, 5);
  const recentIssues = filteredMIVs.slice(0, 5);

  const totalRequests = filteredMaintenance.length;
  const pendingRequests = filteredMaintenance.filter(r => r.status === 'Pending').length;
  const completedRequests = filteredMaintenance.filter(r => r.status === 'Completed').length;

  const loading = maintenanceLoading || ordersLoading || inventoryLoading || usersLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalRequests}</div>}
            <p className="text-xs text-muted-foreground">Total maintenance requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{pendingRequests}</div>}
            <p className="text-xs text-muted-foreground">Requests that need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{completedRequests}</div>}
            <p className="text-xs text-muted-foreground">Completed requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5"/> Recent Material Requests</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/orders">View All<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentMaterialRequests.length === 0 ? <div className="text-center text-muted-foreground p-10">No material requests found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentMaterialRequests.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="font-medium">{order.id}</div>
                                        <div className="text-sm text-muted-foreground">{order.residence}</div>
                                    </TableCell>
                                    <TableCell>
                                         <Badge variant={
                                            order.status === 'Delivered' ? 'default' 
                                            : order.status === 'Approved' ? 'secondary'
                                            : order.status === 'Partially Delivered' ? 'secondary'
                                            : order.status === 'Cancelled' ? 'destructive'
                                            : 'outline'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/> Recent Receipts</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/receive">View All<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentReceipts.length === 0 ? <div className="text-center text-muted-foreground p-10">No recent receipts found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentReceipts.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="font-medium">{order.id}</div>
                                        <div className="text-sm text-muted-foreground">{order.residence}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><ClipboardMinus className="h-5 w-5"/> Recent Issues</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/issue-history">View All<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentIssues.length === 0 ? <div className="text-center text-muted-foreground p-10">No recent issues found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>MIV ID</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentIssues.map(miv => (
                                <TableRow key={miv.id}>
                                    <TableCell><div className="font-medium">{miv.id}</div></TableCell>
                                    <TableCell>{format(miv.date.toDate(), 'PPP')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/> Recent Maintenance</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/maintenance">View All<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentMaintenance.length === 0 ? <div className="text-center text-muted-foreground p-10">No maintenance requests found.</div>
                : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentMaintenance.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.issueTitle}</div>
                                        <div className="text-sm text-muted-foreground">{req.complexName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'Completed' ? 'default' : req.status === 'In Progress' ? 'secondary' : 'outline'}>{req.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
