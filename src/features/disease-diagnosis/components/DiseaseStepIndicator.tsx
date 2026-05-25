import { CheckCircle } from "lucide-react";

export type PipelineStep = "UPLOAD" | "SELECT" | "PREDICT" | "RESULT";

interface DiseaseStepIndicatorProps {
  step: PipelineStep;
  onStepClick?: (targetStep: PipelineStep) => void;
}

export function DiseaseStepIndicator({ step, onStepClick }: DiseaseStepIndicatorProps) {
  const getStepProgress = () => {
    switch (step) {
      case "UPLOAD": return 1;
      case "SELECT": 
      case "PREDICT": return 2;
      case "RESULT": return 3;
    }
  };
  const currentProgress = getStepProgress();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative px-2 sm:px-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full -z-10 px-6 sm:px-12 object-contain hidden sm:block">
           <div 
             className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
             style={{ width: currentProgress === 1 ? '0%' : currentProgress === 2 ? '50%' : '100%' }}
           />
        </div>

        {[
          { num: 1, label: "Tải ảnh", stepValue: "UPLOAD" as PipelineStep },
          { num: 2, label: "Chọn lá", stepValue: "SELECT" as PipelineStep },
          { num: 3, label: "Kết quả", stepValue: "RESULT" as PipelineStep }
        ].map((s) => {
          const isClickable = onStepClick && (
            (s.num === 1) || 
            (s.num === 2 && currentProgress >= 2) || 
            (s.num === 3 && currentProgress >= 3)
          );
          
          return (
            <button 
              key={s.num} 
              onClick={() => isClickable && onStepClick(s.stepValue)}
              className={`flex flex-col items-center gap-2 bg-[#F8FAF9] sm:bg-transparent px-2 focus:outline-none ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300
                ${currentProgress >= s.num ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-slate-400"}
              `}>
                {currentProgress > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs sm:text-sm font-semibold ${currentProgress >= s.num ? "text-emerald-800" : "text-slate-400"}`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
