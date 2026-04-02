'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HousingEmployee, useHousingEmployees } from '@/context/housing-employees-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plane, Activity, Calendar } from 'lucide-react';

interface EmployeeProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: HousingEmployee | null;
}

export function EmployeeProfileSheet({ open, onOpenChange, employee }: EmployeeProfileSheetProps) {
  const { updateEmployee } = useHousingEmployees();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('general');
  const [generalData, setGeneralData] = useState<Partial<HousingEmployee>>({});

  // Leave State
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveData, setLeaveData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Transfer State
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({
    type: 'Move In',
    date: '',
    location: '',
    reason: ''
  });

  // Reset local state when employee changes
  useEffect(() => {
    if (employee) {
      setGeneralData(employee);
      
      // Fetch Leaves
      const qLeaves = query(
        collection(db, 'timesheetLeaves'),
        where('employeeId', '==', employee.id),
        orderBy('createdAt', 'desc')
      );
      const unsubLeaves = onSnapshot(qLeaves, (snap) => {
        setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Fetch Transfers
      const qTransfers = query(
        collection(db, 'timesheetTransfers'),
        where('employeeId', '==', employee.id),
        orderBy('createdAt', 'desc')
      );
      const unsubTransfers = onSnapshot(qTransfers, (snap) => {
        setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubLeaves();
        unsubTransfers();
      };
    }
  }, [employee]);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralData(prev => ({
      ...prev,
      [name]: name === 'dailyHours' || name === 'monthlySalary' ? Number(value) : value
    }));
  };

  const saveGeneralData = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      await updateEmployee(employee.id, generalData);
      toast({ title: 'Success', description: 'Employee updated' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update employee', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Leave
  const submitLeave = async () => {
    if (!employee || !leaveData.startDate || !leaveData.endDate) {
      toast({ title: 'Required', description: 'Please fill start and end dates', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'timesheetLeaves'), {
        employeeId: employee.id,
        badgeId: employee.employeeId,
        name: employee.name,
        nameAr: employee.nameAr,
        ...leaveData,
        createdAt: serverTimestamp()
      });
      // Optionally update employee status
      if (new Date() >= new Date(leaveData.startDate) && new Date() <= new Date(leaveData.endDate)) {
        await updateEmployee(employee.id, { status: 'On Leave' });
      }
      setShowLeaveForm(false);
      setLeaveData({ type: 'Annual', startDate: '', endDate: '', reason: '' });
      toast({ title: 'Success', description: 'Leave recorded' });
    } catch(err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not save leave', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Transfer
  const submitTransfer = async () => {
    if (!employee || !transferData.date) {
      toast({ title: 'Required', description: 'Please fill transfer date', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'timesheetTransfers'), {
        employeeId: employee.id,
        badgeId: employee.employeeId,
        name: employee.name,
        nameAr: employee.nameAr,
        ...transferData,
        createdAt: serverTimestamp()
      });
      
      // Update employee location status
      await updateEmployee(employee.id, { 
        residenceStatus: transferData.type === 'Move In' ? 'Inside' : 'Outside',
        residenceLocation: transferData.location || employee.residenceLocation || '',
        status: transferData.type === 'Move Out' ? 'Transferred' : 'Active'
      });
      
      setShowTransferForm(false);
      setTransferData({ type: 'Move In', date: '', location: '', reason: '' });
      toast({ title: 'Success', description: 'Transfer recorded' });
    } catch(err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not save transfer', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] w-[95vw] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{generalData.nameAr || employee.nameAr} - {generalData.name || employee.name}</SheetTitle>
          <SheetDescription>Badge ID: {generalData.employeeId || employee.employeeId} | Role: {generalData.professionAr || employee.professionAr}</SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">Profile Details</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4 space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-widest mb-4">Edit Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input name="nameAr" value={generalData.nameAr || ''} onChange={handleGeneralChange} />
              </div>
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input name="name" value={generalData.name || ''} onChange={handleGeneralChange} />
              </div>

              <div className="space-y-2">
                <Label>Profession (Arabic)</Label>
                <Input name="professionAr" value={generalData.professionAr || ''} onChange={handleGeneralChange} />
              </div>
              <div className="space-y-2">
                <Label>Profession (English)</Label>
                <Input name="profession" value={generalData.profession || ''} onChange={handleGeneralChange} />
              </div>

              <div className="space-y-2">
                <Label>Employee ID (Badge)</Label>
                <Input name="employeeId" value={generalData.employeeId || ''} onChange={handleGeneralChange} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input name="department" value={generalData.department || ''} onChange={handleGeneralChange} />
              </div>

              <div className="space-y-2">
                <Label>Project / Residence</Label>
                <Input name="projectName" value={generalData.projectName || ''} onChange={handleGeneralChange} />
              </div>
            </div>

            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-widest mt-6 mb-4">Employment Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Work Hours (RH)</Label>
                <Input name="dailyHours" type="number" value={generalData.dailyHours || 8} onChange={handleGeneralChange} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Salary (SR)</Label>
                <Input name="monthlySalary" type="number" value={generalData.monthlySalary || 0} onChange={handleGeneralChange} />
              </div>
              <div className="space-y-2">
                <Label>Employee Status</Label>
                <Select value={generalData.status || employee.status} onValueChange={(val) => setGeneralData(prev => ({ ...prev, status: val as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Residence Status</Label>
                <Select value={generalData.residenceStatus || employee.residenceStatus || 'Inside'} onValueChange={(val) => setGeneralData(prev => ({ ...prev, residenceStatus: val as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inside">Inside Camp</SelectItem>
                    <SelectItem value="Outside">Outside Camp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4" onClick={saveGeneralData} disabled={loading}>
              {loading ? 'Saving...' : 'Update Details'}
            </Button>
          </TabsContent>
          
          <TabsContent value="leaves" className="mt-4">
            <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-900 mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Request New Leave</p>
                <p className="text-xs text-gray-500">Add sick or annual leave</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowLeaveForm(!showLeaveForm)}>
                {showLeaveForm ? 'Cancel' : '+ New Leave'}
              </Button>
            </div>

            {showLeaveForm && (
              <div className="bg-white dark:bg-gray-950 border p-4 rounded-md mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select value={leaveData.type} onValueChange={(val) => setLeaveData(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual">Annual Leave / إجازة سنوية</SelectItem>
                        <SelectItem value="Sick">Sick Leave / إجازة مرضية</SelectItem>
                        <SelectItem value="Emergency">Emergency Leave / إجازة اضطرارية</SelectItem>
                        <SelectItem value="Unpaid">Unpaid / بدون راتب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Input value={leaveData.reason} onChange={(e) => setLeaveData(p => ({ ...p, reason: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={leaveData.startDate} onChange={(e) => setLeaveData(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={leaveData.endDate} onChange={(e) => setLeaveData(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={submitLeave} disabled={loading}>Submit Leave Request</Button>
              </div>
            )}

            {leaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border rounded">
                No leave records found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((lv) => (
                  <div key={lv.id} className="border flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${lv.type === 'Sick' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{lv.type} Leave</p>
                        <p className="text-xs text-gray-500">{lv.startDate} to {lv.endDate}</p>
                      </div>
                    </div>
                    {lv.reason && <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{lv.reason}</span>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transfers" className="mt-4">
            <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-900 mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Transfer Employee</p>
                <p className="text-xs text-gray-500">Move in/out of camp permanently or temporarily</p>
              </div>
              <Button size="sm" variant="outline" className="text-blue-600" onClick={() => setShowTransferForm(!showTransferForm)}>
                {showTransferForm ? 'Cancel' : 'New Transfer'}
              </Button>
            </div>

            {showTransferForm && (
              <div className="bg-white dark:bg-gray-950 border p-4 rounded-md mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select value={transferData.type} onValueChange={(val) => setTransferData(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Move In">Move In (داخل السكن)</SelectItem>
                        <SelectItem value="Move Out">Move Out (خارج السكن/نقل)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={transferData.date} onChange={(e) => setTransferData(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Target Location / Project</Label>
                    <Input value={transferData.location} onChange={(e) => setTransferData(p => ({ ...p, location: e.target.value }))} placeholder="E.g., King Aziz Hospital Camp" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes / Reason</Label>
                    <Input value={transferData.reason} onChange={(e) => setTransferData(p => ({ ...p, reason: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={submitTransfer} disabled={loading}>Submit Transfer Record</Button>
              </div>
            )}

            {transfers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border rounded">
                No transfer history found.
              </div>
            ) : (
               <div className="space-y-3">
                {transfers.map((tr) => (
                  <div key={tr.id} className="border flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tr.type === 'Move In' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Plane className={`h-4 w-4 ${tr.type === 'Move Out' ? 'rotate-45' : 'rotate-[135deg]'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tr.type} <span className="text-gray-400 font-normal">({tr.date})</span></p>
                        <p className="text-xs text-gray-500">{tr.location || 'Unknown Location'}</p>
                      </div>
                    </div>
                    {tr.reason && <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{tr.reason}</span>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
