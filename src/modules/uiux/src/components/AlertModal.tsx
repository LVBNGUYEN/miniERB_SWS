import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Loader2,
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onConfirm?: () => void;
  isSubmitting?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm,
  isSubmitting = false
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-12 h-12 text-status-green animate-in zoom-in-50 duration-500" />;
      case 'error': return <XCircle className="w-12 h-12 text-status-red animate-in zoom-in-50 duration-500" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-status-yellow animate-in zoom-in-50 duration-500" />;
      case 'confirm': return <AlertCircle className="w-12 h-12 text-accent-blue animate-in zoom-in-50 duration-500" />;
      default: return <Info className="w-12 h-12 text-accent-blue animate-in zoom-in-50 duration-500" />;
    }
  };

  const footer = (
    <div className="flex items-center justify-center gap-3 w-full">
      {type === 'confirm' ? (
        <>
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-6 py-2.5 rounded-xl bg-accent-blue text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('common.confirm')}
          </button>
        </>
      ) : (
        <button 
          onClick={onClose}
          className="w-full px-6 py-2.5 rounded-xl bg-bg-surface text-text-primary font-bold text-sm hover:bg-slate-700/10 transition-all border border-border-primary"
        >
          {t('common.close')}
        </button>
      )}
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      footer={footer}
    >
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="p-4 bg-bg-surface rounded-full shadow-inner border border-border-primary">
          {getIcon()}
        </div>
        <p className="text-sm font-medium text-text-primary leading-relaxed italic max-w-sm">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default AlertModal;
