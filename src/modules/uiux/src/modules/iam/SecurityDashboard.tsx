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
  Loader2,
  Trash2,
  Mail,
  Shield,
  Briefcase
} from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';

const SecurityDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'USER'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, settingsRes, logsRes] = await Promise.all([
        api.get('/iam/users'),
        api.get('/iam/settings'),
        api.get('/audit/logs')
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setSettings(settingsRes);
      setAuditLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bảo mật:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await api.patch(`/iam/user/${userId}/toggle-status`);
      fetchData();
    } catch (err) {
      alert('Không thể thay đổi trạng thái người dùng');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn reset mật khẩu tài khoản này về mặc định?')) return;
    try {
      const res: any = await api.post(`/iam/user/${userId}/reset-password`, {});
      alert(res.message || 'Reset mật khẩu thành công');
    } catch (err) {
      alert('Lỗi reset mật khẩu');
    }
  };

  const handleToggleMFA = async () => {
    try {
      const newSettings = await api.patch('/iam/settings', { mfaEnabled: !settings?.mfaEnabled });
      setSettings(newSettings);
    } catch (err) {
      alert('Lỗi cập nhật MFA');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/iam/sign-up', newUser);
      alert('Tạo tài khoản thành công!');
      setIsCreateModalOpen(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'USER' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo tài khoản');
    } finally {
      setCreating(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-status-red/10 text-status-red text-[8px] font-black uppercase tracking-[0.3em] rounded-xl border border-status-red/20 italic">SECURITY CENTER V4.0</span>
             <span className="w-2 h-2 bg-status-red rounded-full animate-ping opacity-75"></span>
           </div>
           <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/30 underline-offset-8">QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN (IAM)</h2>
           <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-accent-blue/10 underline underline-offset-4">Thiết lập bảo mật, phân quyền và giám sát hệ thống chiến lược.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-6 py-4 bg-bg-card border border-border-primary text-text-primary rounded-2xl font-black text-xs hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-xl active:scale-95 italic uppercase tracking-widest ring-4 ring-transparent hover:ring-accent-blue/5">
            <Settings className="w-5 h-5 text-accent-blue" />
            <span>Chế độ Admin</span>
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10 italic"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* User Management Module */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-primary">
                 <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10">
                    <UserCheck className="w-6 h-6 text-accent-blue" />
                    Danh sách Nhân sự & Vai trò
                 </h3>
                 <div className="w-full md:w-80 bg-bg-surface rounded-2xl px-5 py-3 flex items-center gap-3 border border-border-primary shadow-inner group-focus-within:border-accent-blue transition-all">
                    <Search className="w-5 h-5 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder="Tìm tên, vai trò..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-xs outline-none text-text-primary w-full font-black italic placeholder:opacity-40" 
                    />
                 </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-60">
                        <th className="pb-6 font-black italic">NGƯỜI DÙNG</th>
                        <th className="pb-6 font-black italic">VAI TRÒ CHÍNH</th>
                        <th className="pb-6 font-black italic text-center">TRẠNG THÁI</th>
                        <th className="pb-6 font-black italic text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary/40">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="py-20 text-center text-sm text-text-secondary font-black italic uppercase tracking-widest opacity-30">Hệ thống chưa có tài khoản nào matching.</td></tr>
                      ) : (
                        filteredUsers.map((user: any, i: number) => (
                        <tr key={i} className="group hover:bg-bg-surface/50 transition-all cursor-default">
                          <td className="py-6">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-accent-blue/10 text-accent-blue border border-accent-blue/20 group-hover:scale-110 transition-transform shadow-inner italic group-hover:rotate-6">
                                   {(user.fullName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors italic uppercase tracking-tight underline decoration-transparent group-hover:decoration-accent-blue underline-offset-4">{user.fullName}</span>
                                   <span className="text-[10px] text-text-secondary font-black tracking-widest opacity-60 italic mt-1">{user.email}</span>
                                </div>
                             </div>
                          </td>
                          <td className="py-6">
                             <span className="px-3 py-1 bg-bg-surface border border-border-primary rounded-xl font-black text-text-primary text-[10px] uppercase tracking-tighter italic shadow-sm">{user.role}</span>
                          </td>
                          <td className="py-6">
                             <div className="flex justify-center">
                                <button 
                                  onClick={() => handleToggleStatus(user.id)}
                                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all active:scale-90 ${
                                    user.status === 'ACTIVE' 
                                      ? 'text-status-green bg-status-green/10 border-status-green/20 shadow-inner hover:bg-status-red/10 hover:text-status-red hover:border-status-red/20' 
                                      : 'text-status-red bg-status-red/10 border-status-red/20 animate-pulse'
                                  }`}
                                >
                                   {user.status === 'ACTIVE' ? 'KÍCH HOẠT' : 'ĐÃ KHÓA'}
                                </button>
                             </div>
                          </td>
                          <td className="py-6 text-right">
                             <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button 
                                  onClick={() => handleResetPassword(user.id)}
                                  title="Reset mật khẩu"
                                  className="p-3 text-text-secondary hover:text-status-yellow transition-all bg-bg-surface border border-border-primary rounded-xl hover:shadow-lg active:scale-90"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button className="p-3 text-text-secondary hover:text-status-red transition-all bg-bg-surface border border-border-primary rounded-xl shadow-sm hover:shadow-lg active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                <button className="p-3 text-text-secondary hover:text-text-primary transition-all bg-bg-surface border border-border-primary rounded-xl shadow-sm"><MoreVertical className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-status-yellow/20">
                 <Lock className="w-6 h-6 text-status-yellow" />
                 Thiết lập quản trị bảo mật tầng sâu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                    { title: 'Multi-Factor Auth', status: settings?.mfaEnabled ? 'Đã bật' : 'Chưa bật', icon: ShieldCheck, color: settings?.mfaEnabled ? 'text-status-green' : 'text-text-secondary', desc: 'Sử dụng chuẩn FIDO2/WebAuthn cho toàn bộ cấp Quản lý.', onClick: handleToggleMFA },
                    { title: 'IP Whitelisting', status: settings?.ipWhitelisting ? 'Bán phần' : 'Tắt', icon: ShieldAlert, color: 'text-status-yellow', desc: `Chỉ cho phép: ${settings?.ipWhitelisting || 'Tất cả'}` },
                    { title: 'Session Timeout', status: `${settings?.sessionTimeout || 0} giờ`, icon: History, color: 'text-accent-blue', desc: 'Thời gian sống tối đa của phiên làm việc Token (JWT PKI).' },
                    { title: 'API Key Management', status: settings?.apiKeyActive ? 'Active' : 'Inactive', icon: Key, color: 'text-purple-400', desc: 'Cấp quyền truy cập hệ thống từ API Gateway bên thứ 3.' },
                 ].map((mod: any, i) => (
                    <div key={i} onClick={mod.onClick} className="p-6 bg-bg-surface/30 border border-border-primary rounded-3xl hover:bg-bg-surface hover:border-accent-blue/30 transition-all group/card cursor-pointer shadow-sm relative overflow-hidden">
                       <div className="flex justify-between items-start relative z-10">
                          <div className={`p-4 rounded-2xl bg-bg-card border border-border-primary shadow-inner group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform ${mod.color}`}>
                             <mod.icon className="w-6 h-6" />
                          </div>
                          <span className="text-[9px] font-black uppercase text-text-primary bg-bg-surface border border-border-primary px-3 py-1.5 rounded-xl italic tracking-[0.2em] shadow-inner">{mod.status}</span>
                       </div>
                       <h4 className="font-black text-text-primary text-sm mt-6 italic underline decoration-accent-blue/10 underline-offset-4 tracking-tight uppercase group-hover/card:text-accent-blue transition-colors">{mod.title}</h4>
                       <p className="text-[11px] text-text-secondary font-bold mt-2 leading-relaxed italic opacity-70 border-l-2 border-border-primary pl-3 group-hover/card:border-accent-blue/30 transition-colors uppercase tracking-tight">{mod.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Security Logs Module */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] flex items-center gap-3 border-b border-border-primary pb-6 italic underline decoration-purple-500/20 underline-offset-8">
                 <History className="w-5 h-5 text-purple-400" />
                 Nhật ký Bảo mật (Audit Logs)
              </h3>
              <div className="space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {auditLogs.length === 0 ? (
                  <p className="text-[10px] text-text-secondary font-black italic opacity-30 text-center py-6 uppercase tracking-widest">Chưa có nhật ký nào định danh.</p>
                ) : (
                  auditLogs.slice(0, 10).map((log, i) => (
                    <div key={i} className="flex gap-4 relative group/log cursor-default">
                       <div className={`w-10 h-10 rounded-2xl border-2 border-bg-card flex items-center justify-center shrink-0 z-10 shadow-2xl transition-transform group-hover/log:scale-110 group-hover/log:-rotate-6 ${
                          log.action.includes('SIGN') || log.action.includes('INIT') ? 'bg-status-red text-white' : 
                          log.action.includes('UPDATE') ? 'bg-status-yellow text-white' : 'bg-accent-blue text-white'
                       }`}>
                          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                       </div>
                       <div className="space-y-1.5 flex-1 border-b border-border-primary/30 pb-4">
                          <p className="text-xs font-black text-text-primary group-hover/log:text-accent-blue transition-colors italic line-clamp-1 uppercase tracking-tight">{log.action}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest opacity-60 italic">{log.tableName} • {log.user?.fullName || 'System'}</p>
                            <p className="text-[8px] text-text-secondary font-black tracking-tighter italic opacity-40">{new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}</p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full py-4 bg-bg-surface border border-border-primary text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-text-primary hover:bg-slate-700/10 transition-all active:scale-95 shadow-xl italic ring-4 ring-transparent hover:ring-purple-400/5">
                Xem toàn bộ lịch sử Audit
              </button>
           </div>

           <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-[2000ms]">
                 <ShieldCheck className="w-48 h-48" />
              </div>
              <div className="space-y-10 relative z-10">
                 <div>
                    <div className="w-16 h-1 bg-white/40 mb-4 rounded-full"></div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-white/20 underline-offset-8">Đạt chuẩn ISO/IEC 27001</h4>
                    <p className="text-emerald-100/90 text-[11px] font-black mt-6 leading-relaxed italic uppercase tracking-[0.2em]">Hệ thống đang vận hành theo tiêu chuẩn bảo mật v2026 cao nhất.</p>
                 </div>
                 <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-2xl border border-white/20 shadow-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] italic text-emerald-100 pb-4 border-b border-white/10">
                       <span>Audit lần cuối</span>
                       <span className="text-white bg-emerald-700/50 px-3 py-1 rounded-lg">{auditLogs[0] ? new Date(auditLogs[0].createdAt).toLocaleDateString('vi-VN') : '27/03/2026'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-emerald-200 italic">
                       <span>Trạng thái</span>
                       <span className="flex items-center gap-2 text-white animate-pulse"><CheckCircle2 className="w-4 h-4 text-white" /> TUYỆT ĐỐI AN TOÀN</span>
                    </div>
                 </div>
              </div>
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
           </div>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="THÊM TÀI KHOẢN MỚI"
      >
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <User className="w-3 h-3 text-accent-blue" />
                 Họ và tên
               </label>
               <input 
                 type="text"
                 required
                 value={newUser.fullName}
                 onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic"
                 placeholder="Nhập họ tên người dùng..."
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <Mail className="w-3 h-3 text-accent-blue" />
                 Email truy cập (Username)
               </label>
               <input 
                 type="email"
                 required
                 value={newUser.email}
                 onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic"
                 placeholder="example@company.com"
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <Lock className="w-3 h-3 text-accent-blue" />
                 Mật khẩu khởi tạo
               </label>
               <input 
                 type="password"
                 required
                 value={newUser.password}
                 onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic"
                 placeholder="••••••••"
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <Shield className="w-3 h-3 text-accent-blue" />
                 Vai trò hệ thống (Role)
               </label>
               <select 
                 value={newUser.role}
                 onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-black text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic uppercase"
               >
                 <option value="CEO">CEO (Tổng giám đốc)</option>
                 <option value="PM">PM (Quản lý dự án)</option>
                 <option value="SALE">SALE (Kinh doanh)</option>
                 <option value="VENDOR">VENDOR (Đối tác/Thầu phụ)</option>
                 <option value="CLIENT">CLIENT (Khách hàng)</option>
                 <option value="USER">USER (Nhân sự)</option>
               </select>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
               type="button"
               onClick={() => setIsCreateModalOpen(false)}
               className="flex-1 py-4 bg-bg-surface border border-border-primary text-text-secondary rounded-2xl font-black text-xs uppercase tracking-widest italic hover:bg-slate-700/10 transition-all shadow-sm"
             >
               Hủy bỏ
             </button>
             <button 
               type="submit"
               disabled={creating}
               className="flex-1 py-4 bg-accent-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest italic shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
             >
               {creating ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   ĐANG XỬ LÝ...
                 </>
               ) : (
                 <>
                   <CheckCircle2 className="w-4 h-4" />
                   TẠO TÀI KHOẢN
                 </>
               )}
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SecurityDashboard;
