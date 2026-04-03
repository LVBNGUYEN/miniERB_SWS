import React, { useState } from 'react';
import { DollarSign, Clock, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import StatusTracker from '../../../components/StatusTracker';

interface TaskPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    status: string;
  } | null;
  onPrice: (id: string, price: number) => Promise<void>;
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const TaskPricingModal: React.FC<TaskPricingModalProps> = ({ isOpen, onClose, onSuccess, request, onPrice, showAlert }) => {
  const { t } = useTranslation();
  const [price, setPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STEPS = [
    { label: t('task_request.step_init'), subLabel: t('task_request.step_init_sub') },
    { label: t('task_request.step_estimate'), subLabel: t('task_request.step_estimate_sub') },
    { label: t('task_request.step_signing'), subLabel: t('task_request.step_signing_sub') },
    { label: t('task_request.step_approval'), subLabel: t('task_request.step_approval_sub') },
    { label: t('task_request.step_execution'), subLabel: t('task_request.step_execution_sub') }
  ];

  if (!request) return null;

  const handleSetPrice = async () => {
    if (price <= 0) {
      showAlert(t('common.error'), t('task_request.error_invalid_price'), 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onPrice(request.id, price);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_save_price'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('task_request.modal_title_pricing')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('task_request.btn_cancel')}
          </button>
          <button 
            type="button"
            onClick={handleSetPrice} 
            disabled={isSubmitting || price <= 0}
            className="flex-[2] py-2.5 bg-purple-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('task_request.updating')}
              </>
            ) : (
              t('task_request.btn_confirm_pricing')
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Status Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
          <StatusTracker steps={STEPS} currentStep={2} />
        </div>

        <div className="bg-bg-surface border border-slate-700/30 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{t('task_request.label_pm_estimate_base')}</span>
          </div>
          
          <div className="flex items-center justify-between">
             <div className="space-y-1">
                <h4 className="text-sm font-black text-white italic">{request.title}</h4>
                <p className="text-[10px] text-text-secondary italic">ID: {request.id}</p>
             </div>
             <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                <Clock className="w-4 h-4 text-accent-blue" />
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-500 uppercase">{t('task_request.label_pm_effort_signed')}</p>
                   <p className="text-sm font-black text-white italic">{request.estimatedHours} {t('task_request.hours_suffix')}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-status-green" /> {t('task_request.label_fixed_price_vnd')}
          </label>
          <div className="relative group">
            <input 
              type="number" 
              placeholder="0.00" 
              className="w-full bg-bg-surface border border-slate-700/50 p-6 rounded-3xl text-white outline-none focus:border-purple-500 transition-all font-black text-3xl italic pr-20 shadow-inner"
              value={price || ''}
              onChange={e => setPrice(Number(e.target.value))}
              min="1"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-status-green font-black text-lg italic pt-1">
              VNĐ
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-bold italic ml-2">
            {t('task_request.price_desc')}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TaskPricingModal;
