import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import CreateTaskRequestModal from './components/CreateTaskRequestModal';
import TaskEstimateModal from './components/TaskEstimateModal';
import TaskPricingModal from './components/TaskPricingModal';
import ClientSignModal from './components/ClientSignModal';
import CEOSignModal from './components/CEOSignModal';
import DistributeWbsModal from './components/DistributeWbsModal';
import AssignPmModal from './components/AssignPmModal';
import StatusTracker from './components/StatusTracker';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const TaskRequestFlow: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showEstimate, setShowEstimate] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showClientSign, setShowClientSign] = useState(false);
  const [showCEOSign, setShowCEOSign] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [showAssignPm, setShowAssignPm] = useState(false);
  const [pms, setPms] = useState<any[]>([]);

  const { alertConfig, showAlert, closeAlert } = useAlert();

  const TaskRequestFlowStatus: Record<string, { label: string; color: string; next: string }> = {
    PROPOSED: { label: t('task_request.status_proposed'), color: 'bg-status-yellow', next: t('task_request.next_step_pm_estimate') },
    ESTIMATED: { label: t('task_request.status_estimated'), color: 'bg-accent-blue', next: t('task_request.next_step_sale_price') },
    PRICED: { label: t('task_request.status_priced'), color: 'bg-purple-500', next: t('task_request.next_step_client_approve') },
    CLIENT_SIGNED: { label: t('task_request.status_client_signed'), color: 'bg-status-green', next: t('task_request.next_step_ceo_sign') },
    CEO_SIGNED: { label: t('task_request.status_ceo_signed'), color: 'bg-indigo-600', next: t('task_request.next_step_distribute') },
    DISTRIBUTED: { label: t('task_request.status_distributed'), color: 'bg-status-green', next: t('task_request.next_step_complete') },
    REJECTED: { label: t('task_request.status_rejected'), color: 'bg-red-600', next: t('task_request.next_step_new_request') },
  };

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
    fetchRequests();
    fetchPms();
  }, []);

  const fetchPms = async () => {
    try {
      const pmList = await api.get('/iam/pm-list').catch(() => []);
      setPms(Array.isArray(pmList) ? pmList : []);
    } catch (err) { 
      console.error('Error fetching PM list:', err); 
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/task-requests/list').catch(() => []);
      setRequests(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error(err);
      showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_fetch_requests'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = user?.role || Role.VENDOR;

  const handleAction = async (id: string, action: string, data: any = {}) => {
    try {
      await api.post(`/task-requests/${id}/${action}`, { ...data, userId: user.id });
      fetchRequests();
    } catch (err: any) { 
      console.error(err); 
      showAlert(t('common.error'), err.response?.data?.message || t('common.error_occurred'), 'error');
    }
  };

  const handleEstimate = async (id: string, hours: number, signature?: string, publicKey?: string, type?: string) => {
    await api.post(`/task-requests/${id}/estimate`, { hours, pmId: user.id, signature, publicKey, type: type || 'FEATURE' });
  };

  const handleSetPrice = async (id: string, price: number) => {
    await api.post(`/task-requests/${id}/price`, { price, saleId: user.id });
  };

  const handleClientSign = async (id: string, signature: string, publicKey: string) => {
    await api.post(`/task-requests/${id}/client-sign`, { signature, publicKey });
  };

  const handleCEOSign = async (id: string, signature: string, publicKey: string) => {
    await api.post(`/task-requests/${id}/ceo-sign`, { signature, publicKey });
  };

  const handleDistribute = async (id: string) => {
    await api.post(`/task-requests/${id}/distribute`, { pmId: user.id });
  };

  const handleAssignPm = async (pmId: string) => {
    try {
      await api.post(`/task-requests/${selectedRequest.id}/assign-pm`, { pmId, userId: user.id });
      fetchRequests();
      setShowAssignPm(false);
      showAlert(t('common.success'), t('task_request.pm_assigned_success'), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('task_request.error_assign_pm'), 'error');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreate(false);
    fetchRequests();
    showAlert(t('common.success'), t('task_request.create_success_msg'), 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white italic tracking-tight uppercase underline decoration-accent-blue/30 decoration-4 underline-offset-8">
           {t('task_request.title')}
        </h3>
        {(currentRole === Role.CLIENT || currentRole === Role.SALE || currentRole === Role.CEO) && (
          <button 
             onClick={() => setShowCreate(true)}
             className="px-6 py-3 bg-accent-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> {currentRole === Role.SALE ? t('task_request.btn_new_cr') : t('task_request.btn_new_task')}
          </button>
        )}
      </div>

      <CreateTaskRequestModal 
        isOpen={showCreate} 
        onClose={() => setShowCreate(false)} 
        onSuccess={handleCreateSuccess} 
        currentRole={currentRole} 
        userId={user?.id}
        showAlert={showAlert}
      />

      <TaskEstimateModal 
        isOpen={showEstimate}
        onClose={() => setShowEstimate(false)}
        onSuccess={() => { setShowEstimate(false); fetchRequests(); showAlert(t('common.success'), t('task_request.estimate_success'), 'success'); }}
        request={selectedRequest}
        onEstimate={handleEstimate}
        showAlert={showAlert}
      />

      <TaskPricingModal 
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onSuccess={() => { setShowPricing(false); fetchRequests(); showAlert(t('common.success'), t('task_request.price_success'), 'success'); }}
        request={selectedRequest}
        onPrice={handleSetPrice}
        showAlert={showAlert}
      />

      <ClientSignModal 
        isOpen={showClientSign}
        onClose={() => setShowClientSign(false)}
        onSuccess={() => { setShowClientSign(false); fetchRequests(); showAlert(t('common.success'), t('task_request.client_sign_success'), 'success'); }}
        request={selectedRequest}
        onSign={handleClientSign}
        showAlert={showAlert}
      />

      <CEOSignModal 
        isOpen={showCEOSign}
        onClose={() => setShowCEOSign(false)}
        onSuccess={() => { setShowCEOSign(false); fetchRequests(); showAlert(t('common.success'), t('task_request.ceo_sign_success'), 'success'); }}
        request={selectedRequest}
        onSign={handleCEOSign}
        showAlert={showAlert}
      />

      <DistributeWbsModal 
        isOpen={showDistribute}
        onClose={() => setShowDistribute(false)}
        onSuccess={() => { setShowDistribute(false); fetchRequests(); showAlert(t('common.success'), t('task_request.distribute_success'), 'success'); }}
        request={selectedRequest}
        onDistribute={handleDistribute}
        showAlert={showAlert}
      />

      <AssignPmModal
        isOpen={showAssignPm}
        onClose={() => setShowAssignPm(false)}
        onSuccess={handleAssignPm}
        request={selectedRequest}
        pms={pms}
        showAlert={showAlert}
      />

      <div className="space-y-4">
        {requests.map((req, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-all shadow-xl group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-1 px-3 text-[9px] font-black uppercase text-white ${TaskRequestFlowStatus[req.status]?.color || 'bg-slate-700'}`}>
              {TaskRequestFlowStatus[req.status]?.label || req.status}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center text-accent-blue font-bold text-xs shadow-inner border border-slate-700/20">
                     CR
                   </div>
                   <h4 className="text-lg font-black text-white italic">{req.title}</h4>
                 </div>
                 <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 italic">{req.description}</p>
                 <div className="flex flex-wrap gap-4 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="w-3 h-3"/> {t('task_request.label_effort')}: {req.estimatedHours || '??'}h</span>
                    <span className="text-[10px] font-bold text-status-green uppercase flex items-center gap-1.5"><DollarSign className="w-3 h-3"/> {t('task_request.label_cost')}: {req.finalPrice || '??'} VNĐ</span>
                    {req.pmId && (
                      <span className="text-[10px] font-bold text-accent-blue uppercase flex items-center gap-1.5 italic"><Briefcase className="w-3 h-3"/> {t('task_request.label_pm_assigned')}</span>
                    )}
                    {req.type && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                        req.type === 'BUG' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        req.type === 'NEW_PROJECT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>{req.type === 'BUG' ? t('task_request.type_bug') : req.type === 'NEW_PROJECT' ? t('task_request.type_new_project') : t('task_request.type_feature')}</span>
                    )}
                 </div>
              </div>

              {/* Action Center per Role */}
              <div className="flex items-center gap-3 z-10 relative">
                 {req.status === 'PROPOSED' && (currentRole === Role.SALE || currentRole === Role.CEO) && !req.pmId && (
                   <button 
                     onClick={() => { 
                       fetchPms();
                       setSelectedRequest(req); 
                       setShowAssignPm(true); 
                     }}
                     className="px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-orange-500/20 italic"
                   >
                     {t('task_request.btn_assign_pm')}
                   </button>
                 )}
                 {req.status === 'PROPOSED' && currentRole === Role.PM && (
                   <button 
                     onClick={() => { setSelectedRequest(req); setShowEstimate(true); }}
                     className="px-4 py-2 bg-accent-blue text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 italic"
                   >
                     {t('task_request.btn_input_effort')}
                   </button>
                 )}
                 {req.status === 'ESTIMATED' && currentRole === Role.SALE && (
                   <button 
                     onClick={() => { setSelectedRequest(req); setShowPricing(true); }}
                     className="px-4 py-2 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-500/20 italic"
                   >
                     {t('task_request.btn_sale_price')}
                   </button>
                 )}
                 {req.status === 'PRICED' && currentRole === Role.CLIENT && (
                   <button 
                     onClick={() => { setSelectedRequest(req); setShowClientSign(true); }}
                     className="px-4 py-2 bg-status-green text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-500/20 italic flex items-center gap-2"
                   >
                     <ShieldCheck className="w-4 h-4" /> {t('task_request.btn_client_approve_pki')}
                   </button>
                 )}
                 {req.status === 'CLIENT_SIGNED' && currentRole === Role.CEO && (
                   <button 
                     onClick={() => { setSelectedRequest(req); setShowCEOSign(true); }}
                     className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 italic flex items-center gap-2"
                   >
                     <ShieldCheck className="w-4 h-4 ml-1" /> {t('task_request.btn_ceo_approve_pki')}
                   </button>
                 )}
                 {req.status === 'CEO_SIGNED' && currentRole === Role.PM && (
                   <button 
                    onClick={() => { setSelectedRequest(req); setShowDistribute(true); }}
                    className="px-4 py-2 bg-status-green text-white rounded-xl font-black text-[9px] uppercase tracking-widest italic flex items-center gap-2"
                   >
                    <Zap className="w-4 h-4" /> {t('task_request.btn_activate_execution')}
                   </button>
                 )}
                 {req.status === 'REJECTED' && currentRole === Role.SALE && (
                    <button 
                     onClick={() => setShowCreate(true)}
                     className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest italic flex items-center gap-2 shadow-lg shadow-red-500/20"
                    >
                     {t('task_request.btn_pm_rejected_new')}
                    </button>
                  )}
              </div>
            </div>

            <StatusTracker currentStatus={req.status} />
          </div>
        ))}
        {requests.length === 0 && !loading && (
          <div className="bg-bg-card/50 p-12 rounded-3xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center opacity-60">
             <Plus className="w-8 h-8 text-slate-600 mb-4" />
             <p className="text-xs font-bold text-slate-500 italic">{t('task_request.no_requests')}</p>
          </div>
        )}
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
};

export default TaskRequestFlow;
