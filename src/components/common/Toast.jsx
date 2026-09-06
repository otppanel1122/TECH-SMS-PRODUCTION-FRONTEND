import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
    info: <Info className="w-5 h-5 text-brand-500 dark:text-brand-400" />,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10',
    error: 'border-rose-500/30 bg-rose-50 dark:bg-rose-500/10',
    info: 'border-brand-500/30 bg-brand-50 dark:bg-brand-500/10',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} backdrop-blur-sm max-w-md shadow-lg animate-slide-up`}>
      {icons[type]}
      <span className="text-sm text-slate-800 dark:text-slate-200 flex-1">{message}</span>
      <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>
    </div>
  );
};

export default Toast;
