'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedApprovalsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/inventory/receive');
  }, [router]);
  return (
    <div className="p-6 text-sm text-muted-foreground">
      This page has been removed. Redirecting to Receive Materials...
    </div>
  );
}
