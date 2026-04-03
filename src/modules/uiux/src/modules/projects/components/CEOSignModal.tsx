import React, { useState } from 'react';
import { ShieldCheck, Cpu, Key, Lock, Briefcase, FileCheck, CheckCircle2, Loader2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import StatusTracker from '../../../components/StatusTracker';
import { PkiService } from '../../../utils/pki-service';

interface CEOSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    finalPrice: number;
    status: string;
  } | null;
  onSign: (id: string, signature: string, publicKey: string) => Promise<void>;
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const CEOSignModal: React.FC<CEOSignModalProps> = ({ isOpen, onClose, onSuccess, request, onSign, showAlert }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signingProgress, setSigningProgress] = useState(0);

  const STEPS = [
    { label: t('task_request.step_init'), subLabel: t('task_request.step_init_sub') },
    { label: t('task_request.step_estimate'), subLabel: t('task_request.step_estimate_sub') },
    { label: t('task_request.step_signing'), subLabel: t('task_request.step_signing_sub') },
    { label: t('task_request.step_approval'), subLabel: t('task_request.step_approval_sub') },
    { label: t('task_request.step_execution'), subLabel: t('task_request.step_execution_sub') }
  ];

  if (!request) return null;

  const handleCEOSign = async () => {
    showAlert(t('common.confirm'), t('task_request.confirm_ceo_sign'), 'confirm', async () => {
      try {
        setIsSubmitting(true);
        
        const dataToSign = JSON.stringify({
           requestId: request.id,
           finalPrice: request.finalPrice,
           ceoApproval: true,
           timestamp: Date.now(),
           action: 'CEO_MASTER_PKI_APPROVAL'
        });

        // REAL PKI signing for CEO
        const { signature, publicKey } = await PkiService.signData(dataToSign);

        for (let i = 0; i <= 100; i += 20) {
           setSigningProgress(i);
           await new Promise(r => setTimeout(r, 150));
        }

        await onSign(request.id, signature, publicKey);
        
        onSuccess();
        setSigningProgress(0);
      } catch (err: any) {
        console.error('CEO Master PKI Error:', err);
        showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_ceo_pki'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('task_request.modal_title_ceo_sign')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('task_request.btn_cancel_approval')}
          </button>
          <button 
            onClick={handleCEOSign} 
            disabled={isSubmitting}
            className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2 border border-indigo-400/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('task_request.issuing_launch_order')}
              </>
            ) : (
               <>{t('task_request.btn_ceo_sign')} <ShieldCheck className="w-4 h-4" /></>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
          <StatusTracker steps={STEPS} currentStep={3} /> {/* Final Approval Step */}
        </div>

        <div className="bg-bg-surface border border-slate-700/30 p-6 rounded-3xl space-y-6 relative overflow-hidden group">
           <div className="absolute -right-2 -top-2 opacity-5">
              <FileCheck className="w-32 h-32 text-white" />
           </div>

           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest">{t('task_request.project_ready')}</p>
                 <h4 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">{request.title}</h4>
              </div>
              <div className="bg-indigo-600/20 px-4 py-2 rounded-xl border border-indigo-500/30">
                 <p className="text-[10px] font-black text-indigo-400 uppercase text-center">{t('task_request.master_id')}</p>
                 <p className="text-sm font-black text-white italic">#{request.id.substring(0, 8)}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-status-green shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase">{t('task_request.effort_assessment')}</p>
                    <p className="text-sm font-black text-white italic tracking-tighter">{request.estimatedHours} {t('task_request.hours_suffix')} {t('task_request.effort_approved')}</p>
                 </div>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-accent-blue shadow-inner">
                    <FileCheck className="w-6 h-6" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase">{t('task_request.financial_clearance')}</p>
                    <p className="text-sm font-black text-white italic tracking-tighter">${request.finalPrice} {t('task_request.contract_value')}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden group">
           <div className="relative z-10 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('task_request.master_pki_auth')}</p>
                <h5 className="text-sm font-black text-white italic">{t('task_request.final_ceo_clearance')}</h5>
                <p className="text-[10px] text-slate-500 font-bold italic border-l-2 border-indigo-500/30 pl-4 py-1">
                   {t('task_request.ceo_pki_desc')}
                </p>
              </div>
              <Lock className="w-8 h-8 text-indigo-400 animate-pulse" />
           </div>
           
           {isSubmitting && (
             <div className="pt-2">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-gradient-to-r from-indigo-600 to-accent-blue transition-all duration-300 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" style={{ width: `${signingProgress}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse flex items-center gap-2">
                      <Cpu className="w-3 h-3" /> {t('task_request.master_key_handshake')}
                   </span>
                   <span className="text-[8px] font-black text-indigo-400 italic font-mono">{signingProgress}% {t('task_request.complete')}</span>
                </div>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default CEOSignModal;
