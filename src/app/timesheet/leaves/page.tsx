'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, deleteDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Stethoscope, Clock, UserCheck, Plane, Plus, Trash2, Edit2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HousingEmployeesProvider } from '@/context/housing-employees-context';
import { AddLeaveDialog } from '@/components/timesheet/leaves/add-leave-dialog';

function LeavesManagementContent() {
  const { dict, locale } = useLanguage();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('annual');
  const [selectedLeave, setSelectedLeave] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // By using getDocs with a limit, we save significantly on Database reads
      const qL = query(collection(db as any, 'timesheetLeaves'), orderBy('createdAt', 'desc'), limit(1000));
      const snap = await getDocs(qL);
      setAllData(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter based on type
  const annualLeaves = allData.filter(d => d.type === 'Annual' || d.type === 'سنوية' || d.type?.includes('Annual'));
  const sickLeaves = allData.filter(d => d.type === 'Sick' || d.type === 'مرضية');
  const permissions = allData.filter(d => d.type === 'Permission' || d.type === 'استئذان');
  const resumptions = allData.filter(d => d.type === 'Resumption' || d.type === 'مباشرة');

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db as any, 'timesheetLeaves', id));
      setAllData(prev => prev.filter(item => item.docId !== id));
      toast({
        title: isAr ? 'تم الحذف' : 'Deleted',
        description: isAr ? 'تم حذف السجل بنجاح' : 'Record deleted successfully',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'حدث خطأ أثناء الحذف' : 'Failed to delete record',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: any) => {
    setSelectedLeave(item);
    setAddDialogOpen(true);
  };

  const getLeaveStatusInfo = (item: any) => {
    // Return early for Resumption / Permission (they don't span long days usually)
    if (item.type === 'Resumption' || item.type === 'مباشرة' || item.type === 'Permission' || item.type === 'استئذان') {
      return { status: item.status || (isAr ? 'مسجل' : 'Logged'), remaining: '-' };
    }
    
    // Normal leave tracking
    if (!item.endDate) return { status: item.status || (isAr ? 'مستمرة' : 'Ongoing'), remaining: '-' };

    const today = new Date();
    // Reset time to start of day for comparison
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(item.endDate);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    let displayStatus = '';
    let displayRemaining = '';

    if (diffDays < 0) {
      displayStatus = isAr ? 'منتهية (مباشر)' : 'Ended (Active)';
      displayRemaining = isAr ? 'انتهت' : 'Ended';
    } else if (diffDays === 0) {
      displayStatus = isAr ? 'في إجازة' : 'On Leave';
      displayRemaining = isAr ? 'تنتهي اليوم' : 'Ends today';
    } else {
      displayStatus = isAr ? 'في إجازة' : 'On Leave';
      displayRemaining = isAr ? `${diffDays} يوم` : `${diffDays} days`;
    }

    return { status: displayStatus, remaining: displayRemaining, diffDays };
  };

  const renderTable = (data: any[], emptyMsg: string, showRemainingInfo = false) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-900/20 rounded-md border border-dashed">
          {emptyMsg}
        </div>
      );
    }

    return (
      <div className="border rounded-md dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">     
              <TableHead>{isAr ? 'الموظف' : 'Employee'}</TableHead>
              <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>   
              <TableHead>{isAr ? 'من تاريخ' : 'Start Date'}</TableHead>
              <TableHead>{isAr ? 'إلى تاريخ' : 'End Date'}</TableHead>
              {showRemainingInfo && (
                <TableHead>{isAr ? 'المتبقي' : 'Remaining'}</TableHead>
              )}
              <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
              <TableHead className="w-[100px] text-center">{isAr ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => {
              const { status, remaining, diffDays } = getLeaveStatusInfo(item);
              return (
              <TableRow key={item.docId}>
                <TableCell>
                  <div className="font-medium">{isAr ? item.nameAr || item.name : item.name}</div>
                  <div className="text-xs text-gray-500">{item.badgeId || item.employeeId || '-'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>{item.startDate || item.date || '-'}</TableCell>
                <TableCell>{item.endDate || '-'}</TableCell>
                {showRemainingInfo && (
                  <TableCell>
                    <span className={diffDays !== undefined && diffDays < 0 ? "text-gray-400 line-through" : diffDays !== undefined && diffDays <= 3 ? "text-orange-500 font-semibold" : ""}>
                      {remaining}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={
                    item.status === 'Approved' ? 'default' : 
                    item.status === 'Rejected' ? 'destructive' : 
                    (!item.endDate) ? 'secondary' :
                    (diffDays !== undefined && diffDays < 0) ? 'outline' : 'default'
                  } className={(!item.status || item.status === 'Pending') && diffDays !== undefined && diffDays >= 0 ? "bg-indigo-500 hover:bg-indigo-600 text-white" : ""}>
                    {item.status && item.status !== 'Pending' ? item.status : status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{item.reason || item.notes || '-'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(item.docId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTablesForCategory = (dataArray: any[], emptyMsg: string, isSickOrAnnual = false) => {
    if (!isSickOrAnnual) return renderTable(dataArray, emptyMsg, false);

    const activeOrFuture: any[] = [];
    const ended: any[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    dataArray.forEach(item => {
      if (!item.endDate) {
        activeOrFuture.push(item);
        return;
      }
      const endDate = new Date(item.endDate);
      endDate.setHours(0,0,0,0);
      
      if (endDate.getTime() < today.getTime()) {
        ended.push(item);
      } else {
        activeOrFuture.push(item);
      }
    });

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg flex items-center gap-2 font-semibold mb-4 text-indigo-700 dark:text-indigo-400 font-medium">
            {isAr ? 'الإجازات الحالية والقادمة' : 'Active & Upcoming Leaves'}
            <span className="text-xs font-bold leading-none bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full">{activeOrFuture.length}</span>
          </h3>
          {renderTable(activeOrFuture, emptyMsg, true)}
        </div>
        
        {ended.length > 0 && (
          <div className="border-t dark:border-gray-800 pt-8 mt-8">
            <h3 className="text-lg flex items-center gap-2 font-semibold mb-4 text-gray-500 dark:text-gray-400 font-medium">
              {isAr ? 'الإجازات المنتهية / المباشرون' : 'Ended Leaves / Resumed'}
              <span className="text-xs font-bold leading-none bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">{ended.length}</span>
            </h3>
            {renderTable(ended, isAr ? 'لا توجد إجازات أو مباشرات' : 'No ended leaves', true)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-600" />
            {isAr ? 'إدارة الإجازات والمباشرات' : 'Leaves Management'}
          </h1>
          <p className="text-gray-500 max-w-2xl">
            {isAr
              ? 'إدارة الإجازات السنوية، الإجازات المرضية، الاستئذانات والمباشرات للموظفين.'
              : 'Manage annual leaves, sick leaves, permissions, and work resumptions for employees.'}
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-4 md:w-[700px]">    
            <TabsTrigger value="annual" className="py-3 flex items-center justify-center gap-2 font-medium">
              <Plane className="w-4 h-4" />
              {isAr ? 'الإجازات السنوية' : 'Annual Leaves'}
            </TabsTrigger>
            <TabsTrigger value="sick" className="py-3 flex items-center justify-center gap-2 font-medium">
              <Stethoscope className="w-4 h-4 text-red-500" />
              {isAr ? 'المرضية' : 'Sick Leaves'}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="py-3 flex items-center justify-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-500" />
              {isAr ? 'الاستئذانات' : 'Permissions'}
            </TabsTrigger>
            <TabsTrigger value="resumptions" className="py-3 flex items-center justify-center gap-2 font-medium">
              <UserCheck className="w-4 h-4 text-green-500" />
              {isAr ? 'المباشرات' : 'Resumptions'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="annual" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>{isAr ? 'سجل الإجازات السنوية' : 'Annual Leaves History'}</CardTitle>
                  <CardDescription>
                    {isAr ? 'عرض وتوثيق إجازات الموظفين السنوية والاعتيادية.' : 'View and document employees standard annual leaves.'}
                  </CardDescription>
                </div>
                <Button onClick={() => { setActiveTab('annual'); setSelectedLeave(null); setAddDialogOpen(true); }} className="flex items-center gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة إجازة سنوية' : 'Add Annual Leave'}
                </Button>
              </CardHeader>
              <CardContent>
                {renderTablesForCategory(annualLeaves, isAr ? 'لا توجد إجازات سنوية مسجلة' : 'No annual leaves recorded', true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sick" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>{isAr ? 'الإجازات المرضية والتقارير الطبية' : 'Sick Leaves & Medical Reports'}</CardTitle>
                  <CardDescription>
                    {isAr ? 'مرجع الإجازات المرضية الموثقة والتقارير الطبية للموظفين.' : 'Reference for documented sick leaves and medical reports.'}
                  </CardDescription>
                </div>
                <Button onClick={() => { setActiveTab('sick'); setSelectedLeave(null); setAddDialogOpen(true); }} className="flex items-center gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة إجازة مرضية' : 'Add Sick Leave'}
                </Button>
              </CardHeader>
              <CardContent>
                {renderTablesForCategory(sickLeaves, isAr ? 'لا توجد إجازات مرضية مسجلة' : 'No sick leaves recorded', true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>{isAr ? 'سجل الاستئذانات' : 'Permissions Log'}</CardTitle>
                  <CardDescription>
                    {isAr ? 'توثيق ساعات التأخير والخروج المؤقت للموظفين.' : 'Documenting late hours and temporary leaves for employees.'}
                  </CardDescription>
                </div>
                <Button onClick={() => { setActiveTab('permissions'); setSelectedLeave(null); setAddDialogOpen(true); }} className="flex items-center gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة استئذان' : 'Add Permission'}
                </Button>
              </CardHeader>
              <CardContent>
                {renderTablesForCategory(permissions, isAr ? 'لا توجد استئذانات مسجلة' : 'No permission logs recorded', false)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumptions" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>{isAr ? 'مباشرات العمل' : 'Work Resumptions'}</CardTitle>
                  <CardDescription>
                    {isAr ? 'توثيق وتتبع ميعاد مباشرة وعودة الموظفين بعد فترات الغياب والاجازات.' : 'Tracking returns to work after intervals of leaves/absence.'}
                  </CardDescription>
                </div>
                <Button onClick={() => { setActiveTab('resumptions'); setSelectedLeave(null); setAddDialogOpen(true); }} className="flex items-center gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة مباشرة' : 'Add Resumption'}
                </Button>
              </CardHeader>
              <CardContent>
                {renderTablesForCategory(resumptions, isAr ? 'لا توجد مباشرات عمل مسجلة' : 'No resumptions recorded', false)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {addDialogOpen && (
        <AddLeaveDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
          defaultType={
            activeTab === 'annual' ? 'Annual' : 
            activeTab === 'sick' ? 'Sick' : 
            activeTab === 'permissions' ? 'Permission' : 
            'Resumption'
          } 
          mode={selectedLeave ? 'edit' : 'add'}
          initialData={selectedLeave}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

export default function LeavesManagementPage() {
  return (
    <HousingEmployeesProvider>
      <LeavesManagementContent />
    </HousingEmployeesProvider>
  );
}