
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListFilter } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react";

// The shape of a maintenance request.
// In a real app, this would be defined in a shared types file.
type MaintenanceRequest = { 
    id: string; 
    room: string; 
    building: string; 
    complex: string; 
    issue: string; 
    status: 'Pending' | 'In Progress' | 'Completed'; 
    priority: 'Low' | 'Medium' | 'High'; 
    date: string; 
};

// NOTE: The mock data has been removed. 
// In a real application, you would fetch this data from your database.
const allMaintenanceRequests: MaintenanceRequest[] = [];


export default function MaintenancePage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>(allMaintenanceRequests);
    
    // In a real app, you would have filtering logic here based on state
    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const inProgressRequests = requests.filter(r => r.status === 'In Progress');
    const completedRequests = requests.filter(r => r.status === 'Completed');

    const renderRequestsTable = (requestsToRender: MaintenanceRequest[], emptyMessage: string) => {
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestsToRender.length > 0 ? requestsToRender.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.id}</TableCell>
                            <TableCell>{`${request.complex}, ${request.building}, ${request.room}`}</TableCell>
                            <TableCell>{request.issue}</TableCell>
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
                            <TableCell>{request.date}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">{emptyMessage}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    };

    return (
        <Tabs defaultValue="all" className="flex flex-col gap-4 h-full">
            <div className="flex items-center">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
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
                        {renderRequestsTable(requests, "No maintenance requests found.")}
                    </TabsContent>
                     <TabsContent value="pending" className="flex-1">
                        {renderRequestsTable(pendingRequests, "No pending requests.")}
                    </TabsContent>
                     <TabsContent value="in-progress" className="flex-1">
                        {renderRequestsTable(inProgressRequests, "No requests in progress.")}
                    </TabsContent>
                     <TabsContent value="completed" className="flex-1">
                        {renderRequestsTable(completedRequests, "No completed requests.")}
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    )
}
