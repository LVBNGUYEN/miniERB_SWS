import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Key, 
  History, 
  Search, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  ShieldAlert,
  Settings,
  Filter,
  UserCheck,
  UserMinus,
  Loader2
} from 'lucide-react';
import { api } from '../../api';

const SecurityDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/iam/users');
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  const securityLogs = [
    { event: 'Thay đổi cấu hình DB', user: 'Hệ thống', time: '11:15:32', severity: 'High' },
    { event: 'Đăng nhập thành công', user: 'Quản trị viên', time: '11:13:00', severity: 'Info' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20">Quản trị Tài khoản & Phân quyền (IAM)</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Thiết lập bảo mật, phân quyền và giám sát hệ thống chiến lược.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-border-primary text-text-primary rounded-xl font-bold text-sm hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95 italic">
            <Settings className="w-4 h-4 text-text-secondary" />
            <span>Chế độ Admin</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/25 active:scale-95 uppercase tracking-widest">
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* User Management Module */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight italic">
                    <UserCheck className="w-5 h-5 text-accent-blue" />
                    Danh sách Nhân sự & Vai trò
                 </h3>
                 <div className="w-full md:w-64 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-2 border border-border-primary shadow-inner">
                    <Search className="w-4 h-4 text-text-secondary" />
                    <input type="text" placeholder="Tìm tên, vai trò..." className="bg-transparent text-xs outline-none text-text-primary w-full font-bold italic" />
                 </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] border-b border-border-primary pb-4">
                        <th className="pb-4 font-black italic">Người dùng</th>
                        <th className="pb-4 font-black italic">Vai trò chính</th>
                        <th className="pb-4 font-black italic text-center">Trạng thái</th>
                        <th className="pb-4 font-black italic">Truy cập cuối</th>
                        <th className="pb-4 font-black italic text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary/50">
                      {loading ? (
                        <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-8 h-8 text-accent-blue animate-spin mx-auto" /></td></tr>
                      ) : users.length === 0 ? (
                        <tr><td colSpan={5} className="py-10 text-center text-sm text-text-secondary font-bold italic uppercase tracking-widest opacity-40">Hệ thống chưa có tài khoản nào.</td></tr>
                      ) : (
                        users.map((user: any, i: number) => (
                        <tr key={i} className="group hover:bg-bg-surface transition-colors cursor-default">
                          <td className="py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-accent-blue/10 text-accent-blue border border-accent-blue/20 group-hover:scale-110 transition-transform shadow-sm italic">
                                   {(user.fullName || 'U').charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors cursor-pointer italic">{user.fullName}</span>
                                   <span className="text-[10px] text-text-secondary font-medium tracking-tight opacity-70 italic">{user.email}</span>
                                </div>
                             </div>
                          </td>
                          <td className="py-5 font-black text-text-primary text-[11px] uppercase tracking-tighter italic">{user.role}</td>
                          <td className="py-5">
                             <div className="flex justify-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic border ${
                                   user.status === 'ACTIVE' ? 'text-status-green bg-status-green/10 border-status-green/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'text-text-secondary bg-bg-surface border-border-primary'
                                }`}>
                                   {user.status === 'ACTIVE' ? 'KÍCH HOẠT' : user.status}
                                </span>
                             </div>
                          </td>
                          <td className="py-5 text-[10px] text-text-secondary font-black italic uppercase tracking-tighter opacity-60">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="py-5 text-right">
                             <div className="flex justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-text-secondary hover:text-accent-blue transition-all bg-bg-surface border border-border-primary rounded-xl hover:shadow-lg active:scale-90"><Lock className="w-4 h-4" /></button>
                                <button className="p-2 text-text-secondary hover:text-status-red transition-all bg-bg-surface border border-border-primary rounded-xl hover:shadow-lg active:scale-90"><UserMinus className="w-4 h-4" /></button>
                                <button className="p-2 text-text-secondary hover:text-text-primary transition-all bg-bg-surface border border-border-primary rounded-xl shadow-sm"><MoreVertical className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-2 uppercase tracking-tight italic">
                 <Lock className="w-5 h-5 text-status-yellow" />
                 Thiết lập quản trị bảo mật tầng sâu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   { title: 'Multi-Factor Auth', status: 'Đã bật', icon: ShieldCheck, color: 'text-status-green', desc: 'Sử dụng chuẩn FIDO2/WebAuthn cho toàn bộ cấp Quản lý.' },
                   { title: 'IP Whitelisting', status: 'Bán phần', icon: ShieldAlert, color: 'text-status-yellow', desc: 'Chấn chỉnh truy cập chỉ từ IP văn phòng VN & Nhật Bản.' },
                   { title: 'Session Timeout', status: '12 giờ', icon: History, color: 'text-accent-blue', desc: 'Thời gian sống tối đa của phiên làm việc Token (JWT PKI).' },
                   { title: 'API Key Management', status: 'Active', icon: Key, color: 'text-purple-400', desc: 'Cấp quyền truy cập hệ thống từ API Gateway bên thứ 3.' },
                 ].map((mod, i) => (
                   <div key={i} className="p-6 bg-bg-surface/40 border border-border-primary rounded-2xl hover:bg-bg-surface hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm">
                      <div className="flex justify-between items-start">
                         <div className={`p-3 rounded-2xl bg-bg-card border border-border-primary shadow-inner group-hover:scale-110 transition-transform ${mod.color}`}>
                            <mod.icon className="w-5 h-5" />
                         </div>
                         <span className="text-[9px] font-black uppercase text-text-primary bg-bg-surface border border-border-primary px-2.5 py-1 rounded-lg italic tracking-widest">{mod.status}</span>
                      </div>
                      <h4 className="font-black text-text-primary text-sm mt-5 italic underline decoration-accent-blue/10 underline-offset-4 tracking-tight">{mod.title}</h4>
                      <p className="text-[11px] text-text-secondary font-bold mt-2 leading-relaxed italic opacity-70">{mod.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Security Logs Module */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6 shadow-xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 border-b border-border-primary pb-5 italic">
                 <History className="w-4 h-4 text-purple-400" />
                 Nhật ký Bảo mật Real-time (Audit)
              </h3>
              <div className="space-y-6">
                {securityLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 relative">
                     {i !== securityLogs.length - 1 && <div className="absolute top-8 left-4 w-px h-full bg-border-primary/50 pointer-events-none"></div>}
                     <div className={`w-8 h-8 rounded-full border-2 border-bg-card flex items-center justify-center shrink-0 z-10 shadow-lg ${
                        log.severity === 'High' ? 'bg-status-red text-white' : 
                        log.severity === 'Medium' ? 'bg-status-yellow text-white' : 'bg-accent-blue text-white'
                     }`}>
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                     </div>
                     <div className="space-y-1 group cursor-pointer">
                        <p className="text-xs font-black text-text-primary group-hover:text-accent-blue transition-colors italic underline decoration-transparent hover:decoration-accent-blue">{log.event}</p>
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60 italic">{log.user}</p>
                        <p className="text-[9px] text-text-secondary font-black tracking-tight italic mt-1 opacity-40">Thực hiện lúc: {log.time}</p>
                     </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 bg-bg-surface border border-border-primary text-text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-text-primary hover:bg-slate-700/10 transition-all active:scale-95 shadow-sm italic">
                Xem toàn bộ lịch sử Audit
              </button>
           </div>

           <div className="bg-gradient-to-br from-status-green to-emerald-700 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-[2000ms]">
                 <ShieldCheck className="w-48 h-48" />
              </div>
              <div className="space-y-8 relative z-10">
                 <div>
                    <h4 className="text-xl font-black italic tracking-tighter uppercase underline decoration-white/20 underline-offset-8">Đạt chuẩn ISO/IEC 27001</h4>
                    <p className="text-emerald-100/90 text-[11px] font-black mt-4 leading-relaxed italic uppercase tracking-wider">Hệ thống đang vận hành theo tiêu chuẩn bảo mật v2026 cao nhất.</p>
                 </div>
                 <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-xl border border-white/20 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic text-emerald-100">
                       <span>Audit lần cuối</span>
                       <span className="text-white">23/03/2026</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mt-3 text-emerald-200 italic">
                       <span>Trạng thái</span>
                       <span className="flex items-center gap-1.5 text-white"><CheckCircle2 className="w-3 h-3 text-white" /> TUYỆT ĐỐI AN TOÀN</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
