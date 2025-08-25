'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  LayoutDashboard,
  Wrench,
  PackageSearch,
  BarChart3,
  ChevronRight,
  Globe2,
  Moon,
  SunMedium,
} from 'lucide-react';
import Link from 'next/link';

export default function ElegantPreviewPage() {
  const { locale, toggleLanguage } = useLanguage();
  const { resolvedMode, setMode } = useTheme();

  const t = useMemo(() => {
    if (locale === 'ar') {
      return {
        heroTitle: 'EstateCare — التصميم الجديد',
        heroSubtitle: 'تصميم زجاجي فاخر، شفاف وعصري يركز على الإنتاجية.',
        getStarted: 'ابدأ الآن',
        explore: 'استعراض',
        quickActions: 'إجراءات سريعة',
        metrics: 'مؤشرات',
        requests: 'الطلبات',
        maintenance: 'الصيانة',
        inventory: 'المخزون',
        reports: 'التقارير',
        livePreview: 'معاينة مباشرة للوضع واللغة',
        english: 'English',
        arabic: 'العربية',
        light: 'فاتح',
        dark: 'داكن',
        viewDashboard: 'عرض لوحة القيادة',
      } as const;
    }
    return {
      heroTitle: 'EstateCare — New Design',
      heroSubtitle: 'Luxury, transparent glassmorphism. Modern and focused.',
      getStarted: 'Get Started',
      explore: 'Explore',
      quickActions: 'Quick Actions',
      metrics: 'Metrics',
      requests: 'Requests',
      maintenance: 'Maintenance',
      inventory: 'Inventory',
      reports: 'Reports',
      livePreview: 'Live preview of mode and language',
      english: 'English',
      arabic: 'العربية',
      light: 'Light',
      dark: 'Dark',
      viewDashboard: 'View Dashboard',
    } as const;
  }, [locale]);

  const isRTL = locale === 'ar';

  return (
    <div className="relative min-h-[calc(100vh-5rem)]">{/* inside AppLayout main padding */}
      {/* Background gradient and orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl dark:bg-accent/30" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-2xl dark:from-primary/20 dark:via-secondary/20 dark:to-accent/20" />
      </div>

      {/* Hero */}
      <section className={cn(
        'relative mx-auto mb-8 mt-2 max-w-7xl rounded-3xl border',
        'bg-white/60 dark:bg-white/5 backdrop-blur-2xl',
        'border-white/30 dark:border-white/10 shadow-[0_10px_50px_-15px_rgba(0,0,0,0.3)]'
      )}>
        <div className={cn('grid gap-6 p-6 md:grid-cols-2 md:p-10', isRTL && 'text-right')}> 
          <div className="flex flex-col justify-center gap-4">
            <Badge variant="outline" className="w-fit backdrop-blur border-white/40 dark:border-white/20 bg-white/40 dark:bg-white/10">
              <Sparkles className="mr-2 inline h-4 w-4" />
              {t.livePreview}
            </Badge>
            <h1 className={cn('text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl', isRTL && 'leading-[1.2]')}>{t.heroTitle}</h1>
            <p className="text-muted-foreground md:text-lg">{t.heroSubtitle}</p>

            <div className={cn('flex flex-wrap items-center gap-3', isRTL && 'justify-end')}> 
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/">
                  {t.viewDashboard}
                  <ChevronRight className={cn('ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5', isRTL && 'rotate-180 ml-0 mr-2')} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="backdrop-blur border-white/40 dark:border-white/20 bg-white/40 dark:bg-white/10">
                {t.explore}
              </Button>
            </div>

            {/* Toggles */}
            <div className={cn('mt-2 flex flex-wrap items-center gap-2', isRTL && 'justify-end')}>
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
                <Globe2 className="h-4 w-4" />
                <span>{locale === 'ar' ? t.english : t.arabic}</span>
              </Button>
              <div className="h-5 w-px bg-border" />
              {resolvedMode === 'dark' ? (
                <Button variant="ghost" size="sm" onClick={() => setMode('light')} className="gap-2">
                  <SunMedium className="h-4 w-4" /> {t.light}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setMode('dark')} className="gap-2">
                  <Moon className="h-4 w-4" /> {t.dark}
                </Button>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Glass phone mock */}
            <div className="relative mx-auto h-[360px] w-full max-w-sm rounded-[2rem] border border-white/30 bg-white/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              <div className="mx-auto h-2 w-16 rounded-full bg-black/10 dark:bg-white/20" />
              <div className="mt-4 grid gap-3">
                <div className="h-10 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 dark:from-primary/40 dark:to-accent/40" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-xl bg-white/60 backdrop-blur dark:bg-white/10" />
                  <div className="h-20 rounded-xl bg-white/60 backdrop-blur dark:bg-white/10" />
                  <div className="h-20 rounded-xl bg-white/60 backdrop-blur dark:bg-white/10" />
                </div>
                <div className="h-24 rounded-xl bg-white/60 backdrop-blur dark:bg-white/10" />
              </div>
              <div className="pointer-events-none absolute -inset-[2px] rounded-[2rem] ring-1 ring-white/40 dark:ring-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Metrics */}
        <GlassCard>
          <CardHeader className={cn('flex flex-row items-center justify-between space-y-0 pb-2', isRTL && 'flex-row-reverse')}>
            <CardTitle className="text-sm font-medium">{t.metrics}</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('grid grid-cols-2 gap-4', isRTL && 'text-right')}>
              <Stat label={t.requests} value="128" trend="+12%" />
              <Stat label={t.maintenance} value="42" trend="+5%" />
              <Stat label={t.inventory} value="3,245" trend="+2%" />
              <Stat label={t.reports} value="18" trend="+1%" />
            </div>
          </CardContent>
        </GlassCard>

        {/* Quick actions */}
        <GlassCard>
          <CardHeader className={cn('space-y-1', isRTL && 'text-right')}>
            <CardTitle className="text-sm font-medium">{t.quickActions}</CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar' ? 'أنشئ طلبًا جديدًا أو ابدأ مهمة مباشرة.' : 'Start a new request or jump into a task.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn('grid gap-3', isRTL && 'text-right')}>
              <Action href="/inventory/new-order" icon={<PackageSearch className="h-4 w-4" />}>
                {locale === 'ar' ? 'طلب مواد جديد' : 'New Materials Request'}
              </Action>
              <Action href="/maintenance/new" icon={<Wrench className="h-4 w-4" />}>
                {locale === 'ar' ? 'بلاغ صيانة' : 'Maintenance Ticket'}
              </Action>
              <Action href="/reports" icon={<BarChart3 className="h-4 w-4" />}>
                {locale === 'ar' ? 'التقارير الذكية' : 'Smart Reports'}
              </Action>
            </div>
          </CardContent>
        </GlassCard>

        {/* Collections */}
        <GlassLink
          title={t.inventory}
          href="/inventory"
          icon={<PackageSearch className="h-5 w-5" />}
          gradient="from-emerald-400/30 to-cyan-400/30"
          rtl={isRTL}
        />
        <GlassLink
          title={t.maintenance}
          href="/maintenance"
          icon={<Wrench className="h-5 w-5" />}
          gradient="from-amber-400/30 to-orange-400/30"
          rtl={isRTL}
        />
      </section>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      {children}
    </Card>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-xl border border-white/30 bg-white/40 p-3 backdrop-blur dark:border-white/10 dark:bg-white/10">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-emerald-600 dark:text-emerald-400">{trend}</div>
    </div>
  );
}

