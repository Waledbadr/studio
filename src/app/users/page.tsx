
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, Users, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUsers, type User } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/context/language-context';
import * as D1Client from '@/lib/d1-client';


export default function UsersPage() {
    const { users, loading: usersLoading, saveUser, deleteUser, loadUsers, currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();
    const { locale, dict } = useLanguage();
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("staff");
    const { toast } = useToast();

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const isRTL = locale === 'ar';
    const align = isRTL ? 'text-right' : 'text-left';
    const justifyResidences = isRTL ? 'justify-end' : 'justify-start';
    const addIconClass = isRTL ? 'ml-2' : 'mr-2';
    const workersIconClass = isRTL ? 'mr-2' : 'ml-2';

    const staffUsers = useMemo(() => users.filter(u => u.role !== 'Worker'), [users]);
    const workers = useMemo(() => users.filter(u => u.role === 'Worker'), [users]);

    // Seed in-memory auth store for local dev (when D1 is not available)
    const seedLocalUser = useCallback(async (email: string, name: string, role: string, password: string) => {
        try {
            // Only run when D1 is disabled (basic dev mode)
            if (process.env.NEXT_PUBLIC_USE_D1 === 'true') return;
            console.log('[seedLocalUser] Sending POST to /api/seed-local-user:', { email, name, role });
            const response = await fetch('/api/seed-local-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role })
            });
            const data = await response.json();
            console.log('[seedLocalUser] Response:', data);
            if (!response.ok) {
                console.error('[seedLocalUser] Failed:', data);
            }
        } catch (e) {
            console.error('[seedLocalUser] Error:', e);
        }
    }, []);

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

    const openPasswordDialog = (u: User) => {
        setPasswordUser(u);
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setIsPasswordDialogOpen(true);
    };

    const handleChangePassword = async () => {
        const pwd = String(newPassword || '').trim();
        const confirm = String(confirmPassword || '').trim();
        if (!passwordUser) return;
        if (pwd.length < 6) {
            toast({ 
                title: isRTL ? 'خطأ' : 'Error', 
                description: isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters.', 
                variant: 'destructive' 
            });
            return;
        }
        if (pwd !== confirm) {
            toast({ 
                title: isRTL ? 'خطأ' : 'Error', 
                description: isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match.', 
                variant: 'destructive' 
            });
            return;
        }
        setIsChangingPassword(true);
        try {
            const res: any = await D1Client.setUserPassword(passwordUser.id, pwd);
            if (res && res.ok === false) throw new Error(res.error || 'Password update failed');
            // Seed local auth fallback for dev mode
            await seedLocalUser(passwordUser.email, passwordUser.name, passwordUser.role, pwd);
            toast({ title: isRTL ? 'نجح' : 'Success', description: isRTL ? 'تم تحديث كلمة المرور' : 'Password updated.' });
            setIsPasswordDialogOpen(false);
            setPasswordUser(null);
        } catch (e: any) {
            toast({ title: isRTL ? 'خطأ' : 'Error', description: e?.message || (isRTL ? 'تعذر تحديث كلمة المرور' : 'Password could not be updated.'), variant: 'destructive' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSaveUser = async (userToSave: User, password?: string) => {
        setIsSaving(true);
        try {
            // In local dev (D1 disabled), require a password for new users so login works
            const isNew = !userToSave.id;
            const usingD1 = process.env.NEXT_PUBLIC_USE_D1 === 'true';
            if (isNew && !usingD1) {
                const pwd = String(password || '').trim();
                if (!pwd || pwd.length < 6) {
                    toast({
                        title: isRTL ? 'كلمة المرور مطلوبة' : 'Password required',
                        description: isRTL ? 'أدخل كلمة مرور لا تقل عن 6 أحرف للمستخدم الجديد في الوضع المحلي.' : 'Please enter a password (min 6 chars) for new users in local dev.',
                        variant: 'destructive'
                    });
                    setIsSaving(false);
                    return;
                }
            }

            await saveUser(userToSave);

            // Seed auth for new users or when password is provided
            if (password && !usingD1) {
                try {
                    await seedLocalUser(userToSave.email, userToSave.name, userToSave.role, password);
                    toast({ title: isRTL ? 'نجح' : "Success", description: isRTL ? 'تم حفظ المستخدم وكلمة المرور' : "User and password saved." });
                } catch (e: any) {
                    console.warn('Seed local user error:', e?.message);
                }
            }

            setIsUserDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast({ 
                title: isRTL ? 'خطأ' : "Error", 
                description: isRTL ? 'فشل حفظ المستخدم' : "Failed to save user.", 
                variant: "destructive" 
            });
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
                    <h1 className="text-2xl font-bold">{dict.usersPage?.title || 'Users'}</h1>
                    <p className="text-muted-foreground">{dict.usersPage?.description || ''}</p>
                </div>
                <Button onClick={handleAddNewUser}>
                    <PlusCircle className={`${addIconClass} h-4 w-4`} /> {dict.usersPage?.addUser || 'Add User'}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? 'rtl' : 'ltr'}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="staff">{dict.usersPage?.staffTab || 'Staff'} ({staffUsers.length})</TabsTrigger>
                    <TabsTrigger value="workers">
                        <Users className={`${workersIconClass} h-4 w-4`} />
                        {dict.usersPage?.workersTab || 'Workers'} ({workers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.usersPage?.staffTitle || 'Staff'}</CardTitle>
                            <CardDescription>{dict.usersPage?.staffDescription || ''}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className={align}>{dict.usersPage?.name || 'Name'}</TableHead>
                                            <TableHead className={align}>{dict.usersPage?.email || 'Email'}</TableHead>
                                            <TableHead className={align}>{dict.usersPage?.role || 'Role'}</TableHead>
                                            <TableHead className={align}>{dict.usersPage?.assignedResidences || 'Assigned residences'}</TableHead>
                                            <TableHead className={align}>{dict.usersPage?.actions || 'Actions'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? renderStaffSkeleton() : staffUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className={`font-medium ${align}`}>{user.name}</TableCell>
                                                <TableCell className={align}>{user.email}</TableCell>
                                                <TableCell className={align}>
                                                    <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                                </TableCell>
                                                <TableCell className={align}>
                                                    <div className={`flex flex-wrap gap-1 ${justifyResidences}`}>
                                                        {getResidenceNames(user.assignedResidences).map(name => <Badge key={name} variant="outline">{name}</Badge>)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={align}>
                                                    <DropdownMenu 
                                                        open={openDropdownId === `staff-${user.id}`}
                                                        onOpenChange={(open) => {
                                                            setOpenDropdownId(open ? `staff-${user.id}` : null);
                                                        }}
                                                    >
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setOpenDropdownId(null);
                                                                    handleEditUser(user);
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                {dict.usersPage?.edit || 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onSelect={(e) => {
                                                                    e.preventDefault();
                                                                    setOpenDropdownId(null);
                                                                    setTimeout(() => openPasswordDialog(user), 0);
                                                                }}
                                                            >
                                                                <LockKeyhole className="mr-2 h-4 w-4" />
                                                                {isRTL ? 'تغيير كلمة المرور' : 'Change password'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => {
                                                                    e.preventDefault();
                                                                }}
                                                                className="p-0"
                                                            >
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <button 
                                                                            className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            {dict.usersPage?.delete || 'Delete'}
                                                                        </button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>{dict.usersPage?.confirmTitle || 'Are you sure?'}</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                {(dict.usersPage?.confirmDeleteUser || 'This will permanently delete the user "{name}".')
                                                                                    .replace('{name}', user.name)}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>{dict.usersPage?.cancel || 'Cancel'}</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>{dict.usersPage?.confirmDelete || 'Delete'}</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </DropdownMenuItem>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {(dict.usersPage?.workersTitleWithCount || 'Workers ({count})').replace('{count}', String(workers.length))}
                            </CardTitle>
                            <CardDescription>{dict.usersPage?.workersDescription || ''}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className={`${align} min-w-[200px]`}>{dict.usersPage?.name || 'Name'}</TableHead>
                                            <TableHead className={`${align} min-w-[100px]`}>{dict.usersPage?.jobNumber || 'Job number'}</TableHead>
                                            <TableHead className={`${align} min-w-[120px]`}>{dict.usersPage?.idNumber || 'ID number'}</TableHead>
                                            <TableHead className={`${align} min-w-[100px]`}>{dict.usersPage?.nationality || 'Nationality'}</TableHead>
                                            <TableHead className={`${align} min-w-[120px]`}>{dict.usersPage?.company || 'Company'}</TableHead>
                                            <TableHead className={`${align} min-w-[80px]`}>{dict.usersPage?.role || 'Role'}</TableHead>
                                            <TableHead className={`${align} min-w-[100px]`}>{dict.usersPage?.actions || 'Actions'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? renderWorkersSkeleton() : workers.map((worker) => (
                                            <TableRow key={worker.id}>
                                                <TableCell className={`font-medium ${align}`}>
                                                    <div className="max-w-[200px] truncate" title={worker.name}>
                                                        {worker.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={align}>{worker.employeeId || '-'}</TableCell>
                                                <TableCell className={`${align} font-mono text-sm`}>{worker.idNumber || '-'}</TableCell>
                                                <TableCell className={align}>{worker.nationality || '-'}</TableCell>
                                                <TableCell className={align}>{worker.company || '-'}</TableCell>
                                                <TableCell className={align}>
                                                    <Badge variant="outline">{dict.usersPage?.workerRoleLabel || 'Worker'}</Badge>
                                                </TableCell>
                                                <TableCell className={align}>
                                                    <DropdownMenu 
                                                        open={openDropdownId === `worker-${worker.id}`}
                                                        onOpenChange={(open) => {
                                                            setOpenDropdownId(open ? `worker-${worker.id}` : null);
                                                        }}
                                                    >
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setOpenDropdownId(null);
                                                                    handleEditUser(worker);
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                {dict.usersPage?.edit || 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onSelect={(e) => {
                                                                    e.preventDefault();
                                                                    setOpenDropdownId(null);
                                                                    setTimeout(() => openPasswordDialog(worker), 0);
                                                                }}
                                                            >
                                                                <LockKeyhole className="mr-2 h-4 w-4" />
                                                                {isRTL ? 'تغيير كلمة المرور' : 'Change password'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => {
                                                                    e.preventDefault();
                                                                }}
                                                                className="p-0"
                                                            >
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <button 
                                                                            className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            {dict.usersPage?.delete || 'Delete'}
                                                                        </button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>{dict.usersPage?.confirmTitle || 'Are you sure?'}</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                {(dict.usersPage?.confirmDeleteWorker || 'This will permanently delete the worker "{name}".')
                                                                                    .replace('{name}', worker.name)}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>{dict.usersPage?.cancel || 'Cancel'}</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDeleteUser(worker.id)}>{dict.usersPage?.confirmDelete || 'Delete'}</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </DropdownMenuItem>
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

            <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={(open) => {
                    setIsPasswordDialogOpen(open);
                    if (!open) {
                        setPasswordUser(null);
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowPassword(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isRTL ? 'تغيير كلمة المرور' : 'Change password'}</DialogTitle>
                        <DialogDescription>
                            {passwordUser
                                ? (isRTL ? `المستخدم: ${passwordUser.name}` : `User: ${passwordUser.name}`)
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="new-password" className="text-sm font-medium">{isRTL ? 'كلمة المرور الجديدة' : 'New password'}</label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-1' : 'right-1'}`}
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirm-password" className="text-sm font-medium">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm password'}</label>
                            <input
                                id="confirm-password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                {dict.userForm?.cancel || (isRTL ? 'إلغاء' : 'Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
                            {isChangingPassword && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                            {isRTL ? 'حفظ' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
