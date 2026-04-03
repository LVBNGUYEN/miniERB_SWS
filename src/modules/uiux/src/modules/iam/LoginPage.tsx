import React, { useState } from 'react';
import {
   Lock,
   Mail,
   Eye,
   EyeOff,
   ArrowRight,
   AppWindow,
   ShieldCheck,
   Globe,
   Bot
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { setCookie } from '../../utils/cookie';

const LoginPage: React.FC = () => {
   const { t } = useTranslation();
   const [showPassword, setShowPassword] = useState(false);
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [remember, setRemember] = useState(false);
   const navigate = useNavigate();

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
         const res = await api.post('/iam/sign-in', { email, password });
         const expiryDays = remember ? 7 : 1;
         setCookie('access_token', res.access_token, expiryDays);
         setCookie('user', JSON.stringify(res.user), expiryDays);
         navigate('/');
      } catch (err) {
         setError(t('login.error_failed'));
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center p-6 relative overflow-hidden font-inter">
         {/* Background Orbs */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

         <div className="w-full max-w-[1100px] bg-bg-card rounded-[32px] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] relative z-10 backdrop-blur-xl">
            {/* Left Side: Branding & Info */}
            <div className="w-full md:w-[45%] bg-gradient-to-br from-indigo-600 via-blue-700 to-accent-blue p-12 flex flex-col justify-between relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -rotate-12 scale-150 blur-3xl pointer-events-none"></div>

               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 transform -rotate-6 group-hover:rotate-0 transition-transform">
                        <AppWindow className="text-blue-700 w-7 h-7" />
                     </div>
                     <span className="text-2xl font-black text-white italic tracking-tight">AMIT<span className="opacity-60 not-italic">.ERP</span></span>
                  </div>

                  <div className="space-y-4 pt-8">
                     <h1 className="text-4xl font-extrabold text-white leading-tight">{t('login.branding_title')}</h1>
                     <p className="text-blue-100/70 text-sm font-medium leading-relaxed max-w-[280px]">{t('login.branding_subtitle')}</p>
                  </div>
               </div>

               <div className="relative z-10 space-y-8 pb-4">
                  <div className="flex items-center gap-4 group/item cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md group-hover/item:bg-white/20 transition-all border border-white/10 shadow-lg">
                        <ShieldCheck className="w-5 h-5 text-white" />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{t('login.shield_title')}</p>
                        <p className="text-[10px] text-blue-100/50 font-medium">{t('login.shield_desc')}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 group/item cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md group-hover/item:bg-white/20 transition-all border border-white/10 shadow-lg">
                        <Globe className="w-5 h-5 text-white" />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{t('login.globe_title')}</p>
                        <p className="text-[10px] text-blue-100/50 font-medium">{t('login.globe_desc')}</p>
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
                  <Bot className="w-64 h-64 text-white" />
               </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 bg-bg-card p-12 lg:p-20 flex flex-col justify-center">
               <div className="max-w-[360px] mx-auto w-full space-y-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-text-primary tracking-tight italic">{t('login.title')}</h2>
                     <p className="text-text-secondary text-sm font-bold flex items-center gap-2">
                        {t('login.subtitle')}
                        <span className="w-1.5 h-1.5 rounded-full bg-status-green shadow-[0_0_8px_rgba(22,163,74,0.6)]"></span>
                     </p>
                  </div>

                  {error && (
                     <div className="p-4 bg-status-red/10 border border-status-red/20 rounded-xl text-status-red text-xs font-bold animate-in bounce-in">
                        {error}
                     </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-6">
                     <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1 group-focus-within:text-accent-blue transition-colors">{t('login.label_account')}</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-blue transition-colors">
                              <Mail className="w-4 h-4" />
                           </div>
                           <input
                              type="email"
                              value={email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                              placeholder={t('login.placeholder_email')}
                              className="w-full bg-bg-surface border border-border-primary rounded-2xl py-3.5 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/5 transition-all font-medium"
                              required
                           />
                        </div>
                     </div>

                     <div className="space-y-2 group">
                        <div className="flex justify-between items-center ml-1">
                           <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] group-focus-within:text-accent-blue transition-colors">{t('login.label_password')}</label>
                           <button type="button" className="text-[10px] font-black text-accent-blue hover:underline uppercase tracking-tight">{t('login.forgot_password')}</button>
                        </div>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-blue transition-colors">
                              <Lock className="w-4 h-4" />
                           </div>
                           <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full bg-bg-surface border border-border-primary rounded-2xl py-3.5 pl-12 pr-12 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/5 transition-all font-mono"
                              required
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                           >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 pt-2">
                        <input
                           type="checkbox"
                           id="remember"
                           checked={remember}
                           onChange={(e) => setRemember(e.target.checked)}
                           className="w-4 h-4 rounded border-border-primary bg-bg-surface text-accent-blue focus:ring-accent-blue/20 cursor-pointer"
                        />
                        <label htmlFor="remember" className="text-xs font-bold text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                           {t('login.remember_me')}
                        </label>
                     </div>

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-accent-blue to-indigo-600 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 text-sm hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-accent-blue/25 transition-all active:translate-y-[1px] disabled:opacity-50"
                     >
                        {loading ? t('login.loading') : t('login.btn_login')}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                     </button>
                  </form>

               </div>
            </div>
         </div>
      </div>
   );
};
export default LoginPage;
