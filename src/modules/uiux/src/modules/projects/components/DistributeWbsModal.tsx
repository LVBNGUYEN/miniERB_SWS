import React, { useState } from 'react';
import { LayoutGrid, Users, Zap, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';

interface DistributeWbsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    finalPrice: number;
  } | null;
  onDistribute: (id: string) => Promise<void>;
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const DistributeWbsModal: React.FC<DistributeWbsModalProps> = ({ isOpen, onClose, onSuccess, request, onDistribute, showAlert }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  if (!request) return null;

  const handleDistribute = async () => {
    showAlert(t('common.confirm'), t('projects.confirm_distribute_msg'), 'confirm', async () => {
      try {
        setIsSubmitting(true);
        await onDistribute(request.id);
        onSuccess();
      } catch (err: any) {
        console.error('Distribute error:', err);
        showAlert(t('common.error'), err.response?.data?.message || t('projects.error_distribute'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('projects.distribute_modal_title')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('common.close')}
          </button>
          <button 
            onClick={handleDistribute} 
            disabled={isSubmitting}
            className="flex-[2] py-2.5 bg-status-green text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('projects.distributing')}
              </>
            ) : (
              <>{t('projects.activate_distribute')} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-bg-surface border border-slate-700/30 p-6 rounded-3xl space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-status-green/20 flex items-center justify-center text-status-green">
                 <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase">{t('projects.ready_to_execute')}</p>
                 <h4 className="text-lg font-black text-white italic truncate max-w-sm">{request.title}</h4>
              </div>
           </div>
           
           <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-status-green" />
                 <span className="text-[10px] font-black text-white uppercase italic">{t('projects.signatures_verified')}</span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase">Audit Trail ID: {request.id.substring(0,8)}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
           <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-accent-blue font-black text-[10px] uppercase tracking-widest">
                 <LayoutGrid className="w-4 h-4" /> {t('projects.init_wbs_title')}
              </div>
              <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed">
                 {t('projects.init_wbs_desc')}
              </p>
              <div className="flex gap-2">
                 <span className="px-3 py-1 bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase">{t('projects.create_task')}</span>
                 <span className="px-3 py-1 bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase">{t('projects.track_time')}</span>
                 <span className="px-3 py-1 bg-blue-500/20 rounded-lg text-[9px] font-black text-accent-blue uppercase">{t('projects.assign_dev')}</span>
              </div>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Users className="w-6 h-6" />
           </div>
           <div className="space-y-0.5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('projects.confirm_distribute')}</p>
              <p className="text-xs font-bold text-white italic">{t('projects.confirm_distribute_desc')}</p>
           </div>
        </div>
      </div>
    </Modal>
  );
};

export default DistributeWbsModal;
