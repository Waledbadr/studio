
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, ListFilter, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

// The shape of a purchase order.
// In a real app, this would be defined in a shared types file.
type PurchaseOrder = { 
    id: string; 
    date: string;
    supplier: string;
    itemCount: number;
    totalValue: number;
    status: 'Pending' | 'Approved' | 'Delivered' | 'Cancelled'; 
};

// NOTE: This is mock data. 
// In a real application, you would fetch this data from your database.
const allPurchaseOrders: PurchaseOrder[] = [
    { id: 'PO-2024-001', date: '2024-07-15', supplier: 'Global Building Supplies', itemCount: 15, totalValue: 3450.00, status: 'Delivered' },
    { id: 'PO-2024-002', date: '2024-07-18', supplier: 'Sanitary Solutions Ltd.', itemCount: 8, totalValue: 1250.50, status: 'Pending' },
    { id: 'PO-2024-003', date: '2024-07-20', supplier: 'Electrical Components Inc.', itemCount: 32, totalValue: 8790.25, status: 'Approved' },
    { id: 'PO-2024-004', date: '2024-07-21', supplier: 'General Maintenance Tools', itemCount: 5, totalValue: 450.00, status: 'Cancelled' },
];


export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>(allPurchaseOrders);

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Purchase Orders</h1>
                <p className="text-muted-foreground">Review and manage all purchase orders.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span>Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Pending</DropdownMenuItem>
                            <DropdownMenuItem>Approved</DropdownMenuItem>
                            <DropdownMenuItem>Delivered</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="h-9 gap-1">
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Export</span>
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length > 0 ? orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>{order.supplier}</TableCell>
                                    <TableCell>{order.itemCount}</TableCell>
                                    <TableCell>AED {order.totalValue.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            order.status === 'Delivered' ? 'default' 
                                            : order.status === 'Approved' ? 'secondary' 
                                            : order.status === 'Cancelled' ? 'destructive'
                                            : 'outline'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Mark as Delivered</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Cancel Order</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">No purchase orders found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
