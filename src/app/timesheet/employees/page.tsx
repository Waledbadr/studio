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

// Master list provided by housing admin for core employees
// Maps badge ID to Arabic/English names and professions
const EMPLOYEE_MASTER: Record<string, { nameAr: string; name: string; professionAr: string; profession: string }> = {
  '40097': { nameAr: 'محمد العبدلي', name: 'Mohammed Al-Abdali', professionAr: 'إداري', profession: 'Administrator' },
  '28590': { nameAr: 'صدر قريشي', name: 'Sadr Qureshi', professionAr: 'مسؤول سكن', profession: 'Camp Boss / Housing Officer' },
  '50541': { nameAr: 'عبدالرحمن بهاتي', name: 'Abdulrahman Bhatti', professionAr: 'تسكين عمالة', profession: 'Housing Coordinator' },
  '34187': { nameAr: 'بلال قاضي', name: 'Bilal Qazi', professionAr: 'سباك', profession: 'Plumber' },
  '45768': { nameAr: 'جيمانتور ساربين', name: 'Jimantor Sarbin', professionAr: 'حداد', profession: 'Steel Fixer' },
  '49491': { nameAr: 'سلمان خان', name: 'Salman Khan', professionAr: 'عامل', profession: 'Laborer' },
  '49498': { nameAr: 'محمد مبارك', name: 'Mohammed Mubarik', professionAr: 'عامل', profession: 'Laborer' },
  '49545': { nameAr: 'محمد يونس', name: 'Mohammad Yunus', professionAr: 'كهربائي', profession: 'Electrician' },
  '49112': { nameAr: 'محمد أيوب', name: 'Mohammed Ayub', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51121': { nameAr: 'نظام الدين أحمد', name: 'Nizamudin Ahmad', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51155': { nameAr: 'شاكيب شاكر', name: 'Shakib Shaker', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49902': { nameAr: 'زبيل محمد', name: 'Zubail Mohammed', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '41099': { nameAr: 'محمد عبده', name: 'Mohammed Abdu', professionAr: 'مسؤول سكن', profession: 'Camp Boss / Housing Officer' },
  '35512': { nameAr: 'خالد أحمد', name: 'Khalid Ahmed', professionAr: 'مدخل بيانات', profession: 'Data Entry' },
  '45914': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'فني تكييف', profession: 'AC Technician' },
  '48571': { nameAr: 'محمد توصيف', name: 'Mohammad Tauseef', professionAr: 'سائق', profession: 'Driver' },
  '36048': { nameAr: 'بارو ديبو', name: 'Baru Dibu', professionAr: 'حداد', profession: 'Steel Fixer' },
  '28824': { nameAr: 'ألطاف بسياتي', name: 'Altaf Basiyati', professionAr: 'تسكين عمالة', profession: 'Housing Coordinator' },
  '31524': { nameAr: 'شهزاد أحمد', name: 'Shahzad Ahmed', professionAr: 'فني صيانة', profession: 'Maintenance Technician' },
  '30556': { nameAr: 'أيوب خان', name: 'Ayub Khan', professionAr: 'كهربائي', profession: 'Electrician' },
  '50156': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'سباك', profession: 'Plumber' },
  '49499': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'عامل', profession: 'Laborer' },
  '48878': { nameAr: 'عابد محمد', name: 'Abid Mohammed', professionAr: 'بناء', profession: 'Mason' },
  '49646': { nameAr: 'كمران محمود', name: 'Kamran Mahmoud', professionAr: 'بناء', profession: 'Mason' },
  '50210': { nameAr: 'ألطاف رفيق', name: 'Altaf Rafik', professionAr: 'عامل', profession: 'Laborer' },
  '51153': { nameAr: 'عديل أحمد', name: 'Adeel Ahmed', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51068': { nameAr: 'يوميد أكرم', name: 'Yumid Akram', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '30739': { nameAr: 'أكبر بسياتي', name: 'Akbar Basiyati', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '29820': { nameAr: 'إعجاز عبدالرحمن', name: 'Ijaz Abdulrahman', professionAr: 'سائق', profession: 'Driver' },
  '49546': { nameAr: 'ريحان خان', name: 'Rehan Khan', professionAr: 'كهربائي', profession: 'Electrician' },
  '50271': { nameAr: 'عاقب حسين', name: 'Aakib Hussain', professionAr: 'عامل', profession: 'Laborer' },
  '49502': { nameAr: 'محمد عمران', name: 'Mohammed Imran', professionAr: 'عامل', profession: 'Laborer' },
  '49916': { nameAr: 'نديم شريف', name: 'Nadeem Sharif', professionAr: 'فني تكييف', profession: 'AC Technician' },
  '39710': { nameAr: 'شرفي كشاف', name: 'Sharafi Kashaf', professionAr: 'مسؤول سكن', profession: 'Camp Boss / Housing Officer' },
  '39988': { nameAr: 'أحمد الزهراني', name: 'Ahmed Al-Zahrani', professionAr: 'مدخل بيانات', profession: 'Data Entry' },
  '29541': { nameAr: 'خالد علي', name: 'Khalid Ali', professionAr: 'مشرف سكن', profession: 'Housing Supervisor' },
  '32888': { nameAr: 'محسن سيل', name: 'Mohsen Sail', professionAr: 'سائق', profession: 'Driver' },
  '31628': { nameAr: 'أبوبكر سلام', name: 'Abubakar Salam', professionAr: 'كهربائي', profession: 'Electrician' },
  '50082': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'فني تكييف', profession: 'AC Technician' },
  '50083': { nameAr: 'خورشيد علم', name: 'Khurshed Alam', professionAr: 'سباك', profession: 'Plumber' },
  '51255': { nameAr: 'شاه رفيق', name: 'Shah Rafiq', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49490': { nameAr: 'رباني جميل', name: 'Rabbanee Jamil', professionAr: 'عامل', profession: 'Laborer' },
  '37475': { nameAr: 'محمد غافر', name: 'Mohammed Ghafir', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '30807': { nameAr: 'محمد دايار', name: 'Mohammed Dayar', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51256': { nameAr: 'عابد خان', name: 'Abid Khan', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '29778': { nameAr: 'محمد الدين', name: 'Mohammed Aldin', professionAr: 'مشرف سكن', profession: 'Housing Supervisor' },
  '51096': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51098': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49481': { nameAr: 'محمد فرمان', name: 'Mohammad Farman', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49484': { nameAr: 'شاهنواز إرشاد', name: 'Sahanwaj Irsad', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '48969': { nameAr: 'ظهير علي', name: 'Zaheer Ali', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49485': { nameAr: 'محمد إسرائيل', name: 'Mohd Israil', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '27990': { nameAr: 'محمد عريف', name: 'Mohammed Arif', professionAr: 'مشرف سكن', profession: 'Housing Supervisor' },
  '40666': { nameAr: 'محمد أبوعاصي', name: 'Mohammed Abu Asi', professionAr: 'مسؤول سكن', profession: 'Camp Boss / Housing Officer' },
  '34207': { nameAr: 'محمد سيكا', name: 'Mohammed Sika', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '49237': { nameAr: 'أسلم علي', name: 'Aslam Ali', professionAr: 'عامل', profession: 'Laborer' },
  '50079': { nameAr: '(بدون اسم)', name: '(No Name)', professionAr: 'فني تكييف', profession: 'AC Technician' },
  '30239': { nameAr: 'محمد حسين', name: 'Mohammed Hussain', professionAr: 'مدخل بيانات', profession: 'Data Entry' },
  '48891': { nameAr: 'شير خان', name: 'Sher Khan', professionAr: 'سائق', profession: 'Driver' },
  '49776': { nameAr: 'نظام علي', name: 'Nizam Ali', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '34238': { nameAr: 'ذاكر رفيق', name: 'Jakir Rafiq', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '50874': { nameAr: 'هيثم إبراهيم', name: 'Haysam Ibrahim', professionAr: 'مسؤول سكن', profession: 'Camp Boss / Housing Officer' },
  '51537': { nameAr: 'محمد حمودة', name: 'Mohamed Hamouda', professionAr: 'مدخل بيانات', profession: 'Data Entry' },
  '49975': { nameAr: 'يسري علي', name: 'Yusri Ali', professionAr: 'فني تكييف', profession: 'AC Technician' },
  '32886': { nameAr: 'عبدالحكيم الغنامي', name: 'Abdulhakim Al-Ghanami', professionAr: 'كهربائي', profession: 'Electrician' },
  '51499': { nameAr: 'نبيل أبو الفتوح', name: 'Nabil Abu Al-Fotouh', professionAr: 'سباك', profession: 'Plumber' },
  '50674': { nameAr: 'جابر خان', name: 'Jabir Khan', professionAr: 'عامل', profession: 'Laborer' },
  '51183': { nameAr: 'سونو أحمد', name: 'Sonu Ahmed', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51120': { nameAr: 'سمير حسين', name: 'Sameer Husain', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '50675': { nameAr: 'سهيل شريف', name: 'Sohel Sarif', professionAr: 'عامل', profession: 'Laborer' },
  '33412': { nameAr: 'أمين ديورا', name: 'Amin Dewra', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51254': { nameAr: 'فهيم أحمد', name: 'Faheem Ahmad', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '51101': { nameAr: 'عبدالرؤوف علي', name: 'Abdul Rauf Ali', professionAr: 'عامل نظافة', profession: 'Cleaner' },
  '14192': { nameAr: 'شكور محمد', name: 'Shakur Mohammed', professionAr: 'تسكين عمالة', profession: 'Housing Coordinator' },
};

function TimesheetEmployeesContent() {
  const { dict } = useLanguage();
  const { employees, loading, updateEmployee } = useHousingEmployees();
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

  const handleApplyMasterData = async () => {
    try {
      let updated = 0;
      for (const [badgeId, data] of Object.entries(EMPLOYEE_MASTER)) {
        const emp = employees.find(e => e.employeeId === badgeId);
        if (!emp) continue;
        await updateEmployee(emp.id, {
          nameAr: data.nameAr,
          name: data.name,
          professionAr: data.professionAr,
          profession: data.profession,
        } as Partial<HousingEmployee>);
        updated++;
      }
      toast({
        title: 'Master data applied',
        description: `Updated ${updated} employees from provided list.`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Update failed', variant: 'destructive' });
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
          <Button variant="outline" onClick={handleApplyMasterData}>
            <FileText className="mr-2 h-4 w-4" />
            Apply Master Names
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
