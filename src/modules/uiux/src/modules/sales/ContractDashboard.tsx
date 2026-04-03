import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  X
} from 'lucide-react';
import { api } from '../../api';

import Modal from '../../components/Modal';
import AlertModal from '../../components/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const ContractDashboard: React.FC = () => {
  const { t } = useTranslation('contract_dashboard');
  const { alertConfig, showAlert, closeAlert } = useAlert();

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
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Creation Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newContract, setNewContract] = useState({ quotationId: '', contractNumber: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, statsRes, taskReqRes, quotsRes] = await Promise.allSettled([
        api.get('/sales/contracts'),
        api.get('/sales/contracts/stats'),
        api.get('/task-requests/list'),
        api.get('/sales/quotations')
      ]);

      let allContracts: any[] = [];
      if (contractsRes.status === 'fulfilled') {
        allContracts = [...(Array.isArray(contractsRes.value) ? contractsRes.value : [])];
      }

      // Syncing CEO_SIGNED task requests as virtual contracts
      if (taskReqRes.status === 'fulfilled' && Array.isArray(taskReqRes.value)) {
        const signedRequests = taskReqRes.value
          .filter((tr: any) => tr.status === 'CEO_SIGNED' || tr.status === 'DISTRIBUTED')
          .map((tr: any) => ({
            id: tr.id,
            contractNumber: `CR-${tr.id.substring(0, 8).toUpperCase()}`,
            status: tr.status === 'DISTRIBUTED' ? 'ACTIVE' : 'VERIFIED',
            documentHash: tr.signatures?.ceoSignature || 'PKI-GENERATED-HASH',
            isVirtual: true,
            quotation: {
              title: `[Change Request] ${tr.title}`,
              totalAmount: tr.finalPrice || 0,
              client: { fullName: 'Khách hàng hệ thống' } // Should ideally link to real client
            }
          }));
        allContracts = [...allContracts, ...signedRequests];
      }

      setContracts(allContracts);
      
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }

      if (quotsRes.status === 'fulfilled' && Array.isArray(quotsRes.value)) {
        setApprovedQuotations(quotsRes.value.filter((q: any) => q.status === 'APPROVED'));
      }
    } catch (err) {
      console.error('Fetch contract data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = 
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.quotation?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.quotation?.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, filterStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleDownload = (contract: any) => {
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
    setIsCreateModalOpen(true);
  };

  const handleSaveContract = async () => {
    if (!newContract.quotationId || !newContract.contractNumber) {
      showAlert(t('common.error', { ns: 'common' }), t('alert_fill_info'), 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/sales/contracts', newContract);
      setIsCreateModalOpen(false);
      fetchData();
      showAlert(t('common.success', { ns: 'common' }), t('alert_success'), 'success');
    } catch (err) {
      console.error('Create contract error:', err);
      showAlert(t('common.error', { ns: 'common' }), t('alert_error'), 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title={t('create_modal_title')}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close', { ns: 'common' })}
            </button>
            <button 
              disabled={creating || !newContract.quotationId}
              onClick={handleSaveContract}
              className="px-6 py-2.5 bg-accent-blue text-white rounded-xl text-xs font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {t('create_now')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('select_quotation')}</label>
            <select 
              value={newContract.quotationId}
              onChange={(e) => {
                const q = approvedQuotations.find(aq => aq.id === e.target.value);
                setNewContract({
                  ...newContract,
                  quotationId: e.target.value,
                  contractNumber: q ? `HD-${q.id.substring(0,6).toUpperCase()}` : ''
                });
              }}
              className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-accent-blue transition-all uppercase italic"
            >
              <option value="">{t('select_quotation_placeholder')}</option>
              {approvedQuotations.map(q => (
                <option key={q.id} value={q.id}>{q.title} ({formatCurrency(q.totalAmount)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">{t('contract_number_auto')}</label>
            <input 
              type="text"
              readOnly
              value={newContract.contractNumber}
              className="w-full bg-bg-surface/50 border border-border-primary rounded-xl px-4 py-3 text-sm text-accent-blue font-black outline-none opacity-80"
            />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('detail_modal_title')}
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('contract_code')}</p>
                <p className="text-lg font-bold text-white">{selectedContract.contractNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('pki_status')}</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-status-green" />
                  <span className="text-sm font-bold text-status-green uppercase tracking-widest">{selectedContract.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('project_content')}</p>
              <p className="text-md font-bold text-white italic">{selectedContract.quotation?.title}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('client')}</p>
              <p className="text-md font-bold text-accent-blue underline decoration-white/10">{selectedContract.quotation?.client?.fullName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t('contract_value')}</p>
              <p className="text-2xl font-black text-status-green font-mono">{formatCurrency(selectedContract.quotation?.totalAmount || 0)}</p>
            </div>

            <div className="p-4 bg-bg-surface/50 rounded-2xl border border-white/5 space-y-3">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3 h-3 text-accent-blue" />
                {t('pki_hash')}
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
          <h2 className="text-2xl font-extrabold text-white italic tracking-tight">{t('page_title')}</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('page_desc')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('create_contract_btn')}</span>
          </button>
        </div>
      </div>

      {/* Contract Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t('total_value'), value: formatCurrency(stats.totalValue), trend: '+0%', icon: DollarSign, color: 'text-status-green' },
          { label: t('expiring'), value: String(stats.expiringCount).padStart(2, '0'), trend: t('trend_attention'), icon: AlertCircle, color: 'text-status-yellow' },
          { label: t('active'), value: String(stats.activeCount).padStart(2, '0'), trend: t('trend_pki'), icon: CheckCircle2, color: 'text-accent-blue' },
          { label: t('drafting'), value: String(stats.draftCount).padStart(2, '0'), trend: t('trend_sales'), icon: FileText, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card p-6 rounded-2xl border border-slate-700/50 group hover:border-accent-blue transition-all shadow-lg overflow-hidden relative">
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
              <h3 className="text-lg font-bold text-white flex items-center gap-2 italic">
                 <Briefcase className="w-5 h-5 text-accent-blue" />
                 {t('strategic_contracts')}
              </h3>
              <div className="flex gap-2">
                 <div className="w-64 bg-bg-surface rounded-xl px-4 py-2 flex items-center gap-3 border border-slate-700 focus-within:border-accent-blue transition-all group">
                    <Search className="w-4 h-4 text-text-secondary group-focus-within:text-accent-blue" />
                    <input 
                      type="text" 
                      placeholder={t('search_placeholder')} 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-sm outline-none text-white w-full placeholder:text-text-secondary font-medium" 
                    />
                    {searchTerm && <X className="w-3.5 h-3.5 text-text-secondary cursor-pointer hover:text-white" onClick={() => setSearchTerm('')} />}
                 </div>
                 
                 <div className="relative group/filter">
                   <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-white rounded-xl transition-all border border-slate-700 flex items-center gap-2 font-bold text-xs uppercase tracking-widest group-hover/filter:border-accent-blue">
                     <Filter className="w-4 h-4" />
                     <span>{filterStatus}</span>
                   </button>
                   <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all z-20 overflow-hidden">
                      {['ALL', 'VERIFIED', 'ACTIVE', 'SIGNED'].map(st => (
                         <button 
                          key={st}
                          onClick={() => setFilterStatus(st)}
                          className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent-blue/10 transition-colors ${filterStatus === st ? 'text-accent-blue bg-accent-blue/5' : 'text-text-secondary'}`}
                        >
                          {st === 'ALL' ? t('filter_all') : st}
                        </button>
                      ))}
                   </div>
                 </div>
              </div>
           </div>

           {loading ? (
             <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-accent-blue animate-spin" /></div>
           ) : filteredContracts.length === 0 ? (
             <div className="text-center py-20 bg-bg-surface/20 rounded-2xl border border-dashed border-slate-700/50">
               <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-20" />
               <p className="text-sm font-bold text-slate-600 italic">
                 {searchTerm || filterStatus !== 'ALL' ? t('no_contracts_filter') : t('no_contracts')}
               </p>
               {(searchTerm || filterStatus !== 'ALL') && (
                 <button onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }} className="mt-4 text-xs text-accent-blue font-black uppercase tracking-widest hover:underline">{t('clear_filter')}</button>
               )}
             </div>
           ) : (
             <div className="space-y-4">
               {filteredContracts.map((c: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-5 bg-bg-surface/50 rounded-2xl border border-slate-700/20 hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-accent-blue/10 group-hover:text-accent-blue transition-all">
                          <FileText className="w-6 h-6" />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors italic">{c.quotation?.title}</h4>
                          <p className="text-[10px] text-text-secondary font-medium tracking-wide">
                             {t('contract_code_label')} <span className="text-accent-blue font-bold">{c.contractNumber}</span> • 
                             {t('client_label')} <span className="text-white font-bold">{c.quotation?.client?.fullName}</span>
                          </p>
                          <p className="text-[10px] text-text-secondary font-medium tracking-wide">
                             {t('value_label')} <span className="text-status-green font-bold">{formatCurrency(c.quotation?.totalAmount || 0)}</span>
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-8 pr-2">
                       <div className="text-right hidden md:block">
                          <p className="text-[10px] text-text-secondary font-black uppercase tracking-tight opacity-60">{t('pki_status_label')}</p>
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
                           onClick={(e) => { e.stopPropagation(); handleView(c); }}
                           className="p-2 text-slate-500 hover:text-white transition-all bg-bg-surface rounded-lg" title={t('view_detail')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                           onClick={(e) => { e.stopPropagation(); handleDownload(c); }}
                           className="p-2 text-slate-500 hover:text-white transition-all bg-bg-surface rounded-lg" title={t('download_pdf')}
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
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 italic">
                 <Calendar className="w-4 h-4 text-accent-blue" />
                 {t('renewal_schedule')}
              </h3>
              <div className="space-y-4">
                 {[
                   { name: 'Tokyo Tech Stage 2', date: '01/04', color: 'border-l-accent-blue' },
                   { name: 'Viettel Maintenance', date: '31/03', color: 'border-l-status-red' },
                   { name: 'FPT AI Upgrade', date: '15/04', color: 'border-l-status-green' },
                 ].map((rem, i) => (
                   <div key={i} className={`p-4 bg-bg-surface/40 hover:bg-bg-surface rounded-xl transition-all group cursor-pointer border-l-4 ${rem.color} border border-slate-700/30`}>
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-bold text-white italic">{rem.name}</p>
                         <span className="text-[10px] font-mono text-text-secondary italic">{rem.date}</span>
                      </div>
                      <p className="text-[9px] text-text-secondary font-medium mt-1 italic">{t('renewal_notice')}</p>
                   </div>
                 ))}
              </div>
              <button className="w-full py-2.5 bg-bg-surface border border-slate-700 text-white rounded-xl font-black text-[10px] hover:bg-slate-700 transition-all uppercase tracking-widest italic">{t('view_all_reminders')}</button>
           </div>

           <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-white/10 transition-all"></div>
              <TrendingUp className="w-10 h-10 text-accent-blue mx-auto opacity-70 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-black italic tracking-tighter">{t('sales_pipeline_forecast')}</h4>
              <p className="text-[10px] text-indigo-200/50 font-bold leading-relaxed tracking-wide px-2 italic" dangerouslySetInnerHTML={{ __html: t('forecast_desc') }} />
              <button className="w-full py-3 bg-accent-blue text-white rounded-2xl font-black text-[10px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest italic">{t('sales_funnel_detail')}</button>
           </div>
        </div>
      </div>
      
      <AlertModal {...alertConfig} onClose={closeAlert} />
    </div>
  );
};

export default ContractDashboard;
