
import LoginForm from "@/components/auth/login-form";
import { getDictionary } from "@/lib/dictionary-client";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [dict, setDict] = useState<any>(null);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // Example: get language from localStorage or browser
    const lang = typeof window !== 'undefined' ? (window.localStorage.getItem('lang') || navigator.language || 'en') : 'en';
    setDirection(lang.startsWith('ar') ? 'rtl' : 'ltr');
    getDictionary(lang.startsWith('ar') ? 'ar' : 'en').then(setDict);
  }, []);

  if (!dict) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" dir={direction}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/25 to-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-emerald-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.10),transparent_55%),radial-gradient(60%_50%_at_50%_100%,rgba(236,72,153,0.10),transparent_55%)]" />

      {/* Content */}
      <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white/80 dark:bg-black/30 rounded-xl shadow-xl p-4 sm:p-8 flex flex-col items-center">
          <div className="mb-8 flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold shadow-lg">
              EC
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              EstateCare
            </div>
          </div>
          <h1 className="sr-only">{dict.ui?.signIn || 'Sign in'}</h1>
          <LoginForm dict={dict} direction={direction} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {dict.ui?.loginTerms || 'By continuing you agree to our Terms and Privacy Policy.'}
          </p>
        </div>
      </main>
    </div>
  );
}
