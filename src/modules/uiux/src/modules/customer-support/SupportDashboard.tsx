import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Loader2,
  Lock
} from 'lucide-react';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import { api } from '../../api';

const SupportDashboard: React.FC = () => {
  const userStr = getCookie('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;
  const isClient = role === Role.CLIENT;
  const isStaff = role === Role.CEO || role === Role.PM || role === Role.SALE;

  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Modal State cho Quotation
  const [quotationTicket, setQuotationTicket] = useState<any | null>(null);
  const [quotationForm, setQuotationForm] = useState({ title: '', amount: '5000' });
  const [newTicket, setNewTicket] = useState({ 
    clientId: isClient ? user?.id : '', 
    subject: '', 
    priority: 'Trung bình',
    type: 'Lỗi kỹ thuật hệ thống'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, clientRes] = await Promise.all([
        api.get('/support/tickets/me'), // Use user context in backend
        api.post('/iam/user/list', { role: Role.CLIENT })
      ]);
      setTickets(Array.isArray(ticketRes) ? ticketRes : []);
      setClients(Array.isArray(clientRes) ? clientRes : []);
    } catch (err) {
      console.error('Fetch support data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleCreateTicket = async () => {
    try {
      await api.post('/support/tickets', {
        clientId: isClient ? user?.id : newTicket.clientId,
        title: newTicket.subject,
        priority: newTicket.priority,
        type: newTicket.type
      });
      setIsSuccess(true);
      fetchData();
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSuccess(false);
        setNewTicket({ clientId: isClient ? user?.id : '', subject: '', priority: 'Trung bình', type: 'Lỗi kỹ thuật hệ thống' });
      }, 1500);
    } catch (err) {
      alert('Lỗi khi gửi yêu cầu hỗ trợ.');
    }
  };

  const handleCategorize = async (id: string, type: 'BUG' | 'CHANGE_REQUEST') => {
    try {
      setIsUpdating(id);
      await api.patch(`/support/tickets/${id}/categorize`, { type });
      await fetchData();
    } catch (err) {
      alert('Lỗi khi phân loại ticket.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleOpenQuotationModal = (ticket: any) => {
    setQuotationTicket(ticket);
    setQuotationForm({ title: `CR: ${ticket.title}`, amount: '5000' });
  };

  const handleCreateQuotation = async () => {
    const { title, amount } = quotationForm;
    if (!amount || isNaN(Number(amount))) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    try {
      setIsUpdating(quotationTicket.id);
      await api.post('/sales/quotations', {
        title,
        totalAmount: Number(amount),
        ticketId: quotationTicket.id,
        branchId: user?.branchId || quotationTicket.clientId, 
        clientId: quotationTicket.clientId,
      });
      alert('Đã tạo báo giá thành công. Vui lòng vào Tab Báo giá để chờ duyệt.');
      setQuotationTicket(null);
      await fetchData();
    } catch (err) {
      alert('Lỗi tạo báo giá.');
    } finally {
      setIsUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">
            {isClient ? 'Yêu cầu Hỗ trợ & Kỹ thuật' : 'Cổng hỗ trợ khách hàng (CRM)'}
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">
            {isClient ? 'Gửi yêu cầu hỗ trợ và theo dõi tiến độ xử lý trực tiếp.' : 'Quản lý Ticket, SLA và mức độ hài lòng của khách hàng trên toàn cầu.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isClient ? 'Gửi Ticket mới' : 'Tạo Ticket hộ khách'}</span>
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
                 {isClient ? 'Lịch sử yêu cầu của bạn' : 'Điều phối Ticket hỗ trợ'}
              </h3>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex-1 md:w-64 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-2 border border-border-primary shadow-inner">
                    <Search className="w-4 h-4 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder="Tìm tiêu đề, khách hàng..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-[11px] outline-none text-text-primary w-full font-bold italic" 
                    />
                 </div>
                 <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border-primary hover:border-accent-blue/30 shadow-sm active:scale-90"><Filter className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                 <div className="py-20 text-center text-xs font-black text-text-secondary uppercase italic opacity-40">Hệ thống chưa ghi nhận ticket nào phù hợp.</div>
              ) : (
                filteredTickets.map((t, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-bg-surface/40 rounded-3xl border border-border-primary hover:bg-bg-card hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                      t.priority === 'Cao' ? 'bg-status-red' : 
                      t.priority === 'Trung bình' ? 'bg-status-yellow' : 'bg-status-green'
                   }`}></div>
                   
                   <div className="flex flex-col items-start md:items-center gap-1 w-full md:w-24 shrink-0 md:pr-4 border-b md:border-b-0 md:border-r border-border-primary/50 pb-3 md:pb-0">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t.id?.slice(-8).toUpperCase() || `TK-${i}`}</span>
                      <span className="text-[9px] text-text-secondary font-black italic opacity-60 uppercase">{new Date(t.createdAt).toLocaleTimeString()}</span>
                   </div>

                   <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors font-sans italic tracking-tight uppercase leading-relaxed">
                        {t.ticketType === 'CHANGE_REQUEST' && t.status === 'PENDING_QUOTATION' && (
                          <Lock className="w-3.5 h-3.5 inline mr-1 text-status-yellow mb-1" />
                        )}
                        {t.title}
                      </h4>
                      <p className="text-[10px] text-text-secondary font-black flex items-center gap-1.5 italic uppercase opacity-70">
                         <User className="w-3.5 h-3.5" /> 
                         {isClient ? 'Trạng thái xử lý' : `Khách hàng: ${t.clientName || 'Internal'}`} • Loại: {t.ticketType || t.type}
                      </p>
                   </div>

                   <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/50">
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border text-center ${
                           t.status === 'Khẩn cấp' ? 'bg-status-red/10 text-status-red border-status-red/20 animate-pulse' :
                           t.status === 'PENDING_QUOTATION' || t.status === 'PENDING' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner' :
                           t.status === 'CLOSED' || t.status === 'RESOLVED' ? 'bg-bg-surface text-text-secondary border-border-primary/50 opacity-40' :
                           'bg-status-yellow/10 text-status-yellow border-status-yellow/20'
                        }`}>
                           {t.status}
                        </div>
                        {isStaff && t.ticketType === 'CHANGE_REQUEST' && t.status === 'PENDING_QUOTATION' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenQuotationModal(t); }}
                            disabled={isUpdating === t.id}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border text-center transition-all shadow-inner ${isUpdating === t.id ? 'opacity-50' : 'bg-status-green/10 text-status-green border-status-green/20 hover:bg-status-green hover:text-white'}`}
                          >
                            Tạo Báo giá
                          </button>
                        )}
                        {isStaff && t.status === 'OPEN' && (
                          <select 
                            className={`bg-bg-surface border border-accent-blue/30 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1 outline-none text-text-primary shadow-inner ${isUpdating === t.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-blue'}`}
                            onChange={(e) => handleCategorize(t.id, e.target.value as 'BUG' | 'CHANGE_REQUEST')}
                            defaultValue=""
                            disabled={isUpdating === t.id}
                          >
                            <option value="" disabled>Phân loại...</option>
                            <option value="BUG">Sửa lỗi (BUG)</option>
                            <option value="CHANGE_REQUEST">Yêu cầu mới (CR)</option>
                          </select>
                        )}
                      </div>
                      <button className="p-2.5 text-text-secondary hover:text-text-primary transition-all bg-bg-surface border border-border-primary rounded-xl group-hover:border-accent-blue/50 group-hover:shadow-lg active:scale-90">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                ))
              )}
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
        title={isClient ? "Gửi Yêu cầu Hỗ trợ mới" : "Tạo Ticket Hỗ trợ hộ Khách"}
      >
        <div className="space-y-8 p-4">
          {!isClient && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Chọn Khách hàng (Tạo hộ)</label>
              <select 
                value={newTicket.clientId}
                onChange={(e) => setNewTicket({...newTicket, clientId: e.target.value})}
                className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner"
              >
                <option value="">Chọn khách hàng...</option>
                {clients.map((c, i) => <option key={i} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
          )}
          
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
              <select 
                value={newTicket.priority}
                onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner"
              >
                <option>Thấp</option>
                <option>Trung bình</option>
                <option>Cao</option>
                <option>Khẩn cấp (SLA 30p)</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1">Phân loại hỗ trợ</label>
              <select 
                value={newTicket.type}
                onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic appearance-none cursor-pointer focus:border-accent-blue transition-all shadow-inner"
              >
                <option>Lỗi kỹ thuật hệ thống</option>
                <option>Yêu cầu tính năng mới</option>
                <option>Tư vấn Tài chính/Hợp đồng</option>
                <option>Hỗ trợ quy trình PKI</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleCreateTicket}
            disabled={isSuccess || !newTicket.subject || (!isClient && !newTicket.clientId)}
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
