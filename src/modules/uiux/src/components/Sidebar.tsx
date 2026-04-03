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
  AppWindow,
  Menu,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../utils/cookie';
import { Role } from '../../../iam/entities/role.enum';
import { useAlert } from '../hooks/useAlert';
import AlertModal from './AlertModal';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { t } = useTranslation();
  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const role = user?.role || Role.VENDOR;

  const getAllNavItems = () => {
    const items = [
      { icon: LayoutDashboard, label: role === Role.CEO ? t('sidebar.dashboard_ceo') : role === Role.PM ? t('sidebar.dashboard_pm') : role === Role.SALE ? t('sidebar.dashboard_sale') : role === Role.CLIENT ? t('sidebar.dashboard_client') : t('sidebar.dashboard_vendor'), path: '/', roles: [Role.CEO, Role.PM, Role.SALE, Role.VENDOR, Role.CLIENT, Role.DEV] },
      { icon: Briefcase, label: t('sidebar.projects'), path: '/projects', roles: [Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.DEV] },
      { icon: Clock, label: t('sidebar.timesheet'), path: '/timesheets', roles: [Role.CEO, Role.PM, Role.VENDOR, Role.DEV] },
      { icon: FileText, label: t('sidebar.contracts'), path: '/contracts', roles: [Role.CEO, Role.SALE] },
      { icon: FileText, label: t('sidebar.quotations'), path: '/quotations', roles: [Role.CEO, Role.SALE, Role.PM] },
      { icon: Wallet, label: t('sidebar.finance'), path: '/finance', roles: [Role.CEO, Role.CLIENT] },
      { icon: FileSignature, label: t('sidebar.pki'), path: '/digital-signature', roles: [Role.CEO, Role.PM, Role.CLIENT, Role.VENDOR, Role.DEV] },
      { icon: ShieldCheck, label: t('sidebar.iam'), path: '/security', roles: [Role.CEO] },
      { icon: Bot, label: t('sidebar.ai_center'), path: '/ai-copilot', roles: [Role.CEO, Role.PM, Role.SALE] },
      {icon: MessageSquare, label: t('sidebar.support'), path: '/customer-support', roles: [Role.CEO, Role.SALE, Role.CLIENT, Role.PM] },
      { icon: History, label: t('sidebar.audit_logs'), path: '/audit-logs', roles: [Role.CEO] },
    ];
    return items.filter(item => item.roles.includes(role));
};

  const navItems = getAllNavItems();

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-bg-card border-r border-border-primary flex flex-col p-4 gap-8 shrink-0 relative overflow-hidden shadow-2xl transition-all duration-500 ease-in-out`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue opacity-5 blur-3xl pointer-events-none"></div>
      
      {/* Header section with Logo and Toggle */}
      <div className={`flex ${isCollapsed ? 'flex-col items-center gap-6' : 'items-center justify-between'} relative z-10 mb-2 transition-all duration-500`}>
        <div className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-accent-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white/5 shrink-0 group-hover:scale-105 transition-transform">
            <AppWindow className="text-white w-6 h-6" />
          </div>
          <div className={`flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-32 opacity-100'}`}>
            <span className="text-xl font-extrabold tracking-tight text-text-primary italic leading-none whitespace-nowrap">AMIT<span className="text-accent-blue not-italic">.ERP</span></span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Enterprise V2.0</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-xl bg-bg-surface border border-border-primary text-text-secondary hover:text-accent-blue hover:border-accent-blue transition-all shadow-sm active:scale-90 shrink-0 flex items-center justify-center
            ${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation section */}
      <nav className={`flex-1 flex flex-col gap-2 relative z-10 overflow-y-auto custom-scrollbar pr-1 ${isCollapsed ? 'items-center' : ''}`}>
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) => `
              flex items-center rounded-xl transition-all duration-300 group relative
              ${isActive 
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20 shadow-inner' 
                : 'text-text-secondary hover:bg-slate-700/10 dark:hover:bg-slate-700/30 dark:hover:text-text-primary hover:text-text-primary border border-transparent'
              }
              ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full gap-3.5 px-4 py-3'}
            `}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} transition-transform group-hover:scale-110 shrink-0`} />
            <span className={`font-bold text-[13px] tracking-tight transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-40 opacity-100 ml-0'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer section */}
      <div className={`pt-6 border-t border-border-primary relative z-10 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div 
          onClick={() => showAlert(t('common.info'), t('sidebar.secure_alert'), 'info')}
          className={`bg-bg-surface rounded-2xl border border-border-primary flex items-center group cursor-pointer hover:bg-slate-700/10 dark:hover:bg-slate-800 transition-all overflow-hidden
            ${isCollapsed ? 'w-10 h-10 justify-center' : 'p-4 w-full gap-3'}`}
        >
           <div className="w-8 h-8 rounded-full bg-status-green/10 flex items-center justify-center text-status-green group-hover:scale-110 transition-transform shadow-sm shrink-0">
             <ShieldCheck className="w-4 h-4" />
           </div>
           <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-40 opacity-100'}`}>
             <p className="text-[10px] font-black text-text-primary italic whitespace-nowrap">{t('sidebar.secure_title')}</p>
             <p className="text-[9px] text-text-secondary font-medium mt-1 whitespace-nowrap">{t('sidebar.secure_desc')}</p>
           </div>
        </div>
      </div>
      
      <AlertModal {...alertConfig} onClose={closeAlert} />
    </aside>
  );
};

export default Sidebar;
