"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';

/**
 * 🚨 EMERGENCY MODE: Manual Sync Button
 * 
 * Since we disabled all real-time Firestore listeners to prevent 12K reads per operation,
 * this button allows users to manually sync data from Firestore when needed.
 * 
 * Shows read count to help users understand Firebase usage.
 */
export function ManualSyncButton() {
  const { manualSyncFromFirestore } = useAccommodation();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await manualSyncFromFirestore();
      
      if (result.ok) {
        toast({
          title: "✅ تمت المزامنة بنجاح",
          description: `تم قراءة ${result.totalReads.toLocaleString()} سجل من قاعدة البيانات`,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ فشلت المزامنة",
          description: result.error || "حدث خطأ غير معروف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      toast({
        title: "❌ خطأ في المزامنة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>جاري المزامنة...</span>
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          <span>مزامنة البيانات</span>
        </>
      )}
    </Button>
  );
}

/**
 * Compact version for toolbar/header
 */
export function ManualSyncButtonCompact() {
  const { manualSyncFromFirestore } = useAccommodation();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await manualSyncFromFirestore();
      
      if (result.ok) {
        toast({
          title: "✅ تمت المزامنة",
          description: `${result.totalReads.toLocaleString()} قراءة`,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ فشلت المزامنة",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ خطأ",
        description: error instanceof Error ? error.message : "خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="ghost"
      size="icon"
      title="مزامنة البيانات من قاعدة البيانات"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
    </Button>
  );
}
