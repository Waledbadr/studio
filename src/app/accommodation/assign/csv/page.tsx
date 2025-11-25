"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAccommodation } from "@/context/accommodation-context";
import { useResidences } from "@/context/residences-context";

export default function BulkAssignCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { workers, checkInWorker } = useAccommodation();
  const { residences } = useResidences();

  type CsvRow = Record<string, string>;

  // Simple CSV parser (same as API)
  const parseCsv = (text: string): { headers: string[]; rows: CsvRow[] } => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          out.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      out.push(current.trim());
      return out.map((v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v));
    };
    const headers = parseLine(lines[0]).map((h) => h.trim());
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const row: CsvRow = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ?? "";
      });
      rows.push(row);
    }
    return { headers, rows };
  };

  const norm = (s?: string | null) => (s || "").trim();
  const arabicToEnglishDigits = (input: string) => input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776));
  const onlyDigits = (s: string) => arabicToEnglishDigits(s).replace(/\D+/g, "");
  const collapseSpaces = (s: string) => s.replace(/\s+/g, " ").trim();
  const getField = (row: Record<string, string>, keys: string[]): string => {
    const map: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) map[k.toLowerCase()] = v as string;
    for (const k of keys) {
      const v = map[k.toLowerCase()];
      if (v != null && String(v).trim().length > 0) return String(v);
    }
    return "";
  };

  const collectRoomsForResidence = (res: any) => {
    const list: Array<{ id: string; name?: string; buildingId?: string; floorId?: string } & Record<string, any>> = [];
    if (Array.isArray((res as any).rooms)) {
      for (const r of (res as any).rooms) list.push({ ...r });
    }
    if (Array.isArray((res as any).buildings)) {
      for (const b of (res as any).buildings) {
        for (const f of (b as any).floors || []) {
          for (const r of (f as any).rooms || []) {
            list.push({ ...r, buildingId: (b as any).id, floorId: (f as any).id });
          }
        }
      }
    }
    return list;
  };

  const findWorkerLocal = (row: CsvRow) => {
    // 1) employeeId (preferred)
    const employeeId = onlyDigits(norm(getField(row, ['employeeid','employee id','empid','emp id','emp_no','emp no','empnumber','employee number','emp','رقم الموظف'])));
    if (employeeId) {
      const byEmp = workers.find((w: any) => onlyDigits(String(w.employeeId || "")) === employeeId);
      if (byEmp) return byEmp;
    }
    // 2) idNumber
    const idNumber = onlyDigits(norm(getField(row, ['idnumber','id number','nationalid','national id','iqama','iqama number','iqamanumber','civil id','civilid','رقم الهوية','رقم الاقامة','الاقامة'])));
    if (idNumber) {
      const byIdNum = workers.find((w: any) => onlyDigits(String(w.idNumber || "")) === idNumber);
      if (byIdNum) return byIdNum;
    }
    // 3) workerId
    const wid = norm(getField(row, ['workerid','worker id','id','worker','w_id','w-id','w id']));
    if (wid) {
      const byId = workers.find((w: any) => String(w.id) === wid);
      if (byId) return byId;
    }
    // 4) name
    const name = collapseSpaces(norm(getField(row, ['name','workername','worker name','الاسم'])));
    if (name) {
      const byName = workers.find((w: any) => collapseSpaces(norm((w as any).name)).toLowerCase() === name.toLowerCase());
      if (byName) return byName;
    }
    return null;
  };

  const findResidenceLocal = (row: CsvRow) => {
    const rid = norm(getField(row, ['residenceid','residence id','residence','السكن','كود السكن']));
    if (rid) {
      const byId = residences.find((r: any) => String(r.id) === rid);
      if (byId) return byId;
    }
    const rname = norm(getField(row, ['residencename','residence name','residence','اسم السكن']));
    if (rname) {
      const byName = residences.find((r: any) => norm((r as any).name || (r as any).nameEn || (r as any).nameAr).toLowerCase() === rname.toLowerCase());
      if (byName) return byName;
    }
    return null;
  };

  const findRoomLocal = (res: any, row: CsvRow) => {
    const allRooms = collectRoomsForResidence(res);
    const roomId = norm(getField(row, ['roomid','room id','room','الغرفة','رقم الغرفة']));
    const roomName = norm(getField(row, ['roomname','room name','اسم الغرفة']));
    if (roomId) {
      const byId = allRooms.find((r) => String(r.id) === roomId);
      if (byId) return byId;
    }
    if (roomName) {
      const byName = allRooms.find((r) => collapseSpaces(norm((r as any).name)).toLowerCase() === roomName.toLowerCase());
      if (byName) return byName;
    }
    return null;
  };

  const doClientImport = async (csvText: string) => {
    const { rows } = parseCsv(csvText);
    const nowISO = new Date().toISOString();
    const summary = { ok: true, total: rows.length, assigned: 0, skipped: 0, details: [] as Array<{ index: number; status: 'assigned' | 'skipped'; reason?: string }> };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const worker = findWorkerLocal(row);
        if (!worker) { summary.skipped++; summary.details.push({ index: i + 1, status: 'skipped', reason: 'worker-not-found' }); continue; }
        const res = findResidenceLocal(row);
        if (!res) { summary.skipped++; summary.details.push({ index: i + 1, status: 'skipped', reason: 'residence-not-found' }); continue; }
        const room = findRoomLocal(res, row);
        if (!room) { summary.skipped++; summary.details.push({ index: i + 1, status: 'skipped', reason: 'room-not-found' }); continue; }
        const since = norm((row as any).since || (row as any).date || (row as any).checkInDate) || nowISO;
        const r = await checkInWorker({
          workerId: (worker as any).id,
          residenceId: (res as any).id,
          roomId: (room as any).id,
          checkInDate: since,
          performedBy: 'CSV Import',
          notes: 'Imported by CSV',
        });
        if (r.ok) { summary.assigned++; summary.details.push({ index: i + 1, status: 'assigned' }); }
        else { summary.skipped++; summary.details.push({ index: i + 1, status: 'skipped', reason: r.error || 'unknown' }); }
      } catch (e: any) {
        summary.skipped++; summary.details.push({ index: i + 1, status: 'skipped', reason: e?.message || 'exception' });
      }
    }
    setResult(summary);
    toast({ title: 'Client import finished', description: `Assigned: ${summary.assigned}, Skipped: ${summary.skipped}` });
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        toast({ title: "Choose a CSV", description: "Please select a CSV file to upload.", variant: "destructive" });
        return;
      }
      setBusy(true);
      setResult(null);
      const csvText = await file.text();
      // Try server API first
      try {
        const form = new FormData();
        form.set("file", file);
        const res = await fetch("/api/accommodation/assign/csv", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.ok !== false) {
          setResult(data);
          toast({ title: "Import finished", description: `Assigned: ${data.assigned}, Skipped: ${data.skipped}` });
        } else {
          // Fallback to client-side import
          await doClientImport(csvText);
        }
      } catch {
        // Network/API error -> fallback client-side
        await doClientImport(csvText);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Upload failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Assign from CSV</CardTitle>
          <CardDescription>Upload a CSV to assign workers to rooms in bulk. Required columns: workerId|employeeId|idNumber|name, residenceId|residenceName, roomId|roomName.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={busy}>{busy ? "Uploading..." : "Upload & Assign"}</Button>
            <a className="text-sm underline" href="/api/accommodation/assign/csv" target="_blank" rel="noreferrer">API usage</a>
          </div>
          {result && (
            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
