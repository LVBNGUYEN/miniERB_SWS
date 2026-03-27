import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Clock, 
  Wallet, 
  FileSignature, 
  ShieldCheck, 
  Bot, 
  History, 
  MessageSquare,
  FileText,
  AppWindow
} from 'lucide-react';
import { getCookie } from '../utils/cookie';
import { Role } from '../../../iam/entities/role.enum';

const Sidebar: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const role = user?.role || Role.VENDOR;

  const getAllNavItems = () => {
    const items = [
      { icon: LayoutDashboard, label: role === Role.CEO ? 'CEO Strategic View' : role === Role.PM ? 'Dashboard PM' : role === Role.SALE ? 'Pipeline Kinh doanh' : role === Role.CLIENT ? 'Cổng thông tin đối tác' : 'Bảng thực thi', path: '/', roles: [Role.CEO, Role.PM, Role.SALE, Role.VENDOR, Role.CLIENT] },
      { icon: Briefcase, label: 'Dự án & WBS', path: '/projects', roles: [Role.CEO, Role.PM, Role.VENDOR, Role.SALE] },
      { icon: Clock, label: 'Timesheet', path: '/timesheets', roles: [Role.CEO, Role.PM, Role.VENDOR] },
      { icon: FileText, label: 'Hợp đồng & Báo giá', path: '/contracts', roles: [Role.CEO, Role.SALE] },
      { icon: Wallet, label: 'Tài chính - Hóa đơn', path: '/finance', roles: [Role.CEO, Role.CLIENT] },
      { icon: FileSignature, label: 'Ký duyệt PKI (3-Step)', path: '/digital-signature', roles: [Role.CEO, Role.PM, Role.SALE, Role.CLIENT] },
      { icon: ShieldCheck, label: 'Quản trị IAM', path: '/security', roles: [Role.CEO] },
      { icon: Bot, label: 'AI Insights Center', path: '/ai-copilot', roles: [Role.CEO, Role.PM, Role.SALE] },
      { icon: MessageSquare, label: 'Hỗ trợ & CR Flow', path: '/customer-support', roles: [Role.CEO, Role.SALE, Role.CLIENT] },
      { icon: History, label: 'Audit Logs', path: '/audit-logs', roles: [Role.CEO] },
    ];
    return items.filter(item => item.roles.includes(role));
};

  const navItems = getAllNavItems();

  return (
    <aside className="w-64 bg-bg-card border-r border-border-primary flex flex-col p-6 gap-8 shrink-0 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue opacity-5 blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 relative z-10 transition-all hover:scale-105 cursor-pointer">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-accent-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white/5">
          <AppWindow className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-text-primary italic leading-none">AMIT<span className="text-accent-blue not-italic">.ERP</span></span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Enterprise V2.0</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 relative z-10 overflow-y-auto custom-scrollbar pr-1">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20 shadow-inner' 
                : 'text-text-secondary hover:bg-slate-700/10 dark:hover:bg-slate-700/30 dark:hover:text-text-primary hover:text-text-primary'
              }
            `}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-border-primary relative z-10">
        <div className="bg-bg-surface p-4 rounded-2xl border border-border-primary flex flex-col items-center text-center group cursor-pointer hover:bg-slate-700/10 dark:hover:bg-slate-800 transition-all">
           <div className="w-8 h-8 rounded-full bg-status-green/10 flex items-center justify-center text-status-green mb-2 group-hover:scale-110 transition-transform shadow-sm">
             <ShieldCheck className="w-4 h-4" />
           </div>
           <p className="text-[10px] font-black text-text-primary italic">Cloud Secure</p>
           <p className="text-[9px] text-text-secondary font-medium mt-1">Hệ thống đã mã hóa PKI.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
