import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, TrendingUp, Bot, FileText, CheckCircle2, Plus, Download, Check, ShieldCheck, Zap, Key, Loader2, X } from 'lucide-react';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';

interface ClientDashboardProps {
  userName: string;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ userName }) => {
  const { t, i18n } = useTranslation();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReportId, setAiReportId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<any[]>([]);

  const { alertConfig, showAlert, closeAlert } = useAlert();

  // Form State cho Yêu cầu mới
  const [requestType, setRequestType] = useState('INIT_PROJECT');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const getContractStatusInfo = (status: string) => {
    if (status === 'VERIFIED' || status === 'Đang hoạt động' || status === t('client_dashboard.status_active')) {
      return { label: t('client_dashboard.status_active'), class: 'bg-status-green/10 text-status-green border-status-green/20' };
    }
    return { label: t('client_dashboard.status_pending_sign'), class: 'bg-status-yellow/10 text-status-yellow border-status-yellow/20' };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchContracts(), fetchInvoices(), fetchQuotations()]);
    setLoading(false);
  };

  const fetchContracts = async () => {
    try {
      const data = await api.get('/sales/contracts');
      if (Array.isArray(data)) {
        setContracts(data.map((c: any) => ({
          id: c.id,
          title: c.quotation?.title || `${t('sales.contract')} ${c.contractNumber}`,
          date: new Date(c.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN'),
          amount: Number(c.quotation?.totalAmount) || 0,
          status: c.status === 'VERIFIED' ? t('client_dashboard.status_active') : t('client_dashboard.status_pending_sign'),
          contractNumber: c.contractNumber,
          projectId: c.projectId
        })));
      }
    } catch (err) {
      console.error('Fetch contracts error:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const projects = await api.get('/projects');
      const allInvoices: any[] = [];
      if (Array.isArray(projects)) {
        for (const p of projects) {
          const invs = await api.get(`/finance/invoices/${p.id}`);
          if (Array.isArray(invs)) allInvoices.push(...invs);
        }
      }
      setInvoices(allInvoices);
    } catch (err) {
      console.error('Fetch invoices error:', err);
    }
  };

  const fetchQuotations = async () => {
    try {
      const data = await api.get('/sales/quotations');
      if (Array.isArray(data)) {
        setQuotations(data.filter((q: any) => q.status === 'PENDING'));
      }
    } catch (err) {
      console.error('Fetch quotations error:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCreateProject = async () => {
    if (!projectTitle || !projectDescription) {
      showAlert(t('common.info'), t('client_dashboard.input_required'), 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const userStr = getCookie('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const clientId = user?.id;

      if (!clientId) {
        showAlert(t('common.error'), t('client_dashboard.session_expired'), 'error');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        clientId: clientId,
        projectId: null,
        title: projectTitle,
        description: `[${requestType}] ${projectDescription}`
      };

      await api.post('/task-requests/propose', payload);
      setIsSuccess(true);
      setTimeout(() => {
        setIsProjectModalOpen(false);
        setIsSuccess(false);
        setProjectTitle('');
        setProjectDescription('');
        fetchData();
        showAlert(t('common.success'), t('client_dashboard.request_success'), 'success');
      }, 1000);
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('client_dashboard.request_error'), 'error');
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
            <span className="px-3 py-1 bg-accent-blue text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/20 italic border border-white/20">{t('client_dashboard.portal_badge')}</span>
            <span className="w-2 h-2 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20 underline-offset-8">{t('client_dashboard.welcome_title', { name: userName })}</h2>
          <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-accent-blue/10 underline underline-offset-4">{t('client_dashboard.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10 italic"
        >
          <Plus className="w-5 h-5" />
          <span>{t('client_dashboard.btn_submit_request')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t('client_dashboard.kpi_progress'), value: '78%', icon: TrendingUp, color: 'bg-accent-blue' },
          { label: t('client_dashboard.kpi_pending_quotations'), value: quotations.length.toString(), icon: Zap, color: 'bg-status-yellow' },
          { label: t('client_dashboard.kpi_pending_contracts'), value: contracts.filter(c => c.status === t('client_dashboard.status_pending_sign')).length.toString(), icon: FileText, color: 'bg-indigo-500' },
          { label: t('client_dashboard.kpi_outstanding_balance'), value: formatCurrency(invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + Number(i.totalAmount), 0)), icon: ShieldCheck, color: 'bg-status-red' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-3xl border border-border-primary relative overflow-hidden group shadow-xl hover:border-accent-blue/40 transition-all hover:shadow-blue-500/5">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
               <kpi.icon className={`w-16 h-16 ${kpi.color.replace('bg-', 'text-')}`} />
            </div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4 italic leading-relaxed">{kpi.label}</p>
            <p className="text-2xl font-black text-text-primary italic tracking-tighter uppercase">{kpi.value}</p>
            <div className="mt-4 h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
               <div className={`h-full ${kpi.color} shadow-[0_0_15px_rgba(59,130,246,0.4)]`} style={{ width: '78%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between border-b border-border-primary pb-6">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10 underline-offset-4">
                 <FileText className="w-6 h-6 text-accent-blue" />
                 {t('client_dashboard.history_title')}
              </h3>
              <p onClick={fetchData} className="text-[10px] font-black text-accent-blue underline tracking-widest cursor-pointer hover:text-blue-700 transition-all decoration-accent-blue/40 italic uppercase">{loading ? t('common.loading') : t('client_dashboard.refresh_data')}</p>
           </div>
           <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>
              ) : (
                <div className="space-y-8">
                  {/* Báo giá Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic mb-2">{t('client_dashboard.quotation_section')} ({quotations.length})</p>
                    {quotations.length === 0 ? (
                      <div className="text-center py-6 opacity-40 italic font-black text-[10px] uppercase text-text-secondary border border-dashed border-border-primary rounded-2xl">{t('client_dashboard.no_quotations')}</div>
                    ) : (
                      quotations.map((q, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-bg-surface/30 rounded-3xl border border-border-primary group hover:border-status-yellow/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg">
                            <div className="space-y-2">
                              <p className="text-sm font-black text-text-primary uppercase tracking-tight italic">{q.title}</p>
                              <p className="text-[10px] text-text-secondary font-black italic uppercase tracking-widest opacity-60">{t('client_dashboard.value')}: <span className="text-status-yellow font-black underline decoration-status-yellow/10">{formatCurrency(q.totalAmount)}</span></p>
                            </div>
                            <div className="flex items-center gap-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/40 w-full md:w-auto justify-between md:justify-end">
                              <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-[0.2em] border bg-status-yellow/10 text-status-yellow border-status-yellow/20">{t('client_dashboard.status_pending_sign')}</span>
                              <button 
                                onClick={() => window.location.href='/pki-gateway'}
                                className="px-6 py-2 bg-status-yellow text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:bg-yellow-600 transition-all active:scale-95 italic border border-white/10"
                              >
                                {t('client_dashboard.approve_btn')}
                              </button>
                            </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hợp đồng Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic mb-2">{t('client_dashboard.contract_legal')} ({contracts.length})</p>
                    {contracts.length === 0 ? (
                      <div className="text-center py-6 opacity-40 italic font-black text-[10px] uppercase text-text-secondary border border-dashed border-border-primary rounded-2xl">{t('client_dashboard.no_contracts')}</div>
                    ) : (
                      contracts.map((c, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-bg-surface/30 rounded-3xl border border-border-primary group hover:border-accent-blue/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg relative overflow-hidden">
                            <div className="space-y-2 relative z-10">
                              <p className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-all italic uppercase tracking-tight underline decoration-transparent group-hover:decoration-accent-blue underline-offset-4">{c.title}</p>
                              <p className="text-[10px] text-text-secondary font-black italic uppercase tracking-widest opacity-60">{t('client_dashboard.signed_date')}: {c.date} • {t('client_dashboard.value')}: <span className="text-text-primary font-black underline decoration-accent-blue/10 underline-offset-2">{formatCurrency(c.amount)}</span></p>
                            </div>
                            <div className="flex items-center gap-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/40 relative z-10 w-full md:w-auto justify-between md:justify-end">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-[0.2em] border ${
                                  getContractStatusInfo(c.status).class 
                              }`}>{c.status}</span>
                              <button 
                                onClick={() => setSelectedContract(c)}
                                className={`p-3 rounded-2xl border transition-all shadow-md group-hover:shadow-xl ${
                                  c.status === t('client_dashboard.status_pending_sign')
                                  ? 'bg-status-yellow text-white border-white/20'
                                  : 'bg-bg-surface text-text-secondary border-border-primary hover:text-accent-blue'
                                }`}
                              >
                                {c.status === t('client_dashboard.status_pending_sign') ? <ShieldCheck className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hóa đơn Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic mb-2">{t('client_dashboard.invoice_payment')} ({invoices.length})</p>
                    {invoices.length === 0 ? (
                      <div className="text-center py-6 opacity-40 italic font-black text-[10px] uppercase text-text-secondary border border-dashed border-border-primary rounded-2xl">{t('client_dashboard.no_invoices')}</div>
                    ) : (
                      invoices.map((inv, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-bg-surface/30 rounded-3xl border border-border-primary group hover:border-accent-blue/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg">
                            <div className="space-y-2">
                              <p className="text-sm font-black text-text-primary uppercase tracking-tight italic">{inv.invoiceNumber}</p>
                              <p className="text-[10px] text-text-secondary font-black italic uppercase tracking-widest opacity-60">{t('client_dashboard.due_date')}: {new Date(inv.dueDate).toLocaleDateString('vi-VN')} • {t('client_dashboard.total_amount')}: <span className="text-accent-blue font-black underline decoration-accent-blue/10">{formatCurrency(inv.totalAmount)}</span></p>
                            </div>
                            <div className="flex items-center gap-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/40 w-full md:w-auto justify-between md:justify-end">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-[0.2em] border ${
                                  inv.status === 'PAID' 
                                    ? 'bg-status-green/10 text-status-green border-status-green/20' 
                                    : 'bg-status-red/10 text-status-red border-status-red/20 animate-pulse'
                              }`}>{inv.status === 'PAID' ? t('client_dashboard.status_paid') : t('client_dashboard.status_unpaid')}</span>
                              <button 
                                onClick={() => setSelectedInvoice(inv)}
                                className={`p-3 rounded-2xl border transition-all shadow-md ${
                                  inv.status === 'UNPAID'
                                  ? 'bg-accent-blue text-white shadow-blue-500/20'
                                  : 'bg-bg-surface text-text-secondary border-border-primary'
                                }`}
                              >
                                {inv.status === 'UNPAID' ? <Zap className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
           </div>
           <p className="text-[9px] text-text-secondary font-black uppercase text-center italic opacity-30 mt-4 tracking-[0.4em]">{t('client_dashboard.security_hint')}</p>
        </div>

        <div className="bg-bg-card rounded-3xl p-8 border border-border-primary space-y-8 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
              <Bot className="w-64 h-64 text-accent-blue" />
           </div>
           <div className="space-y-6 relative z-10 flex-1">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-accent-blue/10 rounded-2xl border border-accent-blue/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="w-8 h-8 text-accent-blue shadow-xl" />
                 </div>
                 <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight underline decoration-accent-blue/20 underline-offset-8">{t('client_dashboard.ai_insights_title')}</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-bold italic pr-8 uppercase tracking-wide opacity-80 border-l-4 border-accent-blue/30 pl-4">
                 {aiReportId === 'done' 
                  ? t('client_dashboard.ai_report_ready')
                  : t('client_dashboard.ai_analyzing')
                 }
              </p>
           </div>
           <button 
            onClick={handleRequestAi}
            disabled={aiReportId === 'generating'}
            className="w-full mt-8 py-5 bg-accent-blue text-white rounded-3xl font-black text-[10px] shadow-2xl shadow-blue-900/40 tracking-[0.3em] hover:bg-blue-600 transition-all relative z-10 active:scale-95 disabled:opacity-50 italic border border-white/10 uppercase"
           >
             {aiReportId === 'generating' ? t('client_dashboard.ai_processing') : aiReportId === 'done' ? t('client_dashboard.ai_download_pdf') : t('client_dashboard.ai_activate')}
           </button>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-all duration-1000"></div>
        </div>
      </div>

      {/* Request New Project & Ticket Modal */}
      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        title={t('client_dashboard.gateway_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setIsProjectModalOpen(false)}
              className="flex-1 py-4 bg-bg-surface border border-border-primary text-text-secondary rounded-2xl font-black text-xs uppercase tracking-widest italic hover:bg-slate-700/10 transition-all"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleCreateProject}
              disabled={isSubmitting || isSuccess}
              className={`flex-[2] py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 uppercase tracking-widest italic border border-white/10 ${
                isSuccess 
                ? 'bg-status-green text-white' 
                : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSuccess ? (
                <><Check className="w-5 h-5" /> {t('client_dashboard.request_success')}</>
              ) : (
                t('client_dashboard.btn_send_request')
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6 p-4">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">{t('client_dashboard.label_request_type')}</label>
             <select 
               value={requestType}
               onChange={(e) => setRequestType(e.target.value)}
               className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none font-black italic focus:border-accent-blue transition-all shadow-inner appearance-none cursor-pointer"
             >
               <option value="INIT_PROJECT">{t('client_dashboard.opt_new_project')}</option>
               <option value="FEATURE">{t('client_dashboard.opt_feature')}</option>
               <option value="BUG">{t('client_dashboard.opt_bug')}</option>
             </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">{t('client_dashboard.label_proj_title')}</label>
            <input 
              type="text" 
              placeholder={t('client_dashboard.placeholder_proj_title')}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none italic font-black placeholder:italic placeholder:opacity-40 focus:border-accent-blue transition-all shadow-inner"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic ml-1 underline decoration-accent-blue/10">{t('client_dashboard.label_proj_desc')}</label>
            <textarea 
              placeholder={t('client_dashboard.placeholder_proj_desc')}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full h-40 p-5 bg-bg-surface border border-border-primary rounded-2xl text-text-primary outline-none italic font-bold focus:border-accent-blue transition-all shadow-inner leading-relaxed resize-none"
            ></textarea>
          </div>
          <p className="text-[10px] text-text-secondary font-black uppercase text-center italic opacity-40 mt-2 tracking-widest leading-loose">{t('client_dashboard.sync_hint')}</p>
        </div>
      </Modal>

      {/* Contract Detail Modal */}
      <Modal 
        isOpen={!!selectedContract} 
        onClose={() => setSelectedContract(null)} 
        title={t('client_dashboard.legal_finance_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setSelectedContract(null)}
              className="flex-1 py-3 bg-bg-surface border border-border-primary text-text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest italic"
            >
              {t('common.close')}
            </button>
            {selectedContract?.status !== t('client_dashboard.status_pending_sign') && (
              <button 
                onClick={() => showAlert(t('common.info'), t('client_dashboard.pdf_convert_alert'), 'info')}
                className="flex-1 py-3 bg-accent-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg border border-white/10 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> {t('common.download', { defaultValue: 'Tải về' })}
              </button>
            )}
          </div>
        }
      >
        {selectedContract && (
          <div className="space-y-8 p-4">
            <div className="p-8 bg-gradient-to-br from-indigo-700 to-accent-blue rounded-3xl flex justify-between items-center text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">{t('client_dashboard.pki_id_label')}</p>
                <h4 className="text-2xl font-black italic tracking-tighter uppercase">{selectedContract.contractNumber || selectedContract.id}</h4>
              </div>
              <Download 
                onClick={() => showAlert(t('common.info'), t('client_dashboard.pdf_convert_alert'), 'info')}
                className="w-10 h-10 opacity-40 group-hover:opacity-100 transition-all cursor-pointer relative z-10 hover:scale-125 hover:rotate-6 active:scale-90" 
              />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('client_dashboard.contract_name_label')}</span>
                <span className="text-sm font-black text-text-primary italic uppercase tracking-tight">{selectedContract.title}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('client_dashboard.settlement_value_label')}</span>
                <span className="text-md font-black text-accent-blue italic tracking-tighter underline decoration-accent-blue/10 underline-offset-4">{formatCurrency(selectedContract.amount)}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary group">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('client_dashboard.project_progress_label')}</span>
                <span className="text-sm font-black text-status-green italic flex items-center gap-2">{t('client_dashboard.progress_working')} <CheckCircle2 className="w-4 h-4 animate-bounce" /></span>
              </div>
            </div>
            {selectedContract.status === t('client_dashboard.status_pending_sign') && (
               <div className="bg-bg-surface p-6 rounded-3xl border border-border-primary shadow-2xl relative overflow-hidden group space-y-4">
                 <div className="space-y-3">
                   <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('client_dashboard.customer_pki_pin_label')}</label>
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
                          showAlert(t('common.success'), t('client_dashboard.auth_success'), 'success');
                        }, 1000);
                      } catch (err: any) {
                        showAlert(t('common.error'), err.response?.data?.message || t('client_dashboard.pki_error'), 'error');
                      } finally {
                        setIsSigning(false);
                      }
                   }}
                   disabled={isSigning || isSuccess}
                   className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-xl border border-white/10 ${
                     isSuccess 
                     ? 'bg-status-green text-white' 
                     : 'bg-status-yellow text-white hover:bg-yellow-600 active:scale-95 shadow-yellow-500/20'
                   }`}
                 >
                   {isSigning ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : isSuccess ? (
                     <Check className="w-5 h-5" />
                   ) : (
                     t('client_dashboard.pki_auth_btn')
                   )}
                 </button>
               </div>
            )}
          </div>
        )}
      </Modal>

      {/* Invoice Detail & Payment Modal */}
      <Modal 
        isOpen={!!selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
        title={t('client_dashboard.payment_settlement_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="flex-1 py-3 bg-bg-surface border border-border-primary text-text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest italic"
            >
              {t('common.close')}
            </button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-8 p-4">
            <div className="p-8 bg-gradient-to-br from-indigo-700 to-accent-blue rounded-3xl flex justify-between items-center text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">{t('client_dashboard.invoice_number_label')}</p>
                <h4 className="text-2xl font-black italic tracking-tighter uppercase">{selectedInvoice.invoiceNumber}</h4>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                <FileText className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('client_dashboard.invoice_status_label')}</span>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border italic uppercase tracking-widest ${
                  selectedInvoice.status === 'PAID' 
                  ? 'bg-status-green/10 text-status-green border-status-green/20' 
                  : 'bg-status-red/10 text-status-red border-status-red/20'
                }`}>
                  {selectedInvoice.status === 'PAID' ? t('client_dashboard.status_paid') : t('client_dashboard.status_unpaid')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">{t('client_dashboard.invoice_total_label')}</span>
                <span className="text-xl font-black text-accent-blue italic tracking-tighter underline decoration-accent-blue/10 underline-offset-4">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>

            {selectedInvoice.status !== 'PAID' ? (
              <div className="space-y-8">
                 <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border-primary rounded-3xl shadow-inner space-y-6">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('client_dashboard.qr_payment_hint')}</p>
                    <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-2xl border border-border-primary transform hover:scale-105 transition-all">
                       <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-2">
                          <Zap className="w-12 h-12 text-accent-blue animate-pulse" />
                          <p className="text-[10px] text-white font-black italic tracking-widest">{t('client_dashboard.qr_pay_label')}</p>
                       </div>
                    </div>
                    <p className="text-[9px] text-text-secondary italic font-bold uppercase tracking-widest">{t('client_dashboard.bank_info')}</p>
                 </div>

                 <div className="bg-bg-surface p-6 rounded-3xl border border-border-primary shadow-2xl space-y-4">
                   <div className="space-y-3">
                     <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('client_dashboard.pki_otp_label')}</label>
                     <div className="relative">
                       <input 
                         type="password" 
                         placeholder="••••••" 
                         className="w-full p-4 bg-bg-card border border-border-primary rounded-2xl text-text-primary outline-none font-black text-center tracking-[1em] focus:border-status-yellow transition-all" 
                       />
                       <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-status-yellow opacity-50" />
                     </div>
                   </div>

                   <button 
                     onClick={async () => {
                        setIsSigning(true);
                        try {
                          await api.post(`/finance/invoices/${selectedInvoice.id}/pay`, { 
                            amount: selectedInvoice.totalAmount,
                            reference: `PAY-${selectedInvoice.invoiceNumber}`,
                            signature: `PKI_SIG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
                          });
                          setIsSuccess(true);
                          setTimeout(() => { 
                            setIsSuccess(false); 
                            setSelectedInvoice(null); 
                            fetchInvoices();
                            showAlert(t('common.success'), t('client_dashboard.payment_complete'), 'success');
                          }, 1000);
                        } catch (err: any) {
                          showAlert(t('common.error'), err.response?.data?.message || t('client_dashboard.payment_error'), 'error');
                        } finally {
                          setIsSigning(false);
                        }
                     }}
                     disabled={isSigning || isSuccess}
                     className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-xl ${
                       isSuccess 
                       ? 'bg-status-green text-white' 
                       : 'bg-accent-blue text-white hover:bg-blue-600 active:scale-95 shadow-blue-500/20 shadow-xl border border-white/10'
                     }`}
                   >
                     {isSigning ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : isSuccess ? (
                       <Check className="w-5 h-5" />
                     ) : (
                       t('client_dashboard.confirm_pay_pki')
                     )}
                   </button>
                 </div>
              </div>
            ) : (
               <div className="p-8 bg-bg-surface border border-border-primary rounded-3xl text-center space-y-4 opacity-70 italic font-black uppercase tracking-widest text-[10px]">
                  <CheckCircle2 className="w-12 h-12 text-status-green mx-auto animate-bounce" />
                  <p>{t('client_dashboard.invoice_paid_hint')}</p>
                  <p className="text-[8px] opacity-40">Signature: {selectedInvoice.pkiPaymentSignature}</p>
               </div>
            )}
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

export default ClientDashboard;
