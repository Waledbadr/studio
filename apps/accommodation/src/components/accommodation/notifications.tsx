"use client";

import React, { useEffect, useState } from 'react';

export default function AccommodationNotifications() {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_notifications') : null;
      const arr = raw ? JSON.parse(raw) : [];
      setNotes(arr);
    } catch (e) {
      console.error(e);
    }
  }, []);

  function markRead(id: string) {
    const raw = localStorage.getItem('ac_notifications') || '[]';
    const arr = JSON.parse(raw);
    const updated = arr.map((n:any)=> n.id===id ? { ...n, read: true } : n);
    localStorage.setItem('ac_notifications', JSON.stringify(updated));
    setNotes(updated);
  }

  return (
    <div className="rounded-md border p-4 bg-white/80">
      <h3 className="font-medium mb-2">Notifications</h3>
      <ul className="space-y-2">
        {notes.length ? notes.map(n => (
          <li key={n.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs text-muted-foreground">{n.body}</div>
            </div>
            <div>
              {!n.read && <button className="text-sm underline" onClick={()=>markRead(n.id)}>Mark read</button>}
            </div>
          </li>
        )) : <li className="text-sm text-muted-foreground">No notifications</li>}
      </ul>
    </div>
  );
}
