import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Clock, 
  Activity,
  Terminal,
  Database,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { api } from '../../api';

const AuditLogDashboard: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/logs');
      setAuditLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const totalLogs = auditLogs.length;
  const failedLogs = auditLogs.filter((l: any) => l.action === 'DELETE' || l.status === 'Failed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary">Nhật ký Kiểm toán Hệ thống (Audit Logs)</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Ghi vết mọi thay đổi dữ liệu, cấu hình và bảo mật trên toàn bộ 16 phân hệ ERP.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl font-bold text-xs transition-all border border-border-primary">
            <Download className="w-4 h-4" /> Xuất tập tin SQL/CSV
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tổng sự kiện', value: String(totalLogs), color: 'text-accent-blue', icon: Activity },
          { label: 'Sự kiện xóa/lỗi', value: String(failedLogs), color: 'text-status-red', icon: AlertCircle },
          { label: 'Nguồn dữ liệu', value: 'API', color: 'text-purple-400', icon: Database },
        ].map((stat: any, i: number) => (
          <div key={i} className="bg-bg-card p-6 rounded-2xl border border-border-primary flex flex-col items-center justify-center text-center group hover:border-slate-500 transition-all shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <stat.icon className="w-16 h-16" />
             </div>
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">{stat.label}</p>
             <h3 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Audit Feed */}
        <div className="xl:col-span-3 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                 <Terminal className="w-5 h-5 text-accent-blue" />
                 Bảng theo dõi Truy vết kỹ thuật
              </h3>
           </div>

           {auditLogs.length === 0 ? (
             <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-border-primary">
               <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-20" />
               <p className="text-sm font-bold text-text-secondary italic">Chưa có bản ghi audit nào.</p>
             </div>
           ) : (
             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-bg-surface/50 rounded-2xl border border-border-primary hover:border-accent-blue/30 transition-all group">
                     <div className="flex flex-col items-center gap-1 w-16 shrink-0 border-r border-border-primary pr-4">
                        <span className="text-[10px] font-black text-text-secondary uppercase">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span className="text-[9px] text-text-secondary font-bold whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString('vi-VN') : ''}
                        </span>
                     </div>

                     <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-accent-blue uppercase font-mono bg-accent-blue/5 px-2 py-0.5 rounded border border-accent-blue/10">
                             {log.tableName || log.module || 'SYSTEM'}
                           </span>
                           <span className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors cursor-pointer">
                             {log.action || 'Unknown'} {log.recordId ? `#${String(log.recordId).substring(0, 8)}` : ''}
                           </span>
                        </div>
                        <p className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5 italic">
                           <User className="w-3 h-3" /> User ID: {log.userId ? String(log.userId).substring(0, 12) + '...' : 'System'}
                        </p>
                     </div>

                     <div className="flex items-center gap-4 shrink-0">
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                           log.action === 'DELETE' ? 'bg-status-red/10 text-status-red' :
                           log.action === 'INSERT' ? 'bg-status-green/10 text-status-green' :
                           'bg-accent-blue/10 text-accent-blue'
                        }`}>
                           {log.action || 'LOG'}
                        </div>
                        <button className="p-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-all border border-border-primary"><ArrowRight className="w-4 h-4" /></button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Filter Side */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 shadow-lg">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Filter className="w-4 h-4 text-purple-400" />
                 Bộ lọc Nâng cao
              </h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Tìm kiếm Logic</p>
                    <div className="relative">
                       <input type="text" placeholder="Tìm ID bản ghi..." className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-2 text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-blue transition-all" />
                       <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-text-secondary" />
                    </div>
                 </div>
                 <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Theo phân hệ</p>
                    <div className="grid grid-cols-2 gap-2">
                       {['Finance', 'Project', 'IAM', 'PKI', 'Sales', 'Vendor'].map((m) => (
                         <div key={m} className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface rounded-lg border border-border-primary text-[9px] font-bold text-text-secondary hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all cursor-pointer">
                            <CheckCircle2 className="w-3 h-3 text-text-secondary opacity-30" />
                            {m}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
              <button onClick={fetchLogs} className="w-full py-2.5 bg-accent-blue text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all">Tải lại dữ liệu</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDashboard;
