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
  X
} from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';

const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filter & Input States
  const [searchTerm, setSearchTerm] = useState('');
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    pmId: '',
    estimatedHours: 0
  });

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

      const pmRes = await api.get('/iam/pm-list');
      setPms(Array.isArray(pmRes) ? pmRes : []);

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
      await api.post('/projects', {
        ...newProjectData,
        status: 'ACTIVE'
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsNewProjectModalOpen(false);
        setIsSuccess(false);
        setNewProjectData({ name: '', pmId: '', estimatedHours: 0 });
        fetchInitialData();
      }, 1500);
    } catch (err) {
      console.error('Create project error:', err);
      alert('Không thể tạo dự án. Vui lòng kiểm tra quyền hạn.');
    }
  };

  const handleSelectProject = (proj: any) => {
    setSelectedProject(proj);
    fetchTasks(proj.id);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pm?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE').length;
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
      {/* New Project Modal */}
      <Modal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
        title={user?.role === Role.PM ? "Thiết lập dự án hiện hữu" : "Khởi tạo Dự án Chiến lược"}
      >
        <div className="space-y-6">
          {user?.role === Role.PM ? (
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Chọn dự án (Đang có sẵn)</label>
              <select 
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all"
              >
                <option value="">— Chọn dự án —</option>
                {projects.map((p: any) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))
                }
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Tên dự án</label>
              <input 
                type="text" 
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                placeholder="VD: Tokyo Tech Phase 3 Expansion..."
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none italic font-bold placeholder:italic focus:border-accent-blue transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Thời gian dự kiến (Giờ)</label>
                <input 
                  type="number" 
                  value={newProjectData.estimatedHours}
                  onChange={(e) => setNewProjectData({...newProjectData, estimatedHours: Number(e.target.value)})}
                  placeholder="160..." 
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all" 
                />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Ưu tiên</label>
               <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all">
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
               </select>
            </div>
          </div>

          {user?.role !== Role.PM && (
            <div className="space-y-2">
               <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Chủ nhiệm dự án (PM)</label>
               <select 
                 value={newProjectData.pmId}
                 onChange={(e) => setNewProjectData({...newProjectData, pmId: e.target.value})}
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all"
               >
                 <option value="">— Chọn PM phụ trách —</option>
                 {pms.length === 0 ? (
                   <option disabled>Đang tải danh sách PM...</option>
                 ) : (
                   pms.map((pm: any) => (
                     <option key={pm.id} value={pm.id}>{pm.fullName} ({pm.email})</option>
                   ))
                 )}
               </select>
            </div>
          )}

          <button 
            onClick={handleCreateProject}
            disabled={isSuccess || !newProjectData.name}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
              isSuccess 
              ? 'bg-status-green text-white' 
              : 'bg-accent-blue text-white hover:bg-blue-600 shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100'
            }`}
          >
            {isSuccess ? <><Check className="w-6 h-6 animate-bounce" /> <span>Đã tạo dự án thành công!</span></> : 'XÁC NHẬN KHỞI TẠO'}
          </button>
        </div>
      </Modal>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary italic">Quản lý Dự án & WBS</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Theo dõi tiến độ, ngân sách và phân rã công việc của toàn tập đoàn.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center bg-bg-card border border-border-primary rounded-xl px-3 group focus-within:border-accent-blue focus-within:ring-2 ring-accent-blue/10 transition-all">
            <Search className="w-4 h-4 text-text-secondary group-focus-within:text-accent-blue" />
            <input 
              type="text" 
              placeholder="Tìm dự án..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm py-2 px-2 outline-none text-text-primary placeholder:text-text-secondary/50 font-bold"
            />
            {searchTerm && <X className="w-3 h-3 text-text-secondary cursor-pointer" onClick={() => setSearchTerm('')} />}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border-primary text-text-primary rounded-xl font-bold text-sm hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all italic">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span>Xử lý</span>
          </button>
          
          {(user?.role === Role.SALE || user?.role === Role.CEO || user?.role === Role.PM) && (
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              <span>{user?.role === Role.PM ? 'Khởi tạo thông số' : 'Dự án mới'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tổng dự án', value: String(totalProjects), detail: `${activeProjects} Đang chạy`, icon: Briefcase, color: 'text-accent-blue' },
          { label: 'Tasks của dự án chọn', value: String(tasks.length), detail: `${completedTasks} Hoàn thành`, icon: TrendingUp, color: 'text-status-green' },
          { label: 'Dự án không có task', value: String(projects.filter((p: any) => !p.totalEstimatedHours).length), detail: 'Cần bổ sung WBS', icon: AlertCircle, color: 'text-status-red' },
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
        <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border-primary">
             <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight italic">Danh sách Dự án</h3>
             <MoreHorizontal className="w-5 h-5 text-text-secondary cursor-pointer" />
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-10 italic">{searchTerm ? 'Không tìm thấy dự án nào.' : 'Chưa có dự án nào.'}</p>
            ) : (
              filteredProjects.map((proj: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleSelectProject(proj)}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all group cursor-pointer relative overflow-hidden ${
                    selectedProject?.id === proj.id
                      ? 'bg-accent-blue/10 border-accent-blue/40 shadow-inner'
                      : 'bg-bg-surface/50 border-border-primary hover:border-accent-blue/30'
                  }`}
                >
                   <div className="flex justify-between items-start z-10">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${selectedProject?.id === proj.id ? 'bg-accent-blue scale-110' : 'bg-slate-700'}`}>
                            <Briefcase className="w-6 h-6" />
                         </div>
                         <div>
                            <h4 className="font-bold text-text-primary group-hover:text-accent-blue transition-colors italic">{proj.name}</h4>
                            <p className="text-[10px] text-text-secondary flex items-center gap-2 mt-1 font-bold italic">
                               <Clock className="w-3 h-3 text-accent-blue" /> Giờ ước tính: <span className="text-text-primary">{proj.totalEstimatedHours || 0}h</span>
                            </p>
                         </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${
                        proj.status === 'ACTIVE' ? 'bg-status-green/10 text-status-green border-status-green/20' : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                      } border`}>{proj.status}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WBS Breakdown */}
        <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 flex flex-col shadow-xl">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <div>
                 <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight italic">WBS (Work Breakdown)</h3>
                 <p className="text-[10px] text-text-secondary font-black mt-1 italic uppercase tracking-wider">
                   {selectedProject ? `Đã chọn: ${selectedProject.name}` : 'Chọn một dự án bên trái'}
                 </p>
              </div>
              <div className="p-2 bg-bg-surface rounded-lg border border-border-primary">
                 <TrendingUp className="w-4 h-4 text-accent-blue" />
              </div>
           </div>

          {tasksLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-bg-surface/10 rounded-2xl border border-dashed border-border-primary min-h-[300px]">
              <p className="text-text-secondary font-bold text-sm italic">Chưa có task nào cho dự án này.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {tasks.map((task: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-bg-surface/50 rounded-2xl border border-border-primary group hover:border-accent-blue/30 transition-all hover:bg-bg-surface">
                   <div className="w-8 font-black text-[10px] text-text-secondary italic">#{i + 1}</div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors italic">{task.name || task.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter italic">
                           Giờ ước tính: <span className="text-text-primary">{task.estimatedHours || 0}h</span> | Đã log: <span className="text-accent-blue">{task.loggedHours || 0}h</span>
                         </span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      {task.status === 'DONE' || task.status === 'Completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-status-green" />
                      ) : task.status === 'IN_PROGRESS' || task.status === 'In Progress' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-accent-blue border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border-primary opacity-30"></div>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        task.status === 'DONE' ? 'bg-status-green/10 text-status-green border-status-green/20' :
                        task.status === 'IN_PROGRESS' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                        'bg-bg-surface text-text-secondary border border-border-primary'
                      } border`}>{task.status || 'PENDING'}</span>
                   </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-border-primary">
             <div className="flex items-center justify-between text-[10px] p-4 bg-bg-surface/80 rounded-2xl border border-border-primary shadow-inner italic">
                 <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-status-yellow" />
                    <span className="text-text-secondary font-bold">Dữ liệu WBS được đồng bộ từ hệ thống Quản lý Task.</span>
                 </div>
                 <span className="text-accent-blue font-black underline cursor-pointer hover:text-blue-700 uppercase tracking-widest">Detail</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
