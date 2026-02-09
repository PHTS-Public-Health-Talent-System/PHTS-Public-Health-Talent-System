"use client"

import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { RequestFormData } from "@/types/request.types"
import {
  CheckCircle2,
  Info,
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  Users,
  Stethoscope,
  Smile,
  Pill,
  Activity
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useMasterRates } from "@/features/request/hooks"
import { useRateHierarchy } from "@/features/master-data/hooks"
import { MasterRate } from "@/features/request/api"

// Local interfaces matching Backend Types + Icon
interface Criterion {
  id: string;
  label: string;
  description?: string; // Optional
  subCriteria?: Criterion[];
  choices?: string[]; // Kept for compat, though DB might not populate it yet
}

interface ProfessionGroup {
  id: string;
  name: string;
  rate: number;
  criteria: Criterion[];
}

interface ProfessionDef {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  groups: ProfessionGroup[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  DOCTOR: Stethoscope,
  DENTIST: Smile,
  PHARMACIST: Pill,
  NURSE: Activity,
  OTHERS: Users
};

interface Step4Props {
  data: RequestFormData
  updateData: (field: keyof RequestFormData, value: unknown) => void
}

// Helper Component for the "Step" UI Pattern (Adapted from User Demo)
const SelectionStep = ({ title, isActive, isCompleted, onEdit, children }: {
  title: string,
  isActive: boolean,
  isCompleted: boolean,
  onEdit?: () => void,
  children: React.ReactNode
}) => {
  return (
    <div className={`mb-4 border rounded-xl overflow-hidden transition-all duration-300 ${isActive ? 'border-primary/50 shadow-lg ring-1 ring-primary/10' : 'border-muted'}`}>
      <div
        className={`px-4 py-3 flex justify-between items-center ${isCompleted ? 'bg-muted/30 cursor-pointer hover:bg-muted/50' : isActive ? 'bg-primary/5' : 'bg-muted/10 opacity-60'}`}
        onClick={isCompleted ? onEdit : undefined}
      >
        <h3 className={`font-semibold flex items-center gap-2 text-sm md:text-base ${isActive ? 'text-primary' : 'text-foreground/70'}`}>
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {!isCompleted && isActive && <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>}
          {!isCompleted && !isActive && <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>}
          {title}
        </h3>
        {isCompleted && onEdit && <button type="button" className="text-xs text-primary hover:underline">แก้ไข</button>}
      </div>

      {isActive && (
        <div className="p-4 bg-card animate-in fade-in slide-in-from-top-1">
          {children}
        </div>
      )}

      {isCompleted && !isActive && (
        <div className="px-4 py-2 bg-card text-sm text-muted-foreground border-t border-muted/50 flex flex-wrap items-center gap-2">
           <span className="font-medium text-xs uppercase tracking-wide opacity-70">เลือกแล้ว:</span>
           {children}
        </div>
      )}
    </div>
  );
};

export function Step4RateMapping({ data, updateData }: Step4Props) {
  const { data: masterRates, isLoading: isRatesLoading } = useMasterRates()
  const { data: hierarchyData, isLoading: isHeirarchyLoading } = useRateHierarchy()

  const rates = useMemo(() => (masterRates ?? []) as MasterRate[], [masterRates])
  const isLoading = isRatesLoading || isHeirarchyLoading

  // --- STATE ---
  // We use internal state for the wizard flow, then sync to parent 'data'
  const [selectedGroup, setSelectedGroup] = useState<ProfessionGroup | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<Criterion | null>(null);
  const [selectedSubCriteria, setSelectedSubCriteria] = useState<Criterion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Derive selected profession from context (auto-detected Step 1)
  const selectedProfCode = data.professionCode || data.rateMapping?.professionCode || "";

  // Find the matching Profession Data config from DYNAMIC hierarchy
  const selectedProfData = useMemo(() => {
    if (!hierarchyData || !selectedProfCode) return null;

    // Find matching item
    let found = hierarchyData.find((p: ProfessionDef) => p.id === selectedProfCode);

    // Fallback to OTHERS if not found (optional logic)
    if (!found) found = hierarchyData.find((p: ProfessionDef) => p.id === 'OTHERS');

    if (found) {
        // Attach Icon from Map
        return {
            ...found,
            icon: ICON_MAP[found.id] || Users
        };
    }
    return null;
  }, [selectedProfCode, hierarchyData]);

  // Sync initial state from existing 'data' if editing (Rehydration)
  useEffect(() => {
    if (data.rateMapping?.groupId && selectedProfData) {
      // Logic to rehydrate state tree using DYNAMIC data
      const savedGroup = selectedProfData.groups.find((g: ProfessionGroup) => g.id === data.rateMapping?.groupId);
      // eslint-disable-next-line
      if (savedGroup && savedGroup.id !== selectedGroup?.id) setSelectedGroup(savedGroup);
    }
  }, [selectedProfData, data.rateMapping?.groupId, selectedGroup?.id]);

  const selectedGroupId = selectedGroup?.id;
  const selectedGroupRate = selectedGroup?.rate;
  const selectedGroupCriteriaLen = selectedGroup?.criteria?.length ?? 0;
  const selectedCriteriaId = selectedCriteria?.id;
  const selectedSubCriteriaId = selectedSubCriteria?.id;
  const rateMapping = data.rateMapping;

  useEffect(() => {
    if (!selectedGroupId || selectedGroupRate === undefined) return;
    if (selectedGroupCriteriaLen > 0) return;
    const desired = {
      ...rateMapping,
      groupId: selectedGroupId,
      itemId: selectedGroupId,
      subItemId: "",
      amount: selectedGroupRate,
      professionCode: selectedProfCode,
    };
    const isSame =
      rateMapping?.groupId === desired.groupId &&
      rateMapping?.itemId === desired.itemId &&
      (rateMapping?.subItemId || "") === desired.subItemId &&
      (rateMapping?.amount ?? 0) === desired.amount &&
      rateMapping?.professionCode === desired.professionCode;
    if (isSame) return;
    updateData("rateMapping", desired);
  }, [
    selectedGroupId,
    selectedGroupRate,
    selectedGroupCriteriaLen,
    selectedProfCode,
    rateMapping,
    updateData,
  ]);

  useEffect(() => {
    if (!selectedGroupId || !selectedCriteriaId || selectedGroupRate === undefined) return;
    const desiredItemId = selectedCriteriaId || "__NONE__";
    const desiredSubId = selectedSubCriteriaId || "";
    const desired = {
      ...rateMapping,
      professionCode: selectedProfCode,
      groupId: selectedGroupId,
      itemId: desiredItemId,
      subItemId: desiredSubId,
      amount: selectedGroupRate,
    };
    const isSame =
      rateMapping?.groupId === desired.groupId &&
      rateMapping?.itemId === desired.itemId &&
      (rateMapping?.subItemId || "") === desired.subItemId &&
      (rateMapping?.amount ?? 0) === desired.amount &&
      rateMapping?.professionCode === desired.professionCode;
    if (isSame) return;
    updateData("rateMapping", desired);
  }, [
    selectedGroupId,
    selectedGroupRate,
    selectedCriteriaId,
    selectedSubCriteriaId,
    selectedProfCode,
    rateMapping,
    updateData,
  ]);


  // --- ACTIONS ---
  const handleGroupSelect = (group: ProfessionGroup | null) => {
    setSelectedGroup(group);
    setSelectedCriteria(null);
    setSelectedSubCriteria(null);
    setSelectedChoice(null);

    // Preliminary update (rate comes from group in this model)
    // We need to find valid backend rateId if possible
    syncToParent(group, null, null, null);
  };

  const handleCriteriaSelect = (criteria: Criterion | null) => {
    setSelectedCriteria(criteria);
    setSelectedSubCriteria(null);
    setSelectedChoice(null);
    syncToParent(selectedGroup, criteria, null, null);
  };

  const handleSubCriteriaSelect = (sub: Criterion | null) => {
    setSelectedSubCriteria(sub);
    setSelectedChoice(null);
    syncToParent(selectedGroup, selectedCriteria, sub, null);
  };

  const handleChoiceSelect = (choice: string | null) => {
    setSelectedChoice(choice);
    syncToParent(selectedGroup, selectedCriteria, selectedSubCriteria, choice);
  };

  const syncToParent = (
    group: ProfessionGroup | null,
    cri: Criterion | null,
    sub: Criterion | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _choice: string | null
  ) => {
    if (!group) {
        updateData("rateMapping", { ...data.rateMapping, amount: 0, groupId: "", itemId: "", subItemId: "" });
        return;
    }

    // Amount logic: Demo says rate is at Group level
    const amount = group.rate; // Changed 'let' to 'const' and used group.rate directly

    // Find matching backend rate ID if possible
    // We look for a rate in 'rates' that matches profession + amount
    // This is a "best effort" mapping because the frontend rules dictate the amount now.
    const matchingBackendRate = rates.find(r =>
        r.profession_code === selectedProfCode &&
        r.amount === amount
    );

    // Update parent
    updateData("rateMapping", {
        ...data.rateMapping,
        professionCode: selectedProfCode,
        groupId: group.id,
        itemId: cri?.id || (group.criteria?.length ? "__NONE__" : group.id),
        subItemId: sub?.id || "",
        amount: amount,
        rateId: matchingBackendRate?.rate_id,
        // We can store choice/description in a JSON field if backend supports,
        // or just rely on the IDs. For now, we assume IDs reconstruct the view.
    });
  };

  const handleReset = () => {
    setSelectedGroup(null);
    setSelectedCriteria(null);
    setSelectedSubCriteria(null);
    setSelectedChoice(null);
    updateData("rateMapping", { ...data.rateMapping, amount: 0, groupId: "", itemId: "", subItemId: "" });
  };

  const renderMoney = (amount: number) => {
    return amount.toLocaleString() + ' บาท';
  };

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-primary">ระบบคำนวณ พ.ต.ส.</h3>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors border px-3 py-1.5 rounded-md"
          >
            <RefreshCw size={14} /> ล้างค่าเริ่มต้น
          </button>
        </div>

        {isLoading && <Skeleton className="h-40 w-full" />}

        {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* MAIN FORM AREA */}
          <div className="lg:col-span-2 space-y-2">

            {/* STEP 1: Profession (Read Only from Context) */}
            <SelectionStep
              title="1. เลือกวิชาชีพ"
              isActive={false}
              isCompleted={true}
            >
               <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <User size={20} />
                  </div>
                  <span className="font-medium text-foreground">
                    {selectedProfData?.name || selectedProfCode || "ไม่พบข้อมูลวิชาชีพ"}
                  </span>
               </div>
            </SelectionStep>

            {/* STEP 2: Group */}
            {selectedProfData && (
              <SelectionStep
                title="2. เลือกกลุ่ม"
                isActive={!selectedGroup}
                isCompleted={!!selectedGroup}
                onEdit={() => handleGroupSelect(null)}
              >
                {!selectedGroup ? (
                  <div className="space-y-3">
                    {selectedProfData.groups.map((group: ProfessionGroup) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleGroupSelect(group)}
                        className="w-full flex justify-between items-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                      >
                        <span className="font-medium text-foreground">{group.name}</span>
                        <Badge variant="secondary" className="group-hover:bg-white text-base px-3 py-1">
                          {renderMoney(group.rate)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                   <div className="flex justify-between w-full items-center">
                     <span className="font-medium">{selectedGroup.name}</span>
                     <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">{renderMoney(selectedGroup.rate)}</span>
                   </div>
                )}
              </SelectionStep>
            )}

            {/* STEP 3: Criteria */}
            {selectedGroup && (
              <SelectionStep
                title="3. เลือกเกณฑ์/เงื่อนไข"
                isActive={!!selectedGroup && !selectedCriteria}
                isCompleted={!!selectedCriteria}
                onEdit={() => handleCriteriaSelect(null)}
              >
                {!selectedCriteria ? (
                  <div className="space-y-2">
                    {selectedGroup.criteria.map((cri) => (
                      <button
                        key={cri.id}
                        type="button"
                        onClick={() => handleCriteriaSelect(cri)}
                        className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-2">
                           <div>
                                <div className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{cri.label}</div>
                           </div>
                           {cri.subCriteria && (
                            <Badge variant="outline" className="text-[10px] shrink-0 bg-blue-50 text-blue-600 border-blue-200">
                                มีข้อย่อย
                            </Badge>
                           )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-foreground">{selectedCriteria.label}</span>
                )}
              </SelectionStep>
            )}

            {/* STEP 4: Sub-Criteria (Conditional) */}
            {selectedCriteria && selectedCriteria.subCriteria && selectedCriteria.subCriteria.length > 0 && (
              <SelectionStep
                title="4. รายละเอียดเงื่อนไขย่อย"
                isActive={true}
                isCompleted={!!selectedSubCriteria}
                onEdit={() => setSelectedSubCriteria(null)}
              >
                {!selectedSubCriteria ? (
                  <div className="space-y-2">
                    {selectedCriteria.subCriteria.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                            handleSubCriteriaSelect(sub);
                        }}
                        className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-sm group"
                      >
                        <div className="flex justify-between items-center">
                            <span className="group-hover:text-primary transition-colors">{sub.label}</span>
                            {sub.choices && (
                                <span className="text-[10px] text-muted-foreground italic">(ต้องระบุงาน)</span>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                   <span className="text-foreground">{selectedSubCriteria.label}</span>
                )}
              </SelectionStep>
            )}

            {/* STEP 5: Choices (Deep Nested - e.g. Nurse 2.2.2 specific jobs) */}
            {selectedSubCriteria && selectedSubCriteria.choices && (
                 <div className="ml-4 md:ml-8 p-4 bg-purple-50/50 rounded-lg border border-purple-100 mt-4 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <Info size={14} /> ระบุงานเฉพาะทาง (จำเป็น):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedSubCriteria.choices.map((choice, idx) => (
                            <label key={idx} className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-all ${selectedChoice === choice ? 'bg-purple-100 border-purple-300 ring-1 ring-purple-200' : 'bg-white border-purple-100 hover:border-purple-300'}`}>
                                <input
                                    type="radio"
                                    name="specific_job"
                                    className="accent-purple-600 w-4 h-4"
                                    onChange={() => handleChoiceSelect(choice)}
                                />
                                <span className="text-sm text-slate-700">{choice}</span>
                            </label>
                        ))}
                    </div>
                 </div>
            )}

            {/* Effective Date (Always Visible at bottom of form area) */}
            {(selectedGroup || selectedProfCode) && (
              <div className="mt-8 pt-6 border-t">
                 <div className="max-w-xs">
                    <label className="text-sm font-medium mb-1.5 block">วันที่มีผล (Effective Date)</label>
                    <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={data.effectiveDate}
                        onChange={(e) => updateData("effectiveDate", e.target.value)}
                    />
                 </div>
              </div>
            )}

          </div>

          {/* SUMMARY & DOCS PANEL */}
          <div className="space-y-6 lg:sticky lg:top-6">

            {/* RESULT CARD */}
            <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
                <div className="bg-slate-900 p-4 text-white flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-md">
                        <FileText size={18} />
                    </div>
                    <h2 className="font-bold text-sm tracking-wide">สรุป</h2>
                </div>

                <div className="p-6">
                    {!selectedProfData ? (
                        <div className="text-center py-8 text-muted-foreground/50">
                            <Info className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">กรุณาเลือกข้อมูลเพื่อแสดงผล</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">วิชาชีพ</label>
                                <div className="font-medium text-foreground">{selectedProfData.name}</div>
                            </div>

                            {selectedGroup && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">กลุ่ม</label>
                                    <div className="flex justify-between items-end border-b pb-2 border-border/50">
                                        <div className="text-sm text-foreground">{selectedGroup.name}</div>
                                        {/* Amount is conditionally shown at bottom, but demo showed it here too? No, mostly separate.
                                            But keeping it consistent with user demo structure. */}
                                    </div>
                                </div>
                            )}

                            {selectedCriteria && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">เงื่อนไขอ้างอิง</label>
                                    <div className="mt-1.5 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted/50">
                                        <p className="font-medium text-foreground mb-1">{selectedCriteria.description || selectedCriteria.label}</p>

                                        {selectedSubCriteria && (
                                            <div className="mt-2 pt-2 border-t border-muted/50 text-primary font-medium flex items-start gap-2 text-xs">
                                                <span className="block w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0"></span>
                                                {selectedSubCriteria.description || selectedSubCriteria.label}
                                            </div>
                                        )}
                                        {selectedChoice && (
                                            <div className="mt-1 pl-3 text-purple-600 text-xs font-semibold">
                                                • งาน: {selectedChoice}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Validation Warning */}
                            {selectedSubCriteria?.choices && !selectedChoice && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex gap-2 items-start animate-in fade-in">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span>กรุณาระบุงานเฉพาะทางให้ครบถ้วน</span>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Confirm Amount Footer */}
                {selectedGroup && (
                    <div className="bg-muted/20 p-4 border-t border-border text-center">
                         <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">ยอดเงินเพิ่มพิเศษสุทธิ</span>
                         <div className="text-3xl font-bold text-primary">
                           {renderMoney(selectedGroup.rate)}
                         </div>
                    </div>
                )}
            </div>


          </div>
        </div>
        )}
    </div>
  )
}
