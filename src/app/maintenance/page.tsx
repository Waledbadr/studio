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

const allMaintenanceRequests = [
    { id: 'REQ-001', room: 'A-101', building: 'Building A', complex: 'Seaside Residences', issue: 'Leaky Faucet', status: 'Pending', priority: 'High', date: '2023-10-26' },
    { id: 'REQ-002', room: 'C-305', building: 'Building C', complex: 'Seaside Residences', issue: 'Broken AC', status: 'In Progress', priority: 'High', date: '2023-10-25' },
    { id: 'REQ-003', room: 'B-210', building: 'Building B', complex: 'Seaside Residences', issue: 'Window not closing', status: 'Completed', priority: 'Medium', date: '2023-10-24' },
    { id: 'REQ-004', room: 'A-102', building: 'Building A', complex: 'Seaside Residences', issue: 'Clogged Toilet', status: 'Pending', priority: 'Low', date: '2023-10-23' },
    { id: 'REQ-005', room: 'D-401', building: 'Building D', complex: 'Hilltop Apartments', issue: 'No hot water', status: 'In Progress', priority: 'High', date: '2023-10-22' },
    { id: 'REQ-006', room: 'E-110', building: 'Building E', complex: 'Hilltop Apartments', issue: 'Power outlet not working', status: 'Completed', priority: 'Low', date: '2023-10-21' },
];

export default function MaintenancePage() {
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
            <TabsContent value="all" className="flex-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Maintenance Requests</CardTitle>
                        <CardDescription>An overview of all maintenance requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                {allMaintenanceRequests.map((request) => (
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
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
