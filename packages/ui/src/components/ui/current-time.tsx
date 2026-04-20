'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function CurrentTime() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    // Update immediately
    updateTime();
    
    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
      <Clock className="h-3 w-3" />
      <span>{currentTime}</span>
    </div>
  );
}
