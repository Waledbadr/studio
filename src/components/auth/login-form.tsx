"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/platform";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithRedirect,
  getRedirectResult,
} from '@/lib/auth-shim';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, deleteDoc } from '@/lib/realtime-shim';
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, KeyRound, Link2, Shield, User, Gem, Building2, Sparkles } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  // Which app to open after login
  const [appChoice, setAppChoice] = useState<"accommodation" | "materials">(() => {
    if (typeof window === 'undefined') return 'accommodation';
    const saved = window.localStorage.getItem('preferred-app');
    return (saved === 'materials' || saved === 'accommodation') ? saved : 'accommodation';
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // First-run helper: if D1 is enabled and there are no users yet, guide the user to create the first account.
  useEffect(() => {
    const USE_D1 =
      String(
        (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
      ).toLowerCase() === 'true';
    if (!USE_D1) return;

    let cancelled = false;
    (async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('D1 timeout')), 3500));
        const users = await Promise.race([
          (await import('@/lib/d1-client')).getUsers(),
          timeout,
        ]) as any[];
        if (cancelled) return;
        if (Array.isArray(users) && users.length === 0) {
          setMode('signup');
          toast({
            title: 'First-time setup',
            description: 'لا يوجد مستخدمون في قاعدة البيانات. قم بإنشاء أول حساب (سيتم تعيينه Admin تلقائيًا).',
          });
        }
      } catch {
        // Ignore: D1 may be offline or protected; normal sign-in will show an error if needed.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Restrict inputs to ASCII (English) characters only for email & password
  const toASCII = (s: string) => s.replace(/[^\x00-\x7F]/g, "");
  const [emailNonAscii, setEmailNonAscii] = useState(false);
  const [passwordNonAscii, setPasswordNonAscii] = useState(false);
  const onEmailChange = (v: string) => {
    const ascii = toASCII(v);
    const isNonAscii = v !== ascii;
    if (isNonAscii && !emailNonAscii) {
      toast({ title: 'English only', description: 'Please type using English (ASCII) characters.', variant: 'destructive' });
    }
    setEmailNonAscii(isNonAscii);
    setEmail(ascii);
  };
  const onPasswordChange = (v: string) => {
    const ascii = toASCII(v);
    const isNonAscii = v !== ascii;
    if (isNonAscii && !passwordNonAscii) {
      toast({ title: 'English only', description: 'Please type using English (ASCII) characters.', variant: 'destructive' });
    }
    setPasswordNonAscii(isNonAscii);
    setPassword(ascii);
  };

  // Persist preferred app choice for OAuth/MagicLink redirect flows
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem('preferred-app', appChoice); } catch { }
  }, [appChoice]);

  const redirectAfterLogin = (fallbackChoice?: "accommodation" | "materials") => {
    const next = search?.get('next');
    if (next) {
      router.replace(next);
      return;
    }
    const choice = fallbackChoice || appChoice;
    const target = choice === 'materials' ? '/inventory' : '/accommodation';
    router.replace(target);
  };

  useEffect(() => {
    if (typeof onAuthStateChanged !== 'function') return;
    const unsub = onAuthStateChanged(null as any, (u) => {
      console.debug('[LOGIN] onAuthStateChanged fired, user=', u);
      if (u) {
        try {
          redirectAfterLogin();
        } catch (e) {
          console.error('[LOGIN] redirectAfterLogin error', e);
        }
      }
    });
    return () => { try { unsub(); } catch { } };
  }, [router, appChoice, search]);

  // Handle OAuth redirect result if popup fallback was used
  useEffect(() => {
    if (typeof getRedirectResult !== 'function') return;
    (getRedirectResult(null as any) as Promise<any>)
      .then(async (res: any) => {
        // Type guard: check res and res.user
        if (res && res.user && typeof res.user === 'object' && 'uid' in res.user) {
          await ensureUserProfile(res.user.uid, { name: res.user.displayName || undefined, email: res.user.email || undefined });
          // Use persisted choice because UI state may be reset after redirect
          let persisted: "accommodation" | "materials" | null = null;
          try {
            const saved = typeof window !== 'undefined' ? window.localStorage.getItem('preferred-app') : null;
            if (saved === 'materials' || saved === 'accommodation') persisted = saved;
          } catch { }
          redirectAfterLogin(persisted || undefined);
        }
      })
      .catch(() => {/* ignore */ });
  }, [router]);

  // Complete magic link sign-in if applicable
  useEffect(() => {
    if (typeof isSignInWithEmailLink !== 'function') return;
    if (typeof signInWithEmailLink !== 'function') return;
    if (typeof window === 'undefined') return;
    if (isSignInWithEmailLink(null as any, window.location.href)) {
      const savedEmail = window.localStorage.getItem('pendingEmailForLink');
      if (savedEmail) {
        signInWithEmailLink(null as any, savedEmail, window.location.href)
          .then(() => {
            window.localStorage.removeItem('pendingEmailForLink');
            let persisted: "accommodation" | "materials" | null = null;
            try {
              const saved = typeof window !== 'undefined' ? window.localStorage.getItem('preferred-app') : null;
              if (saved === 'materials' || saved === 'accommodation') persisted = saved;
            } catch { }
            redirectAfterLogin(persisted || undefined);
          })
          .catch((e) => {
            const msg = e?.message || 'Magic link failed';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
          });
      }
    }
  }, [router]);

  const ensureUserProfile = async (uid: string, data?: { name?: string; email?: string }) => {
    const USE_D1 =
      String(
        (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
      ).toLowerCase() === 'true';
    const email = data?.email;

    if (USE_D1) {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('D1 timeout')), 5000)
        );

        // Look for pre-provisioned user by email
        if (email) {
          try {
            const users = await Promise.race([
              (await import('@/lib/d1-client')).getUsers(),
              timeout
            ]);
            const pre = (users || []).find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
            if (pre && pre.id !== uid) {
              // Merge into target UID
              const merged = {
                name: data?.name || pre.name || 'User',
                email,
                role: pre.role || 'Technician',
                assignedResidences: pre.assignedResidences || [],
                themeSettings: pre.themeSettings || { colorTheme: 'blue', mode: 'system' },
                createdAt: pre.createdAt || new Date().toISOString()
              };
              await (await import('@/lib/d1-client')).updateUser(uid, merged).catch(() => { });
              return;
            }
          } catch (e) {
            console.warn('D1 getUsers failed:', (e as any)?.message);
          }
        }

        // Ensure ID exists by attempting to create or update
        const payload = {
          name: data?.name || 'User',
          email: data?.email || '',
          role: 'Technician',
          assignedResidences: [],
          themeSettings: { colorTheme: 'blue', mode: 'system' },
          createdAt: new Date().toISOString()
        };
        // Try update first, then create if update didn't create a row (createUser always inserts)
        // Use fire-and-forget for D1 in local dev - don't block on failure
        (await import('@/lib/d1-client')).updateUser(uid, payload).catch(() => { });
        (await import('@/lib/d1-client')).createUser(uid, payload).catch(() => { });
        return;
      } catch (e) {
        console.warn('D1 ensureUserProfile failed:', e);
        // Don't block on D1 errors in local dev
        return;
      }
    }

    if (!db) return;
    const uidRef = doc(db, "users", uid);
    const uidSnap = await getDoc(uidRef);

    // Try to find any pre-provisioned doc by email (created from Users page) and merge it
    let merged = false;
    if (email) {
      const q = query(collection(db, "users"), where("email", "==", email));
      const qs = await getDocs(q);
      for (const pre of qs.docs) {
        if (pre.id !== uid) {
          const preData = pre.data();
          await setDoc(uidRef, {
            name: data?.name || preData.name || "User",
            email,
            role: preData.role || "Technician",
            assignedResidences: preData.assignedResidences || [],
            themeSettings: preData.themeSettings || { colorTheme: "blue", mode: "system" },
            createdAt: preData.createdAt || serverTimestamp(),
          }, { merge: true });
          try { await deleteDoc(pre.ref); } catch { }
          merged = true;
          break;
        }
      }
    }

    if (!uidSnap.exists() && !merged) {
      await setDoc(uidRef, {
        name: data?.name || "User",
        email: data?.email || "",
        role: "Technician",
        assignedResidences: [],
        themeSettings: { colorTheme: "blue", mode: "system" },
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof signInWithEmailAndPassword !== 'function') {
      const msg = "Authentication is not configured.";
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return;
    }
    // Guard: ensure English-only (ASCII) for email & password
    const sanitizedEmail = toASCII(email).trim();
    const sanitizedPassword = toASCII(password);
    if (sanitizedEmail !== email.trim() || sanitizedPassword !== password) {
      const msg = "Please use English (ASCII) characters for email and password only.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setEmail(sanitizedEmail);
      setPassword(sanitizedPassword);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
        // For signin, let onAuthStateChanged listener handle redirect
      } else {
        const cred = await createUserWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
        if (name.trim()) {
          try { await updateProfile(cred.user, { displayName: name.trim() }); } catch { }
        }
        // Ensure profile exists before redirecting
        await ensureUserProfile(cred.user.uid, { name: name || cred.user.displayName || "User", email: cred.user.email || sanitizedEmail });
        // Small delay to allow user state propagation
        await new Promise(r => setTimeout(r, 500));
        redirectAfterLogin();
      }
    } catch (err: any) {
      const code = err?.code || '';
      const map: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/invalid-email': 'The email address is badly formatted.',
        'auth/user-disabled': 'This user account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      };
      const msg = map[code] || err?.message || "Failed. Try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const oauthHandler = async (provider: "google" | "microsoft") => {
    if (provider === "google") {
      setLoading(true);
      window.location.href = "/api/auth/google";
      return;
    }

    if (typeof signInWithPopup !== 'function') {
      const msg = "Authentication is not configured.";
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const prov = new OAuthProvider("microsoft.com");
      try {
        const res = await signInWithPopup(auth, prov);
        // Type guard: check res and res.user
        if (res && res.user && typeof res.user === 'object' && 'uid' in res.user) {
          await ensureUserProfile(res.user.uid, { name: res.user.displayName || undefined, email: res.user.email || undefined });
          redirectAfterLogin();
        }
      } catch (popupErr: any) {
        const c = popupErr?.code || '';
        const msg = popupErr?.message || '';
        // Fallback to redirect for browsers/extensions that block popups or third-party cookies
        if (c === 'auth/popup-blocked' || c === 'auth/popup-closed-by-user' || /blocked|cookies|third.?party/i.test(msg)) {
          if (typeof signInWithRedirect === 'function') {
            await signInWithRedirect(auth, prov);
          } else {
            window.location.href = "/api/auth/microsoft";
          }
          return; // result handled in getRedirectResult effect
        }
        throw popupErr;
      }
    } catch (err: any) {
      const msg = err?.message || "OAuth failed.";
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (typeof sendPasswordResetEmail !== 'function') {
      toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
      return;
    }
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? window.location.origin + '/login' : 'http://localhost/login',
        handleCodeInApp: false,
      } as const;
      await sendPasswordResetEmail(null as any, toASCII(email).trim(), actionCodeSettings);
      toast({ title: 'Email sent', description: 'Password reset email sent.' });
    } catch (err: any) {
      const code = err?.code || '';
      const map: Record<string, string> = {
        'auth/invalid-email': 'The email address is badly formatted.',
        'auth/user-not-found': 'If an account exists for this email, a reset link will be sent.',
        'auth/too-many-requests': 'Too many requests. Please wait and try again.',
      };
      const msg = map[code] || err?.message || "Failed to send reset email.";
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (typeof sendSignInLinkToEmail !== 'function') {
      toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
      return;
    }
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? window.location.origin + '/login' : 'http://localhost/login',
        handleCodeInApp: true,
      } as const;
      const asciiEmail = toASCII(email).trim();
      await sendSignInLinkToEmail(null as any, asciiEmail, actionCodeSettings);
      window.localStorage.setItem('pendingEmailForLink', asciiEmail);
      toast({ title: 'Email sent', description: 'Magic link sent to your email.' });
    } catch (e: any) {
      const msg = e?.message || 'Failed to send magic link.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meJson: any = await meRes.json().catch(() => ({} as any));
      const user = meJson?.user;
      if (!user) {
        toast({ title: 'Error', description: 'Sign in once, then register a passkey.', variant: 'destructive' });
        return;
      }

      const challengeRes = await fetch('/api/auth/webauthn-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', user: { id: user.id, name: user.name || 'User', email: user.email || '' } })
      });
      const options: any = await challengeRes.json();
      const attResp = await startRegistration(options);

      await fetch('/api/auth/webauthn-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', user: { id: user.id, name: user.name || 'User', email: user.email || '' }, response: attResp })
      });
      toast({ title: 'Passkey', description: 'Passkey registered successfully.' });
    } catch (e: any) {
      const msg = e?.message || 'Passkey registration failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      const provisionalUserId = email || 'anonymous';
      const challengeRes = await fetch('/api/auth/webauthn-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'authenticate', user: { id: provisionalUserId, name: '', email } })
      });
      const options: any = await challengeRes.json();
      const assertion = await startAuthentication(options);

      const verifyRes = await fetch('/api/auth/webauthn-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'authenticate', user: { id: provisionalUserId, name: '', email }, response: assertion })
      });
      const verified: any = await verifyRes.json();
      if (verified.verified) {
        toast({ title: 'Passkey', description: 'Passkey verified.' });
        let persisted: "accommodation" | "materials" | null = null;
        try {
          const saved = typeof window !== 'undefined' ? window.localStorage.getItem('preferred-app') : null;
          if (saved === 'materials' || saved === 'accommodation') persisted = saved;
        } catch { }
        redirectAfterLogin(persisted || undefined);
      } else {
        const msg = 'Passkey authentication failed.';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    } catch (e: any) {
      const msg = e?.message || 'Passkey login failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Card className="overflow-hidden border border-white/25 bg-white/10 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid lg:grid-cols-[1.02fr_1fr]">
      <div className="relative hidden min-h-[660px] lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(152deg,rgba(245,192,111,0.3)_0%,rgba(140,198,255,0.2)_36%,rgba(12,27,44,0.82)_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-9 text-slate-50">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/20 px-3 py-1 text-xs font-medium tracking-[0.12em]">
              <Sparkles className="h-3.5 w-3.5" />
              LUXURY OPERATIONS PLATFORM
            </div>

            <h2 className="max-w-md text-4xl font-semibold leading-[1.12] text-white">
              إدارة ذكية بتجربة
              <span className="block text-amber-100">فخمة وحديثة</span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-100/90">
              لوحة موحدة لإدارة السكن، المواد، والصيانة بسرعة عالية، أمان أقوى، وتجربة استخدام تليق بمنظومتك.
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="rounded-xl border border-white/35 bg-white/10 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-2 font-semibold text-white">
                <Gem className="h-4 w-4" />
                Premium Access
              </div>
              <p className="text-slate-100/85">Passkey, Magic Link, and enterprise-grade session security.</p>
            </div>
            <div className="rounded-xl border border-white/35 bg-white/10 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-2 font-semibold text-white">
                <Building2 className="h-4 w-4" />
                Built for Scale
              </div>
              <p className="text-slate-100/85">One sign-in gateway to Accommodation and Materials workflows.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:p-9">
        <CardHeader className="space-y-3 p-0 pb-5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-2xl font-semibold text-white sm:text-[1.9rem]">Welcome to EstateCare</CardTitle>
            <span className="rounded-full border border-white/30 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-amber-100">
              SECURE
            </span>
          </div>
          <CardDescription className="text-slate-200/85">
            {mode === "signin" ? "Sign in to continue your operational workflow." : "Create your account and enter your workspace."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-0">
          <div className="grid grid-cols-2 rounded-xl border border-white/20 bg-white/10 p-1 text-sm">
            <Button
              type="button"
              size="sm"
              variant={mode === "signin" ? "default" : "ghost"}
              className={cn("rounded-lg", mode === "signin" && "bg-white text-slate-900 hover:bg-white/95")}
              onClick={() => setMode("signin")}
            >
              Sign in
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "signup" ? "default" : "ghost"}
              className={cn("rounded-lg", mode === "signup" && "bg-white text-slate-900 hover:bg-white/95")}
              onClick={() => setMode("signup")}
            >
              Create account
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-200/80">Open after login</Label>
            <div className="grid grid-cols-2 rounded-xl border border-white/20 bg-white/10 p-1 text-sm">
              <Button
                type="button"
                size="sm"
                variant={appChoice === 'accommodation' ? 'default' : 'ghost'}
                className={cn("rounded-lg", appChoice === 'accommodation' && "bg-amber-100 text-slate-900 hover:bg-amber-100/95")}
                onClick={() => setAppChoice('accommodation')}
              >
                Accommodation
              </Button>
              <Button
                type="button"
                size="sm"
                variant={appChoice === 'materials' ? 'default' : 'ghost'}
                className={cn("rounded-lg", appChoice === 'materials' && "bg-amber-100 text-slate-900 hover:bg-amber-100/95")}
                onClick={() => setAppChoice('materials')}
              >
                Materials
              </Button>
            </div>
          </div>

          <form onSubmit={handleEmailPassword} className="grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-slate-200">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="h-11 border-white/25 bg-white/10 pl-9 text-white placeholder:text-slate-300/70"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  inputMode="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 border-white/25 bg-white/10 pl-9 text-white placeholder:text-slate-300/70"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="h-11 border-white/25 bg-white/10 pl-9 pr-10 text-white placeholder:text-slate-300/70"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-amber-200 to-orange-300 text-slate-900 shadow-[0_10px_25px_rgba(240,180,90,0.35)] transition hover:from-amber-100 hover:to-orange-200"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <div className="flex items-center gap-2">
              <Separator className="flex-1 bg-white/25" />
              <span className="text-xs text-slate-200/80">Or continue with</span>
              <Separator className="flex-1 bg-white/25" />
            </div>

            <div className="grid gap-2">
              <Button variant="outline" className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => oauthHandler("google")} disabled={loading}>
                <img alt="" src="https://www.google.com/favicon.ico" className="mr-2 h-4 w-4" /> Continue with Google
              </Button>
              <Button variant="outline" className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => oauthHandler("microsoft")} disabled={loading}>
                <img alt="" src="https://learn.microsoft.com/favicon.ico" className="mr-2 h-4 w-4" /> Continue with Microsoft
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" className="h-10 bg-white/90 text-slate-900 hover:bg-white" onClick={handleMagicLink} disabled={loading}>
                  <Link2 className="mr-2 h-4 w-4" /> Magic Link
                </Button>
                <Button type="button" variant="outline" className="h-10 border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={handlePasskeyLogin}>
                  <KeyRound className="mr-2 h-4 w-4" /> Passkey
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={handlePasskeyRegister} className="justify-start text-xs text-slate-200/85 hover:bg-white/10 hover:text-white">
                <Shield className="mr-2 h-3.5 w-3.5" /> Register a Passkey (after your first sign-in)
              </Button>
            </div>

            {mode === "signin" && (
              <button
                type="button"
                className={cn("text-left text-sm text-slate-200/85 transition hover:text-white hover:underline")}
                onClick={handleReset}
              >
                Forgot your password?
              </button>
            )}
          </form>
        </CardContent>
      </div>
    </Card>
  );
}
