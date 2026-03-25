import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import Modal from './Modal';
import { getCookie } from '../utils/cookie';
import { Role } from '../../../iam/entities/role.enum';

const Header: React.FC = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true; // Default to dark as requested earlier
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

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getJobTitle = (role: string) => {
    switch (role) {
      case Role.GLOBAL_ADMIN: return 'Tổng Giám đốc (CEO)';
      case Role.BRANCH_PM: return 'Quản lý Dự án (PM)';
      case Role.SALE: return 'Trưởng phòng Kinh doanh';
      case Role.CLIENT: return 'Đại diện Đối tác';
      case Role.VENDOR: return 'Chuyên viên Kỹ thuật';
      default: return 'Thành viên hệ thống';
    }
  };

  return (
    <header className="h-20 bg-bg-card border-b border-border-primary flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
      <Modal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} title="Trung tâm Thông báo">
         <div className="space-y-4">
            <div className="p-4 bg-status-yellow/5 border border-status-yellow/20 rounded-2xl flex items-center gap-4">
               <Bell className="w-5 h-5 text-status-yellow" />
               <div>
                  <p className="text-sm font-bold text-text-primary">Hợp đồng CT-1711129 sắp hết hạn</p>
                  <p className="text-xs text-text-secondary">Vui lòng kiểm tra và gửi báo giá gia hạn cho khách hàng.</p>
               </div>
            </div>
            <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl flex items-center gap-4">
               <CheckCircle2 className="w-5 h-5 text-accent-blue" />
               <div>
                  <p className="text-sm font-bold text-text-primary">Phê duyệt Timesheet thành công</p>
                  <p className="text-xs text-text-secondary">Dự án Tokyo Tech đã được đồng bộ dữ liệu nhân lực.</p>
               </div>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Cài đặt Hệ thống">
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
            <span className="absolute top-2 right-2 w-2 h-2 bg-status-red rounded-full border-2 border-bg-surface animate-pulse"></span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-bg-surface text-text-secondary hover:text-white transition-all group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </button>
          
          <div className="h-8 w-px bg-slate-700/50"></div>

          <div className="flex items-center gap-3.5 pl-2 group cursor-pointer transition-all hover:translate-x-1">
            <div className="text-right">
              <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-all line-clamp-1">{user?.fullName || 'Guest User'}</p>
              <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-70">{user ? getJobTitle(user.role) : 'Đang tải...'}</p>
            </div>
            <div className={`w-10 h-10 ${user?.role === Role.GLOBAL_ADMIN ? 'bg-amber-400' : 'bg-accent-blue'} rounded-xl flex items-center justify-center border-2 border-bg-surface ring-2 ring-slate-700/50 group-hover:ring-accent-blue transition-all overflow-hidden shadow-lg shadow-amber-500/10`}>
              {user?.avatar ? (
                 <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                 <User className={`${user?.role === Role.GLOBAL_ADMIN ? 'text-amber-950' : 'text-white'} w-6 h-6`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
