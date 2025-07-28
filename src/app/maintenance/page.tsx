
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
import { useMaintenance, type MaintenanceRequest, type MaintenanceStatus } from "@/context/maintenance-context";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/context/users-context";

export default function MaintenancePage() {
    const { requests, loading, loadRequests, updateRequestStatus } = useMaintenance();
    const { currentUser } = useUsers();
    const [activeTab, setActiveTab] = useState('all');
    const isAdmin = currentUser?.role === 'Admin';


    useEffect(() => {
        loadRequests();
    }, [loadRequests]);
    
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
                            <TableHead>Request ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
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
                        <TableHead>Request ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestsToRender.length > 0 ? requestsToRender.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.id}</TableCell>
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
                                            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Pending')}>Pending</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'In Progress')}>In Progress</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Completed')}>Completed</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Cancelled')}>Cancelled</DropdownMenuItem>
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
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="Pending">Pending</TabsTrigger>
                    <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                    <TabsTrigger value="Completed">Completed</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>High</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Medium</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Low</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild size="sm" className="h-8 gap-1">
                        <Link href="/maintenance/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Request</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Maintenance Requests</CardTitle>
                    <CardDescription>An overview of all maintenance requests.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <TabsContent value="all" className="flex-1">
                        {renderRequestsTable(filteredRequests('all'), "No maintenance requests found.")}
                    </TabsContent>
                     <TabsContent value="Pending" className="flex-1">
                        {renderRequestsTable(filteredRequests('Pending'), "No pending requests.")}
                    </TabsContent>
                     <TabsContent value="In Progress" className="flex-1">
                        {renderRequestsTable(filteredRequests('In Progress'), "No requests in progress.")}
                    </TabsContent>
                     <TabsContent value="Completed" className="flex-1">
                        {renderRequestsTable(filteredRequests('Completed'), "No completed requests.")}
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    )
}
