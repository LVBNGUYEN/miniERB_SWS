import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  ArrowRight,
  MessageSquare,
  Loader2,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const ManagerTimesheet: React.FC = () => {
  const { t } = useTranslation();
  const [pendingTimesheets, setPendingTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean, timesheetId: string | null }>({ isOpen: false, timesheetId: null });
  const [rejectReason, setRejectReason] = useState('');

  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timesheets/pending');
      setPendingTimesheets(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch pending error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    showAlert(t('common.confirm'), t('manager_timesheet.confirm_approve', { defaultValue: 'Bạn có chắc muốn duyệt timesheet này?' }), 'confirm', async () => {
      setActionId(id);
      try {
        await api.patch(`/timesheets/${id}/approve`, {});
        setPendingTimesheets(prev => prev.filter(t => t.id !== id));
        showAlert(t('common.success'), t('manager_timesheet.approve_success', { defaultValue: 'Đã duyệt thành công!' }), 'success');
      } catch (err: any) {
        showAlert(t('common.error'), err.response?.data?.message || t('manager_timesheet.approve_error'), 'error');
      } finally {
        setActionId(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setRejectModal({ isOpen: true, timesheetId: id });
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectModal.timesheetId || !rejectReason) return;
    const id = rejectModal.timesheetId;
    setActionId(id);
    try {
      await api.patch(`/timesheets/${id}/reject`, { reason: rejectReason });
      setPendingTimesheets(prev => prev.filter(t => t.id !== id));
      setRejectModal({ isOpen: false, timesheetId: null });
      showAlert(t('common.success'), t('manager_timesheet.reject_success', { defaultValue: 'Đã từ chối thành công!' }), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('manager_timesheet.reject_error'), 'error');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary uppercase italic">{t('manager_timesheet.page_title')}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('manager_timesheet.page_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Approval Queue */}
        <div className="xl:col-span-3 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-accent-blue" />
                 {t('manager_timesheet.approval_queue_title')}
              </h3>
              <div className="flex items-center gap-4">
                 <div className="w-64 bg-bg-surface rounded-lg px-3 py-1.5 flex items-center gap-2 border border-border-primary">
                    <Search className="w-3.5 h-3.5 text-text-secondary" />
                    <input type="text" placeholder={t('manager_timesheet.search_placeholder')} className="bg-transparent text-[11px] outline-none text-text-primary w-full italic" />
                 </div>
                 <button className="p-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-all border border-border-primary"><Filter className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="space-y-4">
              {pendingTimesheets.length === 0 ? (
                <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-border-primary">
                   <Clock className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-bold text-text-secondary italic">{t('manager_timesheet.empty_queue_msg')}</p>
                </div>
              ) : (
                pendingTimesheets.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-5 bg-bg-surface/50 rounded-2xl border border-border-primary hover:border-accent-blue/30 transition-all group relative overflow-hidden cursor-pointer shadow-sm">
                    <div className="w-1.5 h-full absolute left-0 top-0 bg-accent-blue opacity-50"></div>
                    
                    <div className="flex items-center gap-4 w-[280px] shrink-0 border-r border-border-primary pr-4">
                        <div className="w-12 h-12 rounded-xl bg-bg-surface flex items-center justify-center text-accent-blue font-black border border-border-primary shadow-lg group-hover:scale-110 transition-transform">
                          {p.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors">{p.user?.fullName || 'Anonymous'}</h4>
                          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest italic">{p.task?.project?.name || 'No Project'}</p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-4 gap-6">
                        <div className="col-span-1">
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic">{t('manager_timesheet.col_task')}</p>
                          <p className="text-sm font-bold text-text-primary mt-1 italic truncate">{p.task?.name || 'Task Detail'}</p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic tracking-tight">{t('manager_timesheet.col_hours_date')}</p>
                          <p className="text-xl font-black text-status-green mt-1 leading-none">{p.loggedHours}h</p>
                          <p className="text-[9px] text-text-secondary font-bold mt-1 uppercase">{new Date(p.logDate).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2 hidden md:block">
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic">{t('manager_timesheet.col_notes')}</p>
                          <p className="text-[11px] text-text-primary mt-2 italic line-clamp-2 overflow-hidden">{p.rejectReason || t('manager_timesheet.no_notes')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleApprove(p.id)}
                          disabled={actionId === p.id}
                          className="p-2.5 bg-status-green/10 text-status-green hover:bg-status-green hover:text-white rounded-xl transition-all border border-status-green/20 shadow-lg shadow-green-500/5 group-hover:scale-105 disabled:opacity-50"
                        >
                          {actionId === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleReject(p.id)}
                          disabled={actionId === p.id}
                          className="p-2.5 bg-status-red/10 text-status-red hover:bg-status-red hover:text-white rounded-xl transition-all border border-status-red/20 group-hover:scale-105 disabled:opacity-50"
                        >
                          {actionId === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        </button>
                        <button className="p-2.5 bg-bg-surface text-text-secondary rounded-xl transition-all border border-border-primary">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))
              )}
           </div>

           <div className="pt-6 border-t border-border-primary flex justify-between items-center text-xs text-text-secondary italic">
              <div className="flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-status-yellow" />
                 <span>{t('manager_timesheet.warning_notice')}</span>
              </div>
              <button className="text-[11px] font-black uppercase text-accent-blue hover:underline">{t('manager_timesheet.export_report_btn')}</button>
           </div>
        </div>

        {/* Manager QC & Insights Side */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-all duration-700">
                 <Zap className="w-24 h-24" />
              </div>
              <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 border-b border-border-primary pb-4 relative z-10">
                 <Zap className="w-4 h-4 text-accent-blue" />
                 {t('manager_timesheet.ai_qc_title')}
              </h3>
              <div className="space-y-4 relative z-10">
                 {[
                   { title: t('manager_timesheet.qc_anomaly_title'), desc: t('manager_timesheet.qc_anomaly_desc'), severity: 'High' },
                   { title: t('manager_timesheet.qc_suggestion_title'), desc: t('manager_timesheet.qc_suggestion_desc'), severity: 'Info' },
                 ].map((qc, i) => (
                   <div key={i} className={`p-4 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all cursor-pointer ${
                      qc.severity === 'High' ? 'bg-status-red/5 border-l-4 border-l-status-red' : 'bg-accent-blue/5 border-l-4 border-l-accent-blue'
                   }`}>
                      <p className="text-[11px] font-black text-text-primary italic">{qc.title}</p>
                      <p className="text-[10px] text-text-secondary font-medium mt-1 leading-relaxed leading-loose italic">{qc.desc}</p>
                   </div>
                 ))}
                 <button className="w-full py-2.5 bg-bg-surface text-text-primary border border-border-primary rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">{t('manager_timesheet.bulk_fix_btn')}</button>
              </div>
           </div>

           <div className="bg-bg-card rounded-2xl p-6 border border-border-primary space-y-6 shadow-xl relative group">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-purple-400" />
                 {t('manager_timesheet.quick_feedback_title')}
              </h3>
              <div className="space-y-3">
                 <textarea 
                    placeholder={t('manager_timesheet.feedback_placeholder')} 
                    className="w-full h-24 bg-bg-surface border border-border-primary rounded-xl p-3 text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-purple-500 transition-all"
                 ></textarea>
                 <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 bg-bg-surface text-[10px] font-bold text-text-primary border border-border-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">{t('manager_timesheet.btn_req_more')}</button>
                    <button className="py-2 bg-bg-surface text-[10px] font-bold text-text-primary border border-border-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">{t('manager_timesheet.btn_explain_cost')}</button>
                 </div>
                 <button className="w-full py-2.5 mt-2 bg-purple-600 text-white rounded-xl font-black text-xs hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    {t('manager_timesheet.btn_send_feedback')}
                    <ArrowRight className="w-3.5 h-3.5" />
                 </button>
              </div>
           </div>
        </div>
      </div>

      <Modal 
        isOpen={rejectModal.isOpen} 
        onClose={() => setRejectModal({ isOpen: false, timesheetId: null })} 
        title={t('manager_timesheet.modal_reject_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setRejectModal({ isOpen: false, timesheetId: null })}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
              disabled={actionId === rejectModal.timesheetId}
            >
              {t('common.close')}
            </button>
            <button 
              onClick={submitReject}
              disabled={actionId === rejectModal.timesheetId || !rejectReason}
              className="flex-[2] py-2.5 bg-status-red text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionId === rejectModal.timesheetId ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {t('manager_timesheet.btn_confirm_reject')}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase">{t('manager_timesheet.reject_reason_label')}</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder={t('manager_timesheet.reject_reason_placeholder')}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary text-sm font-bold outline-none focus:border-status-red transition-all italic"
              />
           </div>
        </div>
      </Modal>

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

export default ManagerTimesheet;
