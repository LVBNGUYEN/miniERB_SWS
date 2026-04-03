import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  History as HistoryIcon,
  Loader2,
  LayoutList,
  Target,
  CheckCircle2,
  PlusCircle,
  Calendar,
  User,
  Projector,
  Info,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const DeveloperTimesheet: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTimesheets, setMyTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [logData, setLogData] = useState({ hours: '', notes: '' });

  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setFetching(true);
    try {
      const [tasksRes, timesheetsRes] = await Promise.all([
        api.get('/tasks').catch(err => { console.error('Tasks fetch error:', err); return []; }),
        api.get('/timesheets/my').catch(err => { console.error('Timesheets fetch error:', err); return []; })
      ]);

      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setMyTimesheets(Array.isArray(timesheetsRes) ? timesheetsRes : []);
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setFetching(false);
    }
  };

  const onOpenLogModal = (task: any) => {
    setSelectedTask(task);
    setLogData({ hours: '', notes: '' });
    setShowLogModal(true);
  };

  const handleLogHours = async () => {
    if (!selectedTask || !logData.hours) return;
    
    setLoading(true);
    try {
      await api.post('/timesheets', {
        taskId: selectedTask.id,
        hours: Number(logData.hours),
        notes: logData.notes || t('developer_timesheet.default_notes')
      });
      
      showAlert(
        t('common.success'), 
        t('developer_timesheet.success_msg', { hours: logData.hours, taskTitle: selectedTask.title || selectedTask.name }), 
        'success'
      );
      
      setShowLogModal(false);
      fetchInitialData();
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('developer_timesheet.error_msg'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 lg:p-0">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary italic tracking-tight uppercase">{t('developer_timesheet.page_title')}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('developer_timesheet.page_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-black text-text-primary flex items-center gap-2 uppercase tracking-wide">
                <LayoutList className="w-5 h-5 text-accent-blue" />
                {t('developer_timesheet.tasks_in_charge')}
             </h3>
             <span className="text-[10px] font-black bg-bg-surface border border-border-primary px-3 py-1 rounded-full text-text-secondary uppercase">
               {t('developer_timesheet.tasks_count', { count: tasks.length })}
             </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-20 bg-bg-card rounded-2xl border border-border-primary">
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                <p className="text-sm font-bold text-text-secondary italic">{t('developer_timesheet.loading_tasks')}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-20 bg-bg-card rounded-2xl border border-dashed border-border-primary">
                <p className="text-sm font-black text-text-secondary italic opacity-50 uppercase tracking-widest">{t('developer_timesheet.no_tasks')}</p>
              </div>
            ) : (
              tasks.map((task) => {
                const pendingHoursForTask = myTimesheets
                  .filter(ts => (ts.taskId === task.id || ts.task?.id === task.id) && ts.approvalStatus === 'PENDING')
                  .reduce((sum, ts) => sum + (Number(ts.loggedHours) || 0), 0);
                const actualHours = Number(task.actualHours) || 0;
                const displayHours = actualHours + pendingHoursForTask;
                const estimatedHours = Number(task.estimatedHours) || 0;
                
                return (
                <div key={task.id} className="group bg-bg-card border border-border-primary hover:border-accent-blue/30 rounded-2xl p-6 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-accent-blue px-2 py-0.5 bg-accent-blue/5 rounded border border-accent-blue/10 uppercase italic">
                        {task.project?.name || t('developer_timesheet.project_label')}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                        task.status === 'DONE' ? 'bg-status-green/10 text-status-green border-status-green/20' : 'bg-bg-surface text-text-secondary border-border-primary'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-text-primary italic group-hover:text-accent-blue transition-colors">{task.title || task.name}</h4>
                    <p className="text-xs text-text-secondary font-medium line-clamp-1">{task.description || t('developer_timesheet.no_description')}</p>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="text-center flex flex-col items-center">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('developer_timesheet.actual_consumption')}</p>
                        <p className={`text-xl font-black italic ${displayHours >= estimatedHours * 0.8 ? 'text-status-red' : 'text-text-primary'}`}>
                           {displayHours.toFixed(2)}<span className="text-sm ml-1 text-text-secondary">/{estimatedHours.toFixed(2)}h</span>
                        </p>
                        {pendingHoursForTask > 0 && (
                          <div className="text-[10px] font-bold text-status-yellow mt-1 py-0.5 px-2 bg-status-yellow/10 border border-status-yellow/20 rounded capitalize">
                            Pending {pendingHoursForTask.toFixed(2)}h
                          </div>
                        )}
                     </div>
                     <button 
                        onClick={() => onOpenLogModal(task)}
                        disabled={task.status === 'DONE' || loading}
                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                           task.status === 'DONE' ? 'bg-bg-surface text-text-secondary border border-border-primary opacity-40 cursor-not-allowed' :
                           'bg-accent-blue text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                        }`}
                     >
                        <PlusCircle className="w-4 h-4" />
                        {t('developer_timesheet.report_hours_btn')}
                     </button>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Info & History */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                 <Target className="w-32 h-32 text-accent-blue" />
              </div>
              <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                 {t('developer_timesheet.summary_indicators')}
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t('developer_timesheet.total_logged_hours')}</p>
                    <p className="text-2xl font-black text-text-primary italic">
                      {myTimesheets.reduce((sum, ts) => sum + (Number(ts.loggedHours) || 0), 0).toFixed(1)}h
                    </p>
                 </div>
                 <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t('developer_timesheet.approved_this_week')}</p>
                    <p className="text-2xl font-black text-status-green italic">
                      {myTimesheets.filter(ts => ts.approvalStatus === 'APPROVED').reduce((sum, ts) => sum + (Number(ts.loggedHours) || 0), 0).toFixed(1)}h
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <Modal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
        title={t('developer_timesheet.modal_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setShowLogModal(false)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
              disabled={loading}
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleLogHours}
              disabled={loading || !logData.hours}
              className="flex-[2] py-2.5 bg-accent-blue text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              {t('developer_timesheet.submit_btn')}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6">
           <div className="bg-bg-surface p-4 rounded-2xl border border-border-primary space-y-1">
              <p className="text-[10px] font-black text-text-secondary uppercase">{t('developer_timesheet.reporting_for')}</p>
              <h4 className="text-sm font-black text-accent-blue italic uppercase">{selectedTask?.title || selectedTask?.name}</h4>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase">{t('developer_timesheet.actual_hours_label')}</label>
              <input 
                type="number" 
                step="0.5"
                value={logData.hours}
                onChange={(e) => setLogData({...logData, hours: e.target.value})}
                placeholder={t('developer_timesheet.hours_placeholder')}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary text-xl font-black outline-none focus:border-accent-blue transition-all"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase">{t('developer_timesheet.details_label')}</label>
              <textarea 
                value={logData.notes}
                onChange={(e) => setLogData({...logData, notes: e.target.value})}
                rows={4}
                placeholder={t('developer_timesheet.details_placeholder')}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary text-sm font-bold outline-none focus:border-accent-blue transition-all italic"
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

export default DeveloperTimesheet;
