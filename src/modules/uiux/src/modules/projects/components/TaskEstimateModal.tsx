import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Key, Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import StatusTracker from '../../../components/StatusTracker';
import { PkiService } from '../../../utils/pki-service';

interface TaskEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: {
    id: string;
    title: string;
    description: string;
    status: string;
    clientId: string;
  } | null;
  onEstimate: (id: string, hours: number, signature?: string, publicKey?: string) => Promise<void>;
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const TaskEstimateModal: React.FC<TaskEstimateModalProps> = ({ isOpen, onClose, onSuccess, request, onEstimate, showAlert }) => {
  const { t } = useTranslation();
  const [hours, setHours] = useState<number>(0);
  const [step, setStep] = useState(1); // 1: Effort, 2: Real PKI Signing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signingProgress, setSigningProgress] = useState(0);
  const [pkiError, setPkiError] = useState<string | null>(null);

  const STEPS = [
    { label: t('task_request.step_init'), subLabel: t('task_request.step_init_sub') },
    { label: t('task_request.step_estimate'), subLabel: t('task_request.step_estimate_sub') },
    { label: t('task_request.step_signing'), subLabel: t('task_request.step_signing_sub') },
    { label: t('task_request.step_approval'), subLabel: t('task_request.step_approval_sub') },
    { label: t('task_request.step_execution'), subLabel: t('task_request.step_execution_sub') }
  ];

  if (!request) return null;

  const handleNextToSign = () => {
    if (hours <= 0) {
      showAlert(t('common.error'), t('task_request.error_invalid_hours'), 'error');
      return;
    }
    setStep(2);
  };

  const handleRealPKISign = async () => {
    showAlert(t('common.confirm'), t('task_request.confirm_pm_sign'), 'confirm', async () => {
      try {
        setIsSubmitting(true);
        setPkiError(null);
        
        const dataToSign = JSON.stringify({
           requestId: request.id,
           hours: hours,
           timestamp: Date.now(),
           action: 'PM_EFFORT_ESTIMATE'
        });

        const { signature, publicKey } = await PkiService.signData(dataToSign);

        for (let i = 0; i <= 100; i += 25) {
           setSigningProgress(i);
           await new Promise(r => setTimeout(r, 200));
        }

        await onEstimate(request.id, hours, signature, publicKey);
        
        onSuccess();
        setStep(1); 
        setSigningProgress(0);
      } catch (err: any) {
        console.error('PKI Error:', err);
        const errMsg = err.response?.data?.message || t('task_request.error_pki');
        setPkiError(errMsg);
        showAlert(t('common.error'), errMsg, 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={step === 1 ? t("task_request.modal_title_effort") : t("task_request.modal_title_pki")}
      footer={
        <div className="flex items-center gap-3 w-full">
          {step === 1 ? (
            <>
              <button 
                onClick={onClose} 
                className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
              >
                {t('task_request.btn_cancel')}
              </button>
              <button 
                onClick={handleNextToSign} 
                className="flex-[2] py-2.5 bg-accent-blue text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all italic flex items-center justify-center gap-2"
              >
                {t('task_request.btn_continue_pki')} <ShieldCheck className="w-4 h-4 ml-1" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep(1)} 
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic disabled:opacity-0"
              >
                {t('task_request.btn_edit_effort')}
              </button>
              <button 
                onClick={handleRealPKISign} 
                disabled={isSubmitting}
                className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 italic flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('task_request.signing_status')}
                  </>
                ) : (
                  <>{t('task_request.btn_pki_sign')} <ShieldCheck className="w-4 h-4" /></>
                )}
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Status Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
          <StatusTracker steps={STEPS} currentStep={1} />
        </div>

        {step === 1 ? (
          /* STEP 1: Effort Input */
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="bg-bg-surface border border-slate-700/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">{t('task_request.label_req_details')}</span>
              </div>
              <h4 className="text-lg font-black text-white italic">{request.title}</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed italic border-l-2 border-slate-800 pl-4 py-1">
                {request.description}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">
                {t('task_request.label_effort_hours')}
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  className="w-full bg-bg-surface border border-slate-700/50 p-5 rounded-3xl text-white outline-none focus:border-accent-blue transition-all font-black text-2xl italic pr-16 shadow-inner"
                  value={hours || ''}
                  onChange={e => setHours(Number(e.target.value))}
                  min="1"
                  placeholder="0"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs uppercase tracking-widest italic pt-1">
                  {t('task_request.hours_suffix')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Real PKI Signing Wizard */
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Lock className="w-24 h-24 text-indigo-400" />
               </div>
               
               <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('task_request.security_msg')}</p>
                    <h5 className="text-sm font-black text-white italic">{t('task_request.signature_type')}</h5>
                    <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
                       <code className="text-[9px] text-indigo-300/80 font-mono break-all opacity-70 italic">
                          {t('task_request.payload_digest')}: {btoa(request.id + hours).substring(0, 48)}...
                       </code>
                    </div>
                  </div>
               </div>
               
               {isSubmitting && (
                 <div className="pt-2">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${signingProgress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse flex items-center gap-2">
                          <Cpu className="w-3 h-3" /> {t('task_request.signing_msg')}
                       </span>
                       <span className="text-[8px] font-black text-indigo-400 italic">{signingProgress}%</span>
                    </div>
                 </div>
               )}
            </div>

            {pkiError && (
              <div className="bg-status-red/10 border border-status-red/30 p-4 rounded-2xl flex items-center gap-3 text-status-red text-[11px] font-bold italic">
                 <AlertTriangle className="w-4 h-4" /> {pkiError}
              </div>
            )}

            <div className="p-5 bg-bg-surface border border-slate-700/50 rounded-2xl space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-accent-blue border border-slate-700">
                     <Key className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[10px] font-black text-white uppercase tracking-wider">{t('task_request.browser_key')}</p>
                     <p className="text-[9px] text-slate-500 font-bold italic">{t('task_request.browser_key_desc')}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskEstimateModal;
