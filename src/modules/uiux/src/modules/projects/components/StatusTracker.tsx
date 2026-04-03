import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatusTrackerProps {
  currentStatus: string;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ currentStatus }) => {
  const { t } = useTranslation();
  
  const steps = [
    { label: t('task_request.step_init'), requiredStatus: ['PROPOSED', 'ESTIMATED', 'PRICED', 'CLIENT_SIGNED', 'CEO_SIGNED', 'DISTRIBUTED', 'COMPLETED'] },
    { label: t('task_request.step_estimate'), requiredStatus: ['ESTIMATED', 'PRICED', 'CLIENT_SIGNED', 'CEO_SIGNED', 'DISTRIBUTED', 'COMPLETED'] },
    { label: t('task_request.step_pricing'), requiredStatus: ['PRICED', 'CLIENT_SIGNED', 'CEO_SIGNED', 'DISTRIBUTED', 'COMPLETED'] },
    { label: t('task_request.step_signing'), requiredStatus: ['CLIENT_SIGNED', 'CEO_SIGNED', 'DISTRIBUTED', 'COMPLETED'] },
    { label: t('task_request.step_execution'), requiredStatus: ['DISTRIBUTED', 'COMPLETED'] },
  ];
  return (
    <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center relative gap-2">
      {steps.map((step, sidx) => {
        const isDone = step.requiredStatus.includes(currentStatus);
        const isActive = isDone && (!steps[sidx + 1]?.requiredStatus.includes(currentStatus));

        return (
          <div key={sidx} className={`flex items-center gap-2 ${sidx > 0 && 'flex-1 justify-center'}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
              isDone 
                ? (isActive ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/40 scale-110' : 'bg-status-green text-white shadow-lg')
                : 'bg-bg-surface text-slate-700 border border-slate-800'
            }`}>
              {sidx + 1}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest italic ${
              isActive ? 'text-white underline decoration-accent-blue/50 decoration-2' 
              : isDone ? 'text-status-green opacity-80' : 'text-slate-600'
            }`}>
              {step.label}
            </span>
            {sidx < steps.length - 1 && <div className={`h-px flex-1 mx-2 hidden md:block ${isDone ? 'bg-status-green/50' : 'bg-slate-800/50'}`}></div>}
          </div>
        )
      })}
    </div>
  );
};

export default StatusTracker;
