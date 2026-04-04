'use client';

import { useState } from 'react';
import { collection, getDocs, doc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, UserCircle, Briefcase, Clock, FileText, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { AddEmployeeDialog } from '@/components/timesheet/employees/add-employee-dialog';
import { EmployeeProfileSheet } from '@/components/timesheet/employees/employee-profile-sheet';
import { HousingEmployeesProvider, useHousingEmployees, HousingEmployee } from '@/context/housing-employees-context';

function TimesheetEmployeesContent() {
  const { dict } = useLanguage();
  const { employees, loading } = useHousingEmployees();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<HousingEmployee | null>(null);
  const [syncing, setSyncing] = useState(false);

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.nameAr?.includes(searchTerm) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSyncFromRecords = async () => {
    try {
      setSyncing(true);
      // Fetch only the most recent attendance records to significantly reduce read costs
      const q = query(collection(db as any, 'attendanceRecords'), orderBy('date', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      const uniqueMap = new Map<string, any>();
      snapshot.forEach(d => {
        const data = d.data();
        if (data.employeeId && !uniqueMap.has(data.employeeId)) {
          uniqueMap.set(data.employeeId, {
            employeeId: data.employeeId,
            name: data.firstName || 'Unknown',
            nameAr: data.firstName || 'غير معروف',
            department: data.department || '',
            projectName: data.projectName || '',
            profession: data.department || 'Worker',
            professionAr: data.department || 'عامل',
            dailyHours: 8,
            monthlySalary: 0,
            status: 'Active'
          });
        }
      });

      let addedCount = 0;
      for (const [empId, empData] of uniqueMap.entries()) {
        const existing = employees.find(e => e.employeeId === empId);
        if (!existing) {
          const docRef = doc(collection(db as any, 'housingEmployees'));
          await setDoc(docRef, {
            id: docRef.id,
            ...empData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          addedCount++;
        }
      }

      toast({
        title: "Sync Complete",
        description: `Successfully imported ${addedCount} new employees from attendance records.`
      });
    } catch(err) {
      console.error(err);
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {(dict as any).timesheet?.employees || 'Employees Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {(dict as any).timesheet?.employeesDesc || 'Manage employee profiles, salaries, shifts, and leaves'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromRecords} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync from Records
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {(dict as any).timesheet?.addEmployee || 'Add Employee'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">
            {(dict as any).timesheet?.employeesList || 'Employees Directory'}
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={(dict as any).common?.search || 'Search employees...'}        
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mt-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Profession</th>
                  <th className="px-4 py-3 font-medium">Daily Hours</th>
                  <th className="px-4 py-3 font-medium">Salary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">{emp.nameAr}</div>
                          <div className="text-xs text-gray-500">{emp.name} ({emp.employeeId})</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        {emp.professionAr}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {emp.dailyHours} hrs
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {emp.monthlySalary} SR
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-blue-600" onClick={() => setSelectedEmployee(emp)}>
                        Profile & Leaves
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EmployeeProfileSheet 
        open={!!selectedEmployee} 
        onOpenChange={(open) => !open && setSelectedEmployee(null)} 
        employee={selectedEmployee} 
      />
    </div>
  );
}

export default function TimesheetEmployeesPage() {
  return (
    <HousingEmployeesProvider>
      <TimesheetEmployeesContent />
    </HousingEmployeesProvider>
  );
}
