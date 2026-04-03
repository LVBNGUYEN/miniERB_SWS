import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex bg-slate-800/40 p-1 rounded-xl border border-slate-700/50">
       <button 
         onClick={() => changeLanguage('vi')}
         className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${i18n.language === 'vi' ? 'bg-accent-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
       >
         VN
       </button>
       <button 
         onClick={() => changeLanguage('en')}
         className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${i18n.language === 'en' ? 'bg-accent-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
       >
         EN
       </button>
    </div>
  );
};

export default LanguageSwitcher;
