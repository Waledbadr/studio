"use client";

import { useState, useEffect } from "react";
import { useAccommodation, Worker } from "@/context/accommodation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, UserPlus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddWorkerDialogProps {
  trigger?: React.ReactNode;
  onWorkerAdded?: (worker: Worker) => void;
  defaultName?: string;
}

export function AddWorkerDialog({ trigger, onWorkerAdded, defaultName = "" }: AddWorkerDialogProps) {
  const { saveWorker, companies } = useAccommodation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    employeeId: "",
    nationality: "",
    company: "",
    role: "Worker" as "Worker" | "Supervisor" | "Engineer",
  });

  // Update name when defaultName changes or dialog opens
  useEffect(() => {
    if (open && defaultName) {
      setFormData(prev => ({ ...prev, name: defaultName }));
    }
  }, [open, defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.idNumber) {
      toast({
        title: "Missing fields",
        description: "Name and ID Number are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newWorker: Worker = {
        id: `w_${Date.now()}`,
        ...formData,
      };

      await saveWorker(newWorker);

      toast({
        title: "Success",
        description: "Worker added successfully",
      });

      if (onWorkerAdded) {
        onWorkerAdded(newWorker);
      }

      setOpen(false);
      setFormData({
        name: "",
        idNumber: "",
        employeeId: "",
        nationality: "",
        company: "",
        role: "Worker",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add worker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8">
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            Add New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Add a new worker to the database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              placeholder="Full Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idNumber" className="text-right">
              ID / Iqama *
            </Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="col-span-3"
              placeholder="National ID / Iqama"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeId" className="text-right">
              Emp. ID
            </Label>
            <Input
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="col-span-3"
              placeholder="Company ID"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nationality" className="text-right">
              Nationality
            </Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="col-span-3"
              placeholder="e.g. Indian, Filipino"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companyOpen}
                  className="col-span-3 justify-between font-normal"
                >
                  {formData.company
                    ? companies.find((c) => c.name === formData.company)?.name || formData.company
                    : "Select company..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search company..." />
                  <CommandList>
                    <CommandEmpty>No company found.</CommandEmpty>
                    <CommandGroup>
                      {companies.map((company) => (
                        <CommandItem
                          key={company.id}
                          value={company.name}
                          onSelect={(currentValue) => {
                            setFormData({ ...formData, company: currentValue });
                            setCompanyOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.company === company.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {company.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(val: any) => setFormData({ ...formData, role: val })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Worker">Worker</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Worker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
