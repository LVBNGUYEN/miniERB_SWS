import React, { useState } from 'react';
import { User, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';

interface AssignPmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pmId: string) => void;
  request: {
    id: string;
    title: string;
  } | null;
  pms: any[];
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const AssignPmModal: React.FC<AssignPmModalProps> = ({ isOpen, onClose, onSuccess, request, pms, showAlert }) => {
  const { t } = useTranslation();
  const [selectedPmId, setSelectedPmId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleAssign = async () => {
    if (!selectedPmId) return;
    showAlert(t('common.confirm'), t('task_request.confirm_assign_pm'), 'confirm', async () => {
      try {
        setIsSubmitting(true);
        await onSuccess(selectedPmId);
        onClose();
      } catch (err: any) {
        console.error('Assigning PM failed:', err);
        showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_assign_pm'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('task_request.modal_title_assign_pm')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('task_request.btn_cancel')}
          </button>
          <button 
            onClick={handleAssign} 
            disabled={!selectedPmId || isSubmitting}
            className="flex-[2] py-2.5 bg-accent-blue text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('task_request.assigning')}
              </>
            ) : (
              <>{t('task_request.btn_assign_forward')} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-bg-surface border border-slate-700/30 p-6 rounded-3xl space-y-3">
           <div className="flex items-center gap-2 text-accent-blue font-black text-[10px] uppercase tracking-widest">
              <AlertCircle className="w-4 h-4" /> {t('task_request.label_proj_ref')}
           </div>
           <h4 className="text-lg font-black text-white italic truncate">{request.title}</h4>
           <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-status-yellow/20 rounded text-[9px] font-black text-status-yellow uppercase">{t('task_request.status_awaiting_pm')}</span>
           </div>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('task_request.label_select_pm')}</label>
           <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {pms.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPmId(pm.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    selectedPmId === pm.id 
                    ? 'bg-accent-blue/10 border-accent-blue shadow-lg shadow-blue-500/10' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
                  }`}
                >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedPmId === pm.id ? 'bg-accent-blue text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-black italic ${selectedPmId === pm.id ? 'text-white' : 'text-slate-300'}`}>{pm.fullName || pm.username}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t('task_request.role_senior_pm')}</p>
                  </div>
                  {selectedPmId === pm.id && (
                    <div className="w-6 h-6 rounded-full bg-status-green flex items-center justify-center text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
              {pms.length === 0 && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
                  <p className="text-xs font-bold text-slate-500 italic">{t('task_request.no_pm_found')}</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignPmModal;
