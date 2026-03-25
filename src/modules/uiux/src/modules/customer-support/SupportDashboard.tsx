import React, { useState } from 'react';
import TaskRequestFlow from '../projects/TaskRequestFlow';
import Modal from '../../components/Modal';
import { 
  MessageSquare, 
  LifeBuoy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Star,
  Zap,
  PhoneCall,
  Mail,
  History,
  Check
} from 'lucide-react';

const SupportDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', priority: 'Trung bình' });

  const tickets = [
    { client: 'Tokyo Tech Solution', subject: 'Lỗi đồng bộ API Phase 2', priority: 'Cao', status: 'Đang xử lý', time: '10 phút trước', id: 'TK-2026-001' },
    { client: 'VNG Group', subject: 'Cần hướng dẫn PKI CA', priority: 'Trung bình', status: 'Mới mở', time: '1 giờ trước', id: 'TK-2026-002' },
    { client: 'Viettel', subject: 'Thanh toán hóa đơn trễ', priority: 'Cao', status: 'Khẩn cấp', time: '2 giờ trước', id: 'TK-2026-003' },
    { client: 'FPT Software', subject: 'Cài đặt môi trường UAT', priority: 'Thanh thấp', status: 'Đã đóng', time: 'Hôm qua', id: 'TK-2026-004' },
  ];

  const handleCreateTicket = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsSuccess(false);
      setNewTicket({ subject: '', priority: 'Trung bình' });
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">Cổng hỗ trợ khách hàng (CRM)</h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">Quản lý Ticket, SLA và mức độ hài lòng của khách hàng trên toàn cầu.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Ticket mới</span>
          </button>
        </div>
      </div>

      {/* Support KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Ticket Đang mở', value: '42', detail: '12 Khẩn cấp', icon: MessageSquare, color: 'text-accent-blue' },
          { label: 'Thời gian phản hồi', value: '15p', detail: 'SLA: 30p', icon: Zap, color: 'text-status-green' },
          { label: 'Tỷ lệ CSAT', value: '98%', detail: 'Mẫu 1,200', icon: Star, color: 'text-status-yellow' },
          { label: 'Đã giải quyết', value: '1.4k', detail: '+12% Tháng này', icon: CheckCircle2, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card p-6 rounded-3xl border border-border-primary flex items-center justify-between group hover:border-accent-blue transition-all shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <stat.icon className="w-16 h-16" />
             </div>
             <div className="space-y-2 relative z-10">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black text-text-primary italic tracking-tighter">{stat.value}</h3>
                   <span className="text-[10px] text-text-secondary font-black italic opacity-60 leading-relaxed uppercase">{stat.detail}</span>
                </div>
             </div>
             <div className={`p-4 rounded-2xl bg-bg-surface ${stat.color} group-hover:scale-110 transition-transform shadow-inner border border-border-primary ring-4 ring-white/5`}>
                <stat.icon className="w-6 h-6" />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
           <TaskRequestFlow />
           
           {/* Active Ticket Feed */}
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-primary">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10">
                 <LifeBuoy className="w-6 h-6 text-accent-blue" />
                 Điều phối Ticket hỗ trợ
              </h3>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex-1 md:w-64 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-2 border border-border-primary shadow-inner">
                    <Search className="w-4 h-4 text-text-secondary" />
                    <input type="text" placeholder="Tìm ID ticket, khách hàng..." className="bg-transparent text-[11px] outline-none text-text-primary w-full font-bold italic" />
                 </div>
                 <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border-primary hover:border-accent-blue/30 shadow-sm active:scale-90"><Filter className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="space-y-4">
              {tickets.map((t, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-bg-surface/40 rounded-3xl border border-border-primary hover:bg-bg-card hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                      t.priority === 'Cao' ? 'bg-status-red' : 
                      t.priority === 'Trung bình' ? 'bg-status-yellow' : 'bg-status-green'
                   }`}></div>
                   
                   <div className="flex flex-col items-start md:items-center gap-1 w-full md:w-24 shrink-0 md:pr-4 border-b md:border-b-0 md:border-r border-border-primary/50 pb-3 md:pb-0">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t.id}</span>
                      <span className="text-[9px] text-text-secondary font-black italic opacity-60 uppercase">{t.time}</span>
                   </div>

                   <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors font-sans italic tracking-tight uppercase leading-relaxed">{t.subject}</h4>
                      <p className="text-[10px] text-text-secondary font-black flex items-center gap-1.5 italic uppercase opacity-70">
                         <User className="w-3.5 h-3.5" /> Khách hàng: <span className="text-text-primary font-black decoration-accent-blue/30 underline">{t.client}</span> • Nhân sự phụ trách: Team A
                      </p>
                   </div>

                   <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/50">
                      <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border ${
                         t.status === 'Khẩn cấp' ? 'bg-status-red/10 text-status-red border-status-red/20 animate-pulse' :
                         t.status === 'Mới mở' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner' :
                         t.status === 'Đã đóng' ? 'bg-bg-surface text-text-secondary border-border-primary/50 opacity-40' :
                         'bg-status-yellow/10 text-status-yellow border-status-yellow/20'
                      }`}>
                         {t.status}
                      </div>
                      <button className="p-2.5 text-text-secondary hover:text-text-primary transition-all bg-bg-surface border border-border-primary rounded-xl group-hover:border-accent-blue/50 group-hover:shadow-lg active:scale-90">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>

           <button className="w-full py-4 bg-bg-surface text-text-secondary hover:text-accent-blue rounded-2xl font-black text-[10px] transition-all border border-border-primary shadow-xl hover:shadow-2xl active:scale-[0.98] uppercase tracking-[0.3em] italic ring-4 ring-transparent hover:ring-accent-blue/5">
             Truy xuất báo cáo Ticket lịch sử
           </button>
           </div>
        </div>

        {/* Customer Interaction Summary */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic underline decoration-accent-blue/20 underline-offset-4">
                 <History className="w-4 h-4 text-accent-blue" />
                 Tương tác gần đây
              </h3>
              <div className="space-y-6">
                 {[
                   { icon: PhoneCall, user: 'Tokyo Tech', desc: 'Cuộc gọi xác nhận UAT Giai đoạn 2', time: '11:15' },
                   { icon: Mail, user: 'VNG Group', desc: 'Email gửi chứng thư số PKI CA', time: '10:45' },
                   { icon: MessageSquare, user: 'Viettel', desc: 'Hỗ trợ trực tuyến module Tài chính', time: '09:30' },
                 ].map((act, i) => (
                   <div key={i} className="flex gap-5 p-4 bg-bg-surface/30 hover:bg-bg-surface rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-border-primary shadow-sm">
                      <div className="p-3 bg-bg-surface rounded-2xl group-hover:bg-accent-blue/10 group-hover:text-accent-blue transition-all border border-border-primary shadow-inner group-hover:scale-110">
                         <act.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                         <div className="flex justify-between items-center w-full">
                            <span className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">{act.user}</span>
                            <span className="text-[9px] text-text-secondary opacity-60 font-black italic mt-0.5">{act.time}</span>
                         </div>
                         <p className="text-[11px] text-text-secondary font-bold leading-relaxed italic opacity-80">{act.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-30 italic mt-4 tracking-widest">Đã đồng bộ với CRM Gateway</p>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-accent-blue rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group border border-white/10 scale-100 hover:scale-[1.02] transition-all duration-500">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-[1500ms]">
                 <Zap className="w-48 h-48 text-white" />
              </div>
              <div className="space-y-3 relative z-10">
                 <h4 className="text-lg font-black text-white italic uppercase tracking-tight underline decoration-white/20 underline-offset-8">AI Ticket Router</h4>
                 <p className="text-[10px] text-blue-50/70 font-black leading-relaxed italic uppercase tracking-wider py-4">Hệ thống AI đang tự động phân luồng Ticket cho đội ngũ hỗ trợ dựa trên kỹ năng & mức độ ưu tiên thời gian thực.</p>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                 <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest italic">
                    <span>Độ chính xác router</span>
                    <span className="text-white brightness-125">94%</span>
                 </div>
                 <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ width: '94%' }}></div>
                 </div>
              </div>
              <button className="w-full py-4 mt-8 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-[10px] font-black hover:bg-white hover:text-indigo-700 transition-all shadow-xl uppercase relative z-10 tracking-[0.2em] italic active:scale-95">Cấu hình Logic AI Agent</button>
           </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tạo Ticket Hỗ trợ mới"
      >
        <div className="space-y-8 p-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Chọn Khách hàng chiến lược</label>
            <select className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner">
              <option>Tokyo Tech Solution</option>
              <option>VNG Group</option>
              <option>Viettel</option>
              <option>FPT Software</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Tiêu đề yêu cầu</label>
            <input 
              type="text" 
              placeholder="VD: Không truy cập được module Hệ thống..."
              className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic focus:border-accent-blue transition-all shadow-inner"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Mức độ ưu tiên</label>
              <select className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner">
                <option>Thấp</option>
                <option>Trung bình</option>
                <option>Cao</option>
                <option>Khẩn cấp (SLA 30p)</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Phân loại hỗ trợ</label>
              <select className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner">
                <option>Lỗi kỹ thuật hệ thống</option>
                <option>Yêu cầu tính năng mới</option>
                <option>Tư vấn Tài chính/Hợp đồng</option>
                <option>Hỗ trợ quy trình PKI</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleCreateTicket}
            disabled={isSuccess || !newTicket.subject}
            className={`w-full py-5 rounded-3xl font-black text-md transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 uppercase tracking-[0.2em] italic ${
              isSuccess 
              ? 'bg-status-green text-white scale-105' 
              : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20 disabled:opacity-30 disabled:grayscale'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-6 h-6 animate-bounce" />
                <span>Ticket đã được ghi nhận!</span>
              </>
            ) : (
              <span>Xác nhận Gửi Ticket Hỗ trợ</span>
            )}
          </button>
          <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-40 italic mt-2">Hệ thống sẽ tự động gửi email thông báo tới bộ phận liên quan.</p>
        </div>
      </Modal>
    </div>
  );
};

export default SupportDashboard;
