import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Modal from './Modal';
import { getCookie } from '../utils/cookie';
import { Role } from '../../../iam/entities/role.enum';
import { api } from '../api';

const Header: React.FC = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isNotifOpen) fetchNotifications();
  }, [isNotifOpen]);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/system/notifications');
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/system/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getJobTitle = (role: string) => {
    switch (role) {
      case Role.CEO: return 'Tổng Giám đốc (CEO)';
      case Role.PM: return 'Quản lý Dự án (PM)';
      case Role.SALE: return 'Trưởng phòng Kinh doanh';
      case Role.CLIENT: return 'Đại diện Đối tác';
      case Role.VENDOR: return 'Đối tác / Lập trình viên (VENDOR/DEV)';
      default: return 'Thành viên hệ thống';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-20 bg-bg-card border-b border-border-primary flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
      <Modal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} title="Trung tâm Thông báo">
         <div className="space-y-4">
            {loadingNotifs && notifications.length === 0 ? (
               <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-accent-blue animate-spin" /></div>
            ) : notifications.length === 0 ? (
               <div className="text-center py-10 text-sm text-text-secondary italic">Không có thông báo mới nào</div>
            ) : (
               notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`p-4 rounded-2xl flex items-start gap-4 transition-all cursor-pointer ${
                    n.isRead ? 'opacity-60 bg-bg-surface/50 grayscale' : 'bg-accent-blue/5 border-l-4 border-accent-blue shadow-sm'
                  }`}
                >
                   <div className={`p-2 rounded-xl ${n.isRead ? 'bg-slate-700/10' : 'bg-accent-blue/20'}`}>
                      {n.title.toLowerCase().includes('hợp đồng') ? <Clock className="w-5 h-5 text-status-yellow" /> : <AlertCircle className="w-5 h-5 text-accent-blue" />}
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{n.message}</p>
                      <p className="text-[9px] text-text-secondary mt-2 font-black uppercase tracking-widest opacity-60 italic">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                   </div>
                   {!n.isRead && <div className="w-2 h-2 bg-accent-blue rounded-full mt-2"></div>}
                </div>
               ))
            )}
         </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Cài đặt Hệ thống">
         {/* Settings content same as before */}
         <div className="space-y-6">
            <div className="space-y-2">
               <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tài khoản & Bảo mật</p>
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary flex items-center justify-between">
                  <span className="text-sm text-text-primary">Đổi mật khẩu</span>
                  <button className="text-xs text-accent-blue font-bold">CẬP NHẬT</button>
               </div>
            </div>
            <div className="space-y-2">
               <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tùy chỉnh Giao diện</p>
               <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary flex items-center justify-between">
                  <span className="text-sm text-text-primary">{isDarkMode ? 'Chế độ tối (Dark Mode)' : 'Chế độ sáng (Light Mode)'}</span>
                  <button 
                    onClick={toggleDarkMode}
                    className={`w-12 h-6 ${isDarkMode ? 'bg-accent-blue' : 'bg-slate-400'} rounded-full relative transition-all duration-300 shadow-inner`}
                  >
                    <div className={`absolute ${isDarkMode ? 'right-1' : 'left-1'} top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300`}></div>
                  </button>
               </div>
            </div>
         </div>
      </Modal>

      <div className="flex items-center gap-8">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-slate-400 uppercase tracking-widest">AMIT ERP SYSTEM</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-80 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-3 border border-border-primary focus-within:border-accent-blue transition-all group shadow-inner">
          <Search className="w-4 h-4 text-text-secondary group-focus-within:text-accent-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm chiến lược, dự án..." 
            className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-secondary font-medium"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="p-2.5 rounded-xl bg-bg-surface text-text-secondary hover:text-white transition-all relative group overflow-hidden"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-status-red rounded-full border-2 border-bg-surface animate-pulse"></span>}
          </button>
          <div className="h-8 w-px bg-slate-700/50 mx-2"></div>

          <div className="relative">
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3.5 pl-2 group cursor-pointer transition-all hover:translate-x-1"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-all line-clamp-1">{user?.fullName || 'Guest User'}</p>
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-70">{user ? getJobTitle(user.role) : 'Đang tải...'}</p>
              </div>
              <div className={`w-10 h-10 ${user?.role === Role.CEO ? 'bg-amber-400' : 'bg-accent-blue'} rounded-xl flex items-center justify-center border-2 border-bg-surface ring-2 ring-slate-700/50 group-hover:ring-accent-blue transition-all overflow-hidden shadow-lg shadow-amber-500/10`}>
                {user?.avatar ? (
                   <img src={user.avatar} className="w-full h-full object-cover" />
                ) : (
                   <User className={`${user?.role === Role.CEO ? 'text-amber-950' : 'text-white'} w-6 h-6`} />
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-white transition-all ml-1" />
            </div>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute top-[calc(100%+16px)] right-0 w-64 bg-bg-card border border-border-primary rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                   <div className="p-4 border-b border-border-primary sm:hidden">
                      <p className="text-sm font-bold text-white">{user?.fullName || 'Guest User'}</p>
                      <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-1 opacity-70">{user ? getJobTitle(user.role) : 'Đang tải...'}</p>
                   </div>
                   <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-slate-700/50 w-full transition-all text-left group"
                      >
                        <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                        <span className="font-bold text-sm tracking-tight text-white/90">Cài đặt Hệ thống</span>
                      </button>
                   </div>
                   <div className="p-2 border-t border-border-primary">
                      <button 
                        onClick={() => {
                          document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                          window.location.href = '/uiux/login';
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-status-red hover:bg-status-red/10 w-full transition-all group text-left"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm tracking-tight">Đăng xuất</span>
                      </button>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
