import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Search, 
  Send, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu,
  Brain,
  Rocket,
  ArrowRight,
  History as HistoryIcon,
  Plus,
  User,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import { api } from '../../api';

const AICopilotDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { 
      role: 'ai', 
      content: t('ai.welcome'),
      suggestions: [
        t('ai.suggestion1'),
        t('ai.suggestion2'),
        t('ai.suggestion3'),
        t('ai.suggestion4')
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || query;
    if (!messageText.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: messageText }];
    setMessages(newMsgs);
    setQuery('');
    setIsTyping(true);

    try {
      // Call Backend AI Engine
      const response = await api.post('/ai-engine/chat', { query: messageText });
      setMessages([...newMsgs, { 
        role: 'ai', 
        content: response.content, 
        layout: response.layout,
        data: response.data 
      }]);
    } catch (error) {
      setMessages([...newMsgs, { 
        role: 'ai', 
        content: t('ai.error_msg') 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSimulating(false);
            setMessages(prevMsgs => [...prevMsgs, {
              role: 'ai',
              content: t('ai.sim_success')
            }]);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const aiInsights = [
    { title: t('ai.insight_res_title'), desc: t('ai.insight_res_desc'), type: 'Success' },
    { title: t('ai.insight_fin_title'), desc: t('ai.insight_fin_desc'), type: 'Warning' },
    { title: t('ai.insight_rev_title'), desc: t('ai.insight_rev_desc'), type: 'Info' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex gap-8 animate-in slide-in-from-left-5 duration-700 overflow-hidden">
      {/* AI Chat Interface */}
      <div className="flex-1 flex flex-col bg-bg-card rounded-3xl border border-border-primary overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Bot className="w-96 h-96 text-accent-blue" />
        </div>
        
        <div className="h-20 bg-bg-surface/40 border-b border-border-primary flex items-center justify-between px-8 z-10">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-blue rounded-2xl shadow-lg shadow-blue-500/30">
                 <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-text-primary italic">{t('ai.copilot_title')}</h3>
                 <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest flex items-center gap-1.5 underline decoration-accent-blue/30 underline-offset-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse"></span>
                    {t('ai.online_status')}
                 </p>
              </div>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all shadow-sm">
              <HistoryIcon className="w-4 h-4" /> {t('ai.req_history')}
           </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 z-10 custom-scrollbar scroll-smooth"
        >
           {messages.map((m, idx) => (
             <div key={idx} className={`flex gap-4 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 border border-white/10 ${m.role === 'user' ? 'bg-accent-blue ring-2 ring-accent-blue/20' : 'bg-accent-blue'}`}>
                 {m.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
               </div>
               
               <div className={`p-6 rounded-2xl text-sm leading-relaxed shadow-sm font-bold italic ${
                 m.role === 'user' ? 'bg-accent-blue text-white shadow-blue-500/20' : 'bg-bg-surface border border-border-primary text-text-primary'
               }`}>
                 {m.content}

                 {m.suggestions && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                       {m.suggestions.map((s: string, i: number) => (
                         <button 
                          key={i} 
                          onClick={() => handleSend(s)}
                          className="text-left px-4 py-3 bg-bg-card hover:bg-bg-surface rounded-xl text-[11px] font-bold text-text-secondary hover:text-accent-blue transition-all border border-border-primary flex items-center justify-between group shadow-sm"
                         >
                            {s}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                         </button>
                       ))}
                    </div>
                 )}

                 {m.layout === 'finance' && (
                   <div className="mt-4 space-y-4">
                      <ul className="space-y-3 font-bold italic">
                        <li className="flex gap-3">
                           <div className="w-1 h-auto bg-accent-blue rounded-full shrink-0 animate-pulse"></div>
                           <p className="text-xs text-text-secondary"><span className="text-text-primary font-black uppercase tracking-tighter decoration-accent-blue/30 underline decoration-2">{t('ai.finance_cash_flow')}:</span> {t('ai.finance_cash_flow_desc')}</p>
                        </li>
                        <li className="flex gap-3">
                           <div className="w-1 h-auto bg-status-yellow rounded-full shrink-0 animate-pulse"></div>
                           <p className="text-xs text-text-secondary"><span className="text-text-primary font-black uppercase tracking-tighter decoration-status-yellow/30 underline decoration-2">{t('ai.finance_cost')}:</span> {t('ai.finance_cost_desc')}</p>
                        </li>
                      </ul>
                   </div>
                 )}
                 {m.role === 'ai' && <p className="text-[10px] font-black uppercase text-text-secondary pt-2 opacity-50 italic tracking-widest border-t border-border-primary mt-2">{t('ai.data_updated', { time: new Date().toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'vi-VN') })}</p>}
               </div>
            </div>
           ))}

           {isTyping && (
             <div className="flex gap-4 max-w-2xl">
                <div className="w-10 h-10 rounded-xl bg-accent-blue flex items-center justify-center text-white shadow-lg shrink-0">
                   <Bot className="w-6 h-6" />
                </div>
                <div className="bg-bg-surface p-6 rounded-2xl border border-border-primary text-xs italic font-bold text-text-secondary animate-pulse flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   {t('ai.analyzing_msg')}
                </div>
             </div>
           )}
        </div>

        {/* Input Bar */}
        <div className="p-8 pt-0 z-10 bg-gradient-to-t from-bg-card via-bg-card to-transparent">
           <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="bg-bg-surface rounded-2xl p-2.5 flex items-center gap-4 border border-border-primary shadow-2xl ring-4 ring-accent-blue/5"
           >
              <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center group cursor-pointer hover:bg-accent-blue transition-all border border-border-primary">
                 <Plus className="w-5 h-5 text-text-secondary group-hover:text-white" />
              </div>
              <input 
                 type="text" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder={t('ai.input_placeholder')} 
                 className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary font-black italic"
              />
              <button 
                type="submit"
                disabled={isTyping}
                className="h-10 px-6 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 uppercase tracking-widest disabled:opacity-50"
              >
                 <Send className="w-4 h-4" />
                 <span>{t('ai.send_btn')}</span>
              </button>
           </form>
           <p className="text-[9px] text-text-secondary font-black text-center mt-4 uppercase tracking-[0.2em] opacity-50 italic">{t('ai.disclaimer')}</p>
        </div>
      </div>

      {/* AI Insights Sidebar */}
      <div className="w-96 flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar">
         {/* Live Performance Panel */}
         <div className="bg-bg-card rounded-3xl border border-border-primary p-6 space-y-6 shadow-xl">
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-2 italic">
               <Cpu className="w-4 h-4 text-accent-blue" />
               {t('ai.processing_status')}
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase italic">
                     <span className="text-text-secondary tracking-tighter">Neural Processing Unit</span>
                     <span className="text-status-green">{t('ai.processing_stable')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                     <div className="h-full bg-accent-blue animate-pulse" style={{ width: '92%' }}></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase italic">
                     <span className="text-text-secondary tracking-tighter">Data Integration Level</span>
                     <span className="text-accent-blue">{t('ai.processing_sync')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden border border-border-primary shadow-inner">
                     <div className="h-full bg-accent-blue" style={{ width: '100%' }}></div>
                  </div>
               </div>
            </div>
         </div>

         {/* AI Strategy Insights */}
         <div className="bg-bg-card rounded-3xl border border-border-primary p-6 space-y-6 flex-1 shadow-xl">
            <h3 className="text-sm font-black text-text-primary flex items-center gap-2 mb-4 italic uppercase tracking-tight underline decoration-accent-blue/30 underline-offset-4">
               <Brain className="w-5 h-5 text-accent-blue" />
               {t('ai.strategy_title')}
            </h3>
            <div className="space-y-4">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
                  insight.type === 'Success' ? 'bg-status-green/5 border-status-green/10 hover:border-status-green/30' : 
                  insight.type === 'Warning' ? 'bg-status-red/5 border-status-red/10 hover:border-status-red/30' : 
                  'bg-accent-blue/5 border-accent-blue/10 hover:border-accent-blue/30'
                }`}>
                   <div className="flex justify-between items-start mb-2">
                      <p className={`text-[10px] font-black uppercase italic tracking-wider ${
                        insight.type === 'Success' ? 'text-status-green' : 
                        insight.type === 'Warning' ? 'text-status-red' : 'text-accent-blue'
                      }`}>{insight.title}</p>
                      <Zap className={`w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity ${
                        insight.type === 'Success' ? 'text-status-green' : 
                        insight.type === 'Warning' ? 'text-status-red' : 'text-accent-blue'
                      }`} />
                   </div>
                   <p className="text-[11px] text-text-secondary font-bold leading-relaxed group-hover:text-text-primary transition-colors italic">{insight.desc}</p>
                </div>
              ))}
            </div>
         </div>

         <div className="bg-gradient-to-br from-indigo-600 to-accent-blue rounded-3xl p-6 text-white text-center space-y-4 shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute inset-0 bg-white/5 -rotate-12 translate-y-1/2 scale-150 blur-2xl group-hover:bg-white/10 transition-all duration-1000"></div>
            <Rocket className={`w-10 h-10 text-white mx-auto shadow-xl ${isSimulating ? 'animate-bounce' : ''}`} />
            <h4 className="text-lg font-black tracking-tight relative z-10 italic uppercase">
              {isSimulating ? t('ai.sim_forecast_title', { progress: simulationProgress }) : t('ai.forecast_title')}
            </h4>
            <p className="text-blue-100/70 text-[10px] font-black leading-relaxed relative z-10 uppercase tracking-widest px-2">
              {isSimulating ? t('ai.sim_calc_desc') : t('ai.forecast_desc')}
            </p>

            {isSimulating && (
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden absolute bottom-0 left-0">
                 <div className="h-full bg-white transition-all duration-300 shadow-lg" style={{ width: `${simulationProgress}%` }}></div>
              </div>
            )}

            <button 
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-4 bg-white text-indigo-700 rounded-xl font-black text-xs hover:bg-slate-100 transition-all relative z-10 shadow-xl shadow-blue-900/40 uppercase tracking-widest active:scale-95 disabled:opacity-50"
            >
              {isSimulating ? t('ai.running_btn') : t('ai.run_sim_btn')}
            </button>
         </div>
      </div>
    </div>
  );
};

export default AICopilotDashboard;
