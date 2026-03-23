import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Eye, 
  Plus, 
  Search, 
  Filter, 
  Briefcase,
  DollarSign,
  Loader2
} from 'lucide-react';
import { api } from '../../api';

import Modal from '../../components/Modal';

const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalValue: 0,
    activeCount: 0,
    expiringCount: 5,
    draftCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, statsRes] = await Promise.allSettled([
        api.get('/sales/contracts'),
        api.get('/sales/contracts/stats')
      ]);

      if (contractsRes.status === 'fulfilled') {
        setContracts(Array.isArray(contractsRes.value) ? contractsRes.value : []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error('Fetch contract data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleDownload = (contract: any) => {
    // Mock PDF Download process
    console.log('Initiating download for:', contract.contractNumber);
    const mockContent = `AMIT ERP CONTRACT\nNumber: ${contract.contractNumber}\nHash: ${contract.documentHash}\nValue: ${contract.quotation?.totalAmount}`;
    const blob = new Blob([mockContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contractNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleView = (contract: any) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    alert('Chức năng "Tạo Hợp đồng" yêu cầu quyền SalesAdmin. \nĐang chuyển hướng đến quy trình Báo giá...');
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Chi Tiết Hợp Đồng Pháp Lý"
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Mã Hợp Đồng</p>
                <p className="text-lg font-bold text-white">{selectedContract.contractNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Trạng Thái PKI</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-status-green" />
                  <span className="text-sm font-bold text-status-green uppercase tracking-widest">{selectedContract.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Nội Dung Dự Án</p>
              <p className="text-md font-bold text-white italic">{selectedContract.quotation?.title}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Khách Hàng</p>
              <p className="text-md font-bold text-accent-blue underline decoration-white/10">{selectedContract.quotation?.client?.fullName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Giá Trị Hợp Đồng</p>
              <p className="text-2xl font-black text-status-green font-mono">{formatCurrency(selectedContract.quotation?.totalAmount || 0)}</p>
            </div>

            <div className="p-4 bg-bg-surface/50 rounded-2xl border border-white/5 space-y-3">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3 h-3 text-accent-blue" />
                PKI Signature Verification Hash
              </p>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-white/50 break-all leading-relaxed">
                {selectedContract.documentHash}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Quản lý Danh mục Hợp đồng</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Lưu trữ, gia hạn và theo dõi giá trị hợp đồng trên toàn hệ thống.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hợp đồng</span>
          </button>
        </div>
      </div>

      {/* Contract Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tổng giá trị', value: formatCurrency(stats.totalValue), trend: '+0%', icon: DollarSign, color: 'text-status-green' },
          { label: 'Sắp hết hạn', value: String(stats.expiringCount).padStart(2, '0'), trend: 'Cần chú ý', icon: AlertCircle, color: 'text-status-yellow' },
          { label: 'Đang hiệu lực', value: String(stats.activeCount).padStart(2, '0'), trend: 'Hệ thống PKI', icon: CheckCircle2, color: 'text-accent-blue' },
          { label: 'Đang soạn thảo', value: String(stats.draftCount).padStart(2, '0'), trend: 'Sales Pipeline', icon: FileText, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card p-6 rounded-2xl border border-slate-700/50 group hover:border-slate-500 transition-all shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <stat.icon className="w-16 h-16" />
             </div>
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">{stat.label}</p>
             <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-black text-white">{stat.value}</h3>
                <span className={`text-[10px] font-bold ${stat.color} italic hidden lg:inline`}>{stat.trend}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Contract Feed */}
        <div className="xl:col-span-2 bg-bg-card rounded-2xl border border-slate-700/50 p-8 space-y-6 shadow-xl">
           <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Briefcase className="w-5 h-5 text-accent-blue" />
                 Danh mục Hợp đồng chiến lược
              </h3>
              <div className="flex gap-2">
                 <div className="w-48 bg-bg-surface rounded-lg px-3 py-1.5 flex items-center gap-2 border border-slate-700/30 ring-1 ring-white/5">
                    <Search className="w-3.5 h-3.5 text-text-secondary" />
                    <input type="text" placeholder="Tìm hợp đồng..." className="bg-transparent text-[11px] outline-none text-white w-full" />
                 </div>
                 <button className="p-2 bg-slate-800 text-text-secondary hover:text-white rounded-lg transition-all border border-slate-700/50"><Filter className="w-4 h-4" /></button>
              </div>
           </div>

           {loading ? (
             <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-accent-blue animate-spin" /></div>
           ) : contracts.length === 0 ? (
             <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-slate-700/50">
               <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-20" />
               <p className="text-sm font-bold text-slate-600 italic">Chưa có hợp đồng nào được ký kết.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {contracts.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-5 bg-bg-surface/50 rounded-2xl border border-slate-700/20 hover:border-white/10 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-accent-blue/10 group-hover:text-accent-blue transition-all">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors italic">{c.quotation?.title}</h4>
                         <p className="text-[10px] text-text-secondary font-medium tracking-wide">
                            Mã HĐ: <span className="text-accent-blue font-bold">{c.contractNumber}</span> • 
                            Khách hàng: <span className="text-white font-bold">{c.quotation?.client?.fullName}</span>
                         </p>
                         <p className="text-[10px] text-text-secondary font-medium tracking-wide">
                            Giá trị: <span className="text-status-green font-bold">{formatCurrency(c.quotation?.totalAmount || 0)}</span>
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-8 pr-2">
                      <div className="text-right hidden md:block">
                         <p className="text-[10px] text-text-secondary font-black uppercase tracking-tight opacity-60">Trạng thái PKI</p>
                         <p className="text-xs font-bold text-white tracking-widest">{c.status}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                         c.status === 'VERIFIED' ? 'bg-status-green/10 text-status-green border border-status-green/20' :
                         'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                      }`}>
                         {c.status}
                      </span>
                      <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => handleView(c)}
                          className="p-2 text-slate-500 hover:text-white transition-all bg-bg-surface/50 rounded-lg" title="Xem Chi Tiết"
                         >
                          <Eye className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={() => handleDownload(c)}
                          className="p-2 text-slate-500 hover:text-white transition-all bg-bg-surface/50 rounded-lg" title="Tải PDF"
                         >
                          <Download className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
               ))}
             </div>
           )}
        </div>

        {/* Renewal & Forecasting Side */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-2xl border border-slate-700/50 p-6 space-y-6 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-accent-blue" />
                 Lịch gia hạn sắp tới
              </h3>
              <div className="space-y-4">
                 {[
                   { name: 'Tokyo Tech Stage 2', date: '01/04', color: 'border-l-accent-blue' },
                   { name: 'Viettel Maintenance', date: '31/03', color: 'border-l-status-red' },
                   { name: 'FPT AI Upgrade', date: '15/04', color: 'border-l-status-green' },
                 ].map((rem, i) => (
                   <div key={i} className={`p-4 bg-bg-surface/40 hover:bg-bg-surface rounded-xl transition-all group cursor-pointer border-l-4 ${rem.color} border border-slate-700/30`}>
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-bold text-white">{rem.name}</p>
                         <span className="text-[10px] font-mono text-text-secondary">{rem.date}</span>
                      </div>
                      <p className="text-[9px] text-text-secondary font-medium mt-1 italic">Gửi thông báo gia hạn trước 15 ngày.</p>
                   </div>
                 ))}
              </div>
              <button className="w-full py-2.5 bg-slate-700 text-white rounded-xl font-bold text-xs hover:bg-slate-600 transition-all">Xem tất cả lịch nhắc</button>
           </div>

           <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white text-center space-y-4 shadow-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-white/10 transition-all"></div>
              <TrendingUp className="w-10 h-10 text-accent-blue mx-auto opacity-70 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-black italic">Sales Pipeline Forecast</h4>
              <p className="text-[10px] text-indigo-200/50 font-bold leading-relaxed tracking-wide px-4">Dự kiến ký kết mới 03 hợp đồng trong tháng 04 với tổng giá trị tiềm năng <span className="text-white font-black italic">$1.2M</span>.</p>
              <button className="w-full py-2.5 bg-accent-blue text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">XEM PHỄU BÁN HÀNG</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDashboard;
