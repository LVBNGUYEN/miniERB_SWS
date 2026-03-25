import React from 'react';
import { 
  FileSignature, 
  Files, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  Eye, 
  MoreHorizontal, 
  Plus,
  Lock,
  History
} from 'lucide-react';

const DigitalSignatureDashboard: React.FC = () => {
  const documents = [
    { name: 'Hợp đồng Cung ứng SkyLine ERP v2.pdf', date: '23/03/2026', status: 'Đã hoàn tất', size: '2.4 MB', type: 'Hợp đồng' },
    { name: 'Biên bản Nghiệm thu Giai đoạn 1.pdf', date: '22/03/2026', status: 'Chờ đối tác ký', size: '1.2 MB', type: 'Báo cáo' },
    { name: 'Phụ lục Tài chính - Nguyen Van A.pdf', date: '20/03/2026', status: 'Hết hạn', size: '0.8 MB', type: 'Tài chính' },
    { name: 'Chính sách Bảo mật & IAM v2.pdf', date: '19/03/2026', status: 'Đã ký', size: '3.1 MB', type: 'Bảo mật' },
  ];

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20 underline-offset-8">Phòng Ký Kết Điện Tử (PKI Gateway)</h2>
          <p className="text-text-secondary text-sm font-medium mt-3 italic">Xác thực pháp lý, chữ ký số CA và bảo mật văn bản cấp tập đoàn.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-6 py-3 bg-accent-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30 active:scale-95">
            <Plus className="w-5 h-5" />
            <span>Tạo yêu cầu ký mới</span>
          </button>
        </div>
      </div>

      {/* Signing Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Yêu cầu chờ ký', value: '12', icon: Clock, color: 'text-status-yellow' },
          { label: 'Đã hoàn tất ký', value: '1,204', icon: CheckCircle2, color: 'text-status-green' },
          { label: 'Hết hạn/Hủy', value: '08', icon: AlertCircle, color: 'text-status-red' },
          { label: 'Chữ ký hợp lệ', value: '100%', icon: ShieldCheck, color: 'text-accent-blue' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-3xl border border-border-primary flex flex-col items-center text-center group cursor-pointer hover:border-accent-blue transition-all shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <stat.icon className="w-16 h-16" />
             </div>
             <div className={`p-4 rounded-2xl bg-bg-surface mb-4 group-hover:scale-110 transition-transform ${stat.color} shadow-inner border border-border-primary ring-4 ring-white/5`}>
                <stat.icon className="w-7 h-7" />
             </div>
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] italic">{stat.label}</p>
             <h3 className="text-2xl font-black text-text-primary mt-2 italic tracking-tighter uppercase">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Document Repository */}
        <div className="xl:col-span-2 bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-primary">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight italic underline decoration-accent-blue/10">
                 <Files className="w-6 h-6 text-accent-blue" />
                 Kho lưu trữ Hợp đồng PKI CA
              </h3>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-bg-surface border border-border-primary rounded-xl text-[10px] font-black uppercase italic tracking-widest text-text-secondary hover:text-text-primary transition-all shadow-sm">Lọc loại tài liệu</button>
                 <button className="px-4 py-2 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95">Nhật ký Audit</button>
              </div>
           </div>

           <div className="space-y-4">
              {documents.map((doc, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-bg-surface/40 rounded-3xl border border-border-primary hover:bg-bg-card hover:border-accent-blue/30 transition-all group shadow-sm relative overflow-hidden">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-bg-surface rounded-2xl border border-border-primary flex items-center justify-center text-text-secondary group-hover:bg-accent-blue/10 group-hover:text-accent-blue group-hover:scale-110 transition-all shadow-inner group-hover:rotate-6">
                         <FileSignature className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-all cursor-pointer italic uppercase tracking-tight underline decoration-transparent hover:decoration-accent-blue">{doc.name}</p>
                         <p className="text-[10px] text-text-secondary font-black tracking-widest mt-1 italic uppercase opacity-60">{doc.type} • {doc.size} • Tải lên: {doc.date}</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-primary/50">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border ${
                         doc.status === 'Đã hoàn tất' ? 'bg-status-green/10 text-status-green border-status-green/20 shadow-inner' :
                         doc.status === 'Chờ đối tác ký' ? 'bg-status-yellow/10 text-status-yellow border-status-yellow/20 animate-pulse' :
                         'bg-bg-surface text-status-red border-status-red/20 opacity-80'
                      }`}>
                         {doc.status}
                      </span>
                      <div className="flex gap-2">
                         <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-accent-blue rounded-xl transition-all border border-border-primary hover:shadow-lg active:scale-90"><Eye className="w-4 h-4" /></button>
                         <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border-primary hover:shadow-lg active:scale-90"><Download className="w-4 h-4" /></button>
                         <button className="p-2.5 bg-bg-surface text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border-primary hover:shadow-lg active:scale-90"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 border-t border-border-primary flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-text-secondary italic uppercase font-black tracking-widest text-center md:text-left opacity-60">
              <p className="max-w-md leading-relaxed">Tất cả văn bản được mã hóa AES-256 tầng sâu và lưu trữ trên Cloud PKI trung tâm của tập đoàn AMIT.</p>
              <button className="font-black text-accent-blue hover:text-blue-400 hover:underline transition-all cursor-pointer decoration-accent-blue/30 underline-offset-4">Quản trị chứng thư số (CA Center)</button>
           </div>
        </div>

        {/* Legal & Security Panel */}
        <div className="space-y-8">
           <div className="bg-bg-card rounded-3xl border border-border-primary p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic underline decoration-status-green/20 underline-offset-4">
                 <ShieldCheck className="w-5 h-5 text-status-green" />
                 Chứng chỉ CA định danh
              </h3>
              <div className="p-6 bg-bg-surface/50 rounded-2xl border border-border-primary space-y-6 shadow-inner">
                 <div className="flex justify-between items-center border-b border-border-primary pb-3">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic opacity-60">Nhà xuất bản</p>
                    <p className="text-xs font-black text-text-primary italic tracking-tight uppercase underline decoration-accent-blue/20 underline-offset-4">VNPT-CA Global</p>
                 </div>
                 <div className="flex justify-between items-center border-b border-border-primary pb-3">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic opacity-60">Hết hạn (Expires)</p>
                    <p className="text-xs font-black text-status-yellow italic tracking-tight">12/12/2026</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic opacity-60">Thuật toán ký</p>
                    <p className="text-xs font-black text-accent-blue uppercase font-mono tracking-widest brightness-110">RSA-4096 / SHA-256</p>
                 </div>
              </div>
              <button className="w-full py-4 bg-bg-surface border border-border-primary text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-700/10 dark:hover:bg-slate-700 transition-all shadow-xl active:scale-95 italic ring-4 ring-transparent hover:ring-accent-blue/5">
                 Gia hạn chứng thư CA ngay
              </button>
           </div>

           <div className="bg-bg-card rounded-3xl p-8 border border-border-primary space-y-6 shadow-2xl relative overflow-hidden group hover:border-accent-blue/30 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
                 <Lock className="w-48 h-48 text-accent-blue" />
              </div>
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] flex items-center gap-3 relative z-10 italic underline decoration-accent-blue/20 underline-offset-4">
                 <History className="w-4 h-4 text-accent-blue" />
                 Truy vết chuyển mạch kỹ thuật
              </h3>
              <div className="space-y-6 relative z-10">
                 {[
                   { user: 'Admin Alex', action: 'Ký duyệt Hợp đồng v2', time: '11:15' },
                   { user: 'Partner Tokyo', action: 'Mở tài liệu Giai đoạn 1', time: '10:42' },
                   { user: 'System Bot', action: 'Xác thực CA RSA-4096', time: '09:15' },
                 ].map((log, i) => (
                   <div key={i} className="flex justify-between items-center text-[10px] border-l-4 border-border-primary pl-4 py-1 hover:border-accent-blue transition-all group/item cursor-default">
                      <div className="space-y-0.5">
                         <span className="font-black text-text-primary italic uppercase tracking-tighter group-hover/item:text-accent-blue transition-colors">{log.user}</span>
                         <p className="text-text-secondary font-black italic opacity-60 uppercase text-[9px] tracking-widest">{log.action}</p>
                      </div>
                      <span className="text-text-secondary opacity-40 font-mono italic font-black">{log.time}</span>
                   </div>
                 ))}
              </div>
              <p className="text-[8px] font-black uppercase text-text-secondary/30 italic text-center mt-4 tracking-[0.4em]">Audit Trail Active Security Level 5</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignatureDashboard;
