import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';

const TaskRequestFlowStatus: Record<string, { label: string; color: string; next: string }> = {
  PROPOSED: { label: 'Đề xuất', color: 'bg-status-yellow', next: 'PM Ước tính' },
  ESTIMATED: { label: 'PM Đã xác nhận', color: 'bg-accent-blue', next: 'Sale Chốt giá' },
  PRICED: { label: 'Sale Đã báo giá', color: 'bg-purple-500', next: 'Khách hàng duyệt' },
  CLIENT_SIGNED: { label: 'Khách hàng Đã duyệt', color: 'bg-status-green', next: 'CEO Ký xác nhận' },
  CEO_SIGNED: { label: 'CEO Đã ký', color: 'bg-indigo-600', next: 'Phân phối Task' },
  DISTRIBUTED: { label: 'Đang thực thi', color: 'bg-status-green', next: 'Hoàn tất' },
};

const TaskRequestFlow: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', projectId: 'PROJ-TEST' });

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/task-requests/list');
      setRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = user?.role || Role.VENDOR;

  const handleCreate = async () => {
    try {
      await api.post('/task-requests/propose', { ...newRequest, clientId: user.id });
      setShowCreate(false);
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleAction = async (id: string, action: string, data: any = {}) => {
    try {
      await api.post(`/task-requests/${id}/${action}`, { ...data, userId: user.id });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white italic tracking-tight">Ký duyệt Task Request (PKI 3-Step)</h3>
        {currentRole === Role.CLIENT && (
          <button 
             onClick={() => setShowCreate(true)}
             className="px-4 py-2 bg-accent-blue text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Đề xuất Task mới
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-bg-card p-6 rounded-2xl border border-accent-blue/30 space-y-4">
          <input 
            type="text" 
            placeholder="Tên yêu cầu/CR..." 
            className="w-full bg-bg-surface border border-slate-700 p-3 rounded-xl text-white outline-none"
            value={newRequest.title}
            onChange={e => setNewRequest({...newRequest, title: e.target.value})}
          />
          <textarea 
            placeholder="Mô tả chi tiết yêu cầu..." 
            className="w-full bg-bg-surface border border-slate-700 p-3 rounded-xl text-white outline-none h-24"
            value={newRequest.description}
            onChange={e => setNewRequest({...newRequest, description: e.target.value})}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="text-xs font-bold text-text-secondary">Hủy</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-accent-blue text-white rounded-lg font-bold text-xs">Gửi đề xuất</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-all shadow-xl group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-1 px-3 text-[9px] font-black uppercase text-white ${TaskRequestFlowStatus[req.status]?.color || 'bg-slate-700'}`}>
              {req.status}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center text-accent-blue font-bold text-xs shadow-inner border border-slate-700/20">
                     CR
                   </div>
                   <h4 className="text-lg font-black text-white italic">{req.title}</h4>
                 </div>
                 <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 italic">{req.description}</p>
                 <div className="flex flex-wrap gap-4 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="w-3 h-3"/> Effort: {req.estimatedHours || '??'}h</span>
                    <span className="text-[10px] font-bold text-status-green uppercase flex items-center gap-1.5"><DollarSign className="w-3 h-3"/> Cost: {req.finalPrice || '??'} USD</span>
                 </div>
              </div>

              {/* Action Center per Role */}
              <div className="flex items-center gap-3">
                 {req.status === 'PROPOSED' && currentRole === Role.PM && (
                   <button 
                     onClick={() => handleAction(req.id, 'estimate', { hours: 24, signature: 'SIG_PM_X1' })}
                     className="px-4 py-2 bg-accent-blue text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20"
                   >
                     🚀 PM Chốt Effort (Step 1)
                   </button>
                 )}
                 {req.status === 'ESTIMATED' && currentRole === Role.SALE && (
                   <button 
                     onClick={() => handleAction(req.id, 'price', { price: 1200 })}
                     className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-500/20"
                   >
                     💰 Sale Chốt Giá
                   </button>
                 )}
                 {req.status === 'PRICED' && currentRole === Role.CLIENT && (
                   <button 
                     onClick={() => handleAction(req.id, 'client-sign', { signature: 'SIG_CLIENT_X2' })}
                     className="px-4 py-2 bg-status-green text-white rounded-xl font-bold text-xs shadow-lg shadow-green-500/20"
                   >
                     ✍️ Khách hàng Ký duyệt (Step 2)
                   </button>
                 )}
                 {req.status === 'CLIENT_SIGNED' && currentRole === Role.CEO && (
                   <button 
                     onClick={() => handleAction(req.id, 'ceo-sign', { ceoId: user.id, signature: 'SIG_CEO_X3' })}
                     className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20"
                   >
                     🏢 CEO Ký xác nhận (Step 3)
                   </button>
                 )}
                 {req.status === 'CEO_SIGNED' && currentRole === Role.PM && (
                   <button 
                     onClick={() => handleAction(req.id, 'distribute')}
                     className="px-4 py-2 bg-status-green text-white rounded-xl font-bold text-xs"
                   >
                     ✅ Phân phối WBS cho Dev
                   </button>
                 )}
              </div>
            </div>

            {/* Visual Steps Tracker */}
            <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center relative gap-2">
               {[
                 { label: 'PM Ký', st: 'ESTIMATED' },
                 { label: 'Sale Giá', st: 'PRICED' },
                 { label: 'Khách Ký', st: 'CLIENT_SIGNED' },
                 { label: 'CEO Ký', st: 'CEO_SIGNED' },
                 { label: 'WBS', st: 'DISTRIBUTED' },
               ].map((step, sidx) => {
                 const isDone = requests.findIndex(r => r.id === req.id && r.status === step.st) >= 0 || (sidx === 0 && req.status !== 'PROPOSED');
                 // This logic is a bit crude for demo, in reality we'd check status precedence
                 return (
                   <div key={sidx} className={`flex items-center gap-1.5 ${sidx > 0 && 'flex-1 justify-center'}`}>
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${req.status === step.st ? 'bg-accent-blue text-white animate-pulse' : 'bg-bg-surface text-slate-700 border border-slate-700/30'}`}>
                       {sidx + 1}
                     </div>
                     <span className={`text-[9px] font-bold uppercase tracking-tight ${req.status === step.st ? 'text-white' : 'text-slate-700'}`}>{step.label}</span>
                     {sidx < 4 && <ChevronRight className="w-3 h-3 text-slate-800" />}
                   </div>
                 )
               })}
            </div>
          </div>
        ))}
        {requests.length === 0 && !loading && (
          <div className="bg-bg-card/50 p-12 rounded-3xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center opacity-60">
             <Plus className="w-8 h-8 text-slate-600 mb-4" />
             <p className="text-xs font-bold text-slate-500 italic">Chưa có yêu cầu Task/CR nào cần phê duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskRequestFlow;
