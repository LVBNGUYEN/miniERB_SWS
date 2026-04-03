import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Loader2, 
  Plus, 
  Filter, 
  Search 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import Modal from '../../components/Modal';
import { useAlert } from '../../hooks/useAlert';
import AlertModal from '../../components/AlertModal';

const QuotationManager: React.FC = () => {
  const { t } = useTranslation();
  const { alertConfig, showAlert, closeAlert } = useAlert();
  const userStr = getCookie('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isStaff = user?.role === Role.CEO || user?.role === Role.PM || user?.role === Role.SALE;
  const isClientOrCEO = user?.role === Role.CLIENT || user?.role === Role.CEO;
  const isSaleOrPM = user?.role === Role.SALE || user?.role === Role.PM;
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ title: '', amount: '', clientId: '' });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/quotations');
      setQuotations(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch quotations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return t('quotation_manager.status_approved');
      case 'PENDING': return t('quotation_manager.status_pending');
      case 'DRAFT': return t('quotation_manager.status_draft');
      case 'REJECTED': return t('quotation_manager.status_rejected');
      default: return status;
    }
  };

  const filteredAndSortedQuotations = quotations
    .filter(q => {
      const matchesSearch = q.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || q.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        'PENDING': 0,
        'APPROVED': 1,
        'REJECTED': 1,
        'DRAFT': 2
      };
      const aP = priority[a.status] ?? 3;
      const bP = priority[b.status] ?? 3;
      return aP - bP;
    });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'APPROVED') {
       showAlert(t('common.confirm'), t('quotation_manager.alert_approve_confirm'), 'confirm', async () => {
          try {
            setIsUpdating(id);
            await api.patch(`/sales/quotations/${id}/status`, { status: newStatus });
            await fetchQuotations();
            showAlert(t('common.success'), t('quotation_manager.alert_success_update'), 'success');
          } catch (err: any) {
            showAlert(t('common.error'), err.response?.data?.message || t('quotation_manager.alert_error_update'), 'error');
          } finally {
            setIsUpdating(null);
          }
       });
       return;
    }
    
    try {
      setIsUpdating(id);
      await api.patch(`/sales/quotations/${id}/status`, { status: newStatus });
      await fetchQuotations();
      showAlert(t('common.success'), t('quotation_manager.alert_success_update'), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('quotation_manager.alert_error_update'), 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleOpenModal = (q?: any) => {
    if (q) {
      setEditingId(q.id);
      setFormState({ title: q.title || '', amount: q.totalAmount?.toString() || '', clientId: q.clientId || '' });
    } else {
      setEditingId(null);
      setFormState({ title: '', amount: '', clientId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.title || !formState.amount || isNaN(Number(formState.amount))) {
      showAlert(t('common.error'), t('quotation_manager.alert_invalid_input'), 'error');
      return;
    }
    if (!editingId && !formState.clientId) {
      showAlert(t('common.error'), t('quotation_manager.alert_missing_client'), 'error');
      return;
    }
    try {
      setIsUpdating(editingId || 'new');
      if (editingId) {
        await api.patch(`/sales/quotations/${editingId}`, {
          title: formState.title,
          totalAmount: Number(formState.amount)
        });
      } else {
        await api.post('/sales/quotations', {
          title: formState.title,
          totalAmount: Number(formState.amount),
          branchId: user?.branchId || '00000000-0000-0000-0000-000000000000',
          clientId: formState.clientId,
          pmId: user?.id
        });
      }
      setIsModalOpen(false);
      await fetchQuotations();
      showAlert(t('common.success'), t('quotation_manager.alert_success_save'), 'success');
    } catch (err: any) {
      showAlert(t('common.error'), t('quotation_manager.alert_error_prefix') + (err.response?.data?.message || err.message), 'error');
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

  const FilterBtn = ({ status, label }: { status: typeof filterStatus, label: string }) => (
    <button 
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
        filterStatus === status 
          ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' 
          : 'bg-bg-surface text-text-secondary opacity-60 hover:opacity-100 border border-border-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">
            {t('quotation_manager.page_title')}
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">
            {t('quotation_manager.page_desc')}
          </p>
        </div>
      </div>

      <div className="bg-bg-card rounded-3xl border border-border-primary p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <FilterBtn status="ALL" label={t('quotation_manager.filter_all')} />
            <FilterBtn status="DRAFT" label={t('quotation_manager.status_draft')} />
            <FilterBtn status="PENDING" label={t('quotation_manager.status_pending')} />
            <FilterBtn status="APPROVED" label={t('quotation_manager.status_approved')} />
            <FilterBtn status="REJECTED" label={t('quotation_manager.status_rejected')} />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-bg-surface px-4 py-2 rounded-xl flex items-center gap-2 border border-border-primary max-w-xs">
              <Search className="w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                placeholder={t('quotation_manager.search_placeholder')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-[11px] font-bold outline-none text-text-primary italic w-full"
              />
            </div>
            {isStaff && (
              <button 
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-accent-blue/20"
              >
                <Plus className="w-4 h-4" /> {t('quotation_manager.create_btn')}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedQuotations.length === 0 ? (
            <div className="py-12 text-center text-xs font-black text-text-secondary uppercase italic opacity-40">{t('quotation_manager.no_data')}</div>
          ) : (
            filteredAndSortedQuotations.map((q) => (
              <div key={q.id} className="group flex flex-col md:flex-row justify-between md:items-center p-6 bg-bg-surface/50 border border-border-primary rounded-2xl hover:bg-bg-card transition-all shadow-sm">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-black text-text-primary uppercase italic">{q.title}</h4>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
                      q.status === 'APPROVED' ? 'bg-status-green/20 text-status-green border border-status-green/30' :
                      q.status === 'REJECTED' ? 'bg-status-red/20 text-status-red border border-status-red/30' :
                      q.status === 'PENDING' ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' :
                      'bg-status-yellow/20 text-status-yellow border border-status-yellow/30'
                    }`}>
                      {getStatusLabel(q.status)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-text-secondary italic">
                    Ticket ID: <span className="text-accent-blue">{q.ticketId ? q.ticketId.slice(0,8) : 'N/A'}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{t('quotation_manager.total_amount')}</p>
                    <p className="text-lg font-black text-text-primary italic">
                      {Number(q.totalAmount).toLocaleString()} VNĐ
                    </p>
                  </div>
                  
                  {isClientOrCEO && q.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 md:mt-0">
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                        disabled={isUpdating === q.id}
                        className={`px-4 py-2 ${isUpdating === q.id ? 'opacity-50' : 'hover:bg-status-green hover:text-white'} text-[10px] font-black uppercase tracking-widest text-status-green border border-status-green/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-status-green/10 shadow-inner`}
                      >
                        <CheckCircle className="w-3 h-3" /> {t('quotation_manager.approve')}
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                        disabled={isUpdating === q.id}
                        className={`px-4 py-2 ${isUpdating === q.id ? 'opacity-50' : 'hover:bg-status-red hover:text-white'} text-[10px] font-black uppercase tracking-widest text-status-red border border-status-red/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-status-red/10 shadow-inner`}
                      >
                        <XCircle className="w-3 h-3" /> {t('quotation_manager.reject')}
                      </button>
                    </div>
                  )}

                  {isSaleOrPM && q.status === 'DRAFT' && (
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <button 
                        onClick={() => handleOpenModal(q)}
                        disabled={isUpdating === q.id}
                        className="px-3 py-2 text-[10px] hover:bg-accent-blue hover:text-white font-black uppercase tracking-widest text-accent-blue border border-accent-blue/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-accent-blue/10"
                      >
                        <Edit3 className="w-3 h-3" /> {t('quotation_manager.edit')}
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'PENDING')}
                        disabled={isUpdating === q.id}
                        className="px-4 py-2 text-[10px] hover:bg-accent-blue hover:text-white font-black uppercase tracking-widest text-accent-blue border border-accent-blue/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-accent-blue/10"
                      >
                        {t('quotation_manager.submit_for_approval')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? t('quotation_manager.modal_title_edit') : t('quotation_manager.modal_title_create')}
        footer={
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            >
              {t('common.close')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isUpdating === (editingId || 'new')}
              className={`flex-[2] py-2.5 text-sm font-bold rounded-xl text-white shadow-lg transition-all ${isUpdating === (editingId || 'new') ? 'opacity-50 bg-gray-500' : 'bg-accent-blue hover:bg-blue-600'}`}
            >
              {t('quotation_manager.save_btn')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {!editingId && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">{t('quotation_manager.client_id_label')}</label>
              <input 
                type="text" 
                value={formState.clientId}
                onChange={(e) => setFormState({ ...formState, clientId: e.target.value })}
                className="w-full bg-bg-card border border-border-primary rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                placeholder={t('quotation_manager.client_id_placeholder')}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">{t('quotation_manager.description_label')}</label>
            <input 
              type="text" 
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="w-full bg-bg-card border border-border-primary rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              placeholder={t('quotation_manager.description_placeholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">{t('quotation_manager.estimated_value_label')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={formState.amount}
                onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                className="w-full bg-bg-card border border-border-primary rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors pr-12"
                placeholder="5000"
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

export default QuotationManager;
