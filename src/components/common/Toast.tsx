import React from 'react';
import { useGame } from '../../context/GameContext';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useGame();

  if (!toast) return null;

  const config = {
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-[#180d14]/95',
      text: 'text-rose-400',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      accent: 'bg-rose-500/15',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-[#18150d]/95',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      accent: 'bg-amber-500/15',
    },
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-[#0d1813]/95',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      accent: 'bg-emerald-500/15',
    },
    info: {
      border: 'border-sky-500/40',
      bg: 'bg-[#0d141e]/95',
      text: 'text-sky-400',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      accent: 'bg-sky-500/15',
    },
  }[toast.type || 'info'];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto max-w-sm w-full animate-toast-slide">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/80 ${config.border} ${config.bg}`}
      >
        <div className={`p-2 rounded-xl ${config.accent}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <h4 className={`text-xs font-black uppercase tracking-wider mb-0.5 ${config.text}`}>
              {toast.title}
            </h4>
          )}
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={hideToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
