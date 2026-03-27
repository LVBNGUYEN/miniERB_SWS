import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle2, AlertCircle, TrendingUp, Search, Loader2, Check } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';

const TimesheetBoard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    taskId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    progressNote: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, logsRes] = await Promise.all([
        api.get('/projects/tasks/my'),
        api.get('/timesheets/my-logs')
      ]);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Lỗi khi fetch Timesheet Data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.taskId || !formData.date || formData.hours < 0.5) return;
    try {
      await api.post('/timesheets', {
        taskId: formData.taskId,
        date: new Date(formData.date).toISOString(),
        hours: Number(formData.hours),
        progressNote: formData.progressNote
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
        setFormData({ ...formData, hours: 0, progressNote: '' });
        fetchData();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting timesheet:', err);
      alert(err.response?.data?.message || 'Không thể tạo Timesheet.');
    }
  };

  const filteredLogs = logs.filter(log =>
    log.progressNote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.task?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHours = logs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
  const pendingLogs = logs.filter(log => log.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Ghi nhận Giờ làm việc (Log Work)"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Chọn Task</label>
            <select 
              value={formData.taskId}
              onChange={(e) => setFormData({...formData, taskId: e.target.value})}
              className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all"
            >
              <option value="">— Chọn Task bạn đang làm —</option>
              {tasks.length === 0 ? (
                <option disabled>Không có Task nào được gán cho bạn.</option>
              ) : (
                tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} (Còn: {Math.max(0, (t.estimatedHours || 0) - (t.actualHours || 0))}h)</option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Ngày làm</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all" 
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Số Giờ</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={formData.hours || ''}
                  onChange={(e) => setFormData({...formData, hours: Number(e.target.value)})}
                  placeholder="Ví dụ: 4.5" 
                  className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all" 
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Ghi chú / Tiến độ</label>
            <textarea 
              value={formData.progressNote}
              onChange={(e) => setFormData({...formData, progressNote: e.target.value})}
              placeholder="Hôm nay đã làm được những gì..."
              rows={3}
              className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold focus:border-accent-blue transition-all"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSuccess || !formData.taskId || formData.hours < 0.5}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
              isSuccess 
              ? 'bg-status-green text-white' 
              : 'bg-accent-blue text-white hover:bg-blue-600 shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100'
            }`}
          >
            {isSuccess ? <><Check className="w-6 h-6 animate-bounce" /> <span>Đã nộp Timesheet!</span></> : 'SUBMIT WORK'}
          </button>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary italic">My Timesheets</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Ghi nhận và theo dõi số giờ làm việc hằng ngày của bạn.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Log Work
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card p-6 rounded-2xl border border-border-primary flex items-center justify-between group shadow-sm hover:shadow-lg transition-all">
           <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">TỐNG SỐ GIỜ ĐÃ LOG</p>
              <div className="flex items-baseline gap-2 mt-2">
                 <h3 className="text-2xl font-black text-text-primary italic">{totalHours}h</h3>
              </div>
           </div>
           <div className="p-4 rounded-xl bg-bg-surface border border-border-primary text-accent-blue group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-bg-card p-6 rounded-2xl border border-border-primary flex items-center justify-between group shadow-sm hover:shadow-lg transition-all">
           <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">CHỜ CHECK DUYỆT</p>
              <div className="flex items-baseline gap-2 mt-2">
                 <h3 className="text-2xl font-black text-text-primary italic">{pendingLogs}</h3>
                 <span className="text-[10px] text-text-secondary font-medium italic">Logs</span>
              </div>
           </div>
           <div className="p-4 rounded-xl bg-bg-surface border border-border-primary text-status-yellow group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-bg-card p-6 rounded-2xl border border-border-primary flex items-center justify-between group shadow-sm hover:shadow-lg transition-all">
           <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">TASKS ĐANG MỞ</p>
              <div className="flex items-baseline gap-2 mt-2">
                 <h3 className="text-2xl font-black text-text-primary italic">{tasks.length}</h3>
              </div>
           </div>
           <div className="p-4 rounded-xl bg-bg-surface border border-border-primary text-status-green group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
           </div>
        </div>
      </div>

      {/* Log History */}
      <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border-primary">
           <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight italic">Lịch sử Timesheet</h3>
           <div className="flex items-center bg-bg-surface border border-border-primary rounded-xl px-3 group focus-within:border-accent-blue ring-accent-blue/10 transition-all">
             <Search className="w-4 h-4 text-text-secondary" />
             <input 
               type="text" 
               placeholder="Tìm kiếm nội dung..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-transparent text-sm py-2 px-2 outline-none text-text-primary placeholder:text-text-secondary/50 font-bold"
             />
           </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 bg-bg-surface/10 rounded-2xl border border-dashed border-border-primary">
              <p className="text-text-secondary font-bold italic">Chưa có bản ghi Timesheet nào.</p>
            </div>
          ) : (
            filteredLogs.map((log: any, idx: number) => (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl border border-border-primary bg-bg-surface/50 hover:border-accent-blue/30 transition-all group">
                 <div className="flex-1">
                    <div className="flex items-center gap-3">
                       <h4 className="font-bold text-text-primary group-hover:text-accent-blue transition-colors italic">
                         {log.task?.title || 'Unknown Task'}
                       </h4>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                         log.status === 'APPROVED' ? 'bg-status-green/10 text-status-green border-status-green/20' :
                         log.status === 'REJECTED' ? 'bg-status-red/10 text-status-red border-status-red/20' :
                         'bg-status-yellow/10 text-status-yellow border-status-yellow/20'
                       } border`}>{log.status}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 italic border-l-2 border-accent-blue/50 pl-3">
                      "{log.progressNote || 'Không có ghi chú'}"
                    </p>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-3">
                      Ngày: <span className="text-text-primary">{new Date(log.date).toLocaleDateString()}</span> 
                    </p>
                 </div>
                 <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-bg-card border border-border-primary shadow-inner min-w-[80px]">
                    <span className="text-2xl font-black text-accent-blue italic leading-none">{log.hours}</span>
                    <span className="text-[9px] font-bold text-text-secondary mt-1">GIỜ</span>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimesheetBoard;
