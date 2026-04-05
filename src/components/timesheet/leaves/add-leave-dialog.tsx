'use client';

import { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useHousingEmployees } from '@/context/housing-employees-context';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'Annual' | 'Sick' | 'Permission' | 'Resumption';
  initialData?: any;
  mode?: 'add' | 'edit';
  onSuccess?: () => void;
}

export function AddLeaveDialog({ open, onOpenChange, defaultType = 'Annual', initialData, mode = 'add', onSuccess }: AddLeaveDialogProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { employees, loading } = useHousingEmployees();

  const [submitting, setSubmitting] = useState(false);
  const [openEmployeeList, setOpenEmployeeList] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    type: defaultType,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
    reason: '',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setFormData({
          employeeId: initialData.employeeDocId || '',
          type: initialData.type || defaultType,
          startDate: initialData.startDate || format(new Date(), 'yyyy-MM-dd'),
          endDate: initialData.endDate || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
          reason: initialData.reason || initialData.notes || '',
        });
      } else {
        setFormData(prev => ({ ...prev, type: defaultType, employeeId: '', reason: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd') }));
        // Auto open and focus the search input when the dialog opens
        setTimeout(() => {
          setOpenEmployeeList(true);
        }, 100);
      }
    } else {
      setOpenEmployeeList(false);
    }
  }, [open, defaultType, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'الرجاء اختيار الموظف' : 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    setSubmitting(true);
    try {
      // --- Overlap Validation ---
      const q = query(collection(db as any, 'timesheetLeaves'), where('employeeDocId', '==', formData.employeeId));
      const snap = await getDocs(q);
      const existingRecords = snap.docs
        .map(d => ({ docId: d.id, ...d.data() as any }))
        .filter(item => item.docId !== initialData?.docId); 

      // Ranges A=[s1, e1], B=[s2, e2] overlap if: s1 <= e2 AND s2 <= e1
      const targetS = new Date(formData.startDate).getTime();
      const targetE = formData.endDate ? new Date(formData.endDate).getTime() : targetS;

      const conflict = existingRecords.find(item => {
        const exS = new Date(item.startDate).getTime();
        const exE = item.endDate ? new Date(item.endDate).getTime() : exS;
        
        // Skip some overlap checks if it's just a resumption note? 
        // Actually, user wants "no overlaps" generally.
        return (targetS <= exE && exS <= targetE);
      });

      if (conflict) {
        toast({
          title: isAr ? 'تعارض في المواعيد' : 'Schedule Conflict',
          description: isAr 
            ? `الموظف لديه طلب (${conflict.type}) مسجل بالفعل (من ${conflict.startDate} إلى ${conflict.endDate || conflict.startDate})`
            : `Employee already has a ${conflict.type} recorded (from ${conflict.startDate} to ${conflict.endDate || conflict.startDate})`,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }
      // --- End Validation ---
      if (mode === 'edit' && initialData?.docId) {
        const docRef = doc(db as any, 'timesheetLeaves', initialData.docId);
        await updateDoc(docRef, {
          employeeDocId: employee.id, // reference to housingEmployee doc
          employeeId: employee.employeeId || '', // badge/emp ID
          badgeId: employee.employeeId || '',
          name: employee.name || '',
          nameAr: employee.nameAr || employee.name || '',
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          updatedAt: new Date().toISOString(),
        });

        toast({
          title: isAr ? 'نجاح' : 'Success',
          description: isAr ? 'تم تحديث الطلب بنجاح' : 'Request updated successfully',
        });
      } else {
        const colRef = collection(db as any, 'timesheetLeaves');
        const docRef = doc(colRef);
        
        const payload = {
          id: docRef.id,
          employeeDocId: employee.id, // reference to housingEmployee doc
          employeeId: employee.employeeId || '', // badge/emp ID
          badgeId: employee.employeeId || '',
          name: employee.name || '',
          nameAr: employee.nameAr || employee.name || '',
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          status: 'Pending',
          createdAt: new Date().toISOString(),
        };

        await setDoc(docRef, payload);

        toast({
          title: isAr ? 'نجاح' : 'Success',
          description: isAr ? 'تم تسجيل الطلب بنجاح' : 'Request logged successfully',
        });
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      setFormData({
        employeeId: '',
        type: defaultType,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        reason: '',
      });
    } catch (error) {
      console.error('Error adding leave request:', error);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to save request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? (isAr ? 'تعديل الإجازة' : 'Edit Request') : (isAr ? 'تسجيل طلب جديد' : 'New Request')}
            </DialogTitle>
            <DialogDescription>
              {isAr ? 'قم بتعبئة بيانات الإجازة، الاستئذان، أو المباشرة.' : 'Fill the details for the leave, permission, or resumption.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Employee Selection */}
            <div className="grid gap-2 text-right relative">
              <Label>{isAr ? 'الموظف' : 'Employee'}</Label>
              <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployeeList}
                    onClick={() => setOpenEmployeeList(!openEmployeeList)}
                    className={cn(
                      "w-full justify-between items-center text-right font-normal focus:ring-1 focus:ring-ring focus:border-input z-10 relative",
                      !formData.employeeId && "text-muted-foreground"
                    )}
                    dir="rtl"
                  >
                    <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    {formData.employeeId
                      ? (() => {
                          const selectedEmp = employees.find(
                            (emp) => emp.id === formData.employeeId
                          );
                          return selectedEmp
                            ? `${isAr ? selectedEmp.nameAr || selectedEmp.name : selectedEmp.name} - ${selectedEmp.employeeId || selectedEmp.profession}`
                            : isAr ? 'اختر الموظف' : 'Select Employee';
                        })()
                      : isAr ? 'اختر الموظف...' : 'Select Employee...'}
                  </Button>
                {openEmployeeList && (
                  <div className="absolute top-full mt-2 w-full bg-popover text-popover-foreground border shadow-md rounded-md z-[9999]" dir={isAr ? 'rtl' : 'ltr'}>
                    <Command className="w-full">
                      <CommandInput autoFocus placeholder={isAr ? 'ابحث عن موظف بالاسم أو الرقم...' : 'Search employee by name or ID...'} dir="rtl" />
                      <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty>{isAr ? 'لم يتم العثور على موظف.' : 'No employee found.'}</CommandEmpty>
                        <CommandGroup>
                          {employees.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.employeeId || ''} ${emp.name || ''} ${emp.nameAr || ''} ${emp.profession || ''}`}
                              onSelect={() => {
                                setFormData({ ...formData, employeeId: emp.id });
                                setOpenEmployeeList(false);
                              }}
                              className="flex justify-between items-center cursor-pointer text-right w-full"
                            >
                              <span className="flex-1 text-right">
                                {isAr ? emp.nameAr || emp.name : emp.name} - {emp.employeeId || emp.profession}
                              </span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0 opacity-0 transition-opacity",
                                  formData.employeeId === emp.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>
            </div>

            {/* Request Type */}
            <div className="grid gap-2 text-right">
              <Label>{isAr ? 'نوع الطلب' : 'Request Type'}</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger className="text-right flex-row-reverse" dir="rtl">
                  <SelectValue placeholder={isAr ? 'اختر النوع' : 'Select Type'} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="Annual" className="text-right">{isAr ? 'إجازة سنوية' : 'Annual Leave'}</SelectItem>
                  <SelectItem value="Sick" className="text-right">{isAr ? 'إجازة مرضية' : 'Sick Leave'}</SelectItem>
                  <SelectItem value="Permission" className="text-right">{isAr ? 'استئذان' : 'Permission'}</SelectItem>
                  <SelectItem value="Resumption" className="text-right">{isAr ? 'مباشرة عمل' : 'Resumption'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="grid gap-2 text-right">
                <Label>{isAr ? (formData.type === 'Resumption' ? 'تاريخ المباشرة' : formData.type === 'Permission' ? 'وقت الخروج / التاريخ' : 'من تاريخ') : 'Start Date'}</Label>
                <Input 
                  type={formData.type === 'Permission' ? 'datetime-local' : 'date'}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              {/* End Date (Not required for Resumption/Permission sometimes, but we keep it uniform or hide it) */}
              {formData.type !== 'Resumption' && formData.type !== 'Permission' && (
                <div className="grid gap-2 text-right">
                  <Label>{isAr ? 'إلى تاريخ' : 'End Date'}</Label>
                  <Input 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required={formData.type !== 'Resumption'}
                  />
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="grid gap-2 text-right">
              <Label>{isAr ? 'المبرر / ملاحظات' : 'Reason / Notes'}</Label>
              <Textarea 
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={isAr ? 'اكتب ملاحظاتك هنا...' : 'Enter reason or notes...'}
                className="text-right"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row sm:justify-start gap-2 pb-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (mode === 'edit' ? (isAr ? 'تعديل الطلب' : 'Update Request') : (isAr ? 'حفظ الطلب' : 'Save Request'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}