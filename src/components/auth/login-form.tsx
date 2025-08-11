"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
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
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, KeyRound, Link2, Shield } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
    return () => unsub();
  }, [router]);

  // Complete magic link sign-in if applicable
  useEffect(() => {
    if (!auth) return;
    if (typeof window === 'undefined') return;
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail = window.localStorage.getItem('pendingEmailForLink');
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then(() => {
            window.localStorage.removeItem('pendingEmailForLink');
            router.replace('/');
          })
          .catch((e) => setError(e?.message || 'Magic link failed'));
      }
    }
  }, [router]);

  const ensureUserProfile = async (uid: string, data?: { name?: string; email?: string }) => {
    if (!db) return;
    const uidRef = doc(db, "users", uid);
    const uidSnap = await getDoc(uidRef);

    // Try to find any pre-provisioned doc by email (created from Users page) and merge it
    let merged = false;
    const email = data?.email;
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
          try { await deleteDoc(pre.ref); } catch {}
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
    if (!auth) {
      setError("Authentication is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          try { await updateProfile(cred.user, { displayName: name.trim() }); } catch {}
        }
        await ensureUserProfile(cred.user.uid, { name: name || cred.user.displayName || "User", email: cred.user.email || email });
      }
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const oauthHandler = async (provider: "google" | "microsoft") => {
    if (!auth) {
      setError("Authentication is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const prov = provider === "google" ? new GoogleAuthProvider() : new OAuthProvider("microsoft.com");
      const res = await signInWithPopup(auth, prov);
      await ensureUserProfile(res.user.uid, { name: res.user.displayName || undefined, email: res.user.email || undefined });
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "OAuth failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!auth) return setError("Authentication is not configured.");
    if (!email) return setError("Please enter your email first.");
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset email sent.');
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!auth) return setError("Authentication is not configured.");
    if (!email) return setError("Please enter your email first.");
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? window.location.origin + '/login' : 'http://localhost/login',
        handleCodeInApp: true,
      } as const;
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem('pendingEmailForLink', email.trim());
      setInfo('Magic link sent to your email.');
    } catch (e: any) {
      setError(e?.message || 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!auth) return setError('Authentication is not configured.');
    try {
      const user = auth.currentUser;
      if (!user) return setError('Sign in once, then register a passkey.');

      const challengeRes = await fetch('/api/auth/webauthn-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', user: { id: user.uid, name: user.displayName || 'User', email: user.email || '' } })
      });
      const options = await challengeRes.json();
      const attResp = await startRegistration(options);

      await fetch('/api/auth/webauthn-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', user: { id: user.uid, name: user.displayName || 'User', email: user.email || '' }, response: attResp })
      });
      setInfo('Passkey registered successfully.');
    } catch (e: any) {
      setError(e?.message || 'Passkey registration failed.');
    }
  };

  const handlePasskeyLogin = async () => {
    if (!auth) return setError('Authentication is not configured.');
    try {
      const provisionalUserId = auth.currentUser?.uid || email || 'anonymous';
      const challengeRes = await fetch('/api/auth/webauthn-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'authenticate', user: { id: provisionalUserId, name: '', email } })
      });
      const options = await challengeRes.json();
      const assertion = await startAuthentication(options);

      const verifyRes = await fetch('/api/auth/webauthn-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'authenticate', user: { id: provisionalUserId, name: '', email }, response: assertion })
      });
      const verified = await verifyRes.json();
      if (verified.verified) {
        setInfo('Passkey verified.');
        router.replace('/');
      } else {
        setError('Passkey authentication failed.');
      }
    } catch (e: any) {
      setError(e?.message || 'Passkey login failed.');
    }
  };

  return (
    <Card className="shadow-xl border border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <div className="text-sm text-muted-foreground">EstateCare</div>
        </div>
        <CardDescription>
          {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex gap-2 rounded-md bg-muted p-1">
            <Button variant={mode === "signin" ? "default" : "ghost"} className="w-full" onClick={() => setMode("signin")}>Sign in</Button>
            <Button variant={mode === "signup" ? "default" : "ghost"} className="w-full" onClick={() => setMode("signup")}>Create account</Button>
          </div>

          <form onSubmit={handleEmailPassword} className="grid gap-3">
            {mode === "signup" && (
              <div className="grid gap-1">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="pr-10" />
                </div>
              </div>
            )}
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="pr-10" />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="pr-10" />
                <Lock className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <div className="flex items-center gap-2 my-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">Or continue with</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-2">
              <Button variant="outline" onClick={() => oauthHandler("google")} disabled={loading}>
                <img alt="" src="https://www.google.com/favicon.ico" className="h-4 w-4 mr-2" /> Continue with Google
              </Button>
              <Button variant="outline" onClick={() => oauthHandler("microsoft")} disabled={loading}>
                <img alt="" src="https://learn.microsoft.com/favicon.ico" className="h-4 w-4 mr-2" /> Continue with Microsoft
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={handleMagicLink} disabled={loading}>
                  <Link2 className="h-4 w-4 mr-2" /> Magic Link
                </Button>
                <Button type="button" variant="outline" onClick={handlePasskeyLogin}>
                  <KeyRound className="h-4 w-4 mr-2" /> Passkey
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={handlePasskeyRegister} className="justify-start text-xs text-muted-foreground hover:text-foreground">
                <Shield className="h-3.5 w-3.5 mr-2" /> Register a Passkey (after your first sign-in)
              </Button>
            </div>

            {mode === "signin" && (
              <button type="button" className={cn("text-sm text-muted-foreground hover:underline text-left")}
                onClick={handleReset}>
                Forgot your password?
              </button>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
