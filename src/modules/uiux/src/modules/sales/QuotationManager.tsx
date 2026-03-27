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
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import Modal from '../../components/Modal';

const QuotationManager: React.FC = () => {
  const userStr = getCookie('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isStaff = user?.role === Role.CEO || user?.role === Role.PM || user?.role === Role.SALE;
  const isClientOrCEO = user?.role === Role.CLIENT || user?.role === Role.CEO;
  const isSaleOrPM = user?.role === Role.SALE || user?.role === Role.PM;
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ title: '', amount: '', clientId: '' });

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'APPROVED' && !window.confirm('Sau khi APPROVED, dữ liệu Báo giá sẽ bị khóa vĩnh viễn (Immutability). Bạn có chắc chắn?')) {
      return;
    }
    
    try {
      setIsUpdating(id);
      await api.patch(`/sales/quotations/${id}/status`, { status: newStatus });
      await fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái Báo giá.');
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
      alert('Vui lòng nhập Tên và Số tiền hợp lệ.');
      return;
    }
    if (!editingId && !formState.clientId) {
      alert('Vui lòng nhập Mã Khách Hàng (Client ID) để tạo báo giá mới.');
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
    } catch (err: any) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic underline decoration-accent-blue/20 underline-offset-8">
            Quản lý Báo giá (Quotations)
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">
            Soạn thảo, phê duyệt ngân sách và khóa Scope (Nguyên tắc Immutability).
          </p>
        </div>
      </div>

      <div className="bg-bg-card rounded-3xl border border-border-primary p-8 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-text-primary uppercase flex items-center gap-3 italic">
            <FileText className="w-5 h-5 text-accent-blue" />
            Danh sách Báo giá
          </h3>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-bg-surface px-4 py-2 rounded-xl items-center gap-2 border border-border-primary">
              <Search className="w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-transparent text-[11px] font-bold outline-none text-text-primary italic"
              />
            </div>
            {isStaff && (
              <button 
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-accent-blue/20"
              >
                <Plus className="w-4 h-4" /> Tạo Báo Giá
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {quotations.length === 0 ? (
            <div className="py-12 text-center text-xs font-black text-text-secondary uppercase italic opacity-40">Chưa có dữ liệu báo giá</div>
          ) : (
            quotations.map((q) => (
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
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-text-secondary italic">
                    Ticket ID: <span className="text-accent-blue">{q.ticketId ? q.ticketId.slice(0,8) : 'N/A'}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Tổng tiền</p>
                    <p className="text-lg font-black text-text-primary italic">
                      ${Number(q.totalAmount).toLocaleString()}
                    </p>
                  </div>
                  
                  {isClientOrCEO && q.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 md:mt-0">
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                        disabled={isUpdating === q.id}
                        className={`px-4 py-2 ${isUpdating === q.id ? 'opacity-50' : 'hover:bg-status-green hover:text-white'} text-[10px] font-black uppercase tracking-widest text-status-green border border-status-green/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-status-green/10 shadow-inner`}
                      >
                        <CheckCircle className="w-3 h-3" /> Phê Duyệt
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                        disabled={isUpdating === q.id}
                        className={`px-4 py-2 ${isUpdating === q.id ? 'opacity-50' : 'hover:bg-status-red hover:text-white'} text-[10px] font-black uppercase tracking-widest text-status-red border border-status-red/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-status-red/10 shadow-inner`}
                      >
                        <XCircle className="w-3 h-3" /> Từ Chối
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
                        <Edit3 className="w-3 h-3" /> Sửa
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(q.id, 'PENDING')}
                        disabled={isUpdating === q.id}
                        className="px-4 py-2 text-[10px] hover:bg-accent-blue hover:text-white font-black uppercase tracking-widest text-accent-blue border border-accent-blue/50 rounded-lg transition-all flex items-center justify-center gap-2 bg-accent-blue/10"
                      >
                        Gửi Duyệt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-surface w-full max-w-md p-6 rounded-2xl border border-divider shadow-2xl">
            <h3 className="text-xl font-bold text-text-primary mb-6">{editingId ? 'Chỉnh Sửa Báo Giá' : 'Tạo Báo Giá Mới'}</h3>
            
            <div className="space-y-4 mb-6">
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Mã Khách Hàng (Client ID)</label>
                  <input 
                    type="text" 
                    value={formState.clientId}
                    onChange={(e) => setFormState({ ...formState, clientId: e.target.value })}
                    className="w-full bg-bg-card border border-divider rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    placeholder="Nhập System/UUID Khách hàng..."
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Mô tả / Tên báo giá</label>
                <input 
                  type="text" 
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full bg-bg-card border border-divider rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="App Mobile Backend..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Giá trị dự kiến (USD)</label>
                <input 
                  type="number" 
                  value={formState.amount}
                  onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                  className="w-full bg-bg-card border border-divider rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-text-secondary hover:text-text-primary transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isUpdating === (editingId || 'new')}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg transition-all ${isUpdating === (editingId || 'new') ? 'opacity-50 bg-gray-500' : 'bg-accent-blue hover:bg-blue-600'}`}
              >
                Lưu Báo Giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManager;
