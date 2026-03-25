import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  MoreVertical, 
  LayoutList,
  Target,
  Send,
  ArrowRight,
  History as HistoryIcon,
  Loader2
} from 'lucide-react';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';

const DeveloperTimesheet: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTimesheets, setMyTimesheets] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [hours, setHours] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProjects();
    fetchMyTimesheets();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.post('/projects/list', {});
      setProjects(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  const fetchMyTimesheets = async () => {
    try {
      const res = await api.get('/timesheets/my');
      setMyTimesheets(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch timesheets error:', err);
    }
  };

  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    setSelectedTaskId('');
    setTasks([]);
    if (!projectId) return;

    setFetching(true);
    try {
      const res = await api.post(`/projects/${projectId}/tasks-list`, {});
      setTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleLogHours = async () => {
    if (!selectedTaskId || !hours || Number(hours) <= 0) {
      setMessage({ text: 'Vui lòng chọn Task và nhập số giờ hợp lệ.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const userStr = getCookie('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('User not found');

      await api.post('/timesheets', {
        taskId: selectedTaskId,
        hours: Number(hours),
        vendorId: user.id,
        snapshotPrice: 50 // Mocked price
      });

      setMessage({ text: 'Ghi nhận giờ công thành công!', type: 'success' });
      setHours('');
      setSelectedTaskId('');
      fetchMyTimesheets();
    } catch (err) {
      setMessage({ text: 'Lỗi khi ghi nhận giờ công.', type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentWeek = [
    { day: 'Thứ 2', date: '23/03', hours: 8, status: 'Phê duyệt' },
    { day: 'Thứ 3', date: '24/03', hours: 8, status: 'Phê duyệt' },
    { day: 'Thứ 4', date: '25/03', hours: 6, status: 'Chờ duyệt' },
    { day: 'Thứ 5', date: '26/03', hours: 0, status: 'Trống' },
    { day: 'Thứ 6', date: '27/03', hours: 0, status: 'Trống' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary italic">Bảng chấm công Developer</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Ghi nhận hiệu suất làm việc và phân phối thời gian vào các dự án chiến lược.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-accent-blue text-white rounded-xl font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25">
          <Send className="w-4 h-4" />
          <span>GỬI PHÊ DUYỆT TUẦW</span>
        </button>
      </div>

      {/* Weekly Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {currentWeek.map((day, i) => (
          <div key={i} className={`p-6 rounded-2xl border transition-all flex flex-col items-center group cursor-pointer ${
            day.status === 'Trống' ? 'bg-bg-card border-border-primary hover:border-accent-blue/30' : 
            day.status === 'Phê duyệt' ? 'bg-status-green/5 border-status-green/20' : 'bg-status-yellow/5 border-status-yellow/20'
          }`}>
             <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{day.day}</span>
             <h4 className="text-lg font-black text-text-primary mt-1">{day.date}</h4>
             <div className="mt-4 flex flex-col items-center">
                <p className="text-2xl font-black text-text-primary">{day.hours}h</p>
                <div className={`mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                   day.status === 'Phê duyệt' ? 'text-status-green' : 
                   day.status === 'Chờ duyệt' ? 'text-status-yellow' : 'text-text-secondary opacity-40'
                }`}>
                   {day.status}
                </div>
             </div>
             {day.status === 'Trống' && (
               <div className="mt-4 w-8 h-8 rounded-full bg-bg-surface border border-border-primary flex items-center justify-center text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
               </div>
             )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Time Entry Form & List */}
        <div className="xl:col-span-2 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-8 shadow-xl">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                 <LayoutList className="w-5 h-5 text-accent-blue" />
                 Ghi nhận Giờ công
              </h3>
           </div>

           {/* Log Form */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-bg-surface/40 p-6 rounded-2xl border border-border-primary">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Dự án</label>
                 <select 
                   value={selectedProjectId}
                   onChange={handleProjectChange}
                   className="w-full bg-bg-card border border-border-primary rounded-xl py-2.5 px-4 text-sm text-text-primary focus:border-accent-blue outline-none transition-all font-bold"
                 >
                    <option value="">Chọn dự án...</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2 lg:col-span-2">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Công việc (Task)</label>
                 <div className="relative">
                    <select 
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      disabled={!selectedProjectId || fetching}
                      className="w-full bg-bg-card border border-border-primary rounded-xl py-2.5 px-4 text-sm text-text-primary focus:border-accent-blue outline-none transition-all disabled:opacity-50 font-bold"
                    >
                       <option value="">Chọn task...</option>
                       {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {fetching && <Loader2 className="absolute right-8 top-3 w-4 h-4 text-accent-blue animate-spin" />}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Số giờ</label>
                 <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={hours}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-bg-card border border-border-primary rounded-xl py-2.5 px-4 text-sm text-text-primary focus:border-accent-blue outline-none transition-all font-black"
                    />
                    <button 
                      onClick={handleLogHours}
                      disabled={loading || !selectedTaskId}
                      className="bg-accent-blue text-white p-2.5 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </button>
                 </div>
              </div>
           </div>

           {message.text && (
             <div className={`p-4 rounded-xl text-xs font-bold border ${message.type === 'success' ? 'bg-status-green/10 border-status-green/20 text-status-green' : 'bg-status-red/10 border-status-red/20 text-status-red'}`}>
                {message.text}
             </div>
           )}

           <div className="flex items-center justify-between pt-4 pb-2">
              <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Lịch sử Log hôm nay / Gần đây</h4>
              <span className="text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">{myTimesheets.length} Entries</span>
           </div>

           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {myTimesheets.length === 0 ? (
                <div className="text-center py-12 bg-bg-surface/20 rounded-2xl border border-dashed border-border-primary">
                   <Clock className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-20" />
                   <p className="text-xs font-bold text-text-secondary italic">Chưa có dữ liệu log giờ.</p>
                </div>
              ) : (
                myTimesheets.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-bg-surface/60 rounded-2xl border border-border-primary group hover:border-accent-blue/30 transition-all animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 bg-bg-surface border border-border-primary rounded-xl flex items-center justify-center text-text-secondary group-hover:text-accent-blue transition-colors shadow-sm">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">{entry.task?.project?.name || 'Dự án'}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${entry.status === 'APPROVED' ? 'bg-status-green/10 text-status-green border-status-green/20' : entry.status === 'PENDING' ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20' : 'bg-bg-surface text-text-secondary border-border-primary'} border`}>{entry.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-text-primary italic">{entry.task?.name || 'Task'}</h4>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xl font-black text-text-primary italic">{entry.hours}h</p>
                          <p className="text-[9px] text-text-secondary font-medium tracking-tighter">{new Date(entry.logDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                          {entry.status === 'PENDING' && <button className="p-2 text-text-secondary hover:text-status-red transition-all"><Trash2 className="w-4 h-4" /></button>}
                          <button className="p-2 text-text-secondary hover:text-accent-blue transition-all"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Developer Performance Summary */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                 <Target className="w-24 h-24 text-accent-blue" />
              </div>
              <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                 Chỉ số Hiệu năng Tuần
              </h3>
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-end border-b border-border-primary pb-4">
                    <div>
                       <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Tổng giờ log</p>
                       <p className="text-3xl font-black text-text-primary italic">22.5h</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-status-green uppercase italic tracking-widest">+12.4%</p>
                       <p className="text-[9px] text-text-secondary font-medium italic">so với tuần trước</p>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold">
                       <span className="text-text-secondary uppercase text-[10px] tracking-widest">Tỷ lệ Billable</span>
                       <span className="text-text-primary font-black">85.0%</span>
                    </div>
                    <div className="h-1.5 w-full bg-bg-surface border border-border-primary rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: '85%' }}></div>
                    </div>
                 </div>

                 <div className="pt-4 flex justify-center">
                    <button className="text-[11px] font-black text-accent-blue hover:underline uppercase tracking-widest italic flex items-center gap-2 group/btn active:scale-95 transition-all">
                       Xem báo cáo năng suất
                       <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl text-white">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                    <HistoryIcon className="w-5 h-5" />
                 </div>
                 <h4 className="text-sm font-black italic uppercase tracking-tight">Phản hồi từ PM</h4>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border-l-4 border-l-status-yellow text-xs font-medium text-white/80 leading-relaxed italic">
                 "Task 'Phát triển Module Dashboard UI' chấm công hơi cao (4h), Alexander vui lòng bổ sung giải thích chi tiết hơn về các component đã code."
                 <p className="text-[9px] font-black text-indigo-200 mt-2 uppercase not-italic tracking-widest">— Nguyen Van PM</p>
              </div>
              <button className="w-full py-2.5 bg-white text-indigo-900 rounded-xl text-[10px] font-black hover:bg-slate-100 transition-all shadow-md active:scale-95 uppercase tracking-widest">
                 PHẢN HỒI LẠI
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperTimesheet;
