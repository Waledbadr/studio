"use client";

import React, { useEffect, useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DiagnosticPage() {
  const { workers, occupants } = useAccommodation();
  const [firestoreWorkers, setFirestoreWorkers] = useState<any[]>([]);
  const [localStorageWorkers, setLocalStorageWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkFirestore = async () => {
    setLoading(true);
    try {
      if (!db) {
        console.error('Firebase not configured');
        return;
      }
      const snapshot = await getDocs(collection(db, 'workers'));
      const workers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreWorkers(workers);
      console.log('Firestore workers:', workers);
    } catch (e) {
      console.error('Error fetching from Firestore:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    try {
      const raw = localStorage.getItem('ac_workers');
      const parsed = raw ? JSON.parse(raw) : [];
      setLocalStorageWorkers(parsed);
      console.log('LocalStorage workers:', parsed);
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
  };

  const testSearch = async () => {
    try {
      const res = await fetch('/api/accommodation/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: '' })
      });
      const data = await res.json();
      console.log('Search API response:', data);
      alert(`Search returned ${data.results?.length || 0} workers`);
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  useEffect(() => {
    checkFirestore();
    checkLocalStorage();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">تشخيص نظام العمال</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Context Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{workers.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              من accommodation-context
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firestore Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{firestoreWorkers.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              من قاعدة البيانات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{localStorageWorkers.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              من التخزين المحلي
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button onClick={checkFirestore} disabled={loading}>
          {loading ? 'جاري الفحص...' : 'فحص Firestore'}
        </Button>
        <Button onClick={checkLocalStorage}>
          فحص LocalStorage
        </Button>
        <Button onClick={testSearch}>
          اختبار API البحث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العمال في Context ({workers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <p className="text-muted-foreground">لا يوجد عمال</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {workers.map(w => (
                <div key={w.id} className="p-2 border rounded">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {w.id} • {w.nationaliy} • {w.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>العمال في Firestore ({firestoreWorkers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {firestoreWorkers.length === 0 ? (
            <p className="text-muted-foreground">لا يوجد عمال في Firestore</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {firestoreWorkers.map(w => (
                <div key={w.id} className="p-2 border rounded">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {w.id} • {w.nationaliy} • {w.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>العمال في LocalStorage ({localStorageWorkers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {localStorageWorkers.length === 0 ? (
            <p className="text-muted-foreground">لا يوجد عمال في LocalStorage</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {localStorageWorkers.map(w => (
                <div key={w.id} className="p-2 border rounded">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {w.id} • {w.nationaliy} • {w.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle>نصائح الإصلاح</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✅ إذا كان Firestore = 0 واللوكال ستوريج &gt; 0:</p>
          <p className="ml-4">→ العمال موجودون محلياً فقط، استخدم صفحة Workers للمزامنة</p>
          
          <p className="mt-3">✅ إذا كان Firestore &gt; 0 والـ Context = 0:</p>
          <p className="ml-4">→ مشكلة في تحميل البيانات، أعد تحميل الصفحة</p>
          
          <p className="mt-3">✅ إذا كانت جميع القيم = 0:</p>
          <p className="ml-4">→ أضف عمال من <a href="/accommodation/quick-add-workers" className="text-primary underline">هنا</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
