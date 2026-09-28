import React from 'react';
import { ArrowLeft, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const GameHeader: React.FC<{
  title: string;
  icon: string;
  badge: string;
  onBack: () => void;
  headerRight?: React.ReactNode;
}> = ({ title, icon, badge, onBack, headerRight }) => (
  <div className="flex items-center justify-between px-2 mb-3">
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onBack}
        className="w-8 h-8 rounded-xl bg-[#101928] border border-[#1b2b42] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        title="Back to Games"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2">
        <img src={icon} alt={title} className="w-7 h-7 rounded-lg object-cover" />
        <h2 className="text-base font-black text-white tracking-wide uppercase">{title}</h2>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          {badge || '99% RTP'}
        </span>
      </div>
    </div>
    {headerRight}
  </div>
);

export const ManualAutoTabs: React.FC<{
  mode?: 'manual' | 'auto';
  setMode?: (m: 'manual' | 'auto') => void;
}> = () => (
  <div className="bg-[#080d16] p-1 rounded-xl flex items-center border border-[#141f30]">
    <div className="w-full py-1.5 rounded-lg text-xs font-bold text-center bg-[#182638] text-white shadow-sm border border-[#2a3d58]">
      Manual
    </div>
  </div>
);

export const BetInput: React.FC<{
  value: string;
  setValue: (v: string) => void;
  disabled?: boolean;
  label?: string;
}> = ({ value, setValue, disabled, label = 'Bet Amount' }) => {
  const { currencyLabel, currencyIcon, balance, activeCurrency } = useGame();
  const minVal = activeCurrency === 'BGLS' ? 0.0001 : 0.01;
  const stepStr = activeCurrency === 'BGLS' ? '0.0001' : '0.01';

  const halve = () => {
    const cur = Number(value) || 1;
    const next = Math.max(minVal, cur / 2);
    const decimals = activeCurrency === 'BGLS' ? 4 : 2;
    const formatted = parseFloat(next.toFixed(decimals)).toString();
    setValue(formatted);
  };

  const double = () => {
    const cur = Number(value) || 1;
    const decimals = activeCurrency === 'BGLS' ? 4 : 2;
    const maxBalance = Math.max(minVal, Number(balance.toFixed(decimals)));
    const next = Math.min(maxBalance, cur * 2);
    const formatted = parseFloat(next.toFixed(decimals)).toString();
    setValue(formatted);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{label}</span>
      </div>
      <div className="bg-[#0b121e] border border-[#1a2638] rounded-xl flex items-center px-3 py-2 focus-within:border-[#0074e4] transition-colors">
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
        </div>
        <input
          type="number"
          step={stepStr}
          min={minVal}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-transparent text-white font-mono font-bold text-sm outline-none px-2 disabled:opacity-50"
          placeholder={minVal.toString()}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={halve}
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            ½
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={double}
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            2×
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'green' | 'blue' | 'purple' | 'red' }
> = ({ tone = 'blue', className = '', ...props }) => {
  const toneClasses = {
    blue: 'bg-[#0074e4] hover:bg-[#0082ff] active:bg-[#0066cc] text-white shadow-lg shadow-[#0074e4]/25',
    green: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25',
    purple: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-lg shadow-purple-500/25',
    red: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25',
  }[tone];

  return (
    <button
      {...props}
      className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${toneClasses} ${className}`}
    />
  );
};

export const ResultPill: React.FC<{ win?: boolean; children: React.ReactNode }> = ({ win, children }) => (
  <div
    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-lg flex items-center justify-center gap-2 animate-in zoom-in-90 ${
      win
        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
        : 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-500/20'
    }`}
  >
    {children}
  </div>
);

export const PayoutMultiplierStats: React.FC<{
  nextMultiplier?: number | string;
  currentMultiplier?: number | string;
  currentPayout?: number | string;
  hideNextMultiplier?: boolean;
}> = ({ nextMultiplier, currentMultiplier, currentPayout, hideNextMultiplier = false }) => {
  const { currencyIcon, currencyLabel, toActiveAmount, activeCurrency } = useGame();

  const nextStr =
    nextMultiplier !== undefined
      ? typeof nextMultiplier === 'number'
        ? `${nextMultiplier.toFixed(2)}×`
        : nextMultiplier
      : '-';

  const multStr =
    currentMultiplier !== undefined
      ? typeof currentMultiplier === 'number'
        ? `${currentMultiplier.toFixed(2)}×`
        : currentMultiplier
      : null;

  const payoutStr =
    currentPayout !== undefined
      ? typeof currentPayout === 'number'
        ? toActiveAmount(currentPayout).toFixed(activeCurrency === 'BGLS' ? 4 : 2)
        : toActiveAmount(Number(currentPayout) || 0).toFixed(activeCurrency === 'BGLS' ? 4 : 2)
      : '0.00';

  return (
    <div className="space-y-3 pt-1">
      {/* Next Multiplier Box */}
      {!hideNextMultiplier && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Next Multiplier</label>
          <div className="bg-[#0b121e] border border-[#1a2638] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono font-bold">
            {nextStr}
          </div>
        </div>
      )}

      {/* Current Payout Box */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400">
          Current Payout {multStr ? `(${multStr})` : ''}
        </label>
        <div className="bg-[#0b121e] border border-[#1a2638] rounded-xl flex items-center px-3 py-2 text-xs text-slate-200 font-mono font-bold">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 mr-2">
            <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
          </div>
          <span>{payoutStr}</span>
        </div>
      </div>
    </div>
  );
};

export const GameShell: React.FC<{
  title: string;
  icon: string;
  badge: string;
  onBack: () => void;
  controls: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  bottom?: React.ReactNode;
}> = ({ title, icon, badge, onBack, controls, children, headerRight, bottom }) => {
  const { liveBets } = useGame();

  return (
    <div className="mx-auto w-full max-w-[1100px] flex flex-col gap-3 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation */}
      <GameHeader title={title} icon={icon} badge={badge} onBack={onBack} headerRight={headerRight} />

      {/* Main Game Shell Console (matching media_1789394088411.png exactly) */}
      <div className="w-full rounded-2xl bg-[#0e1624] border border-[#1a283c] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)] min-h-[500px]">
        {/* Left Sidebar Control Panel */}
        <div className="w-full bg-[#0b121e] border-b lg:border-b-0 lg:border-r border-[#162337] p-4 flex flex-col justify-between space-y-4">
          {controls}
        </div>

        {/* Right Canvas / Arena */}
        <div className="bg-[#070c14] p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[480px]">
          {children}
        </div>
      </div>

      {bottom}
    </div>
  );
};

export const CashoutCardOverlay: React.FC<{
  multiplier: number | string;
  payout: number | string;
}> = ({ multiplier, payout }) => {
  const { currencyIcon, toActiveAmount } = useGame();
  const multStr = typeof multiplier === 'number' ? `${multiplier.toFixed(2)}×` : multiplier;
  const numPay = typeof payout === 'number' ? payout : Number(payout) || 0;
  const payStr = toActiveAmount(numPay).toFixed(2);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#0b121e]/95 backdrop-blur-md border-2 border-[#00e701] rounded-2xl py-3 px-6 sm:py-4 sm:px-8 min-w-[150px] sm:min-w-[170px] flex flex-col items-center justify-center shadow-[0_0_35px_rgba(0,231,1,0.3)] select-none">
        <span className="text-2xl sm:text-3xl font-black text-[#00e701] font-mono tracking-tight leading-none mb-2">
          {multStr}
        </span>
        <div className="w-14 sm:w-16 h-[1px] bg-slate-700/80 mb-2" />
        <div className="flex items-center justify-center gap-1.5 font-mono font-black text-white text-sm sm:text-base leading-none">
          <span>{payStr}</span>
          <img src={currencyIcon} alt="currency" className="w-4 h-4 object-contain shrink-0" />
        </div>
      </div>
    </div>
  );
};
