import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertCircle, 
  Bot, 
  Download, 
  Plus, 
  ChevronRight,
  PieChart,
  Target,
  Rocket,
  ShieldCheck,
  Check,
  Loader2,
  Clock,
  AlertTriangle,
  FileText,
  Key,
  Inbox
} from 'lucide-react';
import { Role } from '../../../../iam/entities/role.enum';
import Modal from '../../components/Modal';
import { api } from '../../api';

interface ExecutiveDashboardProps {
  userName: string;
  role?: string;
  projects?: any[];
  alerts?: any[];
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ userName, role, projects: initialProjects, alerts: initialAlerts }) => {
  const [modals, setModals] = useState({ export: false, ai: false, newProject: false, pki: false, contract: false, evalTicket: false });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for dynamic list update
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);

  const handleSendManualAlert = async (projectId: string) => {
    try {
      await api.post(`/alerts/${projectId}/manual-alert`, { message: "" });
      alert("Hệ thống: Đã gửi cảnh báo ngân sách tới bộ phận PM!");
    } catch (err) {
      console.error('Send alert error:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Projects
        const data = await api.post('/projects/list', {});
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            name: p.name,
            status: p.status === 'COMPLETED' ? '100%' : (p.taskCount > 0 ? `${Math.round((p.tasks?.filter((t: any) => t.status === 'DONE').length / p.taskCount) * 100)}%` : '10%'),
            color: p.status === 'COMPLETED' ? 'bg-status-green' : 'bg-accent-blue',
            value: Number(p.totalAmount) || 0,
            estimatedHours: p.totalEstimatedHours || 0,
            id: p.id
          }));
          setLocalProjects(mapped);
        }

        // PMs
        const pmData = await api.get('/iam/pm-list');
        if (Array.isArray(pmData)) {
          setPms(pmData);
        }

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayProjects = localProjects;

  const formatCurrency = (val: number) => {
     return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const confirmExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Project,Progress,Value,EstimatedHours\n"
      + displayProjects.map(p => `${p.name},${p.status},${p.value},${p.estimatedHours}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "CEO_Executive_Report.csv");
    document.body.appendChild(link);
    link.click();
    setModals({...modals, export: false});
  };

  // Form states
  const [newProjName, setNewProjName] = useState('');
  const [newProjValue, setNewProjValue] = useState('');

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post('/projects/create', {
        name: newProjName,
        totalAmount: parseInt(newProjValue) || 100000000,
        status: 'INIT'
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        setModals({...modals, newProject: false});
        setIsSuccess(false);
        setNewProjName('');
        setNewProjValue('');
        // Refresh project list
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert('Lỗi khi tạo dự án');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kpis = [
    { label: 'Doanh thu Dự kiến', value: formatCurrency(displayProjects.reduce((sum, p) => sum + p.value, 0)), icon: TrendingUp, detail: '+24% so với quý trước' },
    { label: 'Cơ hội (Leads)', value: '18 Cơ hội', icon: Target, detail: '5 leads giá trị cao (>500M)' },
    { label: 'Dự án đang chạy', value: `${displayProjects.length} Dự án`, icon: Rocket, detail: `${displayProjects.filter(p => p.status !== '100%').length} dự án đang thực thi` },
    { label: 'Tổng TG Dự kiến', value: `${displayProjects.reduce((sum, p) => sum + p.estimatedHours, 0)} Giờ`, icon: Clock, detail: 'Tối ưu nhân sự kỹ thuật' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      {/* Export Modal */}
      <Modal isOpen={modals.export} onClose={() => setModals({...modals, export: false})} title="Xác nhận Xuất Báo Cáo">
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-secondary leading-relaxed font-medium italic">Hệ thống sẽ tổng hợp danh sách <span className="text-text-primary font-black italic underline decoration-accent-blue">{displayProjects.length} dự án</span> chiến lược & hiệu suất Pipeline Sale.</p>
          <button onClick={confirmExport} className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">TẢI PHÂN TÍCH CSV</button>
        </div>
      </Modal>

      {/* AI Copilot Modal */}
      <Modal isOpen={modals.ai} onClose={() => setModals({...modals, ai: false})} title="Executive AI Copilot">
        <div className="space-y-6">
          <div className="p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/20">
            <p className="text-xs font-bold text-accent-blue uppercase tracking-widest mb-1 italic underline">Dự báo rủi ro 24h</p>
            <p className="text-sm text-text-primary leading-relaxed font-semibold italic">"Tôi phát hiện dự án <span className="text-accent-blue font-extrabold italic underline">Mobile Banking V2</span> đang có xu hướng vượt ngân sách 15% so với kế hoạch quý 1. Bạn có muốn tôi đề xuất điều chỉnh nhân sự?"</p>
          </div>
          <div className="space-y-3">
             <div className="flex justify-end">
                <div className="p-3 bg-bg-surface rounded-2xl rounded-tr-none text-sm text-text-primary font-bold border border-border-primary italic">Phân tích rủi ro Pipeline?</div>
             </div>
             <div className="flex justify-start">
                <div className="p-3 bg-accent-blue text-white rounded-2xl rounded-tl-none text-sm font-medium shadow-lg shadow-blue-500/10 italic">Pipeline hiện tại có 3 dự án đang ở giai đoạn chốt hợp đồng, tổng giá trị ước tính 2.4 tỷ VND. Xác suất thành công trung bình là 75%.</div>
             </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Hỏi AI về chiến lược hoặc rủi ro..." 
              className="flex-1 p-4 bg-bg-surface border border-border-primary rounded-xl text-sm focus:ring-2 focus:ring-accent-blue outline-none text-text-primary font-bold placeholder:italic"
            />
            <button className="px-6 bg-accent-blue text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20">Gửi</button>
          </div>
        </div>
      </Modal>

      {/* Project Creation Modal for SALE / PM */}
      <Modal isOpen={modals.newProject} onClose={() => setModals({...modals, newProject: false})} title={role === Role.PM ? "Thiết lập dự án hiện hữu" : "Khởi tạo Dự án / Lead mới"}>
        <form onSubmit={handleCreateProjectSubmit} className="space-y-6">
          {role === Role.PM ? (
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Chọn Dự án (Đang có sẵn)</label>
              <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all">
                {localProjects.length === 0 ? (
                  <option>— Đang tải danh sách dự án —</option>
                ) : (
                  localProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Tên Dự án / Client</label>
              <input 
                required 
                type="text" 
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="VD: AMIT Corporate Branding Lead..." 
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold italic" 
              />
            </div>
          )}

          <div className={`grid ${role === Role.PM ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
             <div className="space-y-2">
               <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">
                 {role === Role.PM ? 'Thời gian dự kiến (Giờ)' : 'Giá trị Deal (VND)'}
               </label>
               <input 
                 required 
                 type="number" 
                 value={newProjValue}
                 onChange={(e) => setNewProjValue(e.target.value)}
                 placeholder={role === Role.PM ? "160" : "500000000"} 
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold" 
               />
             </div>
             
             {role !== Role.PM && (
               <div className="space-y-2">
                 <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Xác suất (Probability)</label>
                 <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic">
                   <option>25% - Prospect</option>
                   <option>50% - Negotiation</option>
                   <option>75% - ProposalSent</option>
                   <option>90% - Contracting</option>
                 </select>
               </div>
             )}
          </div>

          {role !== Role.PM && (
             <div className="space-y-2">
               <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Chủ nhiệm dự án (PM)</label>
               <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all">
                 {pms.length === 0 ? (
                   <option>— Đang tải danh sách PM —</option>
                 ) : (
                   pms.map((pm: any) => (
                     <option key={pm.id} value={pm.id}>{pm.fullName} ({pm.email})</option>
                   ))
                  )}
               </select>
             </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
              isSuccess 
              ? 'bg-status-green text-white shadow-status-green/20' 
              : 'bg-accent-blue text-white hover:bg-blue-600 active:scale-95 shadow-blue-500/20'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSuccess ? (
              <><Check className="w-6 h-6 animate-bounce" /> <span>Hệ thống đã cập nhật!</span></>
            ) : (
              role === Role.PM ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN KHỞI TẠO'
            )}
          </button>
        </form>
      </Modal>

      {/* PKI Signature Modal */}
      <Modal isOpen={modals.pki} onClose={() => setModals({...modals, pki: false})} title="Cổng Ký Số Phê Duyệt (PKI Gateway)">
        <div className="space-y-6">
          <div className="p-4 bg-bg-surface rounded-2xl border-l-4 border-accent-blue shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary opacity-70 italic mb-1">Tài liệu cần trình ký</p>
              <p className="text-sm font-black text-text-primary italic">Hợp đồng: AMIT Corporate Branding Lead_v2</p>
            </div>
            <span className="px-3 py-1 bg-status-yellow/10 text-status-yellow text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-status-yellow/20 italic">Chờ Ký Số</span>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Chứng thư số (CA / Token)</label>
             <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-accent-blue transition-all italic">
                <option>CA: RSA-4096 (Cấp bởi VNPT CA)</option>
                <option>Token: USB Viettel CA_v3</option>
             </select>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Mã PIN Khóa (Private Key)</label>
             <div className="relative group">
               <input 
                 type="password" 
                 placeholder="••••••" 
                 className="w-full p-4 pr-12 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black text-center tracking-[1em] focus:border-accent-blue transition-all shadow-inner" 
               />
               <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-blue opacity-50 group-focus-within:opacity-100 transition-all" />
             </div>
          </div>

          <button 
            onClick={() => {
              setIsSubmitting(true);
              setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); setTimeout(() => { setModals({...modals, pki: false}); setIsSuccess(false); }, 1500); }, 1000);
            }}
            disabled={isSubmitting || isSuccess}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-xl border border-white/10 ${
              isSuccess 
              ? 'bg-status-green text-white shadow-status-green/20' 
              : 'bg-accent-blue text-white hover:bg-blue-600 active:scale-95 shadow-blue-500/20'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSuccess ? (
              <><Check className="w-6 h-6 animate-bounce shadow-xl" /> <span className="underline decoration-white/20">Đã Ký Số Thành Công!</span></>
            ) : (
              'XÁC THỰC KÝ SỐ'
            )}
          </button>
        </div>
      </Modal>

      {/* Contract & Pricing Modal */}
      <Modal isOpen={modals.contract} onClose={() => setModals({...modals, contract: false})} title="Lập Báo Giá Chiến Lược (Sales Gateway)">
        <div className="space-y-6">
          <div className="flex gap-4 p-4 bg-status-yellow/10 rounded-2xl border border-status-yellow/20 items-center">
             <div className="p-3 bg-status-yellow/20 rounded-xl">
               <Target className="w-8 h-8 text-status-yellow shrink-0" />
             </div>
             <div>
                <p className="text-[10px] font-black text-status-yellow uppercase tracking-[0.2em] italic mb-1">Dữ liệu Kỹ thuật từ PM</p>
                <p className="text-xs text-text-primary font-bold italic leading-relaxed">Ticket Hệ thống V2 cần <span className="text-accent-blue underline font-black">120 Giờ</span> công thực thi. Đề xuất Rate sàn: <span className="text-accent-blue underline font-black">200K/Giờ</span>.</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-70 ml-1">Nguồn Lực Tối Thiểu</label>
               <input type="text" value="120 Giờ" readOnly className="w-full p-4 bg-bg-surface/50 border border-border-primary rounded-xl text-text-secondary font-black opacity-80 cursor-not-allowed italic" />
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Tỷ suất Giá Bán (VND/h)</label>
               <input type="number" placeholder="500000" defaultValue="500000" className="w-full p-4 bg-bg-surface border-2 border-accent-blue/40 rounded-xl text-text-primary font-black shadow-inner focus:border-accent-blue outline-none transition-all italic" />
             </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-bg-surface to-accent-blue/5 rounded-2xl border-l-4 border-status-green shadow-xl border border-border-primary">
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-2 italic">Tổng giá trị Đề Xuất Cuối (Gross)</p>
             <p className="text-3xl font-black text-status-green italic">60.000.000 VND</p>
             <div className="mt-4 pt-4 border-t border-border-primary/50 flex justify-between">
                <p className="text-[9px] text-text-primary italic font-bold opacity-60">+ Thuế VAT 10%</p>
                <p className="text-[9px] text-accent-blue italic font-black uppercase tracking-widest">+ Biên LN kỳ vọng: 150%</p>
             </div>
          </div>

          <button 
            onClick={() => {
              setIsSubmitting(true);
              setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); setTimeout(() => { setModals({...modals, contract: false}); setIsSuccess(false); }, 1500); }, 1000);
            }}
            disabled={isSubmitting || isSuccess}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl italic border border-white/10 ${
              isSuccess 
              ? 'bg-status-green text-white shadow-status-green/20' 
              : 'bg-status-yellow text-white hover:bg-yellow-600 active:scale-95 shadow-yellow-500/20'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSuccess ? (
              <><Check className="w-6 h-6 animate-bounce shadow-xl" /> <span className="underline decoration-white/20">Hợp đồng đã trình Client!</span></>
            ) : (
              'CHỐT GIÁ & PHÁT HÀNH BÁO GIÁ'
            )}
          </button>
        </div>
      </Modal>

      {/* Evaluate Ticket Modal for PM */}
      <Modal isOpen={modals.evalTicket} onClose={() => setModals({...modals, evalTicket: false})} title="Đánh giá Ticket Kỹ Thuật (PM Review)">
        <div className="space-y-6">
          <div className="p-4 bg-bg-surface rounded-2xl border-l-4 border-purple-500 shadow-inner flex flex-col gap-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary opacity-70 italic">Client Request: TOKYO-TICKET-092</p>
            <p className="text-sm font-black text-text-primary italic">Khách hàng yêu cầu: Bổ sung module Xuất Báo cáo CSV/Excel.</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 italic">Client Tag: Lỗi (Bug)</span>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Đánh giá Lại Phân Loại (PM Quyết Định)</label>
             <select className="w-full p-4 bg-bg-surface border-2 border-purple-500/40 rounded-2xl text-text-primary outline-none font-bold appearance-none cursor-pointer focus:border-purple-500 transition-all italic shadow-inner">
                <option value="feature">Đây là Tính Năng Mới (Feature - Cần Charge Phí)</option>
                <option value="bug">Đúng là Sửa Lỗi (Bug - Miễn Phí)</option>
             </select>
             <p className="text-[9px] text-text-secondary italic ml-2">Sale sẽ dùng phân loại này để báo giá với Client.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Ước tính (Giờ)</label>
               <input type="number" placeholder="40" defaultValue="40" className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary font-black shadow-inner focus:border-accent-blue outline-none transition-all italic" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Gán Nhân Sự Trực Tiếp</label>
               <select className="w-full h-[58px] px-3 bg-bg-surface border border-border-primary rounded-xl text-text-primary font-black shadow-inner focus:border-accent-blue outline-none transition-all italic">
                 <option>Để trống (Giao sau)</option>
                 <option>Nguyễn Văn Dev</option>
                 <option>Trần Thị Tester</option>
               </select>
             </div>
          </div>

          <button 
            onClick={() => {
              setIsSubmitting(true);
              setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); setTimeout(() => { setModals({...modals, evalTicket: false}); setIsSuccess(false); }, 1500); }, 1000);
            }}
            disabled={isSubmitting || isSuccess}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl italic border border-white/10 ${
              isSuccess 
              ? 'bg-purple-600 text-white shadow-purple-600/20' 
              : 'bg-bg-surface text-purple-500 border-purple-500/30 hover:bg-purple-500/10 active:scale-95 shadow-purple-500/10'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSuccess ? (
              <><Check className="w-6 h-6 animate-bounce shadow-xl" /> <span className="underline decoration-purple-500/50">Đã cập nhật Ticket!</span></>
            ) : (
              'CHUYỂN TICKET SANG CHO SALES'
            )}
          </button>
        </div>
      </Modal>

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-accent-blue text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg shadow-blue-500/20">Executive Gateway</span>
            <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase italic underline decoration-accent-blue/20">Tài khoản Quản trị, {userName}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1 tracking-wide">Phân tích đa chiều về tài chính, dự án và nhân sự chiến lược.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0 items-center">
          <button 
            onClick={() => setModals({...modals, export: true})}
            className="flex items-center gap-2 px-4 py-2 bg-bg-card text-text-primary rounded-xl border border-border-primary font-bold text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-lg active:scale-95 italic uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất BC</span>
          </button>
          
          <button 
            onClick={() => setModals({...modals, pki: true})}
            className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-accent-blue rounded-xl border border-accent-blue/30 font-black text-[10px] hover:bg-accent-blue/10 transition-all shadow-lg shadow-blue-500/10 active:scale-95 uppercase tracking-[0.2em] italic"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ký PKI</span>
          </button>

          {role === Role.PM && (
            <button 
              onClick={() => setModals({...modals, evalTicket: true})}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-500/30 font-black text-[10px] hover:bg-purple-600/20 transition-all shadow-lg shadow-purple-500/10 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <Inbox className="w-4 h-4" />
              <span>Duyệt Ticket</span>
            </button>
          )}

          {role === Role.SALE && (
            <button 
              onClick={() => setModals({...modals, contract: true})}
              className="flex items-center gap-2 px-4 py-2 bg-status-yellow text-white rounded-xl border border-white/10 font-black text-[10px] shadow-xl shadow-yellow-500/20 transition-all hover:bg-yellow-600 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <FileText className="w-4 h-4" />
              <span>Chốt Báo Giá</span>
            </button>
          )}

          {(role === Role.SALE || role === Role.CEO || role === Role.PM) && (
            <button 
              onClick={() => setModals({...modals, newProject: true})}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl border border-white/10 font-black text-[10px] shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <Plus className="w-4 h-4" />
              <span>{role === Role.PM ? 'Khởi Tạo' : 'Dự án mới'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="bg-bg-card p-6 rounded-2xl border border-border-primary relative overflow-hidden group shadow-lg shadow-blue-900/10 hover:border-accent-blue transition-all cursor-pointer hover:bg-bg-surface"
          >
            <div className={`p-4 rounded-xl bg-bg-surface text-accent-blue mb-4 w-fit border border-border-primary group-hover:scale-110 transition-transform group-hover:bg-accent-blue/10 shadow-inner`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
            <p className="text-2xl font-black text-text-primary italic">{kpi.value}</p>
            <p className="text-[10px] text-text-secondary mt-2 font-bold italic group-hover:text-accent-blue transition-colors">{kpi.detail}</p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue opacity-5 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-all duration-700"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6 shadow-xl relative overflow-hidden hover:border-accent-blue/40 transition-all">
          <div className="flex items-center justify-between border-b border-border-primary pb-6">
             <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight italic">Danh mục Dự án Chiến lược</h3>
             <ChevronRight className="w-5 h-5 text-text-secondary hover:text-accent-blue cursor-pointer transition-all hover:translate-x-1" />
          </div>
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
              </div>
            ) : displayProjects.length === 0 ? (
              <div className="text-center py-10 text-text-secondary font-bold italic">Chưa có dự án nào được ghi nhận.</div>
            ) : displayProjects.map((p, i) => (
              <div key={i} className="space-y-2 group cursor-pointer">
                <div className="flex justify-between items-center group-hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors underline decoration-transparent group-hover:decoration-accent-blue italic">
                      {p.name}
                      <span className="text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity font-mono ml-2">({p.estimatedHours} Giờ)</span>
                    </span>
                    {p.isAlerted80 && (
                      <span className="p-1 px-2 rounded-lg bg-status-red/10 text-status-red text-[8px] font-black uppercase tracking-tighter animate-pulse border border-status-red/20">
                        Auto: Ngân sách &gt; 80%
                      </span>
                    )}
                    {(role === Role.SALE || role === Role.CEO) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSendManualAlert(p.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-status-red/5 text-status-red hover:bg-status-red/20 transition-all border border-status-red/10 flex items-center gap-1.5 shadow-sm"
                        title="Gửi cảnh báo ngân sách thủ công"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[8px] font-extrabold uppercase tracking-tight">Cảnh báo PM</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-text-secondary italic">{p.status} Bàn giao</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                  <div 
                    className={`h-full ${p.color} transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]`} 
                    style={{ width: p.status }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-text-secondary opacity-60 uppercase tracking-widest">
                   <span>Giá trị: {formatCurrency(p.value)}</span>
                   <span>TG Dự kiến: {p.estimatedHours} Giờ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-bg-card rounded-2xl p-8 border border-border-primary space-y-6 relative overflow-hidden group shadow-xl">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <ShieldCheck className="w-32 h-32 text-accent-blue" />
             </div>
             <div className="relative z-10 space-y-4">
                <Bot className="w-10 h-10 text-accent-blue" />
                <h4 className="text-xl font-black text-text-primary italic">Hỏi AI Executive</h4>
                <p className="text-sm text-text-secondary leading-relaxed font-bold italic">
                   Phân tích rủi ro, tối ưu hóa nguồn lực và đề xuất chiến lược phát triển từ dữ liệu ERP thời gian thực.
                </p>
                <button 
                  onClick={() => setModals({...modals, ai: true})}
                  className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-xl tracking-widest hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest"
                >
                  BẮT ĐẦU NGAY
                </button>
             </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-8 border border-border-primary space-y-4 shadow-xl hover:border-status-red/30 transition-all group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-status-red/10 rounded-xl flex items-center justify-center text-status-red group-hover:scale-110 transition-transform">
                   <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-status-red uppercase tracking-widest italic underline decoration-status-red/20 underline-offset-4">Cảnh báo Quan trọng</h4>
             </div>
             <p className="text-[11px] text-text-secondary font-medium leading-relaxed italic border-l-2 border-status-red/30 pl-3">
                Dự án <span className="text-text-primary font-black italic cursor-pointer hover:underline underline-offset-2">Tokyo Tech</span> có dấu hiệu trễ Milestone 3 do thiếu hụt nhân sự Backend cấp cao.
             </p>
             <button className="w-full py-2.5 bg-bg-surface text-text-primary text-[10px] font-black uppercase tracking-widest border border-border-primary rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95">ĐIỀU PHỐI NGAY</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
