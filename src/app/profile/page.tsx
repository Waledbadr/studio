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
import { updatePassword, updateEmail, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider, OAuthProvider, linkWithCredential, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { colorThemes } from '@/lib/themes';

export default function ProfilePage() {
  const router = useRouter();
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
          const targetEmail = email.trim();
          try {
            await updateEmail(auth.currentUser, targetEmail);
          } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/requires-recent-login') {
              // Re-auth then retry updateEmail
              const hasPassword = !!auth.currentUser.providerData.find(p => p.providerId === 'password');
              try {
                if (hasPassword) {
                  const current = prompt('For security, enter your current password to confirm email change:');
                  if (!current) throw new Error('Canceled');
                  const cred = EmailAuthProvider.credential(auth.currentUser.email || '', current);
                  await reauthenticateWithCredential(auth.currentUser, cred);
                } else {
                  // Try popup reauth for the primary provider
                  const provId = auth.currentUser.providerData[0]?.providerId;
                  const prov = provId === 'google.com' ? new GoogleAuthProvider() : new OAuthProvider(provId || 'microsoft.com');
                  await reauthenticateWithPopup(auth.currentUser, prov);
                }
                await updateEmail(auth.currentUser, targetEmail);
              } catch (reauthErr: any) {
                const c = reauthErr?.code || '';
                if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') {
                  throw new Error('Re-authentication canceled. Email not changed.');
                }
                throw reauthErr;
              }
            } else if (code === 'auth/email-already-in-use') {
              throw new Error('This email is already in use by another account.');
            } else {
              throw err;
            }
          }
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
    if (newPass.length < 6) { toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' }); return; }
    try {
      // First, try to update directly. Firebase will enforce recent login if needed.
      const email = auth.currentUser.email || '';
      const hasPasswordProvider = !!auth.currentUser.providerData.find(p => p.providerId === 'password');

      if (hasPasswordProvider) {
        try {
          await updatePassword(auth.currentUser, newPass);
          toast({ title: 'Password changed', description: 'Your password was updated. Please sign in again.' });
          try { await signOut(auth); } catch {}
          try { router.replace('/login'); } catch {}
          return;
        } catch (err: any) {
          const code = err?.code || '';
          if (code !== 'auth/requires-recent-login') throw err;
          // Need re-auth: ask for current password only in this case
          const current = prompt('Enter your current password to confirm:');
          if (!current) return;
          const cred = EmailAuthProvider.credential(email, current);
          try {
            await reauthenticateWithCredential(auth.currentUser, cred);
            await updatePassword(auth.currentUser, newPass);
            toast({ title: 'Password changed', description: 'Your password was updated. Please sign in again.' });
            try { await signOut(auth); } catch {}
            try { router.replace('/login'); } catch {}
            return;
          } catch (e: any) {
            const c = e?.code || '';
            if (c === 'auth/invalid-credential' || c === 'auth/wrong-password') {
              const doReset = confirm('Incorrect current password. Would you like to receive a password reset email?');
              if (doReset) {
                try {
                  const actionCodeSettings = {
                    url: typeof window !== 'undefined' ? window.location.origin + '/login' : 'http://localhost/login',
                    handleCodeInApp: false,
                  } as const;
                  await sendPasswordResetEmail(auth, email, actionCodeSettings);
                  toast({ title: 'Reset email sent', description: `Password reset link sent to ${email}.` });
                } catch (err2: any) {
                  const c2 = err2?.code || '';
                  if (c2 === 'auth/too-many-requests') {
                    toast({ title: 'Too many requests', description: 'Please wait and try again later.', variant: 'destructive' });
                  } else if (c2 === 'auth/invalid-email') {
                    toast({ title: 'Invalid email', description: 'Your account email looks invalid. Contact support.', variant: 'destructive' });
                  } else {
                    toast({ title: 'Error', description: err2?.message || 'Could not send reset email', variant: 'destructive' });
                  }
                }
              } else {
                toast({ title: 'Incorrect password', description: 'The current password you entered is incorrect.', variant: 'destructive' });
              }
              return;
            }
            if (c === 'auth/too-many-requests') {
              toast({ title: 'Too many attempts', description: 'Please wait a moment before trying again.', variant: 'destructive' });
              return;
            }
            throw e;
          }
        }
      } else {
        // If the user doesn't have a password provider (e.g., signed in with Google), link a password to the account.
        try {
          const newCred = EmailAuthProvider.credential(email, newPass);
          await linkWithCredential(auth.currentUser, newCred);
          toast({ title: 'Password set', description: 'A password has been added to your account. Please sign in again.' });
          try { await signOut(auth); } catch {}
          try { router.replace('/login'); } catch {}
        } catch (e: any) {
          const code = e?.code || '';
          if (code === 'auth/requires-recent-login') {
            toast({ title: 'Sign-in required', description: 'Please sign in again, then set your password.', variant: 'destructive' });
            return;
          }
          if (code === 'auth/credential-already-in-use') {
            toast({ title: 'Email in use', description: 'This email is already linked to a password.', variant: 'destructive' });
            return;
          }
          throw e;
        }
      }
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
