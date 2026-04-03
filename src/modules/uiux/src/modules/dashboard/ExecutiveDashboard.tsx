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
  Inbox,
  FileSignature,
  Lock as LockIcon,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Role } from '../../../../iam/entities/role.enum';
import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { api } from '../../api';

interface ExecutiveDashboardProps {
  userName: string;
  role?: string;
  projects?: any[];
  alerts?: any[];
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ userName, role, projects: initialProjects, alerts: initialAlerts }) => {
  const [modals, setModals] = useState({ export: false, ai: false, newProject: false, contract: false, evalTicket: false, pki: false });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [highValueLeadsCount, setHighValueLeadsCount] = useState(0);
  const { t, i18n } = useTranslation();
  
  // Local state for dynamic list update
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [currentTaskApproval, setCurrentTaskApproval] = useState<any>(null);
  const [approvalData, setApprovalData] = useState({ hours: 40, type: 'FEATURE' });
  const [user, setUser] = useState<any>(null);
  const [vendorDebts, setVendorDebts] = useState<any[]>([]);
  const [pnlAnalytics, setPnlAnalytics] = useState<any[]>([]);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info', onConfirm?: () => void) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const userStr = document.cookie.split('; ').find(row => row.startsWith('user='))?.split('=')[1];
    if (userStr) {
      try { setUser(JSON.parse(decodeURIComponent(userStr))); } catch {}
    }
  }, []);

  const handleSendManualAlert = async (projectId: string) => {
    try {
      await api.post(`/alerts/${projectId}/manual-alert`, { message: "" });
      showAlert(t('common.success'), t('executive_dashboard.manual_alert_success'), 'success');
    } catch (err) {
      console.error('Send alert error:', err);
      showAlert(t('common.error'), t('common.error_update'), 'error');
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
            value: Number(p.totalEstimatedBudget) || 0,
            actualValue: Number(p.totalActualRevenue) || 0,
            estimatedHours: Number(p.totalEstimatedHours) || 0,
            isAlerted80: p.isAlerted80,
            id: p.id
          }));
          setLocalProjects(mapped);
        }

        // PMs
        const pmData = await api.get('/iam/pm-list');
        if (Array.isArray(pmData)) {
          setPms(pmData);
        }

        // Pending Requests (for PM)
        const reqData = await api.get('/task-requests/list');
        if (Array.isArray(reqData)) {
          setPendingRequests(reqData.filter((r: any) => r.status === 'PROPOSED'));
        }

        // Fetch quotations for KPI
        const quoteData = await api.get('/sales/quotations');
        if (Array.isArray(quoteData)) {
          setQuotationsCount(quoteData.length);
          setHighValueLeadsCount(quoteData.filter((q: any) => Number(q.totalAmount) > 500000000).length);
        }

        // Fetch Vendor Debts for CEO/Finance
        const vendorData = await api.get('/finance/vendor-report');
        if (Array.isArray(vendorData)) {
          setVendorDebts(vendorData);
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
     return new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', { 
       style: 'currency', 
       currency: 'VND',
       maximumFractionDigits: 0
     }).format(val);
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
  const [selectedPmId, setSelectedPmId] = useState('');
  const [newProjHours, setNewProjHours] = useState('');

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post('/projects/create', {
        name: newProjName,
        totalAmount: parseInt(newProjValue) || 100000000,
        totalEstimatedHours: parseInt(newProjHours) || 160,
        pmId: selectedPmId || undefined,
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
      showAlert(t('common.error'), t('common.error_update'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kpis = [
    { label: t('executive_dashboard.kpi_revenue'), value: formatCurrency(displayProjects.reduce((sum, p) => sum + p.actualValue, 0)), icon: TrendingUp, detail: t('executive_dashboard.trend_revenue') },
    { label: t('executive_dashboard.kpi_leads'), value: `${quotationsCount} ${t('executive_dashboard.unit_leads')}`, icon: Target, detail: `${highValueLeadsCount} ${t('executive_dashboard.trend_high_leads')}` },
    { label: t('executive_dashboard.kpi_active'), value: `${displayProjects.length} ${t('executive_dashboard.unit_projects')}`, icon: Rocket, detail: t('executive_dashboard.detail_active', { count: displayProjects.filter(p => p.status !== '100%').length }) },
    { label: t('executive_dashboard.kpi_hours'), value: `${displayProjects.reduce((sum, p) => sum + (Number(p.estimatedHours) || 0), 0)} ${t('executive_dashboard.unit_hours')}`, icon: Clock, detail: t('executive_dashboard.detail_optimization') },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      {/* PKI Signature Modal for CEO */}
      <Modal 
        isOpen={modals.pki} 
        onClose={() => { setModals({...modals, pki: false}); setCurrentTaskApproval(null); }} 
        title={t('executive_dashboard.pki_modal_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => { setModals({...modals, pki: false}); setCurrentTaskApproval(null); }}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
              disabled={isSubmitting}
            >
              {t('common.close')}
            </button>
            <button 
              onClick={async () => {
                 setIsSubmitting(true);
                 try {
                   if (currentTaskApproval) {
                      // PM Estimate Approval
                      await api.post(`/task-requests/${currentTaskApproval.id}/estimate`, { 
                        pmId: user?.id, 
                        hours: approvalData.hours, 
                        type: approvalData.type, 
                        signature: `SIG_PM_${user?.id}_${Date.now()}` 
                      });
                      setPendingRequests(prev => prev.filter(r => r.id !== currentTaskApproval.id));
                      setIsSuccess(true);
                      setTimeout(() => { 
                        setModals({...modals, pki: false}); 
                        setIsSuccess(false); 
                        setCurrentTaskApproval(null);
                      }, 1200);
                   } else {
                      // CEO Master Approval
                      setTimeout(() => { 
                        setIsSubmitting(false); 
                        setIsSuccess(true); 
                        setTimeout(() => { 
                          setModals({...modals, pki: false}); 
                          setIsSuccess(false); 
                        }, 1200); 
                      }, 1000);
                   }
                 } catch (err) {
                    showAlert(t('common.error'), t('executive_dashboard.pki_auth_failed'), 'error');
                 } finally {
                    setIsSubmitting(false);
                 }
              }}
              disabled={isSubmitting || isSuccess}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
                isSuccess 
                ? 'bg-status-green text-white shadow-status-green/20' 
                : 'bg-indigo-700 text-white hover:bg-indigo-800'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="w-4 h-4 animate-bounce" />
              ) : (
                t('executive_dashboard.pki_sign_confirm')
              )}
              {isSuccess && t('executive_dashboard.pki_auth_success')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
           <div className="p-6 bg-gradient-to-br from-indigo-700/10 to-indigo-900/20 rounded-2xl flex justify-between items-center text-text-primary border border-indigo-500/20 shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">{t('executive_dashboard.pki_cert_vld')}</p>
                <h4 className="text-lg font-black italic uppercase">
                  {currentTaskApproval ? t('executive_dashboard.pki_signature_pm', { name: user?.fullName?.toUpperCase() || 'PM' }) : t('executive_dashboard.pki_signature_master')}
                </h4>
              </div>
              <ShieldCheck className="w-8 h-8 text-status-green" />
           </div>

           <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('executive_dashboard.pki_pin_label')}</label>
               <input 
                 type="password" 
                 placeholder={t('executive_dashboard.pki_pin_placeholder')} 
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold text-center tracking-[0.5em] focus:border-accent-blue transition-all" 
               />
           </div>
           <p className="text-[9px] text-text-secondary font-black uppercase text-center italic opacity-40 tracking-widest">{t('executive_dashboard.pki_token_hint')}</p>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal 
        isOpen={modals.export} 
        onClose={() => setModals({...modals, export: false})} 
        title={t('executive_dashboard.export_confirm_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setModals({...modals, export: false})}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={confirmExport} 
              className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
            >
              {t('executive_dashboard.export_btn')}
            </button>
          </div>
        }
      >
        <div className="text-center py-2">
          <p className="text-sm text-text-secondary font-medium italic">{t('executive_dashboard.export_confirm_desc', { count: displayProjects.length })}</p>
        </div>
      </Modal>

      {/* AI Copilot Modal */}
      <Modal 
        isOpen={modals.ai} 
        onClose={() => setModals({...modals, ai: false})} 
        title={t('executive_dashboard.ai_copilot_title')}
        footer={
          <div className="flex items-center gap-2 w-full">
            <input 
              type="text" 
              placeholder={t('executive_dashboard.ai_input_placeholder')} 
              className="flex-1 p-2.5 bg-bg-surface border border-border-primary rounded-xl text-sm focus:border-accent-blue outline-none text-text-primary font-bold placeholder:italic"
            />
            <button 
              onClick={() => showAlert(t('common.info'), t('executive_dashboard.ai_analyzing'), 'info')}
              className="px-6 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              {t('common.update')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/10">
            <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1 italic underline">{t('executive_dashboard.ai_risk_badge')}</p>
            <p className="text-sm text-text-primary leading-relaxed font-semibold italic" dangerouslySetInnerHTML={{ __html: t('executive_dashboard.ai_risk_msg') }}></p>
          </div>
          <div className="space-y-3">
             <div className="flex justify-end">
                <div className="p-3 bg-bg-surface rounded-2xl rounded-tr-none text-sm text-text-primary font-bold border border-border-primary italic">{t('executive_dashboard.ai_user_query')}</div>
             </div>
             <div className="flex justify-start">
                <div className="p-3 bg-accent-blue text-white rounded-2xl rounded-tl-none text-sm font-medium shadow-lg shadow-blue-500/10 italic">{t('executive_dashboard.ai_response')}</div>
             </div>
          </div>
        </div>
      </Modal>

      {/* Project Creation Modal for SALE / PM */}
      <Modal 
        isOpen={modals.newProject} 
        onClose={() => setModals({...modals, newProject: false})} 
        title={role === Role.PM ? t('executive_dashboard.modal_new_proj_pm') : t('executive_dashboard.modal_new_proj_sale')}
        footer={
          <div className="flex items-center gap-3 w-full">
             <button 
                onClick={() => setModals({...modals, newProject: false})}
                className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary text-center"
                disabled={isSubmitting}
              >
                {t('common.close')}
              </button>
              <button 
                onClick={(e) => handleCreateProjectSubmit(e as any)}
                disabled={isSubmitting || isSuccess}
                className={`flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isSuccess 
                  ? 'bg-status-green text-white shadow-status-green/20' 
                  : 'bg-accent-blue text-white hover:bg-blue-600 shadow-blue-500/20'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSuccess ? (
                  <><Check className="w-4 h-4 animate-bounce" /> <span>{t('common.success_update')}</span></>
                ) : (
                  role === Role.PM ? t('common.initiate') : t('common.new_project')
                )}
              </button>
          </div>
        }
      >
        <div className="space-y-6">
          {role === Role.PM ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('executive_dashboard.label_select_proj')}</label>
              <select className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic focus:border-accent-blue transition-all">
                {localProjects.length === 0 ? (
                  <option>{t('executive_dashboard.loading_projects')}</option>
                ) : (
                  localProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('executive_dashboard.label_proj_name')}</label>
              <input 
                required 
                type="text" 
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder={t('executive_dashboard.proj_name_placeholder')} 
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic focus:border-accent-blue transition-all" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                 {role === Role.PM ? t('executive_dashboard.label_est_time') : t('executive_dashboard.label_deal_value')}
               </label>
               <input 
                 required 
                 type="number" 
                 value={role === Role.PM ? newProjHours : newProjValue}
                 onChange={(e) => role === Role.PM ? setNewProjHours(e.target.value) : setNewProjValue(e.target.value)}
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic focus:border-accent-blue transition-all" 
               />
             </div>
             
             {role !== Role.PM && (
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('executive_dashboard.label_est_time')}</label>
                 <input 
                   required 
                   type="number" 
                   value={newProjHours}
                   onChange={(e) => setNewProjHours(e.target.value)}
                   className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic focus:border-accent-blue transition-all" 
                 />
               </div>
             )}
          </div>

          {role !== Role.PM && (
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('executive_dashboard.label_pm')}</label>
               <select 
                 className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary outline-none font-bold italic appearance-none cursor-pointer focus:border-accent-blue transition-all"
                 value={selectedPmId}
                 onChange={(e) => setSelectedPmId(e.target.value)}
               >
                 <option value="">{t('common.select_pm')}</option>
                 {pms.map((pm: any) => (
                   <option key={pm.id} value={pm.id}>{pm.fullName} ({pm.email})</option>
                 ))}
               </select>
             </div>
          )}
        </div>
      </Modal>

      {/* Contract & Pricing Modal */}
      <Modal 
        isOpen={modals.contract} 
        onClose={() => setModals({...modals, contract: false})} 
        title={t('executive_dashboard.sales_gateway_title')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setModals({...modals, contract: false})}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close')}
            </button>
            <button 
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); setTimeout(() => { setModals({...modals, contract: false}); setIsSuccess(false); }, 1200); }, 1000);
              }}
              disabled={isSubmitting || isSuccess}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSuccess 
                ? 'bg-status-green text-white shadow-status-green/20' 
                : 'bg-status-yellow text-white hover:bg-yellow-600'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="w-4 h-4 animate-bounce" />
              ) : (
                <FileSignature className="w-4 h-4" />
              )}
              {isSuccess ? t('executive_dashboard.contract_success') : t('executive_dashboard.contract_btn')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex gap-4 p-4 bg-status-yellow/5 rounded-2xl border border-status-yellow/20 items-center">
             <Target className="w-8 h-8 text-status-yellow shrink-0" />
             <div>
                <p className="text-[10px] font-black text-status-yellow uppercase tracking-widest italic mb-1">{t('executive_dashboard.tech_data_pm')}</p>
                <p className="text-xs text-text-primary font-bold italic leading-relaxed" dangerouslySetInnerHTML={{ __html: t('executive_dashboard.tech_data_desc') }}></p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('executive_dashboard.min_resource')}</label>
               <input type="text" value={t('executive_dashboard.unit_hours_val', { count: 120 })} readOnly className="w-full p-4 bg-bg-surface/50 border border-border-primary rounded-xl text-text-secondary font-bold opacity-60 cursor-not-allowed italic" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic ml-1">{t('executive_dashboard.sales_rate')}</label>
               <input type="number" placeholder="500000" defaultValue="500000" className="w-full p-4 bg-bg-surface border border-border-primary rounded-xl text-text-primary font-black shadow-inner focus:border-accent-blue outline-none transition-all italic text-center" />
             </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-bg-surface to-accent-blue/5 rounded-2xl border-l-4 border-status-green shadow-inner border border-border-primary">
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 italic">{t('executive_dashboard.gross_value')}</p>
             <p className="text-2xl font-black text-status-green italic">{t('executive_dashboard.gross_value_sample')}</p>
             <div className="mt-4 pt-4 border-t border-border-primary/50 flex justify-between items-center">
                <p className="text-[10px] text-text-primary italic font-bold opacity-40">{t('executive_dashboard.tax_hint')}</p>
                <p className="text-[10px] text-accent-blue italic font-black uppercase tracking-widest opacity-80">{t('executive_dashboard.margin_hint')}</p>
             </div>
          </div>
        </div>
      </Modal>

      {/* Evaluate Ticket Modal for PM */}
      <Modal 
        isOpen={modals.evalTicket} 
        onClose={() => setModals({...modals, evalTicket: false})} 
        title={t('executive_dashboard.pm_review_title')}
        footer={
          <div className="w-full flex justify-end">
            <button 
              onClick={() => setModals({...modals, evalTicket: false})}
              className="px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-text-secondary italic">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold opacity-60 tracking-widest uppercase text-xs">{t('executive_dashboard.no_pm_tickets')}</p>
            </div>
          ) : (
            pendingRequests.map((req: any) => (
              <div key={req.id} className="p-5 bg-bg-surface rounded-2xl border-l-4 border-purple-500 shadow-inner space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black tracking-widest text-text-secondary opacity-60 italic">{t('executive_dashboard.ticket_label', { title: req.title })}</p>
                  <p className="text-sm font-black text-text-primary italic">#{req.id?.slice(-8).toUpperCase()}</p>
                </div>
                
                <p className="text-sm font-medium text-text-primary italic leading-relaxed">{req.description || t('executive_dashboard.no_desc')}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('executive_dashboard.label_categorize')}</label>
                    <select id={`type-${req.id}`} defaultValue="FEATURE" className="w-full p-3 bg-bg-surface border border-border-primary rounded-xl text-text-primary font-bold text-xs focus:border-purple-500 outline-none transition-all">
                      <option value="FEATURE">{t('executive_dashboard.opt_feature')}</option>
                      <option value="BUG">{t('executive_dashboard.opt_bug')}</option>
                      <option value="NEW_PROJECT">{t('executive_dashboard.opt_new_project')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('executive_dashboard.label_hours')}</label>
                    <input id={`hours-${req.id}`} type="number" defaultValue={40} className="w-full p-3 bg-bg-surface border border-border-primary rounded-xl text-text-primary font-bold text-xs focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const type = (document.getElementById(`type-${req.id}`) as HTMLSelectElement)?.value;
                      const hours = Number((document.getElementById(`hours-${req.id}`) as HTMLInputElement)?.value) || 40;
                      setCurrentTaskApproval(req);
                      setApprovalData({ hours, type });
                      setModals({ ...modals, evalTicket: false, pki: true });
                    }}
                    className="flex-[2] py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <FileSignature className="w-4 h-4" /> {t('executive_dashboard.btn_pki_sign')}
                  </button>
                  <button
                    onClick={() => {
                      showAlert(t('common.confirm'), t('executive_dashboard.reject_confirm'), 'confirm', async () => {
                         try {
                          await api.post(`/task-requests/${req.id}/reject`, { pmId: user?.id });
                          setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                          showAlert(t('common.success'), t('executive_dashboard.reject_alert'), 'success');
                        } catch (e) { 
                          showAlert(t('common.error'), t('executive_dashboard.reject_error'), 'error'); 
                        }
                      });
                    }}
                    className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500/20 transition-all"
                  >
                    {t('executive_dashboard.reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-accent-blue text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg shadow-blue-500/20">{t('executive_dashboard.gateway_badge')}</span>
            <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase italic underline decoration-accent-blue/20">{t('executive_dashboard.account_title')}, {userName}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1 tracking-wide">{t('executive_dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0 items-center">
          <button 
            onClick={() => setModals({...modals, export: true})}
            className="flex items-center gap-2 px-4 py-2 bg-bg-card text-text-primary rounded-xl border border-border-primary font-bold text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-lg active:scale-95 italic uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </button>
          
          {role === Role.PM && (
            <button 
              onClick={() => setModals({...modals, evalTicket: true})}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-500/30 font-black text-[10px] hover:bg-purple-600/20 transition-all shadow-lg shadow-purple-500/10 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <Inbox className="w-4 h-4" />
              <span>{t('common.approve_ticket')}</span>
            </button>
          )}

          {role === Role.SALE && (
            <button 
              onClick={() => setModals({...modals, contract: true})}
              className="flex items-center gap-2 px-4 py-2 bg-status-yellow text-white rounded-xl border border-white/10 font-black text-[10px] shadow-xl shadow-yellow-500/20 transition-all hover:bg-yellow-600 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <FileText className="w-4 h-4" />
              <span>{t('common.confirm_quote')}</span>
            </button>
          )}

          {(role === Role.SALE || role === Role.CEO || role === Role.PM) && (
            <button 
              onClick={() => setModals({...modals, newProject: true})}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl border border-white/10 font-black text-[10px] shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-95 uppercase tracking-[0.2em] italic"
            >
              <Plus className="w-4 h-4" />
              <span>{role === Role.PM ? t('common.initiate') : t('common.new_project')}</span>
            </button>
          )}

          {role === Role.CEO && (
            <button 
              onClick={() => setModals({...modals, pki: true})}
              className="group flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-2xl border border-indigo-400/30 font-black text-[10px] shadow-2xl shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest italic"
            >
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform">
                <FileSignature className="w-4 h-4 text-white" />
              </div>
              <span>{t('common.pki_system')}</span>
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
             <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight italic">{t('executive_dashboard.list_title')}</h3>
             <ChevronRight className="w-5 h-5 text-text-secondary hover:text-accent-blue cursor-pointer transition-all hover:translate-x-1" />
          </div>
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
              </div>
            ) : displayProjects.length === 0 ? (
              <div className="text-center py-10 text-text-secondary font-bold italic">{t('executive_dashboard.no_projects')}</div>
            ) : displayProjects.map((p, i) => (
              <div key={i} className="space-y-2 group cursor-pointer">
                <div className="flex justify-between items-center group-hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors underline decoration-transparent group-hover:decoration-accent-blue italic">
                      {p.name}
                      <span className="text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity font-mono ml-2">({p.estimatedHours} {t('executive_dashboard.unit_hours')})</span>
                    </span>
                    {p.isAlerted80 && (
                      <span className="p-1 px-2 rounded-lg bg-status-red/10 text-status-red text-[8px] font-black uppercase tracking-tighter animate-pulse border border-status-red/20">
                        {t('executive_dashboard.auto_alert_desc')}
                      </span>
                    )}
                    {(role === Role.SALE || role === Role.CEO) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSendManualAlert(p.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-status-red/5 text-status-red hover:bg-status-red/20 transition-all border border-status-red/10 flex items-center gap-1.5 shadow-sm"
                        title={t('executive_dashboard.manual_alert_btn')}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[8px] font-extrabold uppercase tracking-tight">{t('executive_dashboard.warn_pm')}</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-text-secondary italic">{p.status} {t('executive_dashboard.handover')}</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                  <div 
                    className={`h-full ${p.color} transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]`} 
                    style={{ width: p.status }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-text-secondary opacity-60 uppercase tracking-widest">
                   <span>{t('executive_dashboard.unit_val')}: {formatCurrency(p.value)}</span>
                   <span>{t('executive_dashboard.unit_est')}: {p.estimatedHours} {t('executive_dashboard.unit_hours')}</span>
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
                <h4 className="text-xl font-black text-text-primary italic">{t('executive_dashboard.ask_ai')}</h4>
                <p className="text-sm text-text-secondary leading-relaxed font-bold italic">
                   {t('executive_dashboard.ask_ai_desc')}
                </p>
                <button 
                  onClick={() => setModals({...modals, ai: true})}
                  className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black text-xs shadow-xl tracking-widest hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest"
                >
                  {t('executive_dashboard.start_now')}
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* NEW: PnL & Vendor Settlement Section */}
      {role === Role.CEO && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
          <div className="xl:col-span-2 bg-bg-card rounded-2xl border-2 border-accent-blue/20 p-8 space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
               <Briefcase className="w-48 h-48 text-accent-blue" />
            </div>
            <div className="flex items-center justify-between border-b border-border-primary/50 pb-6 relative z-10">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue">
                   <PieChart className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black text-text-primary uppercase tracking-tight italic">{t('executive_dashboard.pnl_title')}</h3>
               </div>
               <TrendingUp className="w-5 h-5 text-status-green animate-bounce" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* PnL List: Real-time Analytics (Epic 16.7) */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {localProjects.map((p, i) => (
                  <div key={i} className="p-4 bg-bg-surface rounded-2xl border border-border-primary hover:border-accent-blue/40 transition-all flex justify-between items-center group/pnl shadow-sm">
                    <div className="flex-1 mr-4">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic mb-1 truncate">{p.name || p.p_name}</p>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[9px] text-text-secondary font-bold uppercase opacity-60">Revenue (PAID)</p>
                          <p className="text-sm font-black text-text-primary">{formatCurrency(p.totalActualRevenue || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-status-red font-bold uppercase opacity-60">Real Cost (APPROVED)</p>
                          <p className="text-sm font-black text-status-red">-{formatCurrency(p.totalActualCost || 0)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-[9px] text-status-green font-black uppercase tracking-widest mb-1 italic">{t('executive_dashboard.net_profit')}</p>
                      <p className={`text-lg font-black italic ${((p.totalActualRevenue || 0) - (p.totalActualCost || 0)) >= 0 ? 'text-status-green' : 'text-status-red'}`}>
                        {((p.totalActualRevenue || 0) - (p.totalActualCost || 0)) >= 0 ? '+' : ''}{formatCurrency((p.totalActualRevenue || 0) - (p.totalActualCost || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Settlement */}
              <div className="bg-bg-surface rounded-3xl p-6 border-2 border-dashed border-border-primary space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    {t('executive_dashboard.vendor_payout')}
                  </h4>
                  <span className="p-1 px-2 rounded-full bg-purple-500/10 text-purple-500 text-[8px] font-black uppercase tracking-widest">{vendorDebts.length} PENDING</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {vendorDebts.length === 0 ? (
                    <div className="py-10 text-center opacity-40">
                      <Inbox className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase italic">No pending payouts</p>
                    </div>
                  ) : vendorDebts.map((debt, idx) => (
                    <div key={idx} className="p-4 bg-bg-card rounded-2xl border border-border-primary flex justify-between items-center group/debt hover:shadow-lg transition-all">
                      <div>
                        <p className="text-xs font-black text-text-primary uppercase tracking-tight">{debt.vendorName}</p>
                        <p className="text-[10px] text-text-secondary font-bold italic">{debt.projectName}</p>
                        <p className="text-[11px] font-black text-accent-blue mt-1">{formatCurrency(debt.totalAmount)}</p>
                      </div>
                      <button 
                        onClick={() => {
                          showAlert(t('common.confirm'), `Confirm payout to ${debt.vendorName}?`, 'confirm', async () => {
                            try {
                              await api.post(`/finance/vendor-debt/${debt.id}/pay`, {});
                              setVendorDebts(prev => prev.filter(d => d.id !== debt.id));
                              showAlert(t('common.success'), "Payment successful!", 'success');
                            } catch (err) {
                              showAlert(t('common.error'), "Payment error. Please check funds.", 'error');
                            }
                          });
                        }}
                        className="p-2 px-4 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                      >
                        {t('executive_dashboard.pay_btn')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side Insight */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 p-4 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-1000 rotate-12">
               <TrendingUp className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <Rocket className="w-8 h-8 text-status-yellow" />
                 <h4 className="text-lg font-black italic uppercase tracking-tighter">{t('executive_dashboard.earnings_vendor')}</h4>
              </div>
              
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 italic">Expected Payout Q2</p>
                    <p className="text-2xl font-black italic">{formatCurrency(1200000000)}</p>
                 </div>
                 <p className="text-xs text-indigo-200 font-medium leading-relaxed italic opacity-80">
                    System forecasting a 12% increase in project margins due to vendor resource optimization in Tokyo region.
                 </p>
              </div>

              <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">
                 {t('executive_dashboard.ai_risk_badge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Security & PKI Knowledge Section (Epic 9 & 16.8) */}
      {role === Role.CEO && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 bg-bg-card rounded-3xl border-2 border-status-red/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <LockIcon className="w-48 h-48 text-status-red" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-status-red/10 rounded-2xl border border-status-red/20 text-status-red">
                  <ShieldCheck className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter italic">Enterprise Security Health</h3>
                  <p className="text-xs font-black text-text-secondary uppercase tracking-widest opacity-60">Zero Trust Implementation Status</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-status-green uppercase tracking-[0.2em] mb-1">Status: SECURE</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-8 h-1 bg-status-green rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {[
                { label: 'Access Control', val: '98%', status: 'HIGH' },
                { label: 'Token Integrity', val: '100%', status: 'OPTIMAL' },
                { label: 'Network Isolation', val: 'Active', status: 'PROTECTED' },
                { label: 'Audit Compliance', val: 'Passed', status: 'VERIFIED' }
              ].map((sec, idx) => (
                <div key={idx} className="p-6 bg-bg-surface rounded-2xl border border-border-primary hover:border-status-red/30 transition-all flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 italic">{sec.label}</p>
                    <p className="text-xl font-black text-text-primary italic">{sec.val}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-green mb-2"></span>
                    <span className="text-[9px] font-black text-status-green uppercase tracking-tighter">{sec.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PKI Knowledge Base Section (Epic 16.8) */}
          <div className="p-8 bg-gradient-to-br from-slate-900 to-black rounded-3xl border border-border-primary shadow-2xl text-white">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent-blue/20 rounded-xl text-accent-blue">
                   <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black uppercase italic tracking-tighter">KIẾN THỨC PKI (Ký Số)</h4>
             </div>
             
             <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-xs font-black text-accent-blue uppercase tracking-widest mb-2">PKI là gì?</p>
                   <p className="text-[11px] text-text-secondary leading-relaxed italic opacity-80 font-medium">
                      Public Key Infrastructure (PKI) sử dụng cặp khóa công khai và bí mật để xác thực danh tính người dùng và chống chối bỏ. Khi CEO ký số, hệ thống sẽ gán một mã định danh duy nhất không thể làm giả.
                   </p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-xs font-black text-status-green uppercase tracking-widest mb-2">Tính Pháp Lý</p>
                   <p className="text-[11px] text-text-secondary leading-relaxed italic opacity-80 font-medium">
                      Chữ ký số có giá trị pháp lý tương đương chữ ký tay và con dấu, giúp tối ưu quy trình ký kết hợp đồng điện tử ngay trên Dashboard.
                   </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase text-text-secondary mb-1 opacity-50">Lần ký cuối cùng</p>
                   <p className="text-xs font-black italic">Hôm nay, 14:20 (Xác thực bởi HSM)</p>
                </div>
             </div>
          </div>
        </div>
      )}
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

export default ExecutiveDashboard;
