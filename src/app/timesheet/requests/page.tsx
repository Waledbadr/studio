'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plane, ArrowRightLeft, Calendar } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function TimesheetRequestsPage() {
  const { dict, locale } = useLanguage();
  const isAr = locale === 'ar';
  
  const [leaves, setLeaves] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        const qL = query(collection(db as any, 'timesheetLeaves'), orderBy('createdAt', 'desc'), limit(1000));
        const snapL = await getDocs(qL);
        setLeaves(snapL.docs.map(d => ({ docId: d.id, ...d.data() })));

        const qT = query(collection(db as any, 'timesheetTransfers'), orderBy('createdAt', 'desc'), limit(1000));
        const snapT = await getDocs(qT);
        setTransfers(snapT.docs.map(d => ({ docId: d.id, ...d.data() })));       
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          {isAr ? 'الإجازات والتحويلات' : 'Leaves & Transfers'}
        </h1>
      </div>
      <p className="text-gray-500 max-w-2xl">
        {isAr 
          ? 'عرض سجل الإجازات وطلبات التحويل بين المشاريع لجميع الموظفين.' 
          : 'View the history of leaves and project transfers for all employees.'}
      </p>

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="leaves" className="w-full">
          <TabsList className="grid w-full h-auto grid-cols-2 md:w-[400px]">
            <TabsTrigger value="leaves" className="py-3 flex items-center gap-2 font-medium">
              <Plane className="w-4 h-4" />
              {isAr ? 'الإجازات' : 'Leaves'}
            </TabsTrigger>
            <TabsTrigger value="transfers" className="py-3 flex items-center gap-2 font-medium">
              <ArrowRightLeft className="w-4 h-4" />
              {isAr ? 'التحويلات' : 'Transfers'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="leaves" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? 'سجل الإجازات' : 'Leaves History'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead>{isAr ? 'الموظف' : 'Employee'}</TableHead>
                        <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                        <TableHead>{isAr ? 'من تاريخ' : 'Start Date'}</TableHead>
                        <TableHead>{isAr ? 'إلى تاريخ' : 'End Date'}</TableHead>
                        <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            {isAr ? 'لا توجد سجلات' : 'No records found.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaves.map(l => (
                          <TableRow key={l.docId}>
                            <TableCell>
                              <div className="font-medium">{isAr ? l.nameAr || l.name : l.name}</div>
                              <div className="text-xs text-gray-500">{l.badgeId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={l.type === 'Annual' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100'}>
                                {l.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{l.startDate}</TableCell>
                            <TableCell>{l.endDate}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{l.reason || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? 'سجل التحويلات' : 'Transfers History'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead>{isAr ? 'الموظف' : 'Employee'}</TableHead>
                        <TableHead>{isAr ? 'الوجهة الجديدة' : 'To'}</TableHead>
                        <TableHead>{isAr ? 'تاريخ النقل' : 'Date'}</TableHead>
                        <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            {isAr ? 'لا توجد سجلات' : 'No records found.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        transfers.map(t => (
                          <TableRow key={t.docId}>
                            <TableCell>
                              <div className="font-medium">{isAr ? t.nameAr || t.name : t.name}</div>
                              <div className="text-xs text-gray-500">{t.badgeId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{t.toLocation}</Badge>
                            </TableCell>
                            <TableCell>{t.date}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{t.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}