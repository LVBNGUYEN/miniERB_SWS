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
  Briefcase,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const SecurityDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { alertConfig, showAlert, closeAlert } = useAlert();
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'USER',
    hourlyRate: 0
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
      console.error(t('iam.err_load'), err);
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
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('iam.err_toggle_status'), 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    showAlert(t('common.confirm'), t('iam.confirm_reset_pwd'), 'confirm', async () => {
      try {
        const res: any = await api.post(`/iam/user/${userId}/reset-password`, {});
        showAlert(t('common.success'), res.message || t('iam.success_reset_pwd'), 'success');
      } catch (err: any) {
        showAlert(t('common.error'), err.response?.data?.message || t('iam.err_reset_pwd'), 'error');
      }
    });
  };

  const handleToggleMFA = async () => {
    try {
      const newSettings = await api.patch('/iam/settings', { mfaEnabled: !settings?.mfaEnabled });
      setSettings(newSettings);
      showAlert(t('common.success'), t('iam.mfa_updated_success', { defaultValue: 'Đã cập nhật cài đặt MFA!' }), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('iam.err_update_mfa'), 'error');
    }
  };

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUser.fullName || !newUser.email || !newUser.password) return;

    setCreating(true);
    try {
      await api.post('/iam/sign-up', newUser);
      showAlert(t('common.success'), t('iam.success_create_user'), 'success');
      setIsCreateModalOpen(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'USER', hourlyRate: 0 });
      fetchData();
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('iam.err_create_user'), 'error');
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
           <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/30 underline-offset-8">{t('iam.title')}</h2>
           <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-accent-blue/10 underline underline-offset-4">{t('iam.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => showAlert(t('iam.admin_system'), t('iam.admin_mode_alert'), 'info')}
            className="flex items-center gap-3 px-6 py-4 bg-bg-card border border-border-primary text-text-primary rounded-2xl font-black text-xs hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-xl active:scale-95 italic uppercase tracking-widest ring-4 ring-transparent hover:ring-accent-blue/5"
          >
            <Settings className="w-5 h-5 text-accent-blue" />
            <span>{t('iam.btn_admin_mode')}</span>
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10 italic"
          >
            <Plus className="w-5 h-5" />
            <span>{t('iam.btn_add_user')}</span>
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
                    {t('iam.user_list_title')}
                 </h3>
                 <div className="w-full md:w-80 bg-bg-surface rounded-2xl px-5 py-3 flex items-center gap-3 border border-border-primary shadow-inner group-focus-within:border-accent-blue transition-all">
                    <Search className="w-5 h-5 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder={t('iam.search_placeholder')}
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
                        <th className="pb-6 font-black italic">{t('iam.col_user')}</th>
                        <th className="pb-6 font-black italic">{t('iam.col_role')}</th>
                        <th className="pb-6 font-black italic text-center">{t('iam.col_status')}</th>
                        <th className="pb-6 font-black italic text-right">{t('iam.col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary/40">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="py-20 text-center text-sm text-text-secondary font-black italic uppercase tracking-widest opacity-30">{t('iam.no_users')}</td></tr>
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
                             <span className="px-3 py-1 bg-bg-surface border border-border-primary rounded-xl font-black text-text-primary text-[10px] uppercase tracking-tighter italic shadow-sm">
                                {t(`iam.role_${user.role?.toLowerCase()}`, { defaultValue: user.role })}
                             </span>
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
                                   {user.status === 'ACTIVE' ? t('iam.status_active') : t('iam.status_locked')}
                                </button>
                             </div>
                          </td>
                          <td className="py-6 text-right">
                             <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button 
                                  onClick={() => handleResetPassword(user.id)}
                                  title={t('iam.reset_pwd')}
                                  className="p-3 text-text-secondary hover:text-status-yellow transition-all bg-bg-surface border border-border-primary rounded-xl hover:shadow-lg active:scale-90"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                 <button 
                                   onClick={() => showAlert(t('iam.security'), t('iam.err_delete_locked', { name: user.fullName }), 'info')}
                                   className="p-3 text-text-secondary hover:text-status-red transition-all bg-bg-surface border border-border-primary rounded-xl shadow-sm hover:shadow-lg active:scale-90"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => { setSelectedUser(user); setIsDetailsModalOpen(true); }}
                                   className="p-3 text-text-secondary hover:text-text-primary transition-all bg-bg-surface border border-border-primary rounded-xl shadow-sm"
                                 >
                                   <MoreVertical className="w-4 h-4" />
                                 </button>
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
                 {t('iam.deep_security_title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                    { title: 'Multi-Factor Auth', status: settings?.mfaEnabled ? t('iam.enabled') : t('iam.disabled'), icon: ShieldCheck, color: settings?.mfaEnabled ? 'text-status-green' : 'text-text-secondary', desc: t('iam.mfa_desc'), onClick: handleToggleMFA },
                    { title: 'IP Whitelisting', status: settings?.ipWhitelisting ? t('iam.partial') : t('iam.off'), icon: ShieldAlert, color: 'text-status-yellow', desc: t('iam.ip_desc', { ips: settings?.ipWhitelisting || t('iam.all') }) },
                    { title: 'Session Timeout', status: `${settings?.sessionTimeout || 0} ${t('iam.hours')}`, icon: History, color: 'text-accent-blue', desc: t('iam.session_desc') },
                    { title: 'API Key Management', status: settings?.apiKeyActive ? 'Active' : 'Inactive', icon: Key, color: 'text-purple-400', desc: t('iam.api_key_desc') },
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
                 {t('iam.audit_logs_title')}
              </h3>
              <div className="space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {auditLogs.length === 0 ? (
                  <p className="text-[10px] text-text-secondary font-black italic opacity-30 text-center py-6 uppercase tracking-widest">{t('iam.no_audit')}</p>
                ) : (
                  auditLogs.slice(0, 10).map((log, i) => (
                    <div key={i} className="flex gap-4 relative group/log cursor-default">
                       <div className={`w-10 h-10 rounded-2xl border-2 border-bg-card flex items-center justify-center shrink-0 z-10 shadow-2xl transition-transform group-hover/log:scale-110 group-hover/log:-rotate-6 ${
                          log.action?.includes('SIGN') || log.action?.includes('INIT') ? 'bg-status-red text-white' : 
                          log.action?.includes('UPDATE') ? 'bg-status-yellow text-white' : 'bg-accent-blue text-white'
                       }`}>
                          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                       </div>
                       <div className="space-y-1.5 flex-1 border-b border-border-primary/30 pb-4">
                          <p className="text-xs font-black text-text-primary group-hover/log:text-accent-blue transition-colors italic line-clamp-1 uppercase tracking-tight">{log.action}</p>
                          <div className="flex justify-between items-center">
                             <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest opacity-60 italic">{log.tableName} • {log.user?.fullName || 'System'}</p>
                             <p className="text-[8px] text-text-secondary font-black tracking-tighter italic opacity-40">{new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit'})}</p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
               <button 
                onClick={() => showAlert(t('iam.export_audit_title'), t('iam.export_audit_alert'), 'info')}
                className="w-full py-4 bg-bg-surface border border-border-primary text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-text-primary hover:bg-slate-700/10 transition-all active:scale-95 shadow-xl italic ring-4 ring-transparent hover:ring-purple-400/5"
               >
                {t('iam.btn_view_full_audit')}
              </button>
           </div>

           <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-[2000ms]">
                 <ShieldCheck className="w-48 h-48" />
              </div>
              <div className="space-y-10 relative z-10">
                 <div>
                    <div className="w-16 h-1 bg-white/40 mb-4 rounded-full"></div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-white/20 underline-offset-8">{t('iam.iso_title')}</h4>
                    <p className="text-emerald-100/90 text-[11px] font-black mt-6 leading-relaxed italic uppercase tracking-[0.2em]">{t('iam.iso_desc')}</p>
                 </div>
                 <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-2xl border border-white/20 shadow-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] italic text-emerald-100 pb-4 border-b border-white/10">
                       <span>{t('iam.last_audit')}</span>
                       <span className="text-white bg-emerald-700/50 px-3 py-1 rounded-lg">{auditLogs[0] ? new Date(auditLogs[0].createdAt).toLocaleDateString() : '27/03/2026'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-emerald-200 italic">
                       <span>{t('iam.status')}</span>
                       <span className="flex items-center gap-2 text-white animate-pulse"><CheckCircle2 className="w-4 h-4 text-white" /> {t('iam.absolute_safe')}</span>
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
        title={t('iam.modal_create_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 py-3 bg-bg-surface border border-border-primary text-text-secondary rounded-xl font-black text-xs uppercase tracking-widest italic hover:bg-slate-700/10 transition-all shadow-sm"
              disabled={creating}
            >
              {t('iam.btn_cancel')}
            </button>
            <button 
              onClick={() => handleCreateUser()}
              disabled={creating || !newUser.fullName || !newUser.email || !newUser.password}
              className="flex-1 py-3 bg-accent-blue text-white rounded-xl font-black text-xs uppercase tracking-widest italic shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('iam.creating_loading')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t('iam.btn_create_confirm')}
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6 p-4">
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <User className="w-3 h-3 text-accent-blue" />
                 {t('iam.label_fullname')}
               </label>
               <input 
                 type="text"
                 required
                 value={newUser.fullName}
                 onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic"
                 placeholder={t('iam.placeholder_fullname')}
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <Mail className="w-3 h-3 text-accent-blue" />
                 {t('iam.label_email')}
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
                 {t('iam.label_password')}
               </label>
               <div className="relative">
                 <input 
                   type={showPassword ? "text" : "password"}
                   required
                   value={newUser.password}
                   onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                   className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic pr-12"
                   placeholder="••••••••"
                 />
                 <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent-blue transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                 <Shield className="w-3 h-3 text-accent-blue" />
                 {t('iam.label_role')}
               </label>
               <select 
                 value={newUser.role}
                 onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                 className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-black text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic uppercase"
               >
                 <option value="CEO">{t('iam.role_ceo')}</option>
                 <option value="PM">{t('iam.role_pm')}</option>
                 <option value="SALE">{t('iam.role_sale')}</option>
                 <option value="VENDOR">{t('iam.role_vendor')}</option>
                 <option value="CLIENT">{t('iam.role_client')}</option>
                 <option value="USER">{t('iam.role_user')}</option>
               </select>
             </div>

             {newUser.role === 'VENDOR' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic flex items-center gap-2">
                    <Briefcase className="w-3 h-3 text-accent-blue" />
                    {t('iam.label_hourly_rate', { defaultValue: 'Vendor Hourly Rate (VNĐ)' })}
                  </label>
                  <input 
                    type="number"
                    value={newUser.hourlyRate}
                    onChange={(e) => setNewUser({...newUser, hourlyRate: Number(e.target.value)})}
                    className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-accent-blue outline-none transition-all shadow-inner italic"
                    placeholder="200,000"
                  />
                </div>
              )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t('iam.modal_detail_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => { setIsDetailsModalOpen(false); handleResetPassword(selectedUser.id); }}
              className="flex-1 py-2.5 bg-bg-surface border border-border-primary text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-700/10 transition-all"
            >
              {t('iam.btn_reset_pwd')}
            </button>
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all shadow-lg"
            >
              {t('iam.btn_close_detail')}
            </button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-6 p-4">
            <div className="flex items-center gap-6 pb-6 border-b border-border-primary">
               <div className="w-20 h-20 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center text-3xl font-black italic border border-accent-blue/20">
                  {selectedUser.fullName?.charAt(0).toUpperCase()}
               </div>
               <div className="space-y-1">
                  <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight">{selectedUser.fullName}</h4>
                  <p className="text-xs text-text-secondary font-black opacity-60 tracking-widest uppercase">{selectedUser.email}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic">{t('iam.detail_role')}</p>
                  <p className="text-xs font-black text-accent-blue uppercase italic">
                    {t(`iam.role_${selectedUser.role?.toLowerCase()}`, { defaultValue: selectedUser.role })}
                  </p>
               </div>
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic">{t('iam.col_status')}</p>
                  <p className={`text-xs font-black uppercase italic ${selectedUser.status === 'ACTIVE' ? 'text-status-green' : 'text-status-red'}`}>
                    {selectedUser.status === 'ACTIVE' ? t('iam.status_active') : t('iam.status_locked')}
                  </p>
               </div>
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic">{t('iam.detail_user_id')}</p>
                  <p className="text-[9px] font-mono text-text-primary opacity-60 truncate">{selectedUser.id}</p>
               </div>
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic">{t('iam.detail_last_login')}</p>
                  <p className="text-[9px] font-black text-text-primary opacity-60 italic uppercase">{t('iam.today')}, 10:45 AM</p>
               </div>
            </div>
          </div>
        )}
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

export default SecurityDashboard;
