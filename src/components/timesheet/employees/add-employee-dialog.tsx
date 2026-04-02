'use client';

import { useState } from 'react';
import { useHousingEmployees, HousingEmployee } from '@/context/housing-employees-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const { addEmployee } = useHousingEmployees();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    nameAr: '',
    profession: '',
    professionAr: '',
    dailyHours: 8,
    monthlySalary: 0,
    status: 'Active' as const,
    residenceStatus: 'Inside' as const,
    residenceLocation: 'Main Camp',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyHours' || name === 'monthlySalary' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await addEmployee(formData);
      onOpenChange(false);
      setFormData({
        employeeId: '', name: '', nameAr: '', profession: '', professionAr: '',
        dailyHours: 8, monthlySalary: 0, status: 'Active', residenceStatus: 'Inside', residenceLocation: 'Main Camp'
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Housing Employee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee ID / Badge No</Label>
              <Input name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="e.g. E1023" />
            </div>
            <div className="space-y-2">
              <Label>Salary (Monthly)</Label>
              <Input name="monthlySalary" type="number" value={formData.monthlySalary} onChange={handleChange} placeholder="e.g. 4500" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name (English)</Label>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Name (Arabic)</Label>
              <Input name="nameAr" value={formData.nameAr} onChange={handleChange} placeholder="جون دو" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profession (English)</Label>
              <Input name="profession" value={formData.profession} onChange={handleChange} placeholder="Technician" />
            </div>
            <div className="space-y-2">
              <Label>Profession (Arabic)</Label>
              <Input name="professionAr" value={formData.professionAr} onChange={handleChange} placeholder="فني" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Work Hours</Label>
              <Input name="dailyHours" type="number" value={formData.dailyHours} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Residence Status</Label>
              <Select value={formData.residenceStatus} onValueChange={(val) => handleSelectChange('residenceStatus', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inside">Inside Camp</SelectItem>
                  <SelectItem value="Outside">Outside Camp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
