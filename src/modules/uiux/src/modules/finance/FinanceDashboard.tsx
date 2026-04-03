import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const FinanceDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pnl, setPnl] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pnlLoading, setPnlLoading] = useState(false);

  const { alertConfig, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.post('/projects/list', {});
      const list = Array.isArray(res) ? res : [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
        fetchPnl(list[0].id);
        if (list[0].contractId) fetchMilestones(list[0].contractId);
      }
    } catch (err) {
      console.error(t('finance.load_projects_err'), err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (contractId: string) => {
    try {
      const data = await api.get(`/sales/contracts/${contractId}/milestones`);
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load milestones error:", err);
    }
  };

  const fetchPnl = async (projectId: string) => {
    setPnlLoading(true);
    try {
      const res = await api.get(`/finance/pnl/${projectId}`);
      setPnl(res);
    } catch (err) {
      console.error(t('finance.load_pnl_err'), err);
      setPnl(null);
    } finally {
      setPnlLoading(false);
    }
  };

  const updateMilestone = async (mId: string, status: string) => {
    try {
      await api.patch(`/sales/contracts/milestones/${mId}`, { status });
      const currentProject = projects.find(p => p.id === selectedProjectId);
      if (currentProject?.contractId) {
        fetchMilestones(currentProject.contractId);
      }
      fetchPnl(selectedProjectId);
      showAlert(t('common.success'), t('finance.milestone_updated'), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || "Error updating milestone status.", 'error');
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    if (pid) {
      fetchPnl(pid);
      const proj = projects.find(p => p.id === pid);
      if (proj?.contractId) fetchMilestones(proj.contractId);
      else setMilestones([]);
    }
  };

  const handleExport = () => {
    if (!pnl) {
      showAlert(t('common.info'), t('finance.no_pnl_data'), 'info');
      return;
    }

    const headers = ['Metric', 'Value'];
    const data = [
      [t('executive_dashboard.unit_projects'), projects.find((p: any) => p.id === selectedProjectId)?.name || 'N/A'],
      [t('finance.pnl_contract_val'), pnl.contractAmount || 0],
      [t('finance.pnl_total_hours'), pnl.totalApprovedHours || 0],
      [t('finance.pnl_internal_cost'), pnl.totalActualCost || 0],
      [t('finance.pnl_net_profit'), pnl.netProfit || 0],
      [t('finance.pnl_margin_percent'), `${Number(pnl.profitMarginPercent || 0).toFixed(2)}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", t('finance.csv_filename'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = async () => {
    try {
      const data = await api.get('/finance/report/pnl');
      if (!Array.isArray(data)) return;

      const headers = ['Project', 'Revenue', 'Internal Cost', 'Vendor Cost', 'Gross Profit', 'Margin (%)'];
      const rows = data.map((r: any) => [
        r.projectName,
        r.revenue,
        r.internalCosts,
        r.vendorCosts,
        r.profit,
        (Number(r.margin || 0) * 100).toFixed(2)
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\ufeff" 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Full_PnL_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showAlert(t('common.error'), "Error exporting full report.", 'error');
    }
  };

  const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', { 
       style: 'currency', 
       currency: i18n.language === 'en' ? 'USD' : 'VND' 
     }).format(i18n.language === 'en' ? amount / 25000 : amount);
  };

  const financialCards = [
    { label: t('finance.card_contract'), value: pnl ? formatCurrency(pnl.contractAmount || 0) : '—', color: 'text-status-green', icon: ArrowUpRight },
    { label: t('finance.card_cost'), value: pnl ? formatCurrency(pnl.totalActualCost || 0) : '—', color: 'text-status-red', icon: ArrowDownRight },
    { label: t('finance.card_profit'), value: pnl ? formatCurrency(pnl.netProfit || 0) : '—', color: 'text-accent-blue', icon: TrendingUp },
    { label: t('finance.card_margin'), value: pnl ? `${Number(pnl.profitMarginPercent || 0).toFixed(1)}%` : '—', color: 'text-status-yellow', icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-5 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20">{t('finance.dashboard_title')}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('finance.dashboard_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-xl font-bold text-sm hover:bg-accent-blue hover:text-white transition-all shadow-lg active:scale-95 italic transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('finance.export_all_report')}</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-border-primary text-text-primary rounded-xl font-bold text-sm hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95 italic"
          >
            <Download className="w-4 h-4 text-text-secondary" />
            <span>{t('finance.export_report')}</span>
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-bg-card p-5 rounded-2xl border border-border-primary flex items-center gap-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
           <FileText className="w-24 h-24 text-accent-blue" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
             <FileText className="w-5 h-5" />
          </div>
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic">{t('finance.project_selector_hint')}</label>
        </div>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          className="flex-1 bg-bg-surface border border-border-primary rounded-xl py-3 px-5 text-sm text-text-primary font-bold outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10 transition-all appearance-none cursor-pointer"
        >
          {projects.map((p: any, i: number) => (
            <option key={i} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Financial Overview Cards */}
      {pnlLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {financialCards.map((card, idx) => (
            <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-border-primary relative overflow-hidden group hover:border-accent-blue transition-all cursor-default shadow-lg shadow-blue-900/5">
              <div className="flex flex-col gap-1 relative z-10">
                 <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{card.label}</p>
                 <h3 className="text-xl font-black text-text-primary mt-2 italic flex items-center gap-2">
                    {card.value}
                    <card.icon className={`w-4 h-4 ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                 </h3>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-bg-surface border border-border-primary rounded-full flex items-center justify-center -rotate-12 group-hover:bg-accent-blue/5 transition-all shadow-inner`}>
                 <DollarSign className={`w-12 h-12 ${card.color} opacity-10 group-hover:scale-110 transition-transform`} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* PnL Detail */}
        <div className="xl:col-span-2 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden hover:border-accent-blue/40 transition-all">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary italic uppercase tracking-tight">{t('finance.pnl_detail_title')}</h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-status-green shadow-[0_0_8px_rgba(22,163,74,0.4)]"></div>
                 <div className="w-2 h-2 rounded-full bg-status-yellow opacity-30"></div>
                 <div className="w-2 h-2 rounded-full bg-status-red opacity-30"></div>
              </div>
           </div>

           {pnl ? (
             <div className="space-y-4">
               {[
                 { label: t('finance.pnl_contract_val'), value: formatCurrency(pnl.contractAmount || 0), type: 'main' },
                 { label: t('finance.pnl_total_hours'), value: `${pnl.totalApprovedHours || 0} ${t('executive_dashboard.unit_hours')}`, type: 'sub' },
                 { label: t('finance.pnl_internal_cost'), value: formatCurrency(pnl.totalActualCost || 0), type: 'sub', color: 'text-status-red' },
                 { label: t('finance.pnl_net_profit'), value: formatCurrency(pnl.netProfit || 0), type: 'impact', color: 'text-status-green' },
                 { label: t('finance.pnl_margin_percent'), value: `${Number(pnl.profitMarginPercent || 0).toFixed(1)}%`, type: 'impact', color: 'text-accent-blue' },
               ].map((row: any, i: number) => (
                 <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    row.type === 'impact' ? 'bg-bg-surface border-accent-blue/20 shadow-inner' : 'bg-bg-surface/50 border-border-primary'
                 }`}>
                   <span className={`text-[11px] font-black uppercase tracking-wider italic ${row.type === 'impact' ? 'text-text-primary' : 'text-text-secondary'}`}>{row.label}</span>
                   <span className={`text-md font-black italic ${row.color || 'text-text-primary underline decoration-border-primary underline-offset-4'}`}>{row.value}</span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center bg-bg-surface/50 rounded-2xl border border-dashed border-border-primary group">
               <AlertCircle className="w-10 h-10 text-text-secondary opacity-20 mb-3 group-hover:scale-110 transition-transform" />
               <p className="text-text-secondary font-bold text-sm italic">{t('finance.no_data_title')}</p>
               <p className="text-[10px] text-text-secondary/50 font-medium mt-1">{t('finance.no_data_subtitle')}</p>
             </div>
           )}
        </div>

        {/* Milestones / Invoices List */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 italic">
                 <Wallet className="w-4 h-4 text-accent-blue" />
                 {t('finance.pnl_milestones')}
              </h3>
              <div className="space-y-3">
                 {milestones.length > 0 ? milestones.map((m, i) => (
                    <div key={i} className="bg-bg-surface p-4 rounded-xl border border-border-primary hover:border-accent-blue/30 transition-all flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                          <span className="text-[11px] font-black italic text-text-primary">{m.name}</span>
                          <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                             m.status === 'PAID' ? 'bg-status-green/10 text-status-green' : 'bg-status-yellow/10 text-status-yellow'
                          }`}>{m.status}</span>
                       </div>
                       <div className="flex justify-between items-end">
                          <p className="text-sm font-black text-accent-blue italic">{formatCurrency(m.amount)}</p>
                          {m.status !== 'PAID' && (
                             <button
                                onClick={() => updateMilestone(m.id, 'PAID')}
                                className="text-[9px] font-black italic bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-lg hover:bg-accent-blue hover:text-white transition-all uppercase"
                             >
                                {t('finance.btn_mark_paid')}
                             </button>
                          )}
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-8 text-[10px] text-text-secondary font-bold italic opacity-40">
                       — {t('finance.no_milestones')} —
                    </div>
                 )}
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-700 to-accent-blue rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group border border-white/10 scale-100 hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                 <TrendingUp className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 space-y-6">
                 <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 italic">{t('finance.total_managed')}</h4>
                    <p className="text-4xl font-black italic tracking-tighter">{projects.length}</p>
                 </div>
                 <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className="h-full bg-white opacity-90 animate-shimmer" style={{ width: projects.length > 0 ? '100%' : '0%' }}></div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed">{t('finance.sync_msg')}</p>
              </div>
           </div>
        </div>
      </div>

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

export default FinanceDashboard;
