"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuickAddWorkersPage() {
  const { saveWorker, workers } = useAccommodation();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  // Sample workers data
  const sampleWorkers = [
    { name: 'أحمد محمد', nationaliy: 'Egyptian', role: 'Worker' },
    { name: 'محمد علي', nationaliy: 'Egyptian', role: 'Worker' },
    { name: 'عبدالله سعيد', nationaliy: 'Egyptian', role: 'Supervisor' },
    { name: 'خالد حسن', nationaliy: 'Pakistani', role: 'Worker' },
    { name: 'علي رضا', nationaliy: 'Pakistani', role: 'Worker' },
    { name: 'حسن محمود', nationaliy: 'Indian', role: 'Worker' },
    { name: 'راج كومار', nationaliy: 'Indian', role: 'Worker' },
    { name: 'سمير يوسف', nationaliy: 'Bangladeshi', role: 'Worker' },
  ];

  const addSampleWorkers = async () => {
    setAdding(true);
    let added = 0;
    let errors = 0;

    for (const worker of sampleWorkers) {
      try {
        await saveWorker({
          id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...worker
        } as any);
        added++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      } catch (e) {
        console.error('Failed to add worker:', e);
        errors++;
      }
    }

    setAdding(false);
    toast({
      title: 'تم إضافة العمال',
      description: `تم إضافة ${added} عامل، فشل ${errors}`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">إضافة عمال تجريبيين</h1>
        <p className="text-muted-foreground">
          هذه الصفحة لإضافة عمال تجريبيين بسرعة لاختبار نظام التسكين
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العمال الحاليين: {workers.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workers.slice(0, 10).map((worker) => (
              <div key={worker.id} className="p-3 border rounded-lg">
                <div className="font-semibold">{worker.name}</div>
                <div className="text-sm text-muted-foreground">
                  {worker.nationaliy} • {worker.role}
                </div>
              </div>
            ))}
          </div>

          {workers.length > 10 && (
            <p className="text-sm text-muted-foreground">
              ... و {workers.length - 10} عامل آخر
            </p>
          )}

          {workers.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              لا يوجد عمال حالياً
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إضافة عمال تجريبيين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            سيتم إضافة {sampleWorkers.length} عامل تجريبي بجنسيات مختلفة
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sampleWorkers.map((worker, idx) => (
              <div key={idx} className="p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">{worker.name}</div>
                <div className="text-sm text-muted-foreground">
                  {worker.nationaliy} • {worker.role}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={addSampleWorkers}
            disabled={adding}
            className="w-full"
            size="lg"
          >
            {adding ? 'جاري الإضافة...' : 'إضافة جميع العمال التجريبيين'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
