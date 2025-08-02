
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useResidences } from "@/context/residences-context";
import { type User, type UserThemeSettings } from "@/context/users-context";
import { Loader2, Palette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { colorThemes } from "@/lib/themes";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(["Admin", "Supervisor", "Technician"]),
  assignedResidences: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one residence.",
  }),
  language: z.enum(["en", "ar"]).optional(),
  themeSettings: z.object({
      colorTheme: z.string(),
      mode: z.enum(['light', 'dark', 'system']),
  }).optional(),
});

type UserFormData = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: User) => void;
  user?: User | null;
  isLoading: boolean;
}

export function UserFormDialog({ isOpen, onOpenChange, onSave, user, isLoading }: UserFormDialogProps) {
  const { toast } = useToast();
  const { residences, loading: residencesLoading, loadResidences } = useResidences();
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: "",
      email: "",
      role: "Technician",
      assignedResidences: [],
      language: 'en',
      themeSettings: {
          colorTheme: 'blue',
          mode: 'system',
      }
    },
  });

  useEffect(() => {
    if (residences.length === 0) {
        loadResidences();
    }
  }, [loadResidences, residences.length]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedResidences: user.assignedResidences || [],
          language: user.language || 'en',
          themeSettings: user.themeSettings || { colorTheme: 'blue', mode: 'system' },
        });
      } else {
        form.reset({
          id: undefined,
          name: "",
          email: "",
          role: "Technician",
          assignedResidences: [],
          language: 'en',
          themeSettings: { colorTheme: 'blue', mode: 'system' },
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
        language: data.language,
        themeSettings: data.themeSettings as UserThemeSettings,
    };
    onSave(userToSave);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user's details and preferences." : "Fill in the details for the new user."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ahmed Al-Farsi" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ahmed@email.com" {...field} />
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
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
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
             <FormField
                control={form.control}
                name="assignedResidences"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Assigned Residences</FormLabel>
                        <FormDescription>
                        Select the residences this user has access to.
                        </FormDescription>
                    </div>
                    <ScrollArea className="h-40 rounded-md border p-4">
                        {residencesLoading ? <p>Loading residences...</p> : residences.map((residence) => (
                            <FormField
                            key={residence.id}
                            control={form.control}
                            name="assignedResidences"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={residence.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(residence.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), residence.id])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                    (value) => value !== residence.id
                                                )
                                                );
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {residence.name}
                                    </FormLabel>
                                </FormItem>
                                );
                            }}
                            />
                        ))}
                    </ScrollArea>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2 pt-2 border-t">
                <FormLabel className="flex items-center gap-2 pt-4">
                    <Palette className="h-4 w-4" /> User Preferences
                </FormLabel>
                 <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">العربية</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="themeSettings.mode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Theme Mode</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                 <FormField
                    control={form.control}
                    name="themeSettings.colorTheme"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Color Theme</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {colorThemes.map(theme => (
                                    <SelectItem key={theme.id} value={theme.id}>{theme.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
