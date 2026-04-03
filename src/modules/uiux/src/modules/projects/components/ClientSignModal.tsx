import React, { useState } from 'react';
import { ShieldCheck, Cpu, Key, Lock, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import StatusTracker from '../../../components/StatusTracker';
import { PkiService } from '../../../utils/pki-service';

interface ClientSignModalProps {
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

const ClientSignModal: React.FC<ClientSignModalProps> = ({ isOpen, onClose, onSuccess, request, onSign, showAlert }) => {
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

  const handleClientSign = async () => {
    showAlert(t('common.confirm'), t('task_request.confirm_client_sign'), 'confirm', async () => {
      try {
        setIsSubmitting(true);
        
        const dataToSign = JSON.stringify({
           requestId: request.id,
           finalPrice: request.finalPrice,
           timestamp: Date.now(),
           action: 'CLIENT_PKI_APPROVAL'
        });

        const { signature, publicKey } = await PkiService.signData(dataToSign);

        for (let i = 0; i <= 100; i += 25) {
           setSigningProgress(i);
           await new Promise(r => setTimeout(r, 200));
        }

        await onSign(request.id, signature, publicKey);
        
        onSuccess();
        setSigningProgress(0);
      } catch (err: any) {
        console.error('Client PKI Error:', err);
        showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_client_pki'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('task_request.modal_title_client_sign')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('task_request.btn_review_details')}
          </button>
          <button 
            onClick={handleClientSign} 
            disabled={isSubmitting}
            className="flex-[2] py-2.5 bg-status-green text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('task_request.pki_approving')}
              </>
            ) : (
               <>{t('task_request.btn_client_sign')} <Key className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
          <StatusTracker steps={STEPS} currentStep={2} /> {/* step 2 means Phase 3 (index starts at 0) */}
        </div>

        <div className="bg-bg-surface border border-slate-700/30 p-6 rounded-3xl space-y-5">
           <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('task_request.label_project_req')}</p>
                 <h4 className="text-lg font-black text-white italic">{request.title}</h4>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-status-green uppercase tracking-widest">{t('task_request.label_total_cost')}</p>
                 <h4 className="text-2xl font-black text-white italic tracking-tighter">${request.finalPrice}</h4>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-1">
                 <div className="flex items-center gap-2 text-accent-blue opacity-70">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">{t('task_request.label_effort')}</span>
                 </div>
                 <p className="text-sm font-black text-white italic">{request.estimatedHours} {t('task_request.hours_suffix')}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-1">
                 <div className="flex items-center gap-2 text-status-green opacity-70">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">{t('task_request.service_category')}</span>
                 </div>
                 <p className="text-sm font-black text-white italic">{t('task_request.cr_implementation')}</p>
              </div>
           </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl space-y-4 relative overflow-hidden group">
           <div className="relative z-10 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('task_request.pki_auth_level')}</p>
                <h5 className="text-sm font-black text-white italic">{t('task_request.client_digital_sig')}</h5>
                <p className="text-[10px] text-slate-500 font-bold italic">{t('task_request.client_pki_desc')}</p>
              </div>
              <Lock className="w-8 h-8 text-indigo-500 opacity-50" />
           </div>
           
           {isSubmitting && (
             <div className="pt-2">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${signingProgress}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse flex items-center gap-2">
                      <Cpu className="w-3 h-3" /> {t('task_request.security_handshake')}
                   </span>
                   <span className="text-[8px] font-black text-indigo-400 italic">{signingProgress}%</span>
                </div>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default ClientSignModal;
