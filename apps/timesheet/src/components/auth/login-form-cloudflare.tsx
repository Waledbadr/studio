"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@estatecare/ui/button";
import { Input } from "@estatecare/ui/input";
import { Label } from "@estatecare/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@estatecare/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { login, register, getCurrentUser } from "@/lib/auth";

export default function LoginFormCloudflare() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { toast } = useToast();
  const [appChoice, setAppChoice] = useState<"accommodation" | "materials" | "timesheet" | "finance">(() => {
    if (typeof window === 'undefined') return 'accommodation';
    const saved = window.localStorage.getItem('preferred-app') as any;
    return (saved === 'materials' || saved === 'accommodation' || saved === 'timesheet' || saved === 'finance') ? saved : 'accommodation';
  });

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) redirectAfterLogin();
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem('preferred-app', appChoice); } catch {}
  }, [appChoice]);

  const redirectAfterLogin = (fallbackChoice?: "accommodation" | "materials" | "timesheet" | "finance") => {
    const next = search?.get('next');
    if (next) {
      router.replace(next);
      return;
    }
    const choice = fallbackChoice || appChoice;
    const target = choice === 'materials' ? '/inventory' : choice === 'timesheet' ? '/timesheet' : choice === 'finance' ? '/income-expenses' : '/accommodation';
    router.replace(target);
  };

  const toASCII = (value: string) => value.replace(/[^\x00-\x7F]/g, '');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const emailValue = toASCII(email).trim().toLowerCase();
    const passwordValue = toASCII(password);

    if (!emailValue || !passwordValue || (mode === 'signup' && !name.trim())) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        await login(emailValue, passwordValue);
      } else {
        await register(name.trim(), emailValue, passwordValue);
      }
      redirectAfterLogin();
    } catch (err: any) {
      const message = err?.message || 'Authentication failed.';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/25 via-fuchsia-600/20 to-cyan-600/20" />
        <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative z-10 h-full p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-semibold shadow">
                EC
              </div>
              <span className="font-semibold">EstateCare</span>
            </div>
            <h2 className="text-2xl font-semibold leading-tight mb-2">Cloudflare auth</h2>
            <p className="text-sm text-muted-foreground/90 max-w-sm">
              This branch uses local JWT authentication and D1-backed user storage instead of Firebase Auth.
            </p>
          </div>
          <ul className="text-sm text-muted-foreground/90 grid gap-2 mt-8 marker:text-indigo-500 list-disc pl-4">
            <li>Email/password sign in</li>
            <li>Secure session cookie</li>
            <li>Cloudflare D1 user store</li>
          </ul>
        </div>
      </div>

      <div className="p-6">
        <CardHeader className="pb-3 p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{mode === 'signin' ? 'Sign in' : 'Create account'}</CardTitle>
            <div className="text-sm text-muted-foreground">EstateCare</div>
          </div>
          <CardDescription>{mode === 'signin' ? 'Sign in to your Cloudflare branch.' : 'Create a new account.'}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="grid gap-5">
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
              <Button size="sm" variant={mode === 'signin' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setMode('signin')}>
                Sign in
              </Button>
              <Button size="sm" variant={mode === 'signup' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setMode('signup')}>
                Create account
              </Button>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Open after login</Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 rounded-lg bg-muted p-1 text-xs">
                <Button type="button" size="sm" variant={appChoice === 'accommodation' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setAppChoice('accommodation')}>
                  Accommodation
                </Button>
                <Button type="button" size="sm" variant={appChoice === 'materials' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setAppChoice('materials')}>
                  Materials
                </Button>
                <Button type="button" size="sm" variant={appChoice === 'timesheet' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setAppChoice('timesheet')} title="قريباً">
                  Timesheet
                </Button>
                <Button type="button" size="sm" variant={appChoice === 'finance' ? 'default' : 'ghost'} className="rounded-md" onClick={() => setAppChoice('finance')} title="قريباً">
                  Income & Exp
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {mode === 'signup' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="pl-9" />
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" dir="ltr" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="pl-9" />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="pl-9 pr-10" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              {info ? <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{info}</div> : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
