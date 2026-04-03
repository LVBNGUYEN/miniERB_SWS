import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Filter,
  MoreHorizontal,
  Loader2,
  Check,
  Search,
  X,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import { TaskStatus } from '../../../../project/entities/task-status.enum';

const ProjectDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filter & Input States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'INTERNAL' | 'CLIENT'>('ALL');
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    clientId: '',
    estimatedBudget: 0,
    startDate: '',
    endDate: ''
  });
  
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    deadline: '',
    estimatedHours: 0,
    assigneeId: ''
  });

  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await api.post('/projects/list', {});
      const list = Array.isArray(res) ? res : [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProject(list[0]);
        fetchTasks(list[0].id);
      }

      const clientRes = await api.get('/iam/client-list');
      setClients(Array.isArray(clientRes) ? clientRes : []);

      const [vendorRes, devRes] = await Promise.all([
        api.get('/iam/vendor-list'),
        api.get('/iam/dev-list')
      ]);
      const combined = [
        ...(Array.isArray(vendorRes) ? vendorRes : []),
        ...(Array.isArray(devRes) ? devRes : [])
      ];
      setVendors(combined);

    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId: string) => {
    setTasksLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/tasks-list`, {});
      setTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectData.name) return;
    try {
      await api.post('/projects', newProjectData);
      setIsSuccess(true);
      setTimeout(() => {
        setIsNewProjectModalOpen(false);
        setIsSuccess(false);
        setNewProjectData({ name: '', description: '', clientId: '', estimatedBudget: 0, startDate: '', endDate: '' });
        fetchInitialData();
      }, 1500);
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('projects.error_create_project'), 'error');
    }
  };

  const handleSelectProject = (proj: any) => {
    setSelectedProject(proj);
    fetchTasks(proj.id);
  };

  const handleCreateTask = async () => {
    if (!newTaskData.title) {
      showAlert(t('common.error'), t('projects.error_title_required', { defaultValue: 'Vui lòng nhập tiêu đề task' }), 'error');
      return;
    }
    if (!selectedProject) {
      showAlert(t('common.error'), t('projects.error_project_required', { defaultValue: 'Chưa chọn dự án để gán task' }), 'error');
      return;
    }

    setIsCreatingTask(true);
    setTaskSuccess(false);

    try {
      const payload: any = {
        title: newTaskData.title.trim(),
        projectId: selectedProject.id
      };
      
      if (newTaskData.assigneeId) payload.assigneeId = newTaskData.assigneeId;
      if (newTaskData.description && newTaskData.description.trim()) payload.description = newTaskData.description.trim();
      if (newTaskData.deadline) payload.deadline = newTaskData.deadline;
      
      const hours = Number(newTaskData.estimatedHours);
      if (!isNaN(hours) && hours > 0) payload.estimatedHours = hours;

      const result = await api.post('/tasks', payload);

      setTaskSuccess(true);
      
      if (selectedProject) fetchTasks(selectedProject.id);
      fetchInitialData();

      showAlert(
        result?.budgetWarning ? t('common.warning') : t('common.success'),
        result?.budgetWarning 
          ? `Đã gán task thành công!\n\n⚠️ ${result.budgetWarning}` 
          : t('projects.task_success_msg', { defaultValue: 'Đã tạo Task thành công!' }),
        result?.budgetWarning ? 'warning' : 'success'
      );

      setIsNewTaskModalOpen(false);
      setNewTaskData({ title: '', description: '', deadline: '', estimatedHours: 0, assigneeId: '' });
      
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || err.message || t('projects.error_create_task'), 'error');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    showAlert(t('common.confirm'), t('projects.confirm_delete_task'), 'confirm', async () => {
      try {
        await api.delete(`/tasks/${taskId}`);
        if (selectedProject) fetchTasks(selectedProject.id);
        closeAlert();
      } catch (err: any) {
        showAlert(t('common.error'), err.response?.data?.message || t('projects.error_delete_task'), 'error');
      }
    });
  };

  const handleFinishTask = async (taskId: string) => {
    showAlert(t('common.confirm'), t('projects.confirm_finish_task', { defaultValue: 'Bạn có chắc chắn muốn hoàn thành Task này?' }), 'confirm', async () => {
      try {
        await api.put(`/tasks/${taskId}`, { status: TaskStatus.DONE });
        if (selectedProject) fetchTasks(selectedProject.id);
        fetchInitialData();
        closeAlert();
      } catch (err: any) {
        showAlert(t('common.error'), err.response?.data?.message || t('projects.error_finish_task'), 'error');
      }
    });
  };

  const handleCloseProject = async () => {
    if (!selectedProject) return;
    showAlert(t('common.confirm'), t('projects.confirm_close_project'), 'confirm', async () => {
      try {
        await api.post(`/projects/${selectedProject.id}/close`, { qcPassed: true });
        await fetchInitialData();
        showAlert(t('common.success'), t('projects.close_success_msg'), 'success');
      } catch (err: any) {
        showAlert(t('common.error'), err.response?.data?.message || err.message || t('projects.error_close_project'), 'error');
      }
    });
  };

  const decomposedPlannedHours = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  }, [tasks]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.pm?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || 
                           (filterStatus === 'ACTIVE' && (p.status === 'IN_PROGRESS' || p.status === 'ACTIVE')) ||
                           p.status === filterStatus;
      
      const isClientProject = p.clientId && p.clientId !== '00000000-0000-0000-0000-000000000000';
      const matchesType = filterType === 'ALL' ||
                         (filterType === 'CLIENT' && isClientProject) ||
                         (filterType === 'INTERNAL' && !isClientProject);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, searchTerm, filterStatus, filterType]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'DONE' || t.status === 'Completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
      {/* New Task Modal */}
      <Modal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => setIsNewTaskModalOpen(false)} 
        title={t('projects.modal_task_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setIsNewTaskModalOpen(false)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
              disabled={isCreatingTask}
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleCreateTask}
              disabled={isCreatingTask || !newTaskData.title}
              className={`flex-[2] py-2.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg ${
                isCreatingTask
                ? 'bg-gray-600 text-white cursor-not-allowed'
                : taskSuccess 
                ? 'bg-status-green text-white shadow-status-green/20' 
                : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20'
              }`}
            >
              {isCreatingTask ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : taskSuccess ? (
                <Check className="w-5 h-5 animate-bounce" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>
                {isCreatingTask 
                  ? t('projects.distributing') 
                  : taskSuccess 
                  ? t('projects.task_success_msg') 
                  : t('projects.btn_confirm_task')}
              </span>
            </button>
          </div>
        }
      >
        <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_task_title')}</label>
              <input 
                type="text" 
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                placeholder={t('projects.task_placeholder')}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none italic font-bold placeholder:italic focus:border-accent-blue transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_task_desc')}</label>
              <textarea 
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                placeholder={t('projects.task_desc_placeholder')}
                rows={3}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all italic text-sm"
              />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_est_hours')}</label>
                <input 
                  type="number" 
                  value={newTaskData.estimatedHours}
                  onChange={(e) => setNewTaskData({...newTaskData, estimatedHours: Number(e.target.value)})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all italic" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_assignee')}</label>
                <select 
                  value={newTaskData.assigneeId}
                  onChange={(e) => setNewTaskData({...newTaskData, assigneeId: e.target.value})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all italic"
                >
                  <option value="">{t('projects.select_assignee_placeholder')}</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.fullName} ({v.email})</option>
                  ))}
                </select>
            </div>
          </div>

          <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_deadline')}</label>
              <input 
                type="date" 
                value={newTaskData.deadline}
                onChange={(e) => setNewTaskData({...newTaskData, deadline: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all cursor-pointer italic" 
              />
          </div>
        </div>
      </Modal>

      {/* New Project Modal */}
      <Modal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
        title={user?.role === Role.PM ? t('projects.modal_new_project_title_pm') : t('projects.modal_new_project_title_ceo')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setIsNewProjectModalOpen(false)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
              disabled={isSuccess}
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleCreateProject}
              disabled={isSuccess || !newProjectData.name}
              className={`flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSuccess 
                ? 'bg-status-green text-white shadow-status-green/20' 
                : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20'
              }`}
            >
              {isSuccess ? <><Check className="w-5 h-5 animate-bounce" /> <span>{t('projects.project_success_msg')}</span></> : t('projects.btn_confirm_init')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {user?.role === Role.PM ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_select_project_existing')}</label>
              <select 
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all italic"
              >
                <option value="">{t('projects.select_project_placeholder')}</option>
                {projects.map((p: any) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))
                }
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_project_name')}</label>
              <input 
                type="text" 
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                placeholder={t('projects.project_name_placeholder')}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none italic font-bold placeholder:italic focus:border-accent-blue transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_budget')}</label>
                <input 
                  type="number" 
                  value={newProjectData.estimatedBudget}
                  onChange={(e) => setNewProjectData({...newProjectData, estimatedBudget: Number(e.target.value)})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all italic" 
                />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_client')}</label>
               <select 
                 value={newProjectData.clientId}
                 onChange={(e) => setNewProjectData({...newProjectData, clientId: e.target.value})}
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all italic"
               >
                 <option value="">{t('projects.select_client_placeholder')}</option>
                 {clients.map((client: any) => (
                   <option key={client.id} value={client.id}>{client.fullName} ({client.email})</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_start_date')}</label>
                <input 
                  type="date" 
                  value={newProjectData.startDate}
                  onChange={(e) => setNewProjectData({...newProjectData, startDate: e.target.value})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all italic" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('projects.label_end_date')}</label>
                <input 
                  type="date" 
                  value={newProjectData.endDate}
                  onChange={(e) => setNewProjectData({...newProjectData, endDate: e.target.value})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all italic" 
                />
            </div>
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

      {/* Page Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">
            {t('projects.dashboard_title')}
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">
            {t('projects.dashboard_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-bg-card border border-border-primary rounded-xl px-4 group focus-within:border-accent-blue transition-all shadow-sm">
            <Search className="w-4 h-4 text-text-secondary group-focus-within:text-accent-blue" />
            <input 
              type="text" 
              placeholder={t('projects.search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-[11px] py-2.5 px-2 outline-none text-text-primary placeholder:text-text-secondary/50 font-bold w-40 italic"
            />
          </div>

          <div className="flex items-center gap-2 bg-bg-surface/50 p-1 rounded-2xl border border-border-primary">
            <button 
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === 'ALL' ? 'bg-accent-blue text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('projects.filter_all', { defaultValue: 'ALL' })}
            </button>
            <button 
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === 'ACTIVE' ? 'bg-status-green text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('common.active')}
            </button>
            <button 
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === 'COMPLETED' ? 'bg-accent-blue text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('common.done')}
            </button>
          </div>

          {(user?.role === Role.SALE || user?.role === Role.CEO || user?.role === Role.PM) && (
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-5 py-2.5 bg-accent-blue text-white rounded-xl font-black text-[10px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-[0.2em] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{user?.role === Role.PM ? t('projects.btn_init_params') : t('projects.btn_new_project')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('projects.stat_total'), value: String(totalProjects), detail: `${activeProjects} ${t('projects.stat_active_suffix')}`, icon: Briefcase, color: 'text-accent-blue' },
          { label: t('projects.stat_tasks_selected'), value: String(tasks.length), detail: `${completedTasks} ${t('projects.stat_completed_suffix')}`, icon: TrendingUp, color: 'text-status-green' },
          { label: t('projects.stat_no_tasks'), value: String(projects.filter((p: any) => !p.totalEstimatedHours).length), detail: t('projects.stat_no_tasks_detail'), icon: AlertCircle, color: 'text-status-red' },
        ].map((stat: any, idx: number) => (
          <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-border-primary flex items-center justify-between group cursor-default shadow-sm hover:shadow-lg transition-all">
             <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                   <h3 className="text-2xl font-black text-text-primary italic">{stat.value}</h3>
                   <span className="text-[10px] text-text-secondary font-medium italic">{stat.detail}</span>
                </div>
             </div>
             <div className={`p-4 rounded-xl bg-bg-surface border border-border-primary ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <stat.icon className="w-6 h-6" />
             </div>
          </div>
        ))}
      </div>

      {/* Main Project Grid/List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border-primary">
             <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight italic">{t('projects.list_title')}</h3>
             <MoreHorizontal className="w-5 h-5 text-text-secondary cursor-pointer" />
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-10 italic">{searchTerm ? t('projects.no_projects') : t('projects.no_projects')}</p>
            ) : (
              filteredProjects.map((proj: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleSelectProject(proj)}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all group cursor-pointer relative overflow-hidden ${
                    selectedProject?.id === proj.id
                      ? 'bg-bg-card border-accent-blue shadow-lg shadow-accent-blue/5'
                      : 'bg-bg-surface/50 border-border-primary hover:border-accent-blue/30'
                  }`}
                >
                   <div className="flex justify-between items-start z-10">
                      <div className="flex items-center gap-4">
                         <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${selectedProject?.id === proj.id ? 'bg-accent-blue' : 'bg-bg-surface border border-border-primary'}`}>
                            <Briefcase className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="font-bold text-text-primary group-hover:text-accent-blue transition-colors italic">{proj.name}</h4>
                            <p className="text-[10px] text-text-secondary flex items-center gap-2 mt-1 font-bold italic">
                             <Clock className="w-3 h-3 text-accent-blue" /> {t('projects.est_hours')}: <span className="text-text-primary">{proj.totalEstimatedHours || 0}{t('projects.unit_h')}</span>
                            </p>
                         </div>
                      </div>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${
                        proj.status === 'IN_PROGRESS' || proj.status === 'ACTIVE' ? 'bg-status-green/10 text-status-green border-status-green/20' : 
                        proj.status === 'COMPLETED' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' : 
                        'bg-bg-card text-text-secondary border-border-primary'
                      } border`}>
                        {proj.status === 'IN_PROGRESS' || proj.status === 'ACTIVE' ? t('common.active') : 
                         proj.status === 'COMPLETED' ? t('common.done') : 
                         proj.status === 'DRAFT' ? t('common.new') :
                         proj.status === 'ON_HOLD' ? t('common.pending') :
                         proj.status}
                      </span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WBS Breakdown */}
        <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 flex flex-col shadow-xl">
           <div className="flex flex-col gap-5 pb-5 border-b border-border-primary">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight italic flex items-center gap-2">
                       <Briefcase className="w-5 h-5 text-accent-blue" />
                       {t('projects.wbs_title')}
                    </h3>
                    {selectedProject && (
                      <p className="text-[10px] text-text-secondary font-bold italic uppercase tracking-wider mt-1 opacity-70">
                        {t('projects.selected_project', { name: selectedProject.name })}
                      </p>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-2 flex-shrink-0">
                    {(user?.role === Role.PM || user?.role === Role.CEO) && selectedProject && (
                       <button 
                         onClick={() => setIsNewTaskModalOpen(true)}
                         className="flex items-center gap-1.5 px-4 py-2 bg-accent-blue text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 border border-transparent whitespace-nowrap"
                       >
                          <Plus className="w-3.5 h-3.5" /> <span>{t('projects.btn_add_task')}</span>
                       </button>
                    )}
                    
                    {(user?.role === Role.PM || user?.role === Role.CEO) && selectedProject && selectedProject.status !== 'COMPLETED' && (
                       <button 
                         onClick={handleCloseProject}
                         className="flex items-center gap-1.5 px-4 py-2 bg-bg-surface border border-status-green/30 text-status-green hover:bg-status-green hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex-shrink-0 shadow-sm whitespace-nowrap"
                       >
                          <CheckSquare className="w-3.5 h-3.5" /> <span>{t('projects.btn_close_project')}</span>
                       </button>
                    )}
                 </div>
              </div>

              {selectedProject && (() => {
                const limit = Number(selectedProject.totalEstimatedHours) || 0;
                const usagePercent = limit > 0 ? (decomposedPlannedHours / limit) * 100 : 0;
                const isWarning = usagePercent >= 80 && usagePercent < 90;
                const isOverBudget = usagePercent >= 90;
                const usedColor = isOverBudget ? 'text-red-500' : isWarning ? 'text-orange-400' : 'text-status-green';
                const usedBg = isOverBudget ? 'bg-red-500/10 border-red-500/30' : isWarning ? 'bg-orange-400/10 border-orange-400/30' : 'bg-status-green/5 border-status-green/20';
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-bg-surface/50 backdrop-blur-md rounded-2xl border border-border-primary/50 shadow-inner">
                       <div className="flex flex-col gap-1 px-4 py-2.5 bg-bg-card/80 rounded-xl border border-border-primary/30 shadow-sm transition-all hover:bg-bg-card">
                          <span className="text-[8px] font-black text-text-secondary uppercase tracking-[0.2em]">{t('projects.stat_total_est', { defaultValue: 'PROJECT LIMIT' })}</span>
                          <span className="text-sm text-text-primary font-black italic">{limit}H</span>
                       </div>
                       <div className={`flex flex-col gap-1 px-4 py-2.5 rounded-xl border shadow-sm transition-all ${usedBg}`}>
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${usedColor}`}>{t('projects.stat_decomposed', { defaultValue: 'USED' })} ({usagePercent.toFixed(0)}%)</span>
                          <span className={`text-sm font-black italic ${usedColor}`}>{decomposedPlannedHours.toFixed(1)}H</span>
                       </div>
                    </div>
                    {(isWarning || isOverBudget) && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isOverBudget ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse' : 'bg-orange-400/15 text-orange-400 border border-orange-400/30'}`}>
                        <span>⚠️</span>
                        <span>{isOverBudget 
                          ? t('projects.budget_over', { defaultValue: 'VƯỢT NGÂN SÁCH! Đã phân bổ vượt quá hạn mức thời gian dự án.' })
                          : t('projects.budget_warning_80', { defaultValue: 'Cảnh báo: Đã sử dụng trên 80% ngân sách thời gian dự án.' })
                        }</span>
                      </div>
                    )}
                  </div>
                );
              })()}

           </div>

          {tasksLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-bg-surface/10 rounded-2xl border border-dashed border-border-primary min-h-[300px]">
              <p className="text-text-secondary font-bold text-sm italic">{t('projects.no_tasks')}</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {tasks.map((task: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-bg-surface/50 rounded-2xl border border-border-primary group hover:border-accent-blue/30 transition-all hover:bg-bg-surface">
                   <div className="w-6 font-bold text-[9px] text-text-secondary italic opacity-60">#{i + 1}</div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors italic">{task.name || task.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter italic">
                           {t('projects.est_hours')}: <span className="text-text-primary">{task.estimatedHours || 0}{t('projects.unit_h')}</span> | {t('projects.approved')}: <span className="text-accent-blue">{task.actualHours || 0}{t('projects.unit_h')}</span>
                         </span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       {task.status !== 'DONE' && (user?.role === Role.PM || user?.role === Role.CEO) && (
                         <button 
                           onClick={() => handleFinishTask(task.id)}
                           className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-status-green border border-status-green/50 rounded-lg hover:bg-status-green hover:text-white transition-all bg-status-green/10 active:scale-95"
                         >
                           {t('projects.btn_finish_task', { defaultValue: 'FINISH' })}
                         </button>
                       )}
                       {task.status === 'DONE' || task.status === 'Completed' ? (
                         <CheckCircle2 className="w-5 h-5 text-status-green" />
                       ) : task.status === 'IN_PROGRESS' || task.status === 'In Progress' ? (
                         <div className="w-5 h-5 rounded-full border-2 border-accent-blue border-t-transparent animate-spin"></div>
                       ) : (
                         <div className="w-5 h-5 rounded-full border-2 border-border-primary opacity-20"></div>
                       )}
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                         task.status === 'DONE' ? 'bg-status-green/10 text-status-green border-status-green/20' :
                         task.status === 'IN_PROGRESS' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                         'bg-bg-card text-text-secondary border border-border-primary'
                       } border`}>
                         {task.status === 'DONE' ? t('common.done') : 
                          task.status === 'IN_PROGRESS' ? t('common.active') : 
                          task.status === 'TODO' ? t('common.new') :
                          task.status === 'REVIEW' ? t('common.pending') :
                          task.status || t('projects.status_pending')}
                       </span>
                        {(user?.role === Role.PM || user?.role === Role.CEO) && (
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-text-secondary hover:text-status-red transition-colors ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-border-primary">
             <div className="flex items-center justify-between text-[10px] p-4 bg-bg-surface/80 rounded-2xl border border-border-primary shadow-inner italic">
                 <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-status-yellow" />
                    <span className="text-text-secondary font-bold">{t('projects.wbs_sync_hint')}</span>
                 </div>
                 <span className="text-accent-blue font-black underline cursor-pointer hover:text-blue-700 uppercase tracking-widest">{t('projects.detail')}</span>
             </div>
          </div>
        </div>
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

export default ProjectDashboard;
