
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// MOCK DATA - Replace with actual data from context
const users = [
    { id: 'usr_1', name: 'Ahmed Al-Farsi', email: 'ahmed@email.com', role: 'Admin', assignedResidences: ['Seaside Residences'] },
    { id: 'usr_2', name: 'Fatima Al-Marzooqi', email: 'fatima@email.com', role: 'Supervisor', assignedResidences: ['Seaside Residences', 'Hilltop Apartments'] },
    { id: 'usr_3', name: 'Yusuf Al-Haddad', email: 'yusuf@email.com', role: 'Technician', assignedResidences: ['Seaside Residences'] },
];

export default function UsersPage() {
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their permissions.</p>
                </div>
                <Button onClick={() => setIsUserDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Assigned Residences</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.assignedResidences.map(res => <Badge key={res} variant="outline">{res}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* The UserFormDialog would be placed here */}
            {/* <UserFormDialog isOpen={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} /> */}
        </div>
    );
}
