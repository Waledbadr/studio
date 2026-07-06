"use client";

import React from "react";
import { useAccommodation } from "@/context/accommodation-context";
import { useResidences } from "@/context/residences-context";
import { useUsers } from "@/context/users-context";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, ArrowRightLeft, AlertTriangle, Info, ClipboardPaste, Home, Building2, DoorOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  validateDateConflicts,
  getValidationErrorMessage,
  type WorkerHistoryRecord,
} from "@/lib/accommodation-date-validation";

interface CreateTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedWorkers?: string[];
}

type ScopeType = "residence" | "building" | "room";
type LocaleText = { ar: string; en: string };
type RoomOption = {
  id: string;
  label: string;
  buildingId?: string;
  buildingLabel?: string;
  floorLabel?: string;
};

const EMPTY_WORKER_SELECTION: string[] = [];

const copy = {
  title: { ar: "إنشاء طلب نقل", en: "Create Transfer Request" },
  description: { ar: "انقل عامل، مجموعة عمال، غرفة، مبنى، أو سكن كامل بأقل خطوات.", en: "Transfer a worker, a group, a room, a building, or a full residence in fewer steps." },
  source: { ar: "مصدر النقل", en: "Transfer Source" },
  destination: { ar: "الوجهة", en: "Destination" },
  required: { ar: "مطلوب", en: "Required" },
  optional: { ar: "اختياري", en: "Optional" },
  scope: { ar: "نطاق النقل", en: "Transfer Scope" },
  residenceScope: { ar: "سكن كامل", en: "Full Residence" },
  buildingScope: { ar: "مبنى كامل", en: "Full Building" },
  roomScope: { ar: "غرفة كاملة", en: "Full Room" },
  sourceResidence: { ar: "السكن الحالي", en: "Current Residence" },
  sourceBuilding: { ar: "المبنى الحالي", en: "Current Building" },
  sourceRoom: { ar: "الغرفة الحالية", en: "Current Room" },
  targetResidence: { ar: "السكن الجديد", en: "New Residence" },
  targetRoom: { ar: "الغرفة الجديدة", en: "New Room" },
  selectResidence: { ar: "اختر السكن...", en: "Select residence..." },
  selectBuilding: { ar: "اختر المبنى...", en: "Select building..." },
  selectRoom: { ar: "اختر الغرفة...", en: "Select room..." },
  autoRoom: { ar: "توزيع تلقائي على الغرف المتاحة", en: "Auto-fill available rooms" },
  manualWorkers: { ar: "عمال محددون", en: "Selected Workers" },
  noManualWorkers: { ar: "لم يتم اختيار عمال. سيتم نقل كل العمالة داخل النطاق المحدد.", en: "No workers selected. Everyone in the selected source scope will be transferred." },
  addWorker: { ar: "إضافة عامل", en: "Add Worker" },
  pasteWorkers: { ar: "لصق العمال", en: "Paste Workers" },
  pastePlaceholder: { ar: "الصق أرقام الموظفين أو الهويات أو الأسماء، كل عامل في سطر أو مفصول بفاصلة", en: "Paste employee IDs, ID numbers, or names, one per line or comma separated" },
  applyPaste: { ar: "إضافة من النص", en: "Add From Text" },
  unmatched: { ar: "لم يتم العثور على:", en: "Not found:" },
  transferDate: { ar: "تاريخ النقل", en: "Transfer Date" },
  dateHint1: { ar: "لا يمكن اختيار تاريخ في المستقبل", en: "Future dates are not allowed" },
  dateHint2: { ar: "سيتم فحص تعارضات التاريخ للعمال المحددين أو المستنتجين", en: "Date conflicts are checked for selected or inferred workers" },
  reason: { ar: "سبب النقل", en: "Transfer Reason" },
  reasonPlaceholder: { ar: "مثال: نقل للقرب من مكان العمل...", en: "Example: closer to work location..." },
  summary: { ar: "ملخص الطلب", en: "Request Summary" },
  workersCount: { ar: "عدد العمال", en: "Workers" },
  from: { ar: "من", en: "From" },
  to: { ar: "إلى", en: "To" },
  inferred: { ar: "مستنتج من النطاق", en: "Inferred from scope" },
  noWorkersInScope: { ar: "لا توجد عمالة نشطة داخل النطاق المحدد", en: "No active workers in the selected source scope" },
  sourceNeeded: { ar: "اختر مصدر النقل أو أضف عمالاً محددين", en: "Select a transfer source or add specific workers" },
  targetNeeded: { ar: "يجب اختيار السكن المستهدف", en: "Target residence is required" },
  created: { ar: "تم إنشاء الطلب", en: "Request Created" },
  createFailed: { ar: "فشل في إنشاء طلب النقل", en: "Failed to create transfer request" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  submit: { ar: "إنشاء طلب النقل", en: "Create Transfer Request" },
  submitting: { ar: "جاري الإنشاء...", en: "Creating..." },
  clearWorkers: { ar: "مسح الاختيار اليدوي", en: "Clear manual selection" },
  companyFilter: { ar: "تحديد شركة", en: "Company Filter" },
  allCompanies: { ar: "كل الشركات", en: "All Companies" },
  workerPreview: { ar: "بيانات العمال", en: "Worker Details" },
  moreWorkers: { ar: "عمال إضافيون", en: "more workers" },
  employeeNo: { ar: "رقم الموظف", en: "Employee No." },
  idNo: { ar: "الهوية", en: "ID No." },
  company: { ar: "الشركة", en: "Company" },
  nationality: { ar: "الجنسية", en: "Nationality" },
  conflicts: { ar: "تعارض في التواريخ", en: "Date Conflicts" },
  successDetails: { ar: "تم إنشاء طلب نقل بنجاح", en: "Transfer request created successfully" },
  error: { ar: "خطأ", en: "Error" },
} satisfies Record<string, LocaleText>;

export function CreateTransferDialog({ isOpen, onOpenChange, preSelectedWorkers = EMPTY_WORKER_SELECTION }: CreateTransferDialogProps) {
  const { workers, occupants, companies, createTransferRequest, fetchWorkerHistory } = useAccommodation();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { locale } = useLanguage();
  const { toast } = useToast();
  const isAr = locale === "ar";
  const t = React.useCallback((key: keyof typeof copy) => copy[key][locale], [locale]);

  const [selectedWorkers, setSelectedWorkers] = React.useState<string[]>(preSelectedWorkers);
  const [pasteText, setPasteText] = React.useState("");
  const [unmatchedTokens, setUnmatchedTokens] = React.useState<string[]>([]);
  const [scopeType, setScopeType] = React.useState<ScopeType>("residence");
  const [fromResidenceId, setFromResidenceId] = React.useState("");
  const [fromBuildingId, setFromBuildingId] = React.useState("");
  const [fromRoomId, setFromRoomId] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState("_all");
  const [toResidenceId, setToResidenceId] = React.useState("");
  const [toRoomId, setToRoomId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [transferDate, setTransferDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [dateConflicts, setDateConflicts] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedWorkers((prev) => {
      if (prev.length === preSelectedWorkers.length && prev.every((id, index) => id === preSelectedWorkers[index])) {
        return prev;
      }
      return preSelectedWorkers;
    });
  }, [isOpen, preSelectedWorkers]);

  const activeOccupants = React.useMemo(
    () => (occupants || []).filter((occupant) => !occupant.until),
    [occupants]
  );

  const selectedResidence = React.useMemo(
    () => residences?.find((residence) => residence.id === fromResidenceId),
    [fromResidenceId, residences]
  );

  const targetResidence = React.useMemo(
    () => residences?.find((residence) => residence.id === toResidenceId),
    [toResidenceId, residences]
  );

  const fromBuildings = React.useMemo(
    () => (selectedResidence?.buildings || []).map((building: any) => ({
      id: building.id,
      label: getLocalizedName(building, locale),
    })),
    [selectedResidence, locale]
  );

  const fromRooms = React.useMemo(
    () => getRoomOptions(selectedResidence, locale).filter((room) => !fromBuildingId || room.buildingId === fromBuildingId),
    [selectedResidence, fromBuildingId, locale]
  );

  const toRooms = React.useMemo(
    () => getRoomOptions(targetResidence, locale),
    [targetResidence, locale]
  );

  React.useEffect(() => {
    setFromBuildingId("");
    setFromRoomId("");
  }, [fromResidenceId]);

  React.useEffect(() => {
    setFromRoomId("");
  }, [fromBuildingId]);

  React.useEffect(() => {
    setToRoomId("");
  }, [toResidenceId]);

  const scopeWorkerIds = React.useMemo(() => {
    if (!fromResidenceId) return [];
    return activeOccupants
      .filter((occupant) => {
        if (occupant.residenceId !== fromResidenceId) return false;
        if (scopeType === "building") return Boolean(fromBuildingId) && occupant.buildingId === fromBuildingId;
        if (scopeType === "room") return Boolean(fromRoomId) && occupant.roomId === fromRoomId;
        return true;
      })
      .filter((occupant) => {
        if (companyFilter === "_all") return true;
        const worker = workers?.find((item) => item.id === occupant.workerId);
        return workerMatchesCompany(worker, companyFilter, companies || []);
      })
      .map((occupant) => occupant.workerId);
  }, [activeOccupants, companies, companyFilter, fromResidenceId, fromBuildingId, fromRoomId, scopeType, workers]);

  const effectiveWorkerIds = selectedWorkers.length > 0 ? selectedWorkers : scopeWorkerIds;
  const effectiveWorkers = React.useMemo(
    () => effectiveWorkerIds.map((id) => workers?.find((worker) => worker.id === id)).filter(Boolean),
    [effectiveWorkerIds, workers]
  );
  const availableWorkers = (workers || [])
    .filter((worker) => !selectedWorkers.includes(worker.id))
    .filter((worker) => companyFilter === "_all" || workerMatchesCompany(worker, companyFilter, companies || []));

  const companyOptions = React.useMemo(() => {
    const fromCompanies = (companies || []).map((company: any) => ({
      value: company.id,
      label: getLocalizedName(company, locale),
    }));
    const known = new Set(fromCompanies.map((item) => normalizeLookup(item.value)));
    const fromWorkers = (workers || [])
      .map((worker) => worker.company)
      .filter(Boolean)
      .filter((company, index, list) => list.findIndex((item) => normalizeLookup(String(item)) === normalizeLookup(String(company))) === index)
      .filter((company) => !known.has(normalizeLookup(String(company))))
      .map((company) => ({ value: String(company), label: String(company) }));
    return [...fromCompanies, ...fromWorkers].filter((item) => item.label);
  }, [companies, locale, workers]);

  React.useEffect(() => {
    let cancelled = false;

    async function validateWorkers() {
      if (!transferDate || effectiveWorkerIds.length === 0) {
        setDateConflicts({});
        return;
      }

      const entries = await Promise.all(
        effectiveWorkerIds.slice(0, 75).map(async (workerId) => {
          const workerHistory = await fetchWorkerHistory(workerId);
          const historyRecords: WorkerHistoryRecord[] = workerHistory
            .filter((h) => h.actionType === "CHECK_IN" || h.actionType === "CHECK_OUT" || h.actionType === "TRANSFER")
            .map((h) => ({
              id: h.id,
              workerId: h.workerId,
              checkInDate: new Date(h.actionDate),
              checkOutDate: h.actionType === "CHECK_OUT" ? new Date(h.actionDate) : null,
              roomId: h.toRoomId || h.roomId || "",
              residenceId: h.toResidenceId || h.residenceId,
            }));

          const validation = validateDateConflicts(workerId, new Date(transferDate), historyRecords);
          if (validation.isValid || validation.errorCode === "WORKER_STILL_CHECKED_IN") {
            return null;
          }
          return [workerId, getValidationErrorMessage(validation, locale)] as const;
        })
      );

      if (!cancelled) {
        setDateConflicts(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>));
      }
    }

    validateWorkers();
    return () => {
      cancelled = true;
    };
  }, [effectiveWorkerIds.join("|"), fetchWorkerHistory, locale, transferDate]);

  const getWorkerName = (id: string) => workers?.find((worker) => worker.id === id)?.name || id;
  const getResidenceName = (id: string) => getLocalizedName(residences?.find((residence) => residence.id === id), locale) || id;
  const getRoomName = (roomId: string, residenceId: string) => {
    const room = getRoomOptions(residences?.find((residence) => residence.id === residenceId), locale).find((option) => option.id === roomId);
    return room?.label || roomId;
  };

  const handleAddWorker = (workerId: string) => {
    if (workerId === "_empty") return;
    setSelectedWorkers((prev) => (prev.includes(workerId) ? prev : [...prev, workerId]));
  };

  const handleRemoveWorker = (workerId: string) => {
    setSelectedWorkers((prev) => prev.filter((id) => id !== workerId));
  };

  const handlePasteWorkers = () => {
    const tokens = pasteText
      .split(/[\n,\t;،]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const matchedIds: string[] = [];
    const missed: string[] = [];

    tokens.forEach((token) => {
      const normalizedToken = normalizeLookup(token);
      const match = (workers || []).find((worker) => {
        const candidates = [worker.id, worker.employeeId, worker.idNumber, worker.name].filter(Boolean).map((value) => normalizeLookup(String(value)));
        return candidates.includes(normalizedToken);
      });

      if (match) matchedIds.push(match.id);
      else missed.push(token);
    });

    setSelectedWorkers((prev) => Array.from(new Set([...prev, ...matchedIds])));
    setUnmatchedTokens(missed);
    if (matchedIds.length > 0) setPasteText("");
  };

  const canSubmit = toResidenceId && effectiveWorkerIds.length > 0 && Object.keys(dateConflicts).length === 0;

  const handleSubmit = async () => {
    if (!toResidenceId) {
      toast({ title: t("error"), description: t("targetNeeded"), variant: "destructive" });
      return;
    }

    if (effectiveWorkerIds.length === 0) {
      toast({
        title: t("error"),
        description: fromResidenceId ? t("noWorkersInScope") : t("sourceNeeded"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const request = createTransferRequest({
        from: fromResidenceId ? { residenceId: fromResidenceId, roomId: scopeType === "room" ? fromRoomId : undefined } : undefined,
        to: { residenceId: toResidenceId, roomId: toRoomId || undefined },
        workerIds: effectiveWorkerIds,
        requestedBy: currentUser?.id || "unknown",
        transferDate: `${transferDate}T00:00:00.000Z`,
        reason: reason || undefined,
      });

      toast({
        title: t("created"),
        description: `${t("successDetails")} #${request.id.slice(0, 8)}`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create transfer request:", error);
      toast({ title: t("error"), description: t("createFailed"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedWorkers([]);
    setPasteText("");
    setUnmatchedTokens([]);
    setScopeType("residence");
    setFromResidenceId("");
    setFromBuildingId("");
    setFromRoomId("");
    setCompanyFilter("_all");
    setToResidenceId("");
    setToRoomId("");
    setReason("");
    setDateConflicts({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader className={isAr ? "text-right" : "text-left"}>
          <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Home className="h-4 w-4 text-muted-foreground" />
                {t("source")}
              </h3>
              <Badge variant="secondary">{selectedWorkers.length > 0 ? t("optional") : t("required")}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("sourceResidence")}</Label>
                <Select value={fromResidenceId} onValueChange={setFromResidenceId}>
                  <SelectTrigger><SelectValue placeholder={t("selectResidence")} /></SelectTrigger>
                  <SelectContent>
                    {residences?.map((residence: any) => (
                      <SelectItem key={residence.id} value={residence.id}>{getLocalizedName(residence, locale)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("scope")}</Label>
                <Select value={scopeType} onValueChange={(value) => setScopeType(value as ScopeType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residence"><span className="inline-flex items-center gap-2"><Home className="h-4 w-4" />{t("residenceScope")}</span></SelectItem>
                    <SelectItem value="building"><span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />{t("buildingScope")}</span></SelectItem>
                    <SelectItem value="room"><span className="inline-flex items-center gap-2"><DoorOpen className="h-4 w-4" />{t("roomScope")}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scopeType === "building" && (
                <div className="space-y-2">
                  <Label>{t("sourceBuilding")}</Label>
                  <Select value={fromBuildingId} onValueChange={setFromBuildingId} disabled={!fromResidenceId}>
                    <SelectTrigger><SelectValue placeholder={t("selectBuilding")} /></SelectTrigger>
                    <SelectContent>
                      {fromBuildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>{building.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scopeType === "room" && (
                <div className="space-y-2">
                  <Label>{t("sourceRoom")}</Label>
                  <Select value={fromRoomId} onValueChange={setFromRoomId} disabled={!fromResidenceId}>
                    <SelectTrigger><SelectValue placeholder={t("selectRoom")} /></SelectTrigger>
                    <SelectContent>
                      {fromRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>{room.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("companyFilter")}</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">{t("allCompanies")}</SelectItem>
                    {companyOptions.map((company) => (
                      <SelectItem key={company.value} value={company.value}>{company.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedWorkers.length > 0 ? `${t("manualWorkers")}: ${selectedWorkers.length}` : t("noManualWorkers")}
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>{t("manualWorkers")} ({selectedWorkers.length})</Label>
              {selectedWorkers.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedWorkers([])}>
                  <X className="h-4 w-4" />
                  {t("clearWorkers")}
                </Button>
              )}
            </div>

            <div className="flex min-h-12 flex-wrap gap-2 rounded-md border bg-muted/40 p-3">
              {selectedWorkers.length === 0 ? (
                <span className="text-sm text-muted-foreground">{t("noManualWorkers")}</span>
              ) : (
                selectedWorkers.map((workerId) => (
                  <Badge key={workerId} variant="secondary" className="gap-1">
                    <span className="max-w-48 truncate">{formatWorkerSummary(workers?.find((worker) => worker.id === workerId), locale)}</span>
                    <button type="button" onClick={() => handleRemoveWorker(workerId)} className="rounded-full p-0.5 hover:bg-destructive/20" aria-label="Remove worker">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("addWorker")}</Label>
                <Select onValueChange={handleAddWorker}>
                  <SelectTrigger><SelectValue placeholder={t("addWorker")} /></SelectTrigger>
                  <SelectContent>
                    {availableWorkers.length === 0 ? (
                      <SelectItem value="_empty" disabled>{isAr ? "لا توجد عمالة متاحة" : "No workers available"}</SelectItem>
                    ) : (
                      availableWorkers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {formatWorkerSummary(worker, locale)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pasteWorkers")}</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                    placeholder={t("pastePlaceholder")}
                    rows={2}
                    dir="auto"
                  />
                  <Button type="button" variant="outline" onClick={handlePasteWorkers} disabled={!pasteText.trim()} className="self-stretch">
                    <ClipboardPaste className="h-4 w-4" />
                    {t("applyPaste")}
                  </Button>
                </div>
                {unmatchedTokens.length > 0 && (
                  <p className="text-sm text-destructive">{t("unmatched")} {unmatchedTokens.join(", ")}</p>
                )}
              </div>
            </div>

            {Object.keys(dateConflicts).length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="mb-2 font-semibold">{t("conflicts")}:</div>
                  <ul className="list-inside list-disc space-y-1">
                    {Object.entries(dateConflicts).map(([workerId, error]) => (
                      <li key={workerId} className="text-sm">{getWorkerName(workerId)}: {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </section>

          <section className="space-y-4 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-primary">
              <ArrowRightLeft className="h-4 w-4" />
              {t("destination")}
              <Badge variant="outline">{t("required")}</Badge>
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("targetResidence")}</Label>
                <Select value={toResidenceId} onValueChange={setToResidenceId}>
                  <SelectTrigger><SelectValue placeholder={t("selectResidence")} /></SelectTrigger>
                  <SelectContent>
                    {residences?.map((residence: any) => (
                      <SelectItem key={residence.id} value={residence.id}>{getLocalizedName(residence, locale)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("targetRoom")}</Label>
                <Select value={toRoomId || "_auto"} onValueChange={(value) => setToRoomId(value === "_auto" ? "" : value)} disabled={!toResidenceId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_auto">{t("autoRoom")}</SelectItem>
                    {toRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{t("transferDate")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs" dir={isAr ? "rtl" : "ltr"}>
                      <p className="text-sm">{t("dateHint1")}</p>
                      <p className="text-sm">{t("dateHint2")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferDate}
                onChange={(event) => setTransferDate(event.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </section>

          <div className="space-y-2">
            <Label>{t("reason")} ({t("optional")})</Label>
            <Textarea placeholder={t("reasonPlaceholder")} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </div>

          {toResidenceId && effectiveWorkerIds.length > 0 && (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-4">
              <p className="mb-2 text-sm font-medium">{t("summary")}:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>{t("workersCount")}: {effectiveWorkerIds.length} {selectedWorkers.length === 0 ? `(${t("inferred")})` : ""}</li>
                {fromResidenceId && (
                  <li>
                    {t("from")}: {getResidenceName(fromResidenceId)}
                    {scopeType === "building" && fromBuildingId ? ` - ${fromBuildings.find((b) => b.id === fromBuildingId)?.label || fromBuildingId}` : ""}
                    {scopeType === "room" && fromRoomId ? ` - ${getRoomName(fromRoomId, fromResidenceId)}` : ""}
                  </li>
                )}
                <li>{t("to")}: {getResidenceName(toResidenceId)} {toRoomId ? `- ${getRoomName(toRoomId, toResidenceId)}` : `- ${t("autoRoom")}`}</li>
              </ul>
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">{t("workerPreview")}</p>
                <div className="max-h-56 overflow-auto rounded-md border bg-background">
                  {effectiveWorkers.slice(0, 20).map((worker: any) => (
                    <div key={worker.id} className="grid gap-1 border-b p-2 text-xs last:border-b-0 md:grid-cols-[1.4fr_1fr_1fr]">
                      <div className="font-medium text-foreground">{worker.name || worker.id}</div>
                      <div className="text-muted-foreground">
                        {[worker.employeeId ? `${t("employeeNo")}: ${worker.employeeId}` : "", worker.idNumber ? `${t("idNo")}: ${worker.idNumber}` : ""].filter(Boolean).join(" | ") || worker.id}
                      </div>
                      <div className="text-muted-foreground">
                        {[worker.company ? `${t("company")}: ${worker.company}` : "", worker.nationaliy ? `${t("nationality")}: ${worker.nationaliy}` : ""].filter(Boolean).join(" | ")}
                      </div>
                    </div>
                  ))}
                </div>
                {effectiveWorkers.length > 20 && (
                  <p className="text-xs text-muted-foreground">+{effectiveWorkers.length - 20} {t("moreWorkers")}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className={isAr ? "flex-row-reverse" : ""}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>{t("cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getLocalizedName(entity: any, locale: "ar" | "en") {
  if (!entity) return "";
  return locale === "ar"
    ? entity.nameAr || entity.name || entity.nameEn || entity.id
    : entity.nameEn || entity.name || entity.nameAr || entity.id;
}

function getRoomOptions(residence: any, locale: "ar" | "en"): RoomOption[] {
  if (!residence) return [];
  const rooms: RoomOption[] = [];

  (residence.rooms || []).forEach((room: any) => {
    rooms.push({ id: room.id, label: getLocalizedName(room, locale) });
  });

  (residence.buildings || []).forEach((building: any) => {
    (building.floors || []).forEach((floor: any) => {
      (floor.rooms || []).forEach((room: any) => {
        const roomName = getLocalizedName(room, locale);
        const buildingName = getLocalizedName(building, locale);
        const floorName = getLocalizedName(floor, locale);
        rooms.push({
          id: room.id,
          label: [buildingName, floorName, roomName].filter(Boolean).join(" - "),
          buildingId: building.id,
          buildingLabel: buildingName,
          floorLabel: floorName,
        });
      });
    });
  });

  return rooms;
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatWorkerSummary(worker: any, locale: "ar" | "en") {
  if (!worker) return "";
  const primaryId = worker.employeeId || worker.idNumber || worker.id;
  const meta = [primaryId, worker.company, worker.nationaliy].filter(Boolean).join(" - ");
  return locale === "ar" ? `${worker.name || worker.id}${meta ? ` (${meta})` : ""}` : `${worker.name || worker.id}${meta ? ` (${meta})` : ""}`;
}

function workerMatchesCompany(worker: any, selectedCompany: string, companies: any[]) {
  if (!worker) return false;
  const workerCompany = normalizeLookup(worker.company || "");
  const selected = normalizeLookup(selectedCompany);
  if (!workerCompany || !selected) return false;
  if (workerCompany === selected) return true;

  const company = companies.find((item) => normalizeLookup(item.id) === selected);
  if (!company) return false;
  return [company.id, company.name, company.nameAr, company.nameEn]
    .filter(Boolean)
    .map((value) => normalizeLookup(String(value)))
    .includes(workerCompany);
}
