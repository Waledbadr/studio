"use client";

import React, { useEffect, useState } from 'react';
import { useUsers, type User, type UserThemeSettings } from '@/context/users-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { colorThemes } from '@/lib/themes';

export default function ProfilePage() {
  const { currentUser, saveUser } = useUsers();
  const { locale, setLocale, dict } = useLanguage();
  const { toast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [themeMode, setThemeMode] = useState<UserThemeSettings['mode']>(currentUser?.themeSettings?.mode || 'system');
  const [colorTheme, setColorTheme] = useState(currentUser?.themeSettings?.colorTheme || 'blue');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(currentUser?.name || '');
    setEmail(currentUser?.email || '');
  setPhone(currentUser?.phone || '');
    setThemeMode(currentUser?.themeSettings?.mode || 'system');
    setColorTheme(currentUser?.themeSettings?.colorTheme || 'blue');
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const updated: User = { ...currentUser, name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, language: locale, themeSettings: { colorTheme, mode: themeMode } };
      await saveUser(updated);
      // If email changed and Firebase auth available, update auth email as well
      try {
        if (auth && auth.currentUser && auth.currentUser.email !== email.trim()) {
          await updateEmail(auth.currentUser, email.trim());
        }
      } catch (e: any) {
        // Non-fatal: notify user that auth email couldn't be updated
        toast({ title: 'Note', description: `Could not update authentication email: ${e?.message}` });
      }
      try { setLocale(locale); } catch {}
      toast({ title: 'Saved', description: 'Profile updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save profile', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!auth || !auth.currentUser) { toast({ title: 'Unavailable', description: 'Auth not configured.' }); return; }
    const newPass = prompt('Enter new password (min 6 chars):');
    if (!newPass) return;
    try {
      // If user signed-in with email/password we may need to reauthenticate. Ask for current password.
      const provider = auth.currentUser.providerData.find(p => p.providerId === 'password');
      if (provider) {
        const current = prompt('Enter your current password to confirm:');
        if (!current) return;
        const cred = EmailAuthProvider.credential(auth.currentUser.email || '', current);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await updatePassword(auth.currentUser, newPass);
      toast({ title: 'Password changed', description: 'Your password was updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Could not change password', variant: 'destructive' });
    }
  };

  const handleChangeLanguage = (l: 'en' | 'ar') => {
    try { setLocale(l); toast({ title: 'Language', description: `Language set to ${l}` }); } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Update your personal details and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Change your name, email and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional phone number" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>Save Profile</Button>
            <Button variant="outline" onClick={handleChangePassword}>Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Theme and language preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Theme Mode</Label>
            <Select value={themeMode} onValueChange={(v: any) => setThemeMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color Theme</Label>
            <Select value={colorTheme} onValueChange={(v: any) => setColorTheme(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {colorThemes.map(t => <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Language</Label>
            <Select value={locale} onValueChange={(v: any) => handleChangeLanguage(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
