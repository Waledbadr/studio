import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[hsl(216,45%,8%)] text-white"
      style={{
        fontFamily: '"Iowan Old Style", "Palatino Linotype", "Times New Roman", serif',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(210,166,98,0.28),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(124,196,255,0.2),transparent_36%),radial-gradient(circle_at_50%_120%,rgba(236,182,127,0.16),transparent_52%),linear-gradient(145deg,#07111f_0%,#0d1f35_45%,#09172a_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-amber-200/20 bg-amber-200/10 blur-3xl" />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-7xl">
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/5 px-5 py-4 backdrop-blur-xl sm:px-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-amber-200/45 bg-gradient-to-br from-amber-200/70 to-orange-400/80 text-sm font-bold text-slate-900 shadow-[0_8px_30px_rgba(240,180,90,0.45)]">
                EC
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-amber-100/80">EstateCare Suite</p>
                <p className="text-xl font-semibold text-white sm:text-2xl">Command Console</p>
              </div>
            </div>
            <p className="hidden text-right text-xs text-slate-200/90 sm:block">
              Secure access for accommodation, inventory, and operational workflows.
            </p>
          </div>

          <h1 className="sr-only">Sign in</h1>
          <LoginForm />

          <p className="mt-6 text-center text-xs text-slate-300/80">
            By continuing, you agree to EstateCare terms and privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
}
