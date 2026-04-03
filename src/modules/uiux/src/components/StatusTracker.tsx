import React from 'react';

interface Step {
  label: string;
  subLabel: string;
}

interface StatusTrackerProps {
  steps: Step[];
  currentStep: number; // 0, 1, 2, 3, 4
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-start justify-between w-full mb-8 relative">
      {/* Background Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 -z-10" />
      
      {/* Progress Line */}
      <div 
        className="absolute top-4 left-0 h-0.5 bg-accent-blue transition-all duration-700 -z-10"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, idx) => {
        const isActive = idx <= currentStep;
        const isCurrent = idx === currentStep;

        return (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border-2 ${
                isCurrent 
                  ? 'bg-accent-blue border-accent-blue text-white scale-110 shadow-lg shadow-blue-500/30' 
                  : isActive 
                    ? 'bg-slate-900 border-accent-blue text-accent-blue' 
                    : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              {idx + 1}
            </div>
            <div className="mt-2 flex flex-col items-center text-center px-1">
              <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {step.label}
              </span>
              <span className="text-[8px] font-bold text-slate-600 italic mt-0.5">
                {step.subLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTracker;
