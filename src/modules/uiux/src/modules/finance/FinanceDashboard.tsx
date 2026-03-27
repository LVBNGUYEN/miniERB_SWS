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
import { api } from '../../api';

const FinanceDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pnl, setPnl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pnlLoading, setPnlLoading] = useState(false);

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
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPnl = async (projectId: string) => {
    setPnlLoading(true);
    try {
      const res = await api.get(`/finance/pnl/${projectId}`);
      setPnl(res);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu P&L:', err);
      // Fallback mock check
      setPnl(null);
    } finally {
      setPnlLoading(false);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    if (pid) fetchPnl(pid);
  };

  const handleExport = () => {
    if (!pnl) {
      alert('Không có dữ liệu P&L để xuất báo cáo.');
      return;
    }

    const headers = ['Metric', 'Value'];
    const data = [
      ['Dự án', projects.find((p: any) => p.id === selectedProjectId)?.name || 'N/A'],
      ['Giá trị hợp đồng', pnl.contractAmount || 0],
      ['Tổng giờ công', pnl.totalApprovedHours || 0],
      ['Chi phí nhân sự thực tế', pnl.totalActualCost || 0],
      ['Lợi nhuận gộp thực tế', pnl.netProfit || 0],
      ['Biên lợi nhuận gộp (%)', `${Number(pnl.profitMarginPercent || 0).toFixed(2)}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Bao_cao_Tai_chinh.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const financialCards = [
    { label: 'Tổng doanh thu HĐ', value: pnl ? formatCurrency(pnl.contractAmount || 0) : '—', color: 'text-status-green', icon: ArrowUpRight },
    { label: 'Chi phí nhân sự thực tế', value: pnl ? formatCurrency(pnl.totalActualCost || 0) : '—', color: 'text-status-red', icon: ArrowDownRight },
    { label: 'Lợi nhuận ròng', value: pnl ? formatCurrency(pnl.netProfit || 0) : '—', color: 'text-accent-blue', icon: TrendingUp },
    { label: 'Biên lợi nhuận', value: pnl ? `${Number(pnl.profitMarginPercent || 0).toFixed(1)}%` : '—', color: 'text-status-yellow', icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-5 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20">Hóa đơn & Quyết toán tự động</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Quản lý dòng tiền và quy trình tài chính tự động hóa 100%.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-border-primary text-text-primary rounded-xl font-bold text-sm hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95 italic"
          >
            <Download className="w-4 h-4 text-text-secondary" />
            <span>Xuất báo cáo tài chính</span>
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
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic">Dự án phân tích:</label>
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
              <h3 className="text-lg font-bold text-text-primary italic uppercase tracking-tight">Chi tiết Profit & Loss (P&L)</h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-status-green shadow-[0_0_8px_rgba(22,163,74,0.4)]"></div>
                 <div className="w-2 h-2 rounded-full bg-status-yellow opacity-30"></div>
                 <div className="w-2 h-2 rounded-full bg-status-red opacity-30"></div>
              </div>
           </div>

           {pnl ? (
             <div className="space-y-4">
               {[
                 { label: 'Giá trị hợp đồng ký kết', value: formatCurrency(pnl.contractAmount || 0), type: 'main' },
                 { label: 'Tổng giờ công (Đã duyệt)', value: `${pnl.totalApprovedHours || 0} giờ`, type: 'sub' },
                 { label: 'Chi phí nhân lực nội bộ', value: formatCurrency(pnl.totalActualCost || 0), type: 'sub', color: 'text-status-red' },
                 { label: 'Lợi nhuận gộp thực tế', value: formatCurrency(pnl.netProfit || 0), type: 'impact', color: 'text-status-green' },
                 { label: 'Biên lợi nhuận gộp (%)', value: `${Number(pnl.profitMarginPercent || 0).toFixed(1)}%`, type: 'impact', color: 'text-accent-blue' },
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
               <p className="text-text-secondary font-bold text-sm italic">Hệ thống chưa tìm thấy dữ liệu tài chính cho dự án này.</p>
               <p className="text-[10px] text-text-secondary/50 font-medium mt-1">Vui lòng kiểm tra lại trạng thái hợp đồng.</p>
             </div>
           )}
        </div>

        {/* Side Cards */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 italic">
                 <Wallet className="w-4 h-4 text-accent-blue" />
                 Sức khỏe Dòng tiền
              </h3>
              <div className="h-48 w-full bg-bg-surface rounded-2xl border border-border-primary flex items-center justify-center p-6 relative overflow-hidden group hover:bg-bg-card transition-all shadow-inner">
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-status-green/5 to-transparent"></div>
                 <div className="text-center space-y-3 z-10">
                    <TrendingUp className="w-10 h-10 text-status-green mx-auto mb-2 opacity-50 group-hover:scale-110 transition-all" />
                    <p className="text-text-primary text-sm font-black italic">Dự báo dòng tiền dương</p>
                    <p className="text-[10px] text-text-secondary font-bold italic leading-relaxed px-4 underline decoration-accent-blue/10 underline-offset-2">Chênh lệch Phải thu/Phải trả được kiểm soát ở mức an toàn.</p>
                 </div>
              </div>
              <button className="w-full py-4 bg-bg-surface border border-border-primary text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm">Chi tiết kế hoạch chi</button>
           </div>

           <div className="bg-gradient-to-br from-indigo-700 to-accent-blue rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group border border-white/10 scale-100 hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                 <TrendingUp className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 space-y-6">
                 <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 italic">Tổng quy mô dự án quản trị</h4>
                    <p className="text-4xl font-black italic tracking-tighter">{projects.length}</p>
                 </div>
                 <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className="h-full bg-white opacity-90 animate-shimmer" style={{ width: projects.length > 0 ? '100%' : '0%' }}></div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed">Đồng bộ 100% với phân hệ quản trị dự án.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
