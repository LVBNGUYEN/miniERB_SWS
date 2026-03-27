import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, Bot, FileText, CheckCircle2, Plus, Download, Check, ShieldCheck, Zap, Key, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../api';

interface ClientDashboardProps {
  userName: string;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ userName }) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReportId, setAiReportId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/sales/contracts');
      if (Array.isArray(data)) {
        setContracts(data.map((c: any) => ({
          id: c.id,
          title: c.quotation?.title || `Hợp đồng ${c.contractNumber}`,
          date: new Date(c.createdAt).toLocaleDateString('vi-VN'),
          amount: Number(c.quotation?.totalAmount) || 0,
          status: c.status === 'VERIFIED' ? 'Đang hoạt động' : 'Chờ Ký Số',
          contractNumber: c.contractNumber
        })));
      }
    } catch (err) {
      console.error('Fetch contracts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCreateProject = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/customer-support/requests', {
        type: 'PROJECT_INIT',
        title: 'Yêu cầu Dự án mới từ Khách hàng',
        description: 'Khởi tạo từ Portal',
        priority: 'HIGH'
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsProjectModalOpen(false);
        setIsSuccess(false);
        fetchContracts();
      }, 1500);
    } catch (err) {
      alert('Lỗi khi gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAi = () => {
    setAiReportId('generating');
    setTimeout(() => {
      setAiReportId('done');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-accent-blue text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/20 italic border border-white/20">CỔNG ĐỐI TÁC CHIẾN LƯỢC</span>
            <span className="w-2 h-2 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20 underline-offset-8">Chào {userName}, Trung tâm Hợp tác Partners</h2>
          <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-accent-blue/10 underline underline-offset-4">Giám sát tiến độ, giá trị tài chính & báo cáo tương lai (AI Insights).</p>
        </div>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10 italic"
        >
          <Plus className="w-5 h-5" />
          <span>Gửi Yêu Cầu / Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tiến độ Tổng quát', value: '78%', icon: TrendingUp },
          { label: 'Dự án hoàn thành', value: '5', icon: CheckCircle2 },
          { label: 'Hợp đồng cần ký', value: contracts.filter(c => c.status === 'Chờ Ký Số').length.toString(), icon: FileText },
          { label: 'Hỗ trợ 24/7', value: 'ONLINE', icon: Zap },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-3xl border border-border-primary relative overflow-hidden group shadow-xl hover:border-accent-blue/40 transition-all hover:shadow-blue-500/5">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
               <kpi.icon className="w-16 h-16 text-accent-blue" />
            </div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4 italic leading-relaxed">{kpi.label}</p>
            <p className="text-2xl font-black text-text-primary italic tracking-tighter uppercase">{kpi.value}</p>
            <div className="mt-4 h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
               <div className="h-full bg-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.4)]" style={{ width: '78%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between border-b border-border-primary pb-6">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10 underline-offset-4">
                 <FileText className="w-6 h-6 text-accent-blue" />
                 Lịch sử Hợp đồng & Thanh toán
              </h3>
              <p onClick={fetchContracts} className="text-[10px] font-black text-accent-blue underline tracking-widest cursor-pointer hover:text-blue-700 transition-all decoration-accent-blue/40 italic uppercase">{loading ? 'ĐANG TẢI...' : 'LÀM MỚI DỮ LIỆU'}</p>
           </div>
           <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-10 opacity-40 italic font-black uppercase tracking-widest text-text-secondary">Chưa có hợp đồng nào được định danh</div>
              ) : (
                contracts.map((c, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-bg-surface/30 rounded-3xl border border-border-primary group hover:border-accent-blue/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg relative overflow-hidden">
                      <div className="space-y-2 relative z-10">
                        <p className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-all italic uppercase tracking-tight underline decoration-transparent group-hover:decoration-accent-blue underline-offset-4">{c.title}</p>
                        <p className="text-[10px] text-text-secondary font-black italic uppercase tracking-widest opacity-60">Ngày ký: {c.date} • Giá trị: <span className="text-text-primary font-black underline decoration-accent-blue/10 underline-offset-2">{formatCurrency(c.amount)}</span></p>
                      </div>
                      <div className="flex items-center gap-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/40 relative z-10 w-full md:w-auto justify-between md:justify-end">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-[0.2em] border ${
                            c.status === 'Đang hoạt động' 
                              ? 'bg-status-green/10 text-status-green border-status-green/20 shadow-inner' 
                              : 'bg-status-yellow/10 text-status-yellow border-status-yellow/20 animate-pulse'
                        }`}>{c.status}</span>
                        <button 
                          onClick={() => setSelectedContract(c)}
                          className={`p-3 rounded-2xl border transition-all active:scale-90 shadow-md group-hover:shadow-xl group-hover:scale-110 ${
                            c.status === 'Chờ Ký Số'
                            ? 'bg-status-yellow text-white border-white/20 hover:bg-yellow-600'
                            : 'bg-bg-surface text-text-secondary border-border-primary hover:text-accent-blue hover:border-accent-blue/30'
                          }`}
                        >
                          {c.status === 'Chờ Ký Số' ? <ShieldCheck className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                  </div>
                ))
              )}
           </div>
           <p className="text-[9px] text-text-secondary font-black uppercase text-center italic opacity-30 mt-4 tracking-[0.4em]">Đã mã hóa dữ liệu tài chính với CA/PKI.</p>
        </div>

        <div className="bg-bg-card rounded-3xl p-8 border border-border-primary space-y-8 relative overflow-hidden flex flex-col justify-between group shadow-2xl">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
              <Bot className="w-64 h-64 text-accent-blue" />
           </div>
           <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-accent-blue/10 rounded-2xl border border-accent-blue/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="w-8 h-8 text-accent-blue shadow-xl" />
                 </div>
                 <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight underline decoration-accent-blue/20 underline-offset-8">AI Strategic Insights</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-bold italic pr-8 uppercase tracking-wide opacity-80 border-l-4 border-accent-blue/30 pl-4">
                 {aiReportId === 'done' 
                  ? "Báo cáo Chiến lược 'Tokyo Tech Expansion Phase 2' đã sẵn sàng. Tải xuống để xem dự báo rủi ro & cơ hội tăng trưởng."
                  : "Đang phân tích các tác động tài chính & vận hành của các giai đoạn dự án tiếp theo dựa trên dữ liệu ERP thời gian thực."
                 }
              </p>
           </div>
           <button 
            onClick={handleRequestAi}
            disabled={aiReportId === 'generating'}
            className="w-full py-5 bg-accent-blue text-white rounded-3xl font-black text-[10px] shadow-2xl shadow-blue-900/40 tracking-[0.3em] hover:bg-blue-600 transition-all relative z-10 active:scale-95 disabled:opacity-50 italic border border-white/10 uppercase"
           >
             {aiReportId === 'generating' ? 'Hệ thống đang tổng hợp...' : aiReportId === 'done' ? 'TẢI BÁO CÁO (PDF)' : 'KÍCH HOẠT BÁO CÁO AI'}
           </button>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-all duration-1000"></div>
        </div>
      </div>

      {/* Request New Project & Ticket Modal */}
      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        title="Trung tâm Khởi tạo Yêu cầu (Gateway)"
      >
        <div className="space-y-8 p-4">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">Phân loại Yêu cầu</label>
             <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-3xl text-text-primary outline-none font-black italic focus:border-accent-blue transition-all shadow-inner appearance-none cursor-pointer">
               <option>Khởi tạo Dự án / Lead mới</option>
               <option>Ticket: Tính năng hệ thống mới (Feature - Cần Evaluate)</option>
               <option>Ticket: Sửa lỗi hệ thống (Bug - Miễn phí)</option>
             </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">Tên Dự án / Tiêu đề Ticket</label>
            <input 
              type="text" 
              placeholder="VD: Tokyo Tech Phase 3 Expansion..."
              className="w-full p-5 bg-bg-surface border border-border-primary rounded-3xl text-text-primary outline-none italic font-black placeholder:italic placeholder:opacity-40 focus:border-accent-blue transition-all shadow-inner"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">Mô tả yêu cầu sơ bộ (Milestones)</label>
            <textarea 
              placeholder="Nhập các yêu cầu kỹ thuật, nhân sự hoặc business mục tiêu chính..."
              className="w-full h-40 p-5 bg-bg-surface border border-border-primary rounded-3xl text-text-primary outline-none italic font-bold focus:border-accent-blue transition-all shadow-inner leading-relaxed resize-none"
            ></textarea>
          </div>
          <button 
            onClick={handleCreateProject}
            disabled={isSubmitting || isSuccess}
            className={`w-full py-5 rounded-full font-black text-md transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 uppercase tracking-[0.3em] italic border border-white/10 ${
              isSuccess 
              ? 'bg-status-green text-white scale-105' 
              : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20'
            }`}
          >
            {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : isSuccess ? <><Check className="w-7 h-7 animate-bounce shadow-xl" /> <span className="underline decoration-white/20">Đã gửi yêu cầu tới đội ngũ AMIT!</span></> : 'GỬI YÊU CẦU DỰ ÁN'}
          </button>
          <p className="text-[10px] text-text-secondary font-black uppercase text-center italic opacity-40 mt-2 tracking-widest leading-loose">Hệ thống sẽ đồng bộ với Pipeline của đội ngũ Sales chiến lược.</p>
        </div>
      </Modal>

      {/* Contract Detail Modal */}
      <Modal 
        isOpen={!!selectedContract} 
        onClose={() => setSelectedContract(null)} 
        title="Chi tiết Pháp lý & Tài chính"
      >
        {selectedContract && (
          <div className="space-y-8 p-4">
            <div className="p-8 bg-gradient-to-br from-indigo-700 to-accent-blue rounded-3xl flex justify-between items-center text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Mã định danh Hợp đồng (PKI ID)</p>
                <h4 className="text-2xl font-black italic tracking-tighter uppercase">{selectedContract.contractNumber || selectedContract.id}</h4>
              </div>
              <Download className="w-10 h-10 opacity-40 group-hover:opacity-100 transition-all cursor-pointer relative z-10 hover:scale-125 hover:rotate-6 active:scale-90" />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">Tên Hợp đồng</span>
                <span className="text-sm font-black text-text-primary italic uppercase tracking-tight">{selectedContract.title}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">Giá trị quyết toán thực tế</span>
                <span className="text-md font-black text-accent-blue italic tracking-tighter underline decoration-accent-blue/10 underline-offset-4">{formatCurrency(selectedContract.amount)}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary group">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">Tiến độ dự án</span>
                <span className="text-sm font-black text-status-green italic flex items-center gap-2">60% - Đang thực hiện <CheckCircle2 className="w-4 h-4 animate-bounce" /></span>
              </div>
            </div>
            {selectedContract.status === 'Chờ Ký Số' ? (
               <div className="bg-bg-surface p-6 rounded-3xl border border-border-primary shadow-2xl relative overflow-hidden group space-y-4">
                 <div className="space-y-3">
                   <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Mã PIN Khóa PKI Khách hàng</label>
                   <div className="relative group/input">
                     <input 
                       type="password" 
                       placeholder="••••••" 
                       className="w-full p-4 pr-12 bg-bg-card border border-border-primary rounded-2xl text-text-primary outline-none font-black text-center tracking-[1em] focus:border-status-yellow transition-all shadow-inner" 
                     />
                     <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-status-yellow opacity-50 group-focus-within/input:opacity-100 transition-all" />
                   </div>
                 </div>

                 <button 
                   onClick={async () => {
                      setIsSigning(true);
                      try {
                        await api.post('/pki/sign', { 
                          documentId: selectedContract.contractNumber || selectedContract.id,
                          documentContent: `Ký duyệt hợp đồng ${selectedContract.title}`
                        });
                        setIsSuccess(true);
                        setTimeout(() => { 
                          setIsSuccess(false); 
                          setSelectedContract(null); 
                          fetchContracts();
                        }, 1500);
                      } catch (err) {
                        alert('Lỗi khi xác thực PKI');
                      } finally {
                        setIsSigning(false);
                      }
                   }}
                   disabled={isSigning || isSuccess}
                   className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-xl border border-white/10 ${
                     isSuccess 
                     ? 'bg-status-green text-white shadow-status-green/20' 
                     : 'bg-status-yellow text-white hover:bg-yellow-600 active:scale-95 shadow-yellow-500/20'
                   }`}
                 >
                   {isSigning ? (
                     <Loader2 className="w-6 h-6 animate-spin" />
                   ) : isSuccess ? (
                     <><Check className="w-6 h-6 animate-bounce shadow-xl" /> <span className="underline decoration-white/20">Xác thực thành công!</span></>
                   ) : (
                     'XÁC THỰC KÝ SỐ PKI'
                   )}
                 </button>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="py-4 bg-bg-surface text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border-primary hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all active:scale-95 italic shadow-sm shadow-blue-900/5 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> XEM PKI SIG
                </button>
                <button className="py-4 bg-accent-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 italic border border-white/10 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> TẢI BẢN PDF
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientDashboard;
