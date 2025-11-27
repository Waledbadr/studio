
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/language-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUsers, type User } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function UsersPage() {
    const { dict } = useLanguage();
    const { users, loading: usersLoading, saveUser, deleteUser, loadUsers, currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("staff");
    const { toast } = useToast();

    const staffUsers = useMemo(() => users.filter(u => u.role !== 'Worker'), [users]);
    const workers = useMemo(() => users.filter(u => u.role === 'Worker'), [users]);

    useEffect(() => {
        if (!currentUser) return; // wait until signed-in
        loadUsers();
        loadResidences();
    }, [currentUser, loadUsers, loadResidences]);

    const handleAddNewUser = () => {
        setSelectedUser(null);
        setIsUserDialogOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsUserDialogOpen(true);
    };

    const handleSaveUser = async (userToSave: User) => {
        setIsSaving(true);
        try {
            await saveUser(userToSave);
            setIsUserDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast({ title: "Error", description: "Failed to save user.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteUser = async (id: string) => {
        await deleteUser(id);
    };

    const getResidenceNames = (residenceIds: string[]) => {
        if (!residenceIds) return [];
        return residenceIds.map(id => residences.find(res => res.id === id)?.name).filter(Boolean);
    };

    const renderStaffSkeleton = () => (
        Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        ))
    );

    const renderWorkersSkeleton = () => (
        Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{dict.workers?.title || 'إدارة المستخدمين والعمال'}</h1>
                    <p className="text-muted-foreground">{dict.workers?.subtitle || 'إدارة الموظفين والعمال والصلاحيات'}</p>
                </div>
                <Button onClick={handleAddNewUser}>
                    <PlusCircle className="mr-2 h-4 w-4" /> إضافة مستخدم
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} dir={dict?.ui?.dir || (dict?.ui?.rtl ? 'rtl' : 'ltr') || 'rtl'}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="staff">{dict.staff || 'الموظفين'} ({staffUsers.length})</TabsTrigger>
                    <TabsTrigger value="workers">
                        <Users className="ml-2 h-4 w-4" />
                        {dict.workers?.title || 'العمال'} ({workers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.staff || 'الموظفين'}</CardTitle>
                            <CardDescription>{dict.staffDescription || dict.workers?.subtitle || 'قائمة الموظفين والمشرفين في النظام'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-x-auto sm:overflow-x-visible">
                                <Table className="min-w-full sm:min-w-[700px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">{dict.name || 'الاسم'}</TableHead>
                                            <TableHead className="text-right">{dict.email || 'البريد الإلكتروني'}</TableHead>
                                            <TableHead className="text-right">{dict.role || 'الدور'}</TableHead>
                                            <TableHead className="text-right">{dict.assignedResidences || 'المقرات المخصصة'}</TableHead>
                                            <TableHead className="text-right">{dict.actions || 'الإجراءات'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? renderStaffSkeleton() : staffUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium text-right">{user.name}</TableCell>
                                                <TableCell className="text-right">{user.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={user.role === (dict.admin || 'Admin') ? 'destructive' : 'secondary'}>{dict[user.role?.toLowerCase()] || user.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                        {getResidenceNames(user.assignedResidences).map(name => <Badge key={name} variant="outline">{name}</Badge>)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px]">
                                                                <MoreHorizontal className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="min-h-[44px]">
                                                                <Edit className="mr-2 h-5 w-5" />
                                                                {dict.edit || 'تعديل'}
                                                            </DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-3 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive min-h-[44px]">
                                                                        <Trash2 className="mr-2 h-5 w-5" />
                                                                        حذف
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                        <AlertDialogDescription>سيتم حذف المستخدم "{user.name}" نهائياً</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>حذف</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="workers">
                    <Card className="overflow-x-auto w-full">
                        <CardHeader>
                            <CardTitle>{dict.workers?.title || `معاينة البيانات (${workers.length} سجل)`}</CardTitle>
                            <CardDescription>{dict.workers?.subtitle || 'قائمة العمال في النظام'}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            <div className="w-full overflow-x-auto sm:overflow-x-visible">
                                <Table className="min-w-full sm:min-w-[700px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right min-w-[200px]">{dict.name || 'الاسم'}</TableHead>
                                            <TableHead className="text-right min-w-[100px]">{dict.employeeId || 'رقم الوظيفة'}</TableHead>
                                            <TableHead className="text-right min-w-[120px]">{dict.idNumber || 'رقم الهوية'}</TableHead>
                                            <TableHead className="text-right min-w-[100px]">{dict.nationality || 'الجنسية'}</TableHead>
                                            <TableHead className="text-right min-w-[120px]">{dict.company || 'الشركة'}</TableHead>
                                            <TableHead className="text-right min-w-[80px]">{dict.role || 'الدور'}</TableHead>
                                            <TableHead className="text-right min-w-[100px]">{dict.actions || 'الإجراءات'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? renderWorkersSkeleton() : workers.map((worker) => (
                                            <TableRow key={worker.id}>
                                                <TableCell className="font-medium text-right">
                                                    <div className="max-w-[200px] truncate" title={worker.name} dir={dict.dir}>
                                                        {worker.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{worker.employeeId || '-'}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{worker.idNumber || '-'}</TableCell>
                                                <TableCell className="text-right">{worker.nationality || '-'}</TableCell>
                                                <TableCell className="text-right">{worker.company || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline">{dict.worker || 'Worker'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditUser(worker)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                {dict.edit || 'تعديل'}
                                                            </DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        {dict.delete || 'حذف'}
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{dict.confirmDeleteTitle || 'هل أنت متأكد؟'}</AlertDialogTitle>
                                                                        <AlertDialogDescription>{dict.confirmDeleteWorker?.replace('{name}', worker.name) || `سيتم حذف العامل "${worker.name}" نهائياً`}</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{dict.cancel || 'إلغاء'}</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteUser(worker.id)}>{dict.delete || 'حذف'}</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <UserFormDialog 
                isOpen={isUserDialogOpen} 
                onOpenChange={setIsUserDialogOpen}
                onSave={handleSaveUser}
                user={selectedUser}
                isLoading={isSaving}
             />
        </div>
    );
}
