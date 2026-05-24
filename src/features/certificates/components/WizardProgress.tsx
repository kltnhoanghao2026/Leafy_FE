import { Check } from "lucide-react";
import type { WizardStep } from "../types";

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop progress */}
      <div className="hidden sm:flex items-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-[#245A34] text-white ring-4 ring-emerald-100"
                        : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </div>
                <div
                  className={`mt-2 text-center ${
                    isCurrent
                      ? "opacity-100"
                      : isCompleted
                        ? "opacity-80"
                        : "opacity-50"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-[#245A34]"
                        : isCompleted
                          ? "text-emerald-700"
                          : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden md:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-3 mb-6 transition-all duration-500 rounded-full ${
                    isCompleted ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile progress */}
      <div className="sm:hidden flex items-center justify-between px-2">
        <div
          className="text-xs font-bold text-[#245A34]"
        >
          Bước {currentStep + 1} / {steps.length}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#245A34] rounded-full transition-all duration-500"
              style={{
                width: `${((currentStep) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
