'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

export default function DeprecatedApprovalsPage() {
  const router = useRouter();
  const { dict } = useLanguage();
  useEffect(() => {
    router.replace('/inventory/receive');
  }, [router]);
  return (
    <div className="p-6 text-sm text-muted-foreground">{dict.pendingMrvCardDescription}</div>
  );
}
