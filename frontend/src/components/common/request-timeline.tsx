"use client";

import { CheckCircle, Circle, Clock, XCircle } from "lucide-react";
import { STEP_LABELS, RequestStatus } from "@/types/request.types";
import { cn } from "@/lib/utils";

interface RequestTimelineProps {
  currentStep: number;
  status: RequestStatus;
}

const TOTAL_STEPS = 7; // 0..6

function getStepState(
  stepIndex: number,
  currentStep: number,
  status: RequestStatus
): "completed" | "current" | "rejected" | "pending" {
  if (status === "APPROVED") return "completed";
  if (status === "REJECTED" || status === "RETURNED") {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "rejected";
    return "pending";
  }
  if (stepIndex < currentStep) return "completed";
  if (stepIndex === currentStep) return "current";
  return "pending";
}

const stateIcon = {
  completed: <CheckCircle className="h-6 w-6 text-green-500" />,
  current: <Clock className="h-6 w-6 text-blue-500 animate-pulse" />,
  rejected: <XCircle className="h-6 w-6 text-red-500" />,
  pending: <Circle className="h-6 w-6 text-gray-300" />,
};

const stateLineColor = {
  completed: "bg-green-500",
  current: "bg-blue-300",
  rejected: "bg-red-300",
  pending: "bg-gray-200",
};

export function RequestTimeline({ currentStep, status }: RequestTimelineProps) {
  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop horizontal */}
      <div className="hidden md:flex items-start gap-0">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const state = getStepState(i, currentStep, status);
          return (
            <div key={i} className="flex flex-1 flex-col items-center relative">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={cn("h-0.5 flex-1", stateLineColor[getStepState(i - 1, currentStep, status)])} />
                )}
                <div className="z-10">{stateIcon[state]}</div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={cn("h-0.5 flex-1", stateLineColor[state])} />
                )}
              </div>
              <span className="mt-2 text-xs text-center leading-tight max-w-20">
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex flex-col gap-0 md:hidden">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const state = getStepState(i, currentStep, status);
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {stateIcon[state]}
                {i < TOTAL_STEPS - 1 && (
                  <div className={cn("w-0.5 h-6", stateLineColor[state])} />
                )}
              </div>
              <span className="text-sm pt-0.5">{STEP_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
