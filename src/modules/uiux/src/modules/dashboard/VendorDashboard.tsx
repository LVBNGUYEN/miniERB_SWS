import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle2, Bot, ArrowRight, Zap, Check, Cpu } from 'lucide-react';
import Modal from '../../components/Modal';

interface VendorDashboardProps {
  userName: string;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ userName }) => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [aiModal, setAiModal] = useState({ isOpen: false, type: '' });
  const [isOptimizing, setIsOptimizing] = useState(false);

  const tasks = [
    { title: 'Tokyo Tech Frontend Dev', deadline: '2024-03-30', hours: 40, status: 'Đang thực hiện', desc: 'Xây dựng module Dashboard cho đối tác Nhật Bản bằng React/Tailwind.' },
    { title: 'AMIT ERP Backend Sync', deadline: '2024-04-05', hours: 24, status: 'Chờ phê duyệt', desc: 'Đồng bộ dữ liệu SQL Server với PostgreSQL thông qua kiến trúc Microservices.' },
    { title: 'API Integration V2', deadline: '2024-03-25', hours: 16, status: 'Hoàn thành', desc: 'Tích hợp API thanh toán VNPay và ví điện tử MoMo.' },
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setAiModal({ ...aiModal, isOpen: false });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-status-green text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-emerald-500/20 italic border border-white/20">THỰC THI CHIẾN LƯỢC</span>
            <span className="w-2 h-2 bg-status-green rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
          </div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-status-green/20 underline-offset-8">Bảng thực thi: {userName}</h2>
          <p className="text-text-secondary text-sm font-bold mt-4 italic opacity-80 decoration-status-green/10 underline underline-offset-4">Phân tích hiệu suất thực tế & bàn giao công việc kỹ thuật tinh gọn.</p>
        </div>
        <button 
          onClick={() => navigate('/timesheets')}
          className="flex items-center gap-3 px-6 py-4 bg-status-green text-white rounded-2xl font-black text-xs shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-white/10"
        >
          <Clock className="w-5 h-5" />
          <span>Khai báo công việc (Timesheet)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Giờ làm hôm nay', value: '8.5h', icon: Clock },
          { label: 'Dự án đang tham gia', value: '3', icon: Briefcase },
          { label: 'Task hoàn thành (Tuần)', value: '12', icon: CheckCircle2 },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-3xl border border-border-primary relative overflow-hidden group shadow-xl hover:border-status-green/40 transition-all hover:shadow-emerald-500/5">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <kpi.icon className="w-16 h-16 text-status-green" />
             </div>
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-4 italic">{kpi.label}</p>
             <p className="text-3xl font-black text-text-primary font-mono italic tracking-tighter">{kpi.value}</p>
             <div className="mt-4 h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                <div className="h-full bg-status-green shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ width: '70%' }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between pb-6 border-b border-border-primary">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10 underline-offset-4">
                 <Briefcase className="w-6 h-6 text-accent-blue" />
                 Hạng mục Công việc (Task List)
              </h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-status-green shadow-lg"></div>
                 <div className="w-2 h-2 rounded-full bg-border-primary"></div>
                 <div className="w-2 h-2 rounded-full bg-border-primary"></div>
              </div>
           </div>
           <div className="space-y-4">
              {tasks.map((t, i) => (
                 <div 
                   key={i} 
                   onClick={() => setSelectedTask(t)}
                   className="flex items-center justify-between p-5 bg-bg-surface/30 rounded-2xl border border-border-primary group hover:border-accent-blue/30 transition-all cursor-pointer hover:bg-bg-card shadow-sm hover:shadow-lg relative overflow-hidden"
                 >
                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                        t.status === 'Đang thực hiện' ? 'bg-status-yellow' : 
                        t.status === 'Hoàn thành' ? 'bg-status-green' : 'bg-accent-blue'
                    }`}></div>
                    <div className="pl-2 space-y-1">
                       <p className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-all italic uppercase tracking-tight underline decoration-transparent group-hover:decoration-accent-blue">{t.title}</p>
                       <p className="text-[10px] text-text-secondary mt-1 font-black italic uppercase tracking-widest opacity-60">Thời gian dự kiến: <span className="text-text-primary underline decoration-accent-blue/10 underline-offset-2">{t.hours} Giờ</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest border ${
                           t.status === 'Đang thực hiện' ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20' : 
                           t.status === 'Hoàn thành' ? 'bg-status-green/10 text-status-green border-status-green/20' : 
                           'bg-accent-blue/10 text-accent-blue border-accent-blue/20 shadow-inner'
                       }`}>{t.status}</span>
                       <button className="p-2 bg-bg-surface rounded-xl border border-border-primary opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                          <ArrowRight className="w-4 h-4 text-accent-blue" />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-bg-card rounded-3xl p-8 border border-border-primary space-y-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
              <Bot className="w-64 h-64 text-status-green" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-status-green/10 rounded-2xl border border-status-green/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="w-8 h-8 text-status-green shadow-xl" />
                 </div>
                 <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight underline decoration-status-green/20 underline-offset-8">AI Execution Coach</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-bold italic pr-8 uppercase tracking-wide opacity-80 border-l-4 border-status-green/30 pl-4">
                 Phân tích tốc độ hoàn thành công việc và đề xuất lộ trình tối ưu hóa thực thi (Velocity Tracking & Optimization).
              </p>
              <div className="pt-8 flex flex-col md:flex-row gap-4">
                 <button 
                  onClick={() => setAiModal({ isOpen: true, type: 'velocity' })}
                  className="flex-1 px-6 py-4 bg-bg-surface text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border-primary hover:bg-slate-700/10 dark:hover:bg-slate-800 transition-all active:scale-95 italic shadow-xl"
                 >
                   TRA CỨU VẬN TỐC
                 </button>
                 <button 
                  onClick={() => setAiModal({ isOpen: true, type: 'optimize' })}
                  className="flex-1 px-6 py-4 bg-status-green text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-green-900/40 hover:bg-emerald-600 transition-all active:scale-95 italic border border-white/10"
                 >
                   KÍCH HOẠT TỐI ƯU
                 </button>
              </div>
           </div>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-status-green/5 rounded-full blur-3xl group-hover:bg-status-green/10 transition-all duration-1000"></div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <Modal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        title="Chi tiết Bàn giao Công việc"
      >
        {selectedTask && (
          <div className="space-y-8 p-4">
            <div className="p-6 bg-bg-surface rounded-3xl border-l-8 border-status-green border border-border-primary shadow-inner">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-2 italic ml-1">Dự án hiện tại</p>
              <h4 className="text-xl font-black text-text-primary italic uppercase tracking-tight decoration-accent-blue/20 underline decoration-2">AMIT ERP Core System v2.0</h4>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">Tên đầu việc</span>
                <span className="text-sm font-black text-text-primary italic uppercase tracking-tight">{selectedTask.title}</span>
              </div>
              <div className="flex justify-between items-center pb-5 border-b border-border-primary">
                <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-widest">Tình trạng thực thi</span>
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest border ${
                  selectedTask.status === 'Đang thực hiện' ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20 shadow-inner' : 
                  selectedTask.status === 'Hoàn thành' ? 'bg-status-green/10 text-status-green border-status-green/20' : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                }`}>{selectedTask.status}</span>
              </div>
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-primary shadow-inner leading-relaxed text-sm font-bold text-text-secondary italic">
                 <p className="border-b border-border-primary pb-3 mb-3 text-[10px] uppercase font-black tracking-widest text-text-primary/50">Mô tả chi tiết:</p>
                {selectedTask.desc}
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedTask(null);
                navigate('/timesheets');
              }}
              className="w-full py-5 bg-status-green text-white rounded-3xl font-black text-md uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 italic border border-white/10"
            >
              CẬP NHẬT TIẾN ĐỘ THỰC TẾ
            </button>
            <p className="text-[9px] text-text-secondary font-black uppercase text-center opacity-40 italic mt-2 tracking-widest">Dữ liệu sẽ được đồng bộ ngay lập tức tới PM phụ trách.</p>
          </div>
        )}
      </Modal>

      {/* AI Interaction Modal */}
      <Modal 
        isOpen={aiModal.isOpen} 
        onClose={() => setAiModal({ ...aiModal, isOpen: false })} 
        title={aiModal.type === 'velocity' ? 'Phân tích Vận tốc (Velocity Dashboard)' : 'Gợi ý Lộ trình Tối ưu Thực thi'}
      >
        <div className="space-y-8 p-4">
          {aiModal.type === 'velocity' ? (
            <div className="space-y-6">
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-primary shadow-inner space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-secondary italic uppercase tracking-[0.2em]">Chỉ số Vận tốc thực tế</span>
                  <span className="text-sm font-black text-status-green italic">VƯỢT 12% KẾ HOẠCH</span>
                </div>
                <div className="h-4 w-full bg-bg-card border border-border-primary rounded-full overflow-hidden shadow-inner p-1">
                  <div className="h-full bg-status-green rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div className="p-6 bg-bg-surface rounded-3xl border-l-8 border-accent-blue shadow-lg">
                <p className="text-sm text-text-primary font-bold italic leading-relaxed">
                  "Dựa trên các phân hệ đã thực hiện, bạn đang hoàn thành task nhanh hơn dự kiến trung bình 0.5 ngày. Điều này đóng góp trực tiếp vào CSAT (98%) của Tokyo Tech."
                </p>
              </div>
              <p className="text-[9px] text-text-secondary font-black text-center uppercase tracking-widest opacity-40 italic">Báo cáo cập nhật theo từng giờ công được khai báo.</p>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="p-6 bg-status-green/5 rounded-3xl border border-status-green/20 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-12 h-12 text-status-green animate-bounce" />
                  </div>
                  <div className="flex gap-4">
                    <Zap className="w-10 h-10 text-status-green shrink-0 shadow-xl" />
                    <div>
                        <p className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-2">Đề xuất ưu tiên (AI Agent):</p>
                        <p className="text-md font-black text-text-primary italic leading-relaxed uppercase tracking-tight underline decoration-status-green/10 underline-offset-4">Ưu tiên hoàn thiện "Frontend Dev" trong sáng nay để giải phóng Pipeline cho đội ngũ QC và kịp tiến độ Demo Tokyo Stage 2.</p>
                    </div>
                  </div>
               </div>
               <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full py-5 bg-status-green text-white rounded-3xl font-black text-md uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 active:scale-95 disabled:opacity-50 italic flex items-center justify-center gap-4 border border-white/10"
               >
                 {isOptimizing ? <><Cpu className="w-6 h-6 animate-spin text-white" /> <span>ĐANG KHỞI CHẠY LỘ TRÌNH...</span></> : 'ÁP DỤNG LỘ TRÌNH TỐI ƯU CỦA AI'}
               </button>
               <p className="text-[9px] text-text-secondary font-black text-center uppercase tracking-widest opacity-50 italic">Hành động này sẽ cập nhật lại thứ tự ưu tiên trong Task List của bạn.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default VendorDashboard;
