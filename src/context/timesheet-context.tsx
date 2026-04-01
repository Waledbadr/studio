"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { RawPunch, DailyAttendance } from "@/types/timesheet";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { processPunches } from "@/utils/timesheet-utils";
import { useLanguage } from "@/context/language-context";

interface TimesheetContextType {
  rawPunches: RawPunch[];
  processedAttendance: DailyAttendance[];
  deviceToProjectMap: Record<string, string>;
  projectToResidenceMap: Record<string, string>;
  isFetching: boolean;
  isProcessing: boolean;
  fetchAndProcessAttendance: (startDate: string, endDate: string) => Promise<void>;
  syncProcessedDataToFirestore: () => Promise<void>;
  updateAttendanceRecord: (id: string, updates: Partial<DailyAttendance>) => void;
  updateDeviceMapping: (deviceName: string, projectName: string) => Promise<void>;
  updateBulkDeviceMappings: (mappings: Record<string, string>) => Promise<void>;
  removeDeviceMapping: (deviceName: string) => Promise<void>;
  updateProjectMapping: (biometricProject: string, residenceId: string) => Promise<void>;
  removeProjectMapping: (biometricProject: string) => Promise<void>;
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

export function TimesheetProvider({ children }: { children: ReactNode }) {
  const [rawPunches, setRawPunches] = useState<RawPunch[]>([]);
  const [processedAttendance, setProcessedAttendance] = useState<DailyAttendance[]>([]);
  const [deviceToProjectMap, setDeviceToProjectMap] = useState<Record<string, string>>({});
  const [projectToResidenceMap, setProjectToResidenceMap] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  
  // Load mappings on mount
  React.useEffect(() => {
    const loadMapping = async () => {
      try {
        if (!db) return;
        const snap = await getDoc(doc(db, "residences", "timesheetSettings"));
        if (snap.exists()) {
          const data = snap.data();
          setDeviceToProjectMap(data.deviceToProjectMap || {});
          setProjectToResidenceMap(data.projectToResidenceMap || {});
        }
      } catch (e) {
        console.error("Failed to load timesheet settings", e);
      }
    };
    loadMapping();
  }, []);

  const updateDeviceMapping = async (deviceName: string, projectName: string) => {
    if (!db) return;
    const newMap = { ...deviceToProjectMap, [deviceName]: projectName };
    setDeviceToProjectMap(newMap);
    await setDoc(doc(db, "residences", "timesheetSettings"), { deviceToProjectMap: newMap }, { merge: true });
  };

  const updateBulkDeviceMappings = async (mappings: Record<string, string>) => {
    if (!db) return;
    const newMap = { ...deviceToProjectMap, ...mappings };
    setDeviceToProjectMap(newMap);
    await setDoc(doc(db, "residences", "timesheetSettings"), { deviceToProjectMap: newMap }, { merge: true });
  };

  const removeDeviceMapping = async (deviceName: string) => {
    if (!db) return;
    const newMap = { ...deviceToProjectMap };
    delete newMap[deviceName];
    setDeviceToProjectMap(newMap);
    await setDoc(doc(db, "residences", "timesheetSettings"), { deviceToProjectMap: newMap }, { merge: true });
  };

  const updateProjectMapping = async (biometricProject: string, residenceId: string) => {
    if (!db) return;
    const newMap = { ...projectToResidenceMap, [biometricProject]: residenceId };
    setProjectToResidenceMap(newMap);
    await setDoc(doc(db, "residences", "timesheetSettings"), { projectToResidenceMap: newMap }, { merge: true });
  };

  const removeProjectMapping = async (biometricProject: string) => {
    if (!db) return;
    const newMap = { ...projectToResidenceMap };
    delete newMap[biometricProject];
    setProjectToResidenceMap(newMap);
    await setDoc(doc(db, "residences", "timesheetSettings"), { projectToResidenceMap: newMap }, { merge: true });
  };

  const fetchAndProcessAttendance = async (startDate: string, endDate: string) => {
    setIsFetching(true);
    setRawPunches([]);
    setProcessedAttendance([]);

    try {
      const res = await fetch(`/api/timesheet/fetch-attendance?start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch attendance data: ${res.statusText}`);
      }
      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.error);
      }

      setRawPunches(json.data || []);
      
      setIsProcessing(true);
      // Process data grouping by emp_id and date
      const processed = processPunches(json.data || [], deviceToProjectMap);
      setProcessedAttendance(processed);
      
      toast({
        title: isAr ? "تم الاستيراد بنجاح" : "Import Successful",
        description: isAr 
          ? `تم إحضار ${json.data.length} بصمة، ومعالجتها إلى ${processed.length} سجل يومي.`
          : `Fetched ${json.data.length} punches, processed into ${processed.length} daily records.`,
        variant: "default",
      });

    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      toast({
        title: isAr ? "خطأ في الاستيراد" : "Import Error",
        description: error.message || (isAr ? "فشل في إحضار البيانات من الخوادم، تأكد من الاتصال." : "Failed to fetch data, please check your connection."),
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
      setIsProcessing(false);
    }
  };

  const updateAttendanceRecord = (id: string, updates: Partial<DailyAttendance>) => {
    setProcessedAttendance(prev => prev.map(record => {
      if (record.id === id) {
        return { ...record, ...updates, isSyncedToFirestore: false };
      }
      return record;
    }));
  };

  const syncProcessedDataToFirestore = async () => {
    if (processedAttendance.length === 0) return;

    try {
      if (!db) return;
      const maxBatchSize = 500;
      let currentBatch = writeBatch(db);
      let count = 0;

      for (const record of processedAttendance) {
        const ref = doc(db, 'attendanceRecords', record.id);
        currentBatch.set(ref, {
          ...record,
          syncedAt: new Date().toISOString()
        }, { merge: true });

        count++;
        if (count === maxBatchSize) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await currentBatch.commit();
      }

      setProcessedAttendance(prev => prev.map(p => ({ ...p, isSyncedToFirestore: true })));
      
      toast({
        title: isAr ? "تم الحفظ بنجاح" : "Save Successful",
        description: isAr ? "تم أرشفة وحفظ سجلات الحضور بقاعدة البيانات." : "Attendance records archived and saved in Database.",
        variant: "default",
      });

    } catch (error: any) {
      console.error("Error syncing to Firestore:", error);
      toast({
        title: isAr ? "فشل الحفظ" : "Save Failed",
        description: isAr ? "حدث خطأ أثناء محاولة حفظ السجلات." : "An error occurred while saving the records.",
        variant: "destructive",
      });
    }
  };

  return (
    <TimesheetContext.Provider
      value={{
        rawPunches,
        processedAttendance,
        projectToResidenceMap,
        isFetching,
        isProcessing,
        fetchAndProcessAttendance,
        syncProcessedDataToFirestore,
        updateAttendanceRecord,
        updateProjectMapping,
        removeProjectMapping,
        deviceToProjectMap,
        updateDeviceMapping,
        updateBulkDeviceMappings,
        removeDeviceMapping,      }}
    >
      {children}
    </TimesheetContext.Provider>
  );
}

export function useTimesheet() {
  const context = useContext(TimesheetContext);
  if (context === undefined) {
    throw new Error("useTimesheet must be used within a TimesheetProvider");
  }
  return context;
}
