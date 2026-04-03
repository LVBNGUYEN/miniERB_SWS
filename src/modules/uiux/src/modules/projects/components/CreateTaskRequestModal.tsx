import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import StatusTracker from '../../../components/StatusTracker';
import { api } from '../../../api';
import { Role } from '../../../../../iam/entities/role.enum';
import { Loader2, Send } from 'lucide-react';

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
}

enum TaskType {
  TASK = 'TASK',
  CR = 'CR'
}

interface CreateTaskRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRole: Role;
  userId: string;
  showAlert: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', onConfirm?: () => void) => void;
}

const INITIAL_REQUEST = { title: '', description: '', pmId: '', clientId: '', type: TaskType.TASK };

const CreateTaskRequestModal: React.FC<CreateTaskRequestModalProps> = ({ isOpen, onClose, onSuccess, currentRole, userId, showAlert }) => {
  const { t } = useTranslation();
  const [pms, setPms] = useState<UserInfo[]>([]);
  const [clients, setClients] = useState<UserInfo[]>([]);
  const [newRequest, setNewRequest] = useState(INITIAL_REQUEST);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const STEPS = [
    { label: t('task_request.step_init'), subLabel: t('task_request.step_init_sub') },
    { label: t('task_request.step_estimate'), subLabel: t('task_request.step_estimate_sub') },
    { label: t('task_request.step_signing'), subLabel: t('task_request.step_signing_sub') },
    { label: t('task_request.step_approval'), subLabel: t('task_request.step_approval_sub') },
    { label: t('task_request.step_execution'), subLabel: t('task_request.step_execution_sub') }
  ];

  useEffect(() => {
    if (isOpen) {
      setNewRequest(INITIAL_REQUEST);
      setFetchError(null);
      fetchPmsAndClients();
    }
  }, [isOpen]);

  const fetchPmsAndClients = async () => {
    try {
      const pmList = await api.get('/iam/user/list?role=PM');
      const clientList = await api.get('/iam/user/list?role=CLIENT');
      
      setPms(Array.isArray(pmList) ? pmList : []);
      setClients(Array.isArray(clientList) ? clientList : []);
    } catch (err) { 
      console.error('Error fetching users:', err); 
      setFetchError(t('task_request.error_fetch_users'));
    }
  };

  const handleCreate = async () => {
    if (!newRequest.title) {
      showAlert(t('common.error'), t('task_request.error_input_title'), 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { 
        ...newRequest, 
        clientId: currentRole === Role.CLIENT ? userId : newRequest.clientId,
        saleId: currentRole === Role.SALE ? userId : undefined
      };

      await api.post('/task-requests/propose', payload);
      onSuccess();
    } catch (err: any) { 
      console.error(err);
      showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_submit'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={currentRole === Role.SALE ? t('task_request.modal_title_sale') : t('task_request.modal_title_propose')}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary italic"
          >
            {t('task_request.btn_close')}
          </button>
          <button 
            type="button"
            onClick={handleCreate} 
            disabled={isSubmitting || !newRequest.title || (currentRole !== Role.CLIENT && !newRequest.clientId)}
            className="flex-[2] py-2.5 bg-accent-blue text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('task_request.submitting')}
              </>
            ) : (
              <>
                {t('task_request.btn_submit')}
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
          <StatusTracker steps={STEPS} currentStep={0} />
        </div>

        {fetchError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('task_request.label_title')}</label>
            <input 
              type="text" 
              placeholder={t('task_request.title_placeholder')} 
              className="w-full bg-bg-surface border border-slate-700/50 p-4 rounded-2xl text-white outline-none focus:border-accent-blue transition-all font-bold italic"
              value={newRequest.title}
              onChange={e => setNewRequest({...newRequest, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('task_request.label_type')}</label>
            <div className="flex bg-bg-surface border border-slate-700/50 p-1 rounded-2xl">
              <button 
                onClick={() => setNewRequest({...newRequest, type: TaskType.TASK})}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newRequest.type === TaskType.TASK ? 'bg-accent-blue text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {t('task_request.type_task')}
              </button>
              <button 
                onClick={() => setNewRequest({...newRequest, type: TaskType.CR})}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newRequest.type === TaskType.CR ? 'bg-accent-amber text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
              >
                {t('task_request.type_cr')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentRole !== Role.CLIENT && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('task_request.label_client_select')}</label>
              <select 
                className="w-full bg-bg-surface border border-slate-700/50 p-4 rounded-2xl text-white outline-none focus:border-accent-blue transition-all font-bold italic appearance-none cursor-pointer"
                value={newRequest.clientId}
                onChange={e => setNewRequest({...newRequest, clientId: e.target.value})}
              >
                <option value="">{t('task_request.select_client_placeholder')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.email}</option>)}
              </select>
            </div>
          )}

          {(currentRole === Role.SALE || currentRole === Role.CEO) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('task_request.label_pm_select')}</label>
              <select 
                className="w-full bg-bg-surface border border-slate-700/50 p-4 rounded-2xl text-white outline-none focus:border-accent-blue transition-all font-bold italic appearance-none cursor-pointer"
                value={newRequest.pmId}
                onChange={e => setNewRequest({...newRequest, pmId: e.target.value})}
              >
                <option value="">{t('task_request.select_pm_placeholder')}</option>
                {pms.map(pm => <option key={pm.id} value={pm.id}>{pm.fullName}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('task_request.label_desc')}</label>
          <textarea 
            placeholder={t('task_request.desc_placeholder')} 
            className="w-full bg-bg-surface border border-slate-700/50 p-4 rounded-2xl text-white outline-none h-32 focus:border-accent-blue transition-all italic font-medium"
            value={newRequest.description}
            onChange={e => setNewRequest({...newRequest, description: e.target.value})}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateTaskRequestModal;
