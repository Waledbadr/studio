
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useResidences } from "@/context/residences-context";
import { type User, type UserThemeSettings } from "@/context/users-context";
import { Loader2, Palette, Check, ChevronsUpDown, X, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { colorThemes } from "@/lib/themes";
import { useLanguage } from "@/context/language-context";
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
import { Badge } from "@/components/ui/badge";

const formSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    role: z.enum(["Admin", "Supervisor", "Technician"]),
    assignedResidences: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one residence.",
    }),
    themeSettings: z
      .object({
        colorTheme: z.string(),
        mode: z.enum(["light", "dark", "system"]),
      })
      .optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const password = String(data.password ?? '').trim();
    const confirm = String(data.confirmPassword ?? '').trim();
    if (!password && !confirm) return;
    if (password.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must be at least 6 characters.' });
    }
    if (password !== confirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
  });

type UserFormData = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: User, password?: string) => void;
  user?: User | null;
  isLoading: boolean;
}

export function UserFormDialog({ isOpen, onOpenChange, onSave, user, isLoading }: UserFormDialogProps) {
  const { toast } = useToast();
  const { residences, loading: residencesLoading, loadResidences } = useResidences();
  const { locale, dict } = useLanguage();
  const isRTL = locale === 'ar';
  const inlineIconClass = isRTL ? 'ml-2' : 'mr-2';
  const [residencesOpen, setResidencesOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: "",
      email: "",
      role: "Technician",
      assignedResidences: [],
      themeSettings: {
          colorTheme: 'blue',
          mode: 'system',
      }
    },
  });

  const residenceOptions = useMemo(() => {
    return (residences || [])
      .filter((r) => r && typeof (r as any).id === 'string')
      .map((r) => ({
        id: (r as any).id as string,
        name: String((r as any).name ?? ''),
        city: String((r as any).city ?? ''),
      }))
      .sort((a, b) => `${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`));
  }, [residences]);

  const residenceById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; city: string }>();
    for (const r of residenceOptions) map.set(r.id, r);
    return map;
  }, [residenceOptions]);

  useEffect(() => {
    if (residences.length === 0) {
        loadResidences();
    }
  }, [loadResidences, residences.length]);

  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      if (user) {
        form.reset({
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role === 'Admin' || user.role === 'Supervisor' || user.role === 'Technician') ? user.role : 'Technician',
          assignedResidences: user.assignedResidences || [],
          themeSettings: user.themeSettings || { colorTheme: 'blue', mode: 'system' },
          password: '',
          confirmPassword: '',
        });
      } else {
        form.reset({
          id: undefined,
          name: "",
          email: "",
          role: "Technician",
          assignedResidences: [],
          themeSettings: { colorTheme: 'blue', mode: 'system' },
          password: '',
          confirmPassword: '',
        });
      }
    }
  }, [user, form, isOpen]);

  function onSubmit(data: UserFormData) {
    const userToSave: User = {
        id: user?.id || '',
        name: data.name,
        email: data.email,
        role: data.role,
        assignedResidences: data.assignedResidences,
        themeSettings: data.themeSettings as UserThemeSettings,
    };
    const password = String(data.password ?? '').trim();
    onSave(userToSave, password ? password : undefined);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? (dict.userForm?.editTitle || 'Edit User') : (dict.userForm?.addTitle || 'Add New User')}</DialogTitle>
          <DialogDescription>
            {user ? (dict.userForm?.editDescription || "Update the user's details and preferences.") : (dict.userForm?.addDescription || 'Fill in the details for the new user.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.userForm?.nameLabel || 'Name'}</FormLabel>
                          <FormControl>
                            <Input placeholder={dict.userForm?.namePlaceholder || 'e.g., Ahmed Al-Farsi'} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.userForm?.emailLabel || 'Email'}</FormLabel>
                          <FormControl>
                            <Input placeholder={dict.userForm?.emailPlaceholder || 'e.g., ahmed@email.com'} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.userForm?.roleLabel || 'Role'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={dict.userForm?.selectRolePlaceholder || 'Select a role'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Supervisor">Supervisor</SelectItem>
                              <SelectItem value="Technician">Technician</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="assignedResidences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">{dict.userForm?.assignedResidencesLabel || 'Assigned Residences'}</FormLabel>
                          <FormDescription>
                            {dict.userForm?.assignedResidencesDescription || 'Select the residences this user has access to.'}
                          </FormDescription>

                          <Popover open={residencesOpen} onOpenChange={setResidencesOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'w-full justify-between',
                                  residencesLoading && 'opacity-70',
                                  !field.value?.length && 'text-muted-foreground'
                                )}
                                disabled={residencesLoading}
                              >
                                {residencesLoading
                                  ? (dict.userForm?.loadingResidences || 'Loading residences...')
                                  : field.value?.length
                                    ? `${field.value.length} ${isRTL ? 'محدد' : 'selected'}`
                                    : (isRTL ? 'اختر السكنات...' : 'Select residences...')}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={isRTL ? 'بحث بالسكن...' : 'Search residences...'} />
                                <CommandList>
                                  <CommandEmpty>{isRTL ? 'لا توجد نتائج' : 'No results found.'}</CommandEmpty>
                                  <CommandGroup>
                                    <div className="flex items-center justify-between gap-2 px-2 py-2 border-b">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          form.setValue('assignedResidences', residenceOptions.map(r => r.id), { shouldDirty: true, shouldValidate: true });
                                        }}
                                      >
                                        {isRTL ? 'تحديد الكل' : 'Select all'}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          form.setValue('assignedResidences', [], { shouldDirty: true, shouldValidate: true });
                                        }}
                                      >
                                        {isRTL ? 'مسح' : 'Clear'}
                                      </Button>
                                    </div>

                                    {residenceOptions.map((r) => {
                                      const selected = (field.value || []).includes(r.id);
                                      return (
                                        <CommandItem
                                          key={r.id}
                                          value={`${r.name} ${r.city}`}
                                          onSelect={() => {
                                            const current = new Set(field.value || []);
                                            if (current.has(r.id)) current.delete(r.id);
                                            else current.add(r.id);
                                            form.setValue('assignedResidences', Array.from(current), { shouldDirty: true, shouldValidate: true });
                                          }}
                                        >
                                          <Check className={cn(inlineIconClass, 'h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                          <span className="truncate">{r.name}</span>
                                          {r.city ? (
                                            <span className={cn('text-xs text-muted-foreground', isRTL ? 'mr-auto' : 'ml-auto')}>{r.city}</span>
                                          ) : null}
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {!!field.value?.length && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {field.value
                                .map((id) => residenceById.get(id) || { id, name: id, city: '' })
                                .map((r) => (
                                  <Badge key={r.id} variant="secondary" className="gap-2">
                                    <span className="max-w-[220px] truncate">{r.name}{r.city ? ` (${r.city})` : ''}</span>
                                    <button
                                      type="button"
                                      className="rounded-sm opacity-70 hover:opacity-100"
                                      onClick={() => {
                                        form.setValue(
                                          'assignedResidences',
                                          (field.value || []).filter((x) => x !== r.id),
                                          { shouldDirty: true, shouldValidate: true }
                                        );
                                      }}
                                      aria-label={isRTL ? 'إزالة' : 'Remove'}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" /> {dict.userForm?.preferencesTitle || 'User Preferences'}
                  </FormLabel>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="themeSettings.mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.userForm?.themeModeLabel || 'Theme Mode'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">{dict.userForm?.themeModeLight || 'Light'}</SelectItem>
                              <SelectItem value="dark">{dict.userForm?.themeModeDark || 'Dark'}</SelectItem>
                              <SelectItem value="system">{dict.userForm?.themeModeSystem || 'System'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="themeSettings.colorTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.userForm?.colorThemeLabel || 'Color Theme'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colorThemes.map((theme) => (
                                <SelectItem key={theme.id} value={theme.id}>{theme.displayName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <FormLabel className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    {isRTL ? 'كلمة مرور الدخول' : 'Login password'}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'اترك الحقول فارغة لعدم تغيير كلمة المرور.' : 'Leave empty to keep the current password unchanged.'}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'كلمة المرور' : 'Password'}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={isRTL ? '••••••••' : '••••••••'}
                                autoComplete="new-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn('absolute top-1/2 -translate-y-1/2', isRTL ? 'left-1' : 'right-1')}
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isRTL ? 'تأكيد كلمة المرور' : 'Confirm password'}</FormLabel>
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder={isRTL ? '••••••••' : '••••••••'}
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{dict.userForm?.cancel || 'Cancel'}</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className={`${inlineIconClass} h-4 w-4 animate-spin`} />}
                {dict.userForm?.saveUser || 'Save User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
