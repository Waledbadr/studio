import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

type CsvRow = Record<string, string>;

// Minimal CSV parser that handles commas and quotes
function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
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
          i++; // skip escaped quote
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
}

function norm(s?: string | null) {
  return (s || "").trim();
}

function arabicToEnglishDigits(input: string): string {
  const arabicIndic = /[\u0660-\u0669]/g; // ٠١٢٣٤٥٦٧٨٩
  const easternArabicIndic = /[\u06F0-\u06F9]/g; // ۰۱۲۳۴۵۶۷۸۹
  return input
    .replace(arabicIndic, (d) => String(d.charCodeAt(0) - 1632))
    .replace(easternArabicIndic, (d) => String(d.charCodeAt(0) - 1776));
}

function onlyDigits(s: string): string {
  return arabicToEnglishDigits(s).replace(/\D+/g, "");
}

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function getField(row: Record<string, string>, keys: string[]): string {
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    map[k.toLowerCase()] = v as string;
  }
  for (const k of keys) {
    const v = map[k.toLowerCase()];
    if (v != null && String(v).trim().length > 0) return String(v);
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firebase Admin not configured" },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || !(file as any).text) {
        return NextResponse.json(
          { ok: false, error: "No file uploaded under field 'file'" },
          { status: 400 }
        );
      }
      csvText = await (file as File).text();
    } else if (
      contentType.includes("text/csv") ||
      contentType.includes("application/octet-stream")
    ) {
      csvText = await request.text();
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      csvText = norm(body.csv);
      if (!csvText) {
        return NextResponse.json(
          { ok: false, error: "Expected { csv: string } or text/csv body" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported content type. Use multipart/form-data with 'file' or text/csv." },
        { status: 415 }
      );
    }

    const { headers, rows } = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "CSV appears to be empty" },
        { status: 400 }
      );
    }

    // Load required collections once
    const [workersSnap, occupantsSnap, residencesSnap] = await Promise.all([
      adminDb.collection("workers").get(),
      adminDb.collection("occupants").get(),
      adminDb.collection("residences").get(),
    ]);

    const workers = workersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
    const workersById = new Map(workers.map((w) => [String(w.id), w]));
    const workersByEmployeeId = new Map(
      workers
        .filter((w) => w.employeeId)
        .map((w) => [onlyDigits(String(w.employeeId)), w])
    );
    const workersByIdNumber = new Map(
      workers
        .filter((w) => w.idNumber)
        .map((w) => [onlyDigits(String(w.idNumber)), w])
    );
    const workersByName = new Map(
      workers.filter((w) => w.name).map((w) => [String(w.name).trim(), w])
    );

    const existingOccupants = occupantsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

    const residences = residencesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

    const findResidence = (row: CsvRow) => {
      const rid = norm(
        getField(row, ['residenceid','residence id','residence','السكن','كود السكن'])
      );
      if (rid) {
        const byId = residences.find((r) => String(r.id) === rid);
        if (byId) return byId;
      }
      const rname = norm(getField(row, ['residencename','residence name','residence','اسم السكن']));
      if (rname) {
        const byName = residences.find(
          (r) => norm(r.name || r.nameEn || r.nameAr).toLowerCase() === rname.toLowerCase()
        );
        if (byName) return byName;
      }
      return null;
    };

    const collectRoomsForResidence = (res: any) => {
      const list: Array<{ id: string; name?: string; buildingId?: string; floorId?: string } & Record<string, any>> = [];
      if (Array.isArray(res.rooms)) {
        for (const r of res.rooms) list.push({ ...r });
      }
      if (Array.isArray(res.buildings)) {
        for (const b of res.buildings) {
          for (const f of b.floors || []) {
            for (const r of f.rooms || []) {
              list.push({ ...r, buildingId: b.id, floorId: f.id });
            }
          }
        }
      }
      return list;
    };

    const findWorker = (row: CsvRow) => {
      // 1) employeeId (preferred)
      const employeeIdRaw = norm(getField(row, ['employeeid','employee id','empid','emp id','emp_no','emp no','empnumber','employee number','emp','رقم الموظف']));
      const employeeId = onlyDigits(employeeIdRaw);
      if (employeeId && workersByEmployeeId.has(employeeId)) return workersByEmployeeId.get(employeeId);
      // 2) national/idNumber
      const idNumRaw = norm(getField(row, ['idnumber','id number','nationalid','national id','iqama','iqama number','iqamanumber','civil id','civilid','رقم الهوية','رقم الاقامة','الاقامة']));
      const idNumber = onlyDigits(idNumRaw);
      if (idNumber && workersByIdNumber.has(idNumber)) return workersByIdNumber.get(idNumber);
      // 3) explicit workerId
      const wid = norm(getField(row, ['workerid','worker id','id','worker','w_id','w-id','w id']));
      if (wid && workersById.has(wid)) return workersById.get(wid);
      // 4) name fallback
      const nameRaw = norm(getField(row, ['name','workername','worker name','الاسم']));
      const name = collapseSpaces(nameRaw);
      if (name) {
        const byName = workers.find((w) => collapseSpaces(String((w as any).name || '')).toLowerCase() === name.toLowerCase());
        if (byName) return byName;
      }
      return null;
    };

    const findRoomInResidence = (res: any, row: CsvRow) => {
      const roomId = norm(getField(row, ['roomid','room id','room','الغرفة','رقم الغرفة']));
      const roomName = norm(getField(row, ['roomname','room name','اسم الغرفة']));
      const buildingName = norm(row.building || row.Building);
      const floorName = norm(row.floor || row.Floor);
      const allRooms = collectRoomsForResidence(res);

      if (roomId) {
        const byId = allRooms.find((r) => String(r.id) === roomId);
        if (byId) return byId;
      }
      if (roomName) {
        const byName = allRooms.find(
          (r) => norm(r.name).toLowerCase() === roomName.toLowerCase()
        );
        if (byName) return byName;
      }
      // If building/floor provided, try narrow by names
      if (buildingName || floorName) {
        const candidates = allRooms.filter((r) => true);
        // Note: structures may not store building/floor names, so this is best-effort
        return candidates[0] || null;
      }
      return null;
    };

    const results = {
      ok: true,
      total: rows.length,
      assigned: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as Array<{ index: number; status: "assigned" | "skipped"; reason?: string }>,
    };

    const nowISO = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const worker = findWorker(row);
        if (!worker) {
          results.skipped++;
          results.details.push({ index: i + 1, status: "skipped", reason: "worker-not-found" });
          continue;
        }
        // Already assigned? (active occupant without until)
        const already = existingOccupants.find((o: any) => o.workerId === worker.id && !o.until);
        if (already) {
          results.skipped++;
          results.details.push({ index: i + 1, status: "skipped", reason: "worker-already-assigned" });
          continue;
        }

        const res = findResidence(row);
        if (!res) {
          results.skipped++;
          results.details.push({ index: i + 1, status: "skipped", reason: "residence-not-found" });
          continue;
        }
        const room = findRoomInResidence(res, row);
        if (!room) {
          results.skipped++;
          results.details.push({ index: i + 1, status: "skipped", reason: "room-not-found" });
          continue;
        }

        // Capacity check (prefer explicit capacity else compute from spaceSqm if present in data model)
        const roomOccupants = existingOccupants.filter(
          (o: any) => o.roomId === room.id && o.residenceId === res.id && !o.until
        );
        const capacity = Number(room.capacity || 0);
        if (capacity && roomOccupants.length >= capacity) {
          results.skipped++;
          results.details.push({ index: i + 1, status: "skipped", reason: "room-full" });
          continue;
        }

        // Nationality rule: if room has occupants, all must match nationality
        if (roomOccupants.length > 0) {
          const firstWorker = workers.find((w) => w.id === roomOccupants[0].workerId);
          const firstNat = firstWorker?.nationaliy;
          if (firstNat && worker.nationaliy && firstNat !== worker.nationaliy) {
            results.skipped++;
            results.details.push({ index: i + 1, status: "skipped", reason: "nationality-mismatch" });
            continue;
          }
        }

        // Assign occupant
        const since = norm(row.since || row.date || row.checkInDate) || nowISO;
        await adminDb.collection("occupants").add({
          workerId: worker.id,
          residenceId: res.id,
          roomId: room.id,
          since,
          createdAt: nowISO,
        });

        // update local cache for subsequent capacity checks
        existingOccupants.push({ workerId: worker.id, residenceId: res.id, roomId: room.id, since });
        results.assigned++;
        results.details.push({ index: i + 1, status: "assigned" });
      } catch (err: any) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: ${err?.message || String(err)}`);
        results.details.push({ index: i + 1, status: "skipped", reason: "exception" });
      }
    }

    return NextResponse.json(results);
  } catch (e: any) {
    console.error("assign/csv route error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: {
      endpoint: "/api/accommodation/assign/csv",
      methods: ["POST"],
      contentTypes: [
        "multipart/form-data (field: file)",
        "text/csv",
        "application/json { csv: string }",
      ],
      requiredColumns: ["workerId|employeeId|idNumber|name", "residenceId|residenceName", "roomId|roomName"],
      optionalColumns: ["since (ISO date)", "building", "floor"],
      sampleCsv:
        "workerId,residenceId,roomId,since\n" +
        "w001,RES-01,RM-101,2025-10-16\n" +
        "w002,RES-01,RM-101,2025-10-16\n",
    },
  });
}
