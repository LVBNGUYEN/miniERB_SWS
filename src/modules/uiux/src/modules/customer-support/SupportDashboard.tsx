import React, { useState, useEffect, useMemo } from 'react';
import TaskRequestFlow from '../projects/TaskRequestFlow';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

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
import { useTranslation } from 'react-i18next';

const SupportDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { alertConfig, showAlert, closeAlert } = useAlert();
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
  const [quotationTicket, setQuotationTicket] = useState<any | null>(null);
  const [quotationForm, setQuotationForm] = useState({ title: '', amount: '5000' });
  const [newTicket, setNewTicket] = useState({ 
    clientId: isClient ? user?.id : '', 
    subject: '', 
    priority: t('support.priority_medium'),
    type: t('support.type_tech')
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, clientRes] = await Promise.all([
        api.get('/support/tickets/me'),
        api.post('/iam/user/list', { role: Role.CLIENT })
      ]);
      setTickets(Array.isArray(ticketRes) ? ticketRes : []);
      setClients(Array.isArray(clientRes) ? clientRes : []);
    } catch (err) {
      console.error('Fetch support data error:', err);
      showAlert(t('common.error'), t('support.error_fetch'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
        setNewTicket({ 
          clientId: isClient ? user?.id : '', 
          subject: '', 
          priority: t('support.priority_medium'), 
          type: t('support.type_tech') 
        });
      }, 1500);
    } catch (err) {
      showAlert(t('common.error'), t('support.error_create'), 'error');
    }
  };

  const handleCategorize = async (id: string, type: 'BUG' | 'CHANGE_REQUEST') => {
    try {
      setIsUpdating(id);
      await api.patch(`/support/tickets/${id}/categorize`, { type });
      await fetchData();
      showAlert(t('common.success'), t('support.success_categorize'), 'success');
    } catch (err) {
      showAlert(t('common.error'), t('support.error_categorize'), 'error');
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
      showAlert(t('common.error'), t('finance.load_pnl_err'), 'error');
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
      showAlert(t('common.success'), t('quotation_manager.alert_success_save'), 'success');
      setQuotationTicket(null);
      await fetchData();
    } catch (err) {
      showAlert(t('common.error'), t('support.error_quote'), 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'URGENT' || s === 'KHẨN CẤP' || s === t('support.status_urgent').toUpperCase()) {
      return { label: t('support.status_urgent'), class: 'bg-status-red/10 text-status-red border-status-red/20 animate-pulse' };
    }
    if (s === 'PENDING_QUOTATION' || s === t('support.status_pending_quotation').toUpperCase()) {
      return { label: t('support.status_pending_quotation'), class: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner' };
    }
    if (s === 'PENDING' || s === t('support.status_pending').toUpperCase()) {
      return { label: t('support.status_pending'), class: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner' };
    }
    if (s === 'OPEN' || s === t('support.status_open').toUpperCase()) {
      return { label: t('support.status_open'), class: 'bg-status-yellow/10 text-status-yellow border-status-yellow/20' };
    }
    if (s === 'CLOSED' || s === t('support.status_closed').toUpperCase() || s === 'RESOLVED' || s === t('support.status_resolved').toUpperCase()) {
      return { label: s === 'CLOSED' || s === t('support.status_closed').toUpperCase() ? t('support.status_closed') : t('support.status_resolved'), class: 'bg-bg-surface text-text-secondary border-border-primary/50 opacity-40' };
    }
    return { label: status, class: 'bg-bg-surface text-text-secondary border-border-primary/50' };
  };

  const getPriorityColor = (priority: string) => {
    const p = priority?.toUpperCase();
    if (p === 'HIGH' || p === 'CAO' || p === 'URGENT' || p === 'KHẨN CẤP' || p === t('support.priority_high').toUpperCase() || p === t('support.priority_urgent').toUpperCase()) {
      return 'bg-status-red';
    }
    if (p === 'MEDIUM' || p === 'TRUNG BÌNH' || p === t('support.priority_medium').toUpperCase()) {
      return 'bg-status-yellow';
    }
    return 'bg-status-green';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const urgentTicketsCount = tickets.filter(t => (t.priority === 'HIGH' || t.priority === 'URGENT' || t.priority === 'CRITICAL')).length;
  const lateralStatus = t('support.status_urgent'); // Helper for matching
  const resolvedTicketsCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">
            {isClient ? t('support.title_client') : t('support.title_staff')}
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">
            {isClient ? t('support.subtitle_client') : t('support.subtitle_staff')}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isClient ? t('support.btn_new_client') : t('support.btn_new_staff')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t('support.stat_open'), value: openTicketsCount.toString(), detail: t('support.stat_urgent', { count: urgentTicketsCount }), icon: MessageSquare, color: 'text-accent-blue' },
          { label: t('support.stat_resp_time'), value: t('common.time_m', { count: 12 }), detail: t('support.stat_sla', { time: t('common.time_m', { count: 30 }) }), icon: Zap, color: 'text-status-green' },
          { label: t('support.stat_csat'), value: '98%', detail: t('support.stat_sample', { count: tickets.length > 0 ? (tickets.length * 12).toLocaleString() : '1,200' }), icon: Star, color: 'text-status-yellow' },
          { label: t('support.stat_resolved'), value: resolvedTicketsCount.toString(), detail: t('support.stat_trend', { percent: 12 }), icon: CheckCircle2, color: 'text-purple-400' },
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
                 {isClient ? t('support.repo_title_client') : t('support.repo_title_staff')}
              </h3>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex-1 md:w-64 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-2 border border-border-primary shadow-inner">
                    <Search className="w-4 h-4 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder={t('support.search_placeholder')}
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
                 <div className="py-20 text-center text-xs font-black text-text-secondary uppercase italic opacity-40">{t('support.no_tickets')}</div>
              ) : (
                filteredTickets.map((t_item, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-bg-surface/40 rounded-3xl border border-border-primary hover:bg-bg-card hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${getPriorityColor(t_item.priority)}`}></div>
                   
                   <div className="flex flex-col items-start md:items-center gap-1 w-full md:w-24 shrink-0 md:pr-4 border-b md:border-b-0 md:border-r border-border-primary/50 pb-3 md:pb-0">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t_item.id?.slice(-8).toUpperCase() || `${t('support.ticket_id')}-${i}`}</span>
                      <span className="text-[9px] text-text-secondary font-black italic opacity-60 uppercase">{new Date(t_item.createdAt).toLocaleTimeString()}</span>
                   </div>

                   <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors font-sans italic tracking-tight uppercase leading-relaxed">
                        {t_item.ticketType === 'CHANGE_REQUEST' && t_item.status === 'PENDING_QUOTATION' && (
                          <Lock className="w-3.5 h-3.5 inline mr-1 text-status-yellow mb-1" />
                        )}
                        {t_item.title || t_item.subject}
                      </h4>
                      <p className="text-[10px] text-text-secondary font-black flex items-center gap-1.5 italic uppercase opacity-70">
                         <User className="w-3.5 h-3.5" /> 
                         {isClient ? t('common.status') : `${t('sidebar.dashboard_client')}: ${t_item.clientName || 'Internal'}`} • {t('projects.detail')}: {t_item.ticketType || t_item.type}
                      </p>
                   </div>

                   <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/50">
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border text-center ${
                           t_item.status === 'Khẩn cấp' || t_item.status === t('support.status_urgent') ? 'bg-status-red/10 text-status-red border-status-red/20 animate-pulse' :
                           t_item.status === 'PENDING_QUOTATION' || t_item.status === 'PENDING' || t_item.status === t('support.status_pending') ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner' :
                           t_item.status === 'CLOSED' || t_item.status === 'RESOLVED' || t_item.status === t('support.status_closed') || t_item.status === t('support.status_resolved') ? 'bg-bg-surface text-text-secondary border-border-primary/50 opacity-40' :
                           'bg-status-yellow/10 text-status-yellow border-status-yellow/20'
                        }`}>
                           {t_item.status}
                        </div>
                        {isStaff && t_item.ticketType === 'CHANGE_REQUEST' && t_item.status === 'PENDING_QUOTATION' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenQuotationModal(t_item); }}
                            disabled={isUpdating === t_item.id}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border text-center transition-all shadow-inner ${isUpdating === t_item.id ? 'opacity-50' : 'bg-status-green/10 text-status-green border-status-green/20 hover:bg-status-green hover:text-white'}`}
                          >
                            {t('support.btn_quote')}
                          </button>
                        )}
                        {isStaff && t_item.status === 'OPEN' && (
                          <select 
                            className={`bg-bg-surface border border-accent-blue/30 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1 outline-none text-text-primary shadow-inner ${isUpdating === t_item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-blue'}`}
                            onChange={(e) => handleCategorize(t_item.id, e.target.value as 'BUG' | 'CHANGE_REQUEST')}
                            defaultValue=""
                            disabled={isUpdating === t_item.id}
                          >
                            <option value="" disabled>{t('support.categorize_placeholder')}</option>
                            <option value="BUG">{t('support.type_bug')}</option>
                            <option value="CHANGE_REQUEST">{t('support.type_cr')}</option>
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

           <button 
            onClick={() => showAlert(t('common.info'), t('support.report_alert'), 'info')}
            className="w-full py-4 bg-bg-surface text-text-secondary hover:text-accent-blue rounded-2xl font-black text-[10px] transition-all border border-border-primary shadow-xl hover:shadow-2xl active:scale-[0.98] uppercase tracking-[0.3em] italic ring-4 ring-transparent hover:ring-accent-blue/5"
           >
             {t('support.btn_report')}
           </button>
           </div>
        </div>

        {/* Customer Interaction Summary */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic underline decoration-accent-blue/20 underline-offset-4">
                 <History className="w-4 h-4 text-accent-blue" />
                 {t('support.recent_title')}
              </h3>
              <div className="space-y-6">
                 {[
                   { icon: PhoneCall, user: t('support.recent_interaction_1_user'), desc: t('support.recent_interaction_1_desc'), time: '11:15' },
                   { icon: Mail, user: t('support.recent_interaction_2_user'), desc: t('support.recent_interaction_2_desc'), time: '10:45' },
                   { icon: MessageSquare, user: t('support.recent_interaction_3_user'), desc: t('support.recent_interaction_3_desc'), time: '09:30' },
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
              <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-30 italic mt-4 tracking-widest">{t('support.sync_crm')}</p>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-accent-blue rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group border border-white/10 scale-100 hover:scale-[1.02] transition-all duration-500">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-[1500ms]">
                 <Zap className="w-48 h-48 text-white" />
              </div>
              <div className="space-y-3 relative z-10">
                 <h4 className="text-lg font-black text-white italic uppercase tracking-tight underline decoration-white/20 underline-offset-8">{t('support.ai_router_title')}</h4>
                 <p className="text-[10px] text-blue-50/70 font-black leading-relaxed italic uppercase tracking-wider py-4">{t('support.ai_router_desc')}</p>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                 <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest italic">
                    <span>{t('support.router_accuracy')}</span>
                    <span className="text-white brightness-125">94%</span>
                 </div>
                 <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ width: '94%' }}></div>
                 </div>
              </div>
              <button 
                onClick={() => showAlert(t('common.info'), t('support.ai_config_alert'), 'info')}
                className="w-full py-4 mt-8 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-[10px] font-black hover:bg-white hover:text-indigo-700 transition-all shadow-xl uppercase relative z-10 tracking-[0.2em] italic active:scale-95"
              >
                {t('support.ai_config_btn')}
              </button>
           </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isClient ? t('support.modal_new_title_client') : t('support.modal_new_title_staff')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleCreateTicket}
              disabled={isSuccess || !newTicket.subject || (!isClient && !newTicket.clientId)}
              className={`flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                isSuccess 
                ? 'bg-status-green text-white' 
                : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20 disabled:opacity-30'
              }`}
            >
              {isSuccess ? <Check className="w-4 h-4" /> : null}
              {isSuccess ? t('support.success_msg') : t('support.btn_submit')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {!isClient && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('support.label_client')}</label>
              <select 
                value={newTicket.clientId}
                onChange={(e) => setNewTicket({...newTicket, clientId: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic appearance-none cursor-pointer focus:border-accent-blue transition-all"
              >
                <option value="">{t('support.client_placeholder')}</option>
                {clients.map((c_item, i) => <option key={i} value={c_item.id}>{c_item.fullName}</option>)}
              </select>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('support.label_subject')}</label>
            <input 
              type="text" 
              placeholder={t('support.subject_placeholder')}
              className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic focus:border-accent-blue transition-all"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('support.label_priority')}</label>
              <select 
                value={newTicket.priority}
                onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic cursor-pointer focus:border-accent-blue transition-all"
              >
                <option value={t('support.priority_low')}>{t('support.priority_low')}</option>
                <option value={t('support.priority_medium')}>{t('support.priority_medium')}</option>
                <option value={t('support.priority_high')}>{t('support.priority_high')}</option>
                <option value={t('support.priority_urgent')}>{t('support.priority_urgent')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('support.label_type')}</label>
              <select 
                value={newTicket.type}
                onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic cursor-pointer focus:border-accent-blue transition-all"
              >
                <option value={t('support.type_tech')}>{t('support.type_tech')}</option>
                <option value={t('support.type_feature')}>{t('support.type_feature')}</option>
                <option value={t('support.type_consult')}>{t('support.type_consult')}</option>
                <option value={t('support.type_pki')}>{t('support.type_pki')}</option>
              </select>
            </div>
          </div>
          <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-40 italic tracking-widest">{t('support.email_hint')}</p>
        </div>
      </Modal>

      {/* Quotation Modal for CR Flow */}
      <Modal
        isOpen={!!quotationTicket}
        onClose={() => setQuotationTicket(null)}
        title={t('support.btn_quote')}
        footer={
          <div className="flex items-center gap-3 w-full">
             <button 
              onClick={() => setQuotationTicket(null)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleCreateQuotation}
              disabled={isUpdating === quotationTicket?.id}
              className={`flex-[2] py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isUpdating === quotationTicket?.id ? 'bg-gray-500' : 'bg-status-green hover:bg-green-600'}`}
            >
              {isUpdating === quotationTicket?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('support.btn_quote')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/10">
            <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1 italic">Ticket Reference</p>
            <p className="text-sm font-black text-text-primary italic">#{quotationTicket?.id?.slice(-8).toUpperCase()} - {quotationTicket?.title}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('quotation_manager.description_label')}</label>
            <input 
              type="text" 
              value={quotationForm.title}
              onChange={(e) => setQuotationForm({ ...quotationForm, title: e.target.value })}
              className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:border-accent-blue outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('quotation_manager.estimated_value_label')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={quotationForm.amount}
                onChange={(e) => setQuotationForm({ ...quotationForm, amount: e.target.value })}
                className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:border-accent-blue outline-none transition-all pl-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xs">VNĐ</span>
            </div>
          </div>
        </div>
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

export default SupportDashboard;
