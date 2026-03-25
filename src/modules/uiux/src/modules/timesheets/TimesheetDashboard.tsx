import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check
} from 'lucide-react';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';

const TimesheetDashboard: React.FC = () => {
  const userStr = getCookie('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isPM = user?.role === Role.BRANCH_PM;
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const [timesheetData, setTimesheetData] = useState([
    { date: '2026-03-23', project: 'SkyLine ERP', task: 'Phân tích Business Process', hours: 8, status: 'Phê duyệt' },
    { date: '2026-03-22', project: 'Mobile Banking V2', task: 'Fix bug UI login', hours: 4, status: 'Phê duyệt' },
    { date: '2026-03-21', project: 'Core Banking API', task: 'Viết tài liệu Swagger', hours: 6, status: 'Chờ duyệt' },
    { date: '2026-03-20', project: 'AI Chatbot', task: 'Training model GPT-4', hours: 8, status: 'Phê duyệt' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(3);
  const [newLog, setNewLog] = useState({ project: 'SkyLine ERP', task: '', hours: 8 });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAddLog = () => {
    const today = new Date().toISOString().split('T')[0];
    const item = { 
      ...newLog, 
      date: today, 
      status: 'Chờ duyệt', 
      hours: Number(newLog.hours) 
    };
    setTimesheetData([item, ...timesheetData]);
    setIsSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsSuccess(false);
      setNewLog({ project: 'SkyLine ERP', task: '', hours: 8 });
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary">Chấm công & Cảnh báo Ngân sách</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Quản lý thời gian làm việc và tối ưu hóa chi phí nhân sự dự án.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-bg-card border border-border-primary rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setCurrentMonth(prev => Math.max(1, prev - 1))}
                className="p-2.5 hover:bg-bg-surface transition-all text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-5 py-2.5 flex items-center justify-center font-bold text-sm bg-bg-surface border-x border-border-primary text-text-primary gap-2 min-w-[150px]">
                 <CalendarIcon className="w-4 h-4 text-accent-blue" />
                 <span>Tháng {currentMonth < 10 ? `0${currentMonth}` : currentMonth}, 2026</span>
              </div>
              <button 
                onClick={() => setCurrentMonth(prev => Math.min(12, prev + 1))}
                className="p-2.5 hover:bg-bg-surface transition-all text-text-secondary hover:text-text-primary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
           >
             <Plus className="w-4 h-4" />
             <span>Chấm công mới</span>
           </button>
        </div>
      </div>

      {/* Warning Notification */}
      <div className="bg-gradient-to-r from-status-red/20 to-status-yellow/10 border border-status-red/30 p-5 rounded-2xl flex items-center justify-between shadow-xl shadow-status-red/5">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-status-red text-white flex items-center justify-center shadow-lg shadow-status-red/20 animate-pulse">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-extrabold text-status-red text-lg">Cảnh báo Ngân sách trượt</h3>
               <p className="text-text-secondary text-sm font-medium mt-0.5 max-w-xl leading-relaxed">
                 Dự án <span className="text-text-primary font-bold">Mobile Banking V2</span> đã đạt 95% ngân sách nhân sự. 
                 {isPM ? ' Cần theo dõi sát sao các hoạt động chấm công trong tuần này.' : ' Cần rà soát ngay các hoạt động chấm công trong tuần này.'}
               </p>
            </div>
         </div>
         {!isPM && (
           <button 
            onClick={() => alert('Đang gửi thông báo rà soát tới PM dự án...')}
            className="px-6 py-2.5 bg-white text-status-red rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all shadow-lg active:scale-95"
           >
              Rà soát ngay
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Weekly Timesheet View */}
        <div className="xl:col-span-2 bg-bg-card rounded-2xl border border-border-primary p-8 space-y-6">
           <div className="flex items-center justify-between pb-4 border-b border-border-primary">
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Thống kê tuần này</h3>
              <div className="flex gap-2">
                 <button 
                   onClick={() => {
                     const csv = "Date,Project,Task,Hours,Status\n" + timesheetData.map(d => `${d.date},${d.project},${d.task},${d.hours},${d.status}`).join("\n");
                     const blob = new Blob([csv], { type: 'text/csv' });
                     const url = window.URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.setAttribute('href', url);
                     a.setAttribute('download', 'timesheet_export.csv');
                     a.click();
                   }}
                   className="text-xs font-bold px-3 py-1.5 bg-bg-surface text-text-secondary rounded-lg border border-border-primary hover:text-text-primary transition-all"
                 >
                   Xuất Excel
                 </button>
                 <button className="text-xs font-bold px-3 py-1.5 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-all">Xem chi tiết</button>
              </div>
           </div>

           <div className="grid grid-cols-7 gap-4">
              {days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                   <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{day}</p>
                   <div className="w-full h-32 bg-bg-surface rounded-2xl border border-border-primary flex flex-col items-center justify-end p-2 relative group hover:border-accent-blue/40 transition-all overflow-hidden">
                      <div className={`w-full ${idx < 5 ? 'bg-accent-blue' : 'bg-slate-400 dark:bg-slate-700'} rounded-xl transition-all duration-700 mb-0 group-hover:opacity-100 opacity-80`} style={{ height: idx < 5 ? (idx === 0 ? '100%' : idx === 1 ? '50%' : '75%') : '10%' }}></div>
                      <span className="absolute top-2 font-black text-xs text-text-primary dark:text-white">{idx < 5 ? (idx === 0 ? '8h' : idx === 1 ? '4h' : '6h') : '0h'}</span>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 border-t border-border-primary space-y-4">
              <h4 className="text-sm font-bold text-text-secondary">Lịch sử chấm công gần đây</h4>
              <div className="space-y-3">
                {timesheetData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-surface/60 rounded-xl border border-border-primary hover:border-accent-blue/30 transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-bg-surface rounded-xl border border-border-primary flex items-center justify-center text-text-secondary group-hover:text-accent-blue transition-colors">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{item.project}</p>
                           <p className="text-xs text-text-secondary italic">{item.task}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <p className="text-sm font-black text-text-primary">{item.hours}h</p>
                           <p className="text-[10px] text-text-secondary font-medium uppercase">{item.date}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                           item.status === 'Phê duyệt' ? 'bg-status-green/10 text-status-green' : 'bg-status-yellow/10 text-status-yellow'
                        }`}>
                           {item.status}
                        </div>
                        <button className="p-1 px-2 hover:bg-bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-all border border-transparent hover:border-border-primary">
                           <MoreVertical className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Financial Health / Budget Alerts Sidebar */}
        <div className="space-y-8">
            <div className="bg-bg-card rounded-2xl border border-border-primary p-6 space-y-6">
               <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-blue" />
                  Utilization Rate
               </h3>
               <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                        <circle cx="80" cy="80" r="70" className="stroke-accent-blue fill-none transition-all duration-1000" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * 0.82)} strokeLinecap="round" />
                     </svg>
                     <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-text-primary">82.1%</span>
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Billable</span>
                     </div>
                  </div>
                  <div className="w-full mt-6 grid grid-cols-2 gap-4">
                     <div className="p-3 bg-bg-surface rounded-xl border border-border-primary text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Target</p>
                        <p className="text-lg font-black text-text-primary">85.0%</p>
                     </div>
                     <div className="p-3 bg-bg-surface rounded-xl border border-border-primary text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Variance</p>
                        <p className="text-lg font-black text-status-red">-2.9%</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border-primary space-y-4">
               <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Đề xuất tối ưu</h3>
               <div className="space-y-4">
                  {[
                    { title: 'Tăng cường Billable hours', desc: 'Team Lead Nguyen đang có 20% Non-billable tasks.' },
                    { title: 'Rà soát chi phí vượt định mức', desc: 'Dự án SkyLine đã sử dụng hết ngân sách dự phòng.' },
                  ].map((rec, i) => (
                    <div key={i} className="p-4 bg-bg-surface rounded-xl border-l-4 border-accent-blue hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border border-border-primary">
                       <p className="text-xs font-extrabold text-text-primary">{rec.title}</p>
                       <p className="text-[10px] text-text-secondary font-medium mt-1 leading-relaxed">{rec.desc}</p>
                    </div>
                  ))}
               </div>
               <button className="w-full py-2.5 mt-2 bg-bg-surface text-text-primary rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-border-primary">
                 Xem tất cả báo cáo
               </button>
            </div>
        </div>
      </div>

      {/* Add Timesheet Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Ghi nhận Chấm công Mới"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Dự án</label>
            <select 
              value={newLog.project}
              onChange={(e) => setNewLog({ ...newLog, project: e.target.value })}
              className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-blue outline-none font-bold"
            >
              <option value="SkyLine ERP">SkyLine ERP</option>
              <option value="Mobile Banking V2">Mobile Banking V2</option>
              <option value="Core Banking API">Core Banking API</option>
              <option value="AI Chatbot">AI Chatbot</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Nội dung công việc</label>
            <input 
              type="text"
              placeholder="VD: Nghiên cứu tài liệu, Code UI..."
              value={newLog.task}
              onChange={(e) => setNewLog({ ...newLog, task: e.target.value })}
              className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-blue outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Số giờ</label>
              <input 
                type="number"
                min="0"
                max="24"
                value={newLog.hours}
                onChange={(e) => setNewLog({ ...newLog, hours: Number(e.target.value) })}
                className="w-full p-4 bg-bg-surface border border-border-primary rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-blue outline-none font-black"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Ngày thực hiện</label>
              <div className="w-full p-4 bg-bg-surface/50 border border-border-primary rounded-2xl text-text-secondary font-bold flex items-center justify-between">
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button 
            disabled={isSuccess || !newLog.task}
            onClick={handleAddLog}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
              isSuccess 
              ? 'bg-status-green text-white' 
              : 'bg-accent-blue text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-6 h-6 animate-bounce" />
                <span>Đã ghi nhận!</span>
              </>
            ) : (
              <span>Xác nhận Ghi công</span>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TimesheetDashboard;
