"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        router.replace("/");
      }
    } catch (e) {
      // User not authenticated, stay on login page
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "signup" && !name) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "signin"
        ? { email, password }
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json() as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast({
        title: mode === "signin" ? "Welcome back!" : "Account created!",
        description: data.message || "Success"
      });

      router.replace("/");
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left info panel (shown on large screens) */}
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
            <h2 className="text-2xl font-semibold leading-tight mb-2">All-in-one operations</h2>
            <p className="text-sm text-muted-foreground/90 max-w-sm">
              Streamline inventory, maintenance, and accommodation workflows in one secure workspace.
            </p>
          </div>
          <ul className="text-sm text-muted-foreground/90 grid gap-2 mt-8 marker:text-indigo-500 list-disc pl-4">
            <li>Secure authentication with JWT</li>
            <li>Cloudflare D1 database</li>
            <li>Fast, reliable performance</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="p-6">
        <CardHeader className="pb-3 p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <div className="text-sm text-muted-foreground">EstateCare</div>
          </div>
          <CardDescription>
            {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="grid gap-5">
            {/* Segmented control */}
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
              <Button
                size="sm"
                variant={mode === "signin" ? "default" : "ghost"}
                className="rounded-md"
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                variant={mode === "signup" ? "default" : "ghost"}
                className="rounded-md"
                onClick={() => setMode("signup")}
              >
                Create account
              </Button>
            </div>

            <form onSubmit={handleEmailPassword} className="grid gap-4">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
