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
  Loader2
} from 'lucide-react';
import { api } from '../../api';

const ManagerTimesheet: React.FC = () => {
  const [pendingTimesheets, setPendingTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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
    setActionId(id);
    try {
      await api.post(`/timesheets/${id}/approve`, {});
      setPendingTimesheets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/timesheets/${id}/reject`, {});
      setPendingTimesheets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Reject error:', err);
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
          <h2 className="text-2xl font-extrabold text-text-primary uppercase italic">Phê duyệt & QC Timesheet</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Quản lý chất lượng ghi nhận công việc và phê duyệt chi phí nhân sự dự án.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Approval Queue */}
        <div className="xl:col-span-3 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-accent-blue" />
                 Hàng đợi Phê duyệt chiến lược
              </h3>
              <div className="flex items-center gap-4">
                 <div className="w-64 bg-bg-surface rounded-lg px-3 py-1.5 flex items-center gap-2 border border-border-primary">
                    <Search className="w-3.5 h-3.5 text-text-secondary" />
                    <input type="text" placeholder="Tìm tên nhân viên, team..." className="bg-transparent text-[11px] outline-none text-text-primary w-full italic" />
                 </div>
                 <button className="p-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-all border border-border-primary"><Filter className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="space-y-4">
              {pendingTimesheets.length === 0 ? (
                <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-border-primary">
                   <Clock className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-bold text-text-secondary italic">Hàng đợi đang trống. Tuyệt vời!</p>
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

                    <div className="flex-1 grid grid-cols-3 gap-8">
                        <div>
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic">Task</p>
                          <p className="text-sm font-bold text-text-primary mt-1 italic truncate max-w-[200px]">{p.task?.name || 'Task Detail'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic tracking-tight">Số giờ</p>
                          <p className="text-xl font-black text-status-green mt-1">{p.hours}h</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-[10px] text-text-secondary font-bold uppercase italic">Ngày Log</p>
                          <p className="text-[11px] text-text-primary font-bold mt-2 uppercase tracking-tight">{new Date(p.logDate).toLocaleDateString()}</p>
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
                        <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border-primary">
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
                 <span>Lưu ý: Bảng chấm công quá hạn 7 ngày sẽ tự động bị đánh dấu 'Cảnh báo'.</span>
              </div>
              <button className="text-[11px] font-black uppercase text-accent-blue hover:underline">Xuất báo cáo phê duyệt (PDF)</button>
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
                 AI QC Assistant
              </h3>
              <div className="space-y-4 relative z-10">
                 {[
                   { title: 'Phát hiện bất thường', desc: 'Ken Masters có dấu hiệu log trùng giờ tại 2 dự án cùng khung giờ.', severity: 'High' },
                   { title: 'Gợi ý phê duyệt', desc: 'Alexander Wright có lịch sử log giờ chính xác 100% trong 3 tháng qua.', severity: 'Info' },
                 ].map((qc, i) => (
                   <div key={i} className={`p-4 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all cursor-pointer ${
                      qc.severity === 'High' ? 'bg-status-red/5 border-l-4 border-l-status-red' : 'bg-accent-blue/5 border-l-4 border-l-accent-blue'
                   }`}>
                      <p className="text-[11px] font-black text-text-primary italic">{qc.title}</p>
                      <p className="text-[10px] text-text-secondary font-medium mt-1 leading-relaxed leading-loose italic">{qc.desc}</p>
                   </div>
                 ))}
                 <button className="w-full py-2.5 bg-bg-surface text-text-primary border border-border-primary rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">SỬA LỖI HÀNG LOẠT</button>
              </div>
           </div>

           <div className="bg-bg-card rounded-2xl p-6 border border-border-primary space-y-6 shadow-xl relative group">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-purple-400" />
                 Gửi phản hồi nhanh
              </h3>
              <div className="space-y-3">
                 <textarea 
                    placeholder="Nhập phản hồi QC cho nhân viên..." 
                    className="w-full h-24 bg-bg-surface border border-border-primary rounded-xl p-3 text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-purple-500 transition-all"
                 ></textarea>
                 <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 bg-bg-surface text-[10px] font-bold text-text-primary border border-border-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">"Yêu cầu bổ sung"</button>
                    <button className="py-2 bg-bg-surface text-[10px] font-bold text-text-primary border border-border-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">"Giải trình chi phí"</button>
                 </div>
                 <button className="w-full py-2.5 mt-2 bg-purple-600 text-white rounded-xl font-black text-xs hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    GỬI PHẢN HỒI
                    <ArrowRight className="w-3.5 h-3.5" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTimesheet;
