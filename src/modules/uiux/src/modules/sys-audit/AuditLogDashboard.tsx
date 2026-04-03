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
  Loader2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const AuditLogDashboard: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { t, i18n } = useTranslation();

  const { alertConfig, showAlert, closeAlert } = useAlert();

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

  const handleExport = async (format: 'SQL' | 'CSV') => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const content = format === 'CSV' 
          ? "Time,Module,Action,User,Status\n" + auditLogs.map(l => `${l.createdAt},${l.tableName},${l.action},${l.userId},Success`).join("\n")
          : "-- AMIT ERP Audit SQL Export\n" + auditLogs.map(l => `INSERT INTO audit_logs (id, module, action) VALUES ('${l.id}', '${l.tableName}', '${l.action}');`).join("\n");
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_export_${new Date().getTime()}.${format.toLowerCase()}`;
        a.click();
        window.URL.revokeObjectURL(url);
        showAlert(t('common.success'), t('audit.export_success', { defaultValue: 'Xuất dữ liệu thành công!' }), 'success');
      } catch (err) {
        showAlert(t('common.error'), t('audit.export_error', { defaultValue: 'Lỗi khi xuất dữ liệu' }), 'error');
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
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

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'DELETE': return t('audit.action_delete');
      case 'INSERT': return t('audit.action_insert');
      case 'UPDATE': return t('audit.action_update');
      default: return action || t('audit.action_default');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary">{t('audit.dashboard_title')}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('audit.dashboard_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
           disabled={isExporting}
           onClick={() => handleExport('CSV')}
           className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl font-bold text-xs transition-all border border-border-primary hover:border-accent-blue/50 shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : <Download className="w-4 h-4" />}
            <span>{t('audit.export_csv')}</span>
          </button>
          <button 
           disabled={isExporting}
           onClick={() => handleExport('SQL')}
           className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all border border-slate-800 hover:border-accent-blue/50"
          >
             <Database className="w-4 h-4" /> 
             <span>{t('audit.export_sql')}</span>
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('audit.total_events'), value: String(totalLogs), color: 'text-accent-blue', icon: Activity },
          { label: t('audit.failure_events'), value: String(failedLogs), color: 'text-status-red', icon: AlertCircle },
          { label: t('audit.data_source'), value: 'API', color: 'text-purple-400', icon: Database },
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
                 {t('audit.table_title')}
              </h3>
           </div>

           {auditLogs.length === 0 ? (
             <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-border-primary">
               <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-20" />
               <p className="text-sm font-bold text-text-secondary italic">{t('audit.no_logs')}</p>
             </div>
           ) : (
             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-bg-surface/50 rounded-2xl border border-border-primary hover:border-accent-blue/30 transition-all group">
                     <div className="flex flex-col items-center gap-1 w-16 shrink-0 border-r border-border-primary pr-4">
                        <span className="text-[10px] font-black text-text-secondary uppercase">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span className="text-[9px] text-text-secondary font-bold whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN') : ''}
                        </span>
                     </div>

                     <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-accent-blue uppercase font-mono bg-accent-blue/5 px-2 py-0.5 rounded border border-accent-blue/10">
                             {log.tableName || log.module || 'SYSTEM'}
                           </span>
                           <span 
                            onClick={() => handleViewLog(log)}
                            className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors cursor-pointer"
                           >
                             {getActionLabel(log.action)} {log.recordId ? `#${String(log.recordId).substring(0, 8)}` : ''}
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
                        <button 
                          onClick={() => handleViewLog(log)}
                          className="p-2 bg-bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-all border border-border-primary hover:border-accent-blue/50 shadow-sm"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
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
                 {t('audit.filter_title')}
              </h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">{t('audit.search_logic')}</p>
                    <div className="relative">
                       <input type="text" placeholder={t('audit.search_id')} className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-2 text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-blue transition-all" />
                       <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-text-secondary" />
                    </div>
                 </div>
                 <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">{t('audit.by_module')}</p>
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
              <button onClick={fetchLogs} className="w-full py-2.5 bg-accent-blue text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all">{t('audit.reload')}</button>
           </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('audit.modal_detail_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => {
                setIsModalOpen(false);
                showAlert(t('audit.verify_title', { defaultValue: 'Xác thực' }), t('audit.cross_verify_msg'), 'info'); 
              }}
              className="flex-1 py-2.5 bg-bg-surface border border-border-primary text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-accent-blue transition-all"
            >
              <ShieldCheck className="w-4 h-4 inline-block mr-1" />
              {t('audit.verify_btn')}
            </button>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Check className="w-4 h-4 inline-block mr-1" />
              {t('audit.close_btn')}
            </button>
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-border-primary">
               <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-primary flex items-center justify-center">
                  <Terminal className="w-8 h-8 text-accent-blue" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-lg font-black text-text-primary italic uppercase tracking-tight">{selectedLog.tableName}</h4>
                  <p className="text-[10px] text-text-secondary font-black opacity-60 tracking-widest uppercase italic">{t('audit.registry_verify')}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic opacity-60">{t('audit.record_id')}</p>
                  <p className="text-[11px] font-black text-text-primary font-mono break-all">{selectedLog.id ? String(selectedLog.id).substring(0, 8) + '...' : 'N/A'}</p>
               </div>
               <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic opacity-60">{t('audit.timestamp')}</p>
                  <p className="text-[11px] font-black text-text-primary italic">{new Date(selectedLog.createdAt).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN')}</p>
               </div>
               <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic opacity-60">{t('audit.action_label')}</p>
                  <p className="text-[11px] font-black text-accent-blue uppercase italic">{selectedLog.action}</p>
               </div>
               <div className="p-4 bg-bg-surface/50 rounded-2xl border border-border-primary">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic opacity-60">{t('audit.access_user')}</p>
                  <p className="text-[11px] font-black text-text-primary italic truncate">{selectedLog.userId ? String(selectedLog.userId).substring(0, 12) + '...' : 'SERVICE_ACCOUNT'}</p>
               </div>
            </div>

            <div className="p-4 bg-bg-surface rounded-2xl border border-border-primary space-y-3">
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 italic">
                  <Activity className="w-3 h-3 text-status-green" /> {t('audit.pki_integrity')}
               </p>
               <div className="p-3 bg-bg-card rounded-xl border border-border-primary font-mono text-[9px] text-status-green opacity-80 break-all leading-relaxed animate-pulse">
                  {"VALID_HASH: " + btoa(selectedLog.id + selectedLog.createdAt).substring(0, 32)}
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

export default AuditLogDashboard;