function Action({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Button asChild variant="secondary" className="justify-between rounded-xl border border-white/30 bg-white/60/50 backdrop-blur dark:border-white/10 dark:bg-white/10">
      <Link href={href} className="flex w-full items-center">
        <span className="flex items-center gap-2">
          {icon}
          {children}
        </span>
        <ChevronRight className="ml-auto h-4 w-4 rtl:rotate-180" />
      </Link>
    </Button>
  );
}

function GlassLink({ title, href, icon, gradient, rtl }: { title: string; href: string; icon: React.ReactNode; gradient: string; rtl?: boolean }) {
  return (
    <Link href={href} className="group">
      <div className={cn(
        'relative overflow-hidden rounded-2xl border p-5',
        'border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/10',
        'shadow-[0_10px_35px_-15px_rgba(0,0,0,0.35)]'
      )}>
        <div className={cn('mb-3 flex items-center gap-2 text-sm text-muted-foreground', rtl && 'flex-row-reverse text-right')}>
          {icon}
          <span>{title}</span>
        </div>
        <div className={cn('text-2xl font-semibold tracking-tight', rtl && 'text-right')}>{title}</div>
        <div className={cn('mt-1 text-sm text-muted-foreground', rtl && 'text-right')}>
          {rtl ? 'انقر للانتقال' : 'Click to navigate'}
        </div>

        <div className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br',
          gradient,
          'opacity-0 transition-opacity duration-300 group-hover:opacity-100'
        )} />
      </div>
    </Link>
  );
}
