import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, Clock, CheckCircle2, Bot, ArrowRight, Zap, Cpu, Loader2, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';
import { api } from '../../api';

interface VendorDashboardProps {
  userName: string;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ userName }) => {
  const { t } = useTranslation('vendor_dashboard');
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [aiModal, setAiModal] = useState({ isOpen: false, type: '' });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ totalPaid: 0, pendingPayment: 0, totalTasks: 0 });
  const [loading, setLoading] = useState(true);

  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    fetchMyTasks();
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const data = await api.get('/finance/earnings/my');
      setEarnings(data);
    } catch (err) {
      console.error("Failed to fetch earnings:", err);
    }
  };

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/projects/tasks/my');
      if (Array.isArray(data)) {
        setTasks(data.map((task: any) => ({
          id: task.id,
          title: task.title,
          deadline: new Date(task.createdAt).toLocaleDateString('vi-VN'),
          hours: task.estimatedHours,
          status: task.status === 'TODO' ? t('status_unperformed') : task.status === 'IN_PROGRESS' ? t('status_in_progress') : t('status_completed'),
          desc: t('task_code', { id: task.id })
        })));
      }
    } catch (err) {
      console.error(t('label_fetch_error'), err);
      showAlert(t('common.error'), t('label_fetch_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setAiModal({ ...aiModal, isOpen: false });
      showAlert(t('common.success'), t('optimize_success', { defaultValue: 'Đã tối ưu hóa lộ trình làm việc!' }), 'success');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-status-green text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-emerald-500/20 italic border border-white/20">{t('exec_strategy')}</span>
            <span className="w-2 h-2 bg-status-green rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-status-green/20 underline-offset-8">{t('exec_board', { userName })}</h2>
          <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-status-green/10 underline underline-offset-4">{t('exec_analysis')}</p>
        </div>
        <button 
          onClick={() => navigate('/timesheets')}
          className="flex items-center gap-3 px-6 py-4 bg-status-green text-white rounded-2xl font-black text-xs shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10"
        >
          <Clock className="w-5 h-5" />
          <span>{t('timesheet_btn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('pending_tasks'), value: tasks.filter(task => task.status !== t('status_completed')).length.toString(), icon: Clock },
          { label: t('total_earnings'), value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(earnings.totalPaid), icon: Zap },
          { label: t('pending_payment'), value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(earnings.pendingPayment), icon: CheckCircle2 },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-3xl border border-border-primary relative overflow-hidden group shadow-xl hover:border-status-green/40 transition-all hover:shadow-emerald-500/5">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <kpi.icon className="w-16 h-16 text-status-green" />
             </div>
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4 italic">{kpi.label}</p>
             <p className="text-3xl font-black text-text-primary font-mono italic tracking-tighter">{kpi.value}</p>
             <div className="mt-4 h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                <div className="h-full bg-status-green shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ width: '70%' }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between pb-6 border-b border-border-primary">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10 underline-offset-4">
                 <Briefcase className="w-6 h-6 text-accent-blue" />
                 {t('current_tasks')}
              </h3>
              <button onClick={fetchMyTasks} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"><Cpu className={`w-4 h-4 text-accent-blue ${loading ? 'animate-spin' : ''}`} /></button>
           </div>
           <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10 opacity-40 italic font-black uppercase tracking-widest text-text-secondary text-xs">{t('no_tasks')}</div>
              ) : (
                tasks.map((task, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center justify-between p-5 bg-bg-surface/30 rounded-2xl border border-border-primary group hover:border-accent-blue/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg relative overflow-hidden"
                  >
                      <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                          task.status === t('status_in_progress') ? 'bg-status-yellow' : 
                          task.status === t('status_completed') ? 'bg-status-green' : 'bg-accent-blue'
                      }`}></div>
                      <div className="pl-2 space-y-1">
                        <p className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-all italic uppercase tracking-tight underline decoration-transparent group-hover:decoration-accent-blue">{task.title}</p>
                        <p className="text-[10px] text-text-secondary mt-1 font-black italic uppercase tracking-widest opacity-60">{t('estimate')} <span className="text-text-primary underline decoration-accent-blue/10 underline-offset-2">{t('estimate_hours', { hours: task.hours })}</span></p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest border ${
                            task.status === t('status_in_progress') ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20 shadow-inner' : 
                            task.status === t('status_completed') ? 'bg-status-green/10 text-status-green border-status-green/20' : 
                            'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner'
                        }`}>{task.status}</span>
                        <button className="p-2 bg-bg-surface rounded-xl border border-border-primary opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4 text-accent-blue" />
                        </button>
                      </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="bg-bg-card rounded-3xl p-8 border border-border-primary space-y-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
              <Bot className="w-64 h-64 text-status-green" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-status-green/10 rounded-2xl border border-status-green/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="w-8 h-8 text-status-green shadow-xl" />
                 </div>
                 <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight underline decoration-status-green/20 underline-offset-8">{t('ai_coach')}</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-bold italic pr-8 uppercase tracking-wide opacity-80 border-l-4 border-status-green/30 pl-4">
                 {t('ai_coach_desc')}
              </p>
              <div className="pt-8 flex flex-col md:flex-row gap-4">
                 <button 
                  onClick={() => setAiModal({ isOpen: true, type: 'velocity' })}
                  className="flex-1 px-6 py-4 bg-bg-surface text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border-primary hover:bg-slate-700/10 dark:hover:bg-slate-800 transition-all active:scale-95 italic shadow-xl"
                 >
                   {t('velocity_dashboard')}
                 </button>
                 <button 
                  onClick={() => setAiModal({ isOpen: true, type: 'optimize' })}
                  className="flex-1 px-6 py-4 bg-status-green text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-green-900/40 hover:bg-emerald-600 transition-all active:scale-95 italic border border-white/10"
                 >
                   {t('optimize_trigger')}
                 </button>
              </div>
           </div>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-status-green/5 rounded-full blur-3xl group-hover:bg-status-green/10 transition-all duration-1000"></div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <Modal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        title={t('task_detail')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setSelectedTask(null)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close', { defaultValue: 'Đóng' })}
            </button>
            <button 
              onClick={() => {
                setSelectedTask(null);
                navigate('/timesheets');
              }}
              className="flex-[2] py-2.5 bg-status-green text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 italic border border-white/10"
            >
              {t('submit_timesheet_btn')}
            </button>
          </div>
        }
      >
        {selectedTask && (
          <div className="space-y-8 p-4">
            <div className="p-6 bg-bg-surface rounded-3xl border-l-8 border-status-green border border-border-primary shadow-inner">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-2 italic ml-1">{t('task_id')}</p>
              <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight decoration-accent-blue/20 underline decoration-2">{selectedTask.id}</h4>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('task_name')}</span>
                <span className="text-sm font-black text-text-primary italic uppercase tracking-tight">{selectedTask.title}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('exec_status')}</span>
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest border ${
                  selectedTask.status === t('status_in_progress') ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20 shadow-inner' : 
                  selectedTask.status === t('status_completed') ? 'bg-status-green/10 text-status-green border-status-green/20' : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                }`}>{selectedTask.status}</span>
              </div>
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-primary shadow-inner leading-relaxed text-sm font-bold text-text-secondary italic">
                 <p className="border-b border-border-primary pb-3 mb-3 text-[10px] uppercase font-black tracking-widest text-text-primary/50">{t('system_desc')}</p>
                {selectedTask.desc}
              </div>
            </div>
            <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-40 italic mt-2 tracking-widest">{t('sync_notice')}</p>
          </div>
        )}
      </Modal>

      {/* AI Interaction Modal */}
      <Modal 
        isOpen={aiModal.isOpen} 
        onClose={() => setAiModal({ ...aiModal, isOpen: false })} 
        title={aiModal.type === 'velocity' ? t('velocity_dashboard_title') : t('optimize_route_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setAiModal({ ...aiModal, isOpen: false })}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close', { defaultValue: 'Đóng' })}
            </button>
            {aiModal.type === 'optimize' && (
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex-[2] py-2.5 bg-status-green text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 active:scale-95 disabled:opacity-50 italic flex items-center justify-center gap-4 border border-white/10"
              >
                {isOptimizing ? <><Cpu className="w-6 h-6 animate-spin text-white" /> <span>{t('running_route')}</span></> : <><Check className="w-5 h-5" /> <span>{t('apply_route')}</span></>}
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-8 p-4">
          {aiModal.type === 'velocity' ? (
            <div className="space-y-6">
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-primary shadow-inner space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-[0.2em]">{t('velocity_actual')}</span>
                  <span className="text-sm font-black text-status-green italic">{t('velocity_exceed')}</span>
                </div>
                <div className="h-4 w-full bg-bg-card border border-border-primary rounded-full overflow-hidden shadow-inner p-1">
                  <div className="h-full bg-status-green rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div className="p-6 bg-bg-surface rounded-3xl border-l-8 border-accent-blue shadow-lg">
                <p className="text-sm text-text-primary font-bold italic leading-relaxed">
                  {t('velocity_insight')}
                </p>
              </div>
              <p className="text-[9px] text-text-secondary font-black text-center uppercase tracking-widest opacity-40 italic">{t('report_update')}</p>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="p-6 bg-status-green/5 rounded-3xl border border-status-green/20 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-12 h-12 text-status-green animate-bounce" />
                  </div>
                  <div className="flex gap-4">
                    <Zap className="w-10 h-10 text-status-green shrink-0 shadow-xl" />
                    <div>
                        <p className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-2">{t('ai_priority_suggestion')}</p>
                        <p className="text-md font-black text-text-primary italic leading-relaxed uppercase tracking-tight underline decoration-status-green/10 underline-offset-4">{t('ai_priority_desc')}</p>
                    </div>
                  </div>
               </div>
               <p className="text-[9px] text-text-secondary font-black text-center uppercase tracking-widest opacity-50 italic">{t('action_update_priority')}</p>
            </div>
          )}
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

export default VendorDashboard;
