
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListFilter, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from '@/context/language-context';
import { useMaintenance, type MaintenanceRequest, type MaintenanceStatus } from "@/context/maintenance-context";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/context/users-context";

export default function MaintenancePage() {
    const { requests, loading, loadRequests, updateRequestStatus } = useMaintenance();
    const { currentUser } = useUsers();
    const { dict } = useLanguage();
    const [activeTab, setActiveTab] = useState('all');
    const isAdmin = currentUser?.role === 'Admin';


    useEffect(() => {
        if (!currentUser) return;
        loadRequests();
    }, [currentUser, loadRequests]);
    
    const userRequests = useMemo(() => {
        if (!currentUser || isAdmin) return requests;
        return requests.filter(r => currentUser.assignedResidences.includes(r.complexId));
    }, [requests, currentUser, isAdmin]);
    
    const filteredRequests = (status: MaintenanceStatus | 'all') => {
        if (status === 'all') return userRequests;
        return userRequests.filter(r => r.status === status);
    };

    const handleUpdateStatus = (id: string, status: MaintenanceStatus) => {
        updateRequestStatus(id, status);
    };

    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        ))
    );


    const renderRequestsTable = (requestsToRender: MaintenanceRequest[], emptyMessage: string) => {
        if (loading) {
            return (
            <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>{dict.requestId || 'Request ID'}</TableHead>
                        <TableHead>{dict.location || 'Location'}</TableHead>
                        <TableHead>{dict.issue || 'Issue'}</TableHead>
                        <TableHead>{dict.status || 'Status'}</TableHead>
                        <TableHead>{dict.priority || 'Priority'}</TableHead>
                        <TableHead>{dict.date || 'Date'}</TableHead>
                        <TableHead>{dict.actions || 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderSkeleton()}
                    </TableBody>
                </Table>
            );
        }

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{dict.requestId || 'Request ID'}</TableHead>
                        <TableHead>{dict.location || 'Location'}</TableHead>
                        <TableHead>{dict.issue || 'Issue'}</TableHead>
                        <TableHead>{dict.status || 'Status'}</TableHead>
                        <TableHead>{dict.priority || 'Priority'}</TableHead>
                        <TableHead>{dict.date || 'Date'}</TableHead>
                        <TableHead className="text-right">{dict.actions || 'Actions'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestsToRender.length > 0 ? requestsToRender.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium font-mono">{request.id}</TableCell>
                            <TableCell>{`${request.complexName}, ${request.buildingName}, ${request.roomName}`}</TableCell>
                            <TableCell>{request.issueTitle}</TableCell>
                            <TableCell>
                                <Badge variant={
                                    request.status === 'Completed' ? 'default' : request.status === 'In Progress' ? 'secondary' : 'outline'
                                }>
                                    {request.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={request.priority === 'High' ? 'destructive' : request.priority === 'Medium' ? 'secondary' : 'outline'}>{request.priority}</Badge>
                            </TableCell>
                            <TableCell>{format(request.date.toDate(), 'PPP')}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                         <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>{dict.changeStatus || 'Change Status'}</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Pending')}>{dict.pending || 'Pending'}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'In Progress')}>{dict.inProgress || 'In Progress'}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Completed')}>{dict.completed || 'Completed'}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Cancelled')}>{dict.cancelled || 'Cancelled'}</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">{emptyMessage}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    };

    return (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4 h-full">
            <div className="flex items-center">
                <TabsList>
                    <TabsTrigger value="all">{dict.all || 'All'}</TabsTrigger>
                    <TabsTrigger value="Pending">{dict.pending || 'Pending'}</TabsTrigger>
                    <TabsTrigger value="In Progress">{dict.inProgress || 'In Progress'}</TabsTrigger>
                    <TabsTrigger value="Completed">{dict.completed || 'Completed'}</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{dict.filter || 'Filter'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{dict.filterByPriority || 'Filter by Priority'}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>{dict.high || 'High'}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>{dict.medium || 'Medium'}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>{dict.low || 'Low'}</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild size="sm" className="h-8 gap-1">
                        <Link href="/maintenance/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{dict.newRequest || 'New Request'}</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{dict.maintenanceRequestsTitle || 'Maintenance Requests'}</CardTitle>
                    <CardDescription>{dict.maintenanceRequestsDescription || 'An overview of all maintenance requests.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <TabsContent value="all" className="flex-1">
                        {renderRequestsTable(filteredRequests('all'), dict.noMaintenanceRequestsFound || "No maintenance requests found.")}
                    </TabsContent>
                     <TabsContent value="Pending" className="flex-1">
                        {renderRequestsTable(filteredRequests('Pending'), dict.noPendingRequests || "No pending requests.")}
                    </TabsContent>
                     <TabsContent value="In Progress" className="flex-1">
                        {renderRequestsTable(filteredRequests('In Progress'), dict.noInProgressRequests || "No requests in progress.")}
                    </TabsContent>
                     <TabsContent value="Completed" className="flex-1">
                        {renderRequestsTable(filteredRequests('Completed'), dict.noCompletedRequests || "No completed requests.")}
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    )
}
