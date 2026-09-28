import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';

export const WalletModal: React.FC = () => {
  const {
    walletModalOpen,
    setWalletModalOpen,
    walletTab,
    setWalletTab,
    user,
    activeCurrency,
    balance,
    formatBalance,
    toActiveAmount,
    fromActiveAmount,
    currencyLabel,
    currencyIcon,
    deposit,
    withdraw,
    tip,
  } = useGame();

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('10');
  const [withdrawGrowId, setWithdrawGrowId] = useState<string>(user.growId || user.username);
  const [withdrawWorld, setWithdrawWorld] = useState<string>('VOIDTRADE');
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tip state
  const [tipTarget, setTipTarget] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('5');
  const [tipNote, setTipNote] = useState<string>('');
  const [tipMsg, setTipMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!walletModalOpen) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    sound.playClick();
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateDeposit = () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;
    const dlsVal = fromActiveAmount(val);
    deposit(dlsVal);
    setDepositSuccessMsg(`Successfully credited ${val} ${currencyLabel} (${dlsVal} DLS) to your account!`);
    setTimeout(() => setDepositSuccessMsg(null), 5000);
  };

  const handleWithdraw = () => {
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      setWithdrawMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    const dlsVal = fromActiveAmount(val);
    const res = withdraw(dlsVal, withdrawGrowId, withdrawWorld);
    if (res.success) {
      setWithdrawMsg({ type: 'success', text: res.message });
      setTimeout(() => setWithdrawMsg(null), 6000);
    } else {
      setWithdrawMsg({ type: 'error', text: res.message });
    }
  };

  const handleTip = () => {
    const val = parseFloat(tipAmount);
    if (isNaN(val) || val <= 0) {
      setTipMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    const dlsVal = fromActiveAmount(val);
    const res = tip(dlsVal, tipTarget, tipNote);
    if (res.success) {
      setTipMsg({ type: 'success', text: res.message });
      setTipTarget('');
      setTipNote('');
      setTimeout(() => setTipMsg(null), 6000);
    } else {
      setTipMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d131f] border border-[#1d293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b263b] bg-[#0c111c]">
          <h2 className="text-base font-extrabold text-white tracking-wide">Wallet Cashier</h2>
          <button
            onClick={() => {
              sound.playClick();
              setWalletModalOpen(false);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#162134] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Deposit, Withdraw, Tip */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#090e18] border-b border-[#182335] text-xs font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setWalletTab('deposit');
            }}
            className={`py-2.5 rounded-xl transition ${
              walletTab === 'deposit'
                ? 'bg-[#18253b] text-white shadow-sm border border-[#2b3e60]'
                : 'text-slate-400 hover:text-white hover:bg-[#111927]'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setWalletTab('withdraw');
            }}
            className={`py-2.5 rounded-xl transition ${
              walletTab === 'withdraw'
                ? 'bg-[#18253b] text-white shadow-sm border border-[#2b3e60]'
                : 'text-slate-400 hover:text-white hover:bg-[#111927]'
            }`}
          >
            Withdraw
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setWalletTab('tip');
            }}
            className={`py-2.5 rounded-xl transition ${
              walletTab === 'tip'
                ? 'bg-[#18253b] text-white shadow-sm border border-[#2b3e60]'
                : 'text-slate-400 hover:text-white hover:bg-[#111927]'
            }`}
          >
            Tip
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* TAB 1: DEPOSIT */}
          {walletTab === 'deposit' && (
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  In Game
                </span>
                {/* Void-Ps Deposit Selection Card with BGLS.png */}
                <div className="w-full bg-gradient-to-r from-[#111c2e] to-[#17253d] border border-[#263c62] rounded-xl p-3.5 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#09111c] border border-[#21375a] flex items-center justify-center p-1.5 shadow-inner">
                      {/* Using BGLS.png as instructed */}
                      <img src="/assets/BGLS.png" alt="Void-Ps Deposit" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Void-Ps Deposit</h4>
                      <p className="text-[11px] text-[#38bdf8] font-medium">Automatic In-Game Growtopia Bot</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              </div>

              {/* Bot World Information Box (Personal code removed per request) */}
              <div className="bg-[#101725] border border-[#1d2a3f] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Bot Drop World Details</span>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Bot Online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0b101a] p-2.5 rounded-xl border border-[#192437] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">World Name</span>
                      <span className="font-mono font-bold text-white text-sm">VOIDDEP77</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VOIDDEP77', 'world')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162133] transition"
                      title="Copy World Name"
                    >
                      {copiedField === 'world' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-[#0b101a] p-2.5 rounded-xl border border-[#192437] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Bot Name</span>
                      <span className="font-mono font-bold text-[#38bdf8] text-sm">VoidBot_01</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VoidBot_01', 'bot')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162133] transition"
                      title="Copy Bot Name"
                    >
                      {copiedField === 'bot' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter world <strong className="text-white">VOIDDEP77</strong> in Growtopia and drop your DLS or BGLS with <strong className="text-[#38bdf8]">VoidBot_01</strong>. Your deposit will be credited instantly!
                </p>
              </div>

              {/* Instant In-Game Deposit Confirmation */}
              <div className="bg-[#101725] border border-[#1d2a3f] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Confirm Deposit Amount</span>
                  <span className="text-[10px] text-slate-400 font-mono">100 DLS = 1 BGL</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Amount ({currencyLabel}):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={activeCurrency === 'BGLS' ? '0.01' : '1'}
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#0074e4] transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
                      <span className="text-xs font-bold text-slate-300">{currencyLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Quick amount presets */}
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDepositAmount(activeCurrency === 'BGLS' ? '0.5' : '50');
                    }}
                    className="py-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1a263a] text-slate-300 transition"
                  >
                    +{activeCurrency === 'BGLS' ? '0.5' : '50'}
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDepositAmount(activeCurrency === 'BGLS' ? '1.0' : '100');
                    }}
                    className="py-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1a263a] text-slate-300 transition"
                  >
                    +{activeCurrency === 'BGLS' ? '1 BGL' : '100 DL'}
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDepositAmount(activeCurrency === 'BGLS' ? '5.0' : '500');
                    }}
                    className="py-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1a263a] text-amber-300 transition"
                  >
                    +{activeCurrency === 'BGLS' ? '5 BGL' : '500 DL'}
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDepositAmount(activeCurrency === 'BGLS' ? '10.0' : '1000');
                    }}
                    className="py-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1a263a] text-cyan-300 transition"
                  >
                    +{activeCurrency === 'BGLS' ? '10 BGL' : '1000 DL'}
                  </button>
                </div>

                {depositSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{depositSuccessMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleSimulateDeposit}
                  className="w-full py-3 rounded-xl bg-[#0074e4] hover:bg-[#0082fe] active:bg-[#0066cb] text-white font-extrabold text-xs shadow-lg shadow-[#0074e4]/30 transition flex items-center justify-center gap-2"
                >
                  <span>Confirm Void-Ps Deposit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {walletTab === 'withdraw' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#101725] border border-[#1d2a3f] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#182337]">
                  <span className="text-xs text-slate-400">Available Balance:</span>
                  <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
                    {formatBalance()} {currencyLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">GrowID / Recipient Name:</label>
                  <input
                    type="text"
                    value={withdrawGrowId}
                    onChange={(e) => setWithdrawGrowId(e.target.value)}
                    placeholder="Enter GrowID"
                    className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0074e4] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Delivery World Name:</label>
                  <input
                    type="text"
                    value={withdrawWorld}
                    onChange={(e) => setWithdrawWorld(e.target.value)}
                    placeholder="e.g. MYWORLD99"
                    className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-[#0074e4] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-400">Withdraw Amount ({currencyLabel}):</label>
                    <button
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="text-[10px] text-[#38bdf8] font-bold hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={activeCurrency === 'BGLS' ? '0.01' : '1'}
                      min="1"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#0074e4] transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
                      <span className="text-xs font-bold text-slate-300">{currencyLabel}</span>
                    </div>
                  </div>
                </div>

                {withdrawMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      withdrawMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/15 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {withdrawMsg.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{withdrawMsg.text}</span>
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0074e4] to-[#0284c7] hover:brightness-110 active:brightness-95 text-white font-extrabold text-xs shadow-lg shadow-[#0074e4]/30 transition flex items-center justify-center gap-2"
                >
                  <span>Request In-Game Bot Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TIP */}
          {walletTab === 'tip' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#101725] border border-[#1d2a3f] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#182337]">
                  <span className="text-xs text-slate-400">Available Balance:</span>
                  <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
                    {formatBalance()} {currencyLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Recipient Username:</label>
                  <input
                    type="text"
                    value={tipTarget}
                    onChange={(e) => setTipTarget(e.target.value)}
                    placeholder="Enter player's username"
                    className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0074e4] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Tip Amount ({currencyLabel}):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={activeCurrency === 'BGLS' ? '0.01' : '1'}
                      min="1"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#0074e4] transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <img src={currencyIcon} alt={currencyLabel} className="w-4 h-4 object-contain" />
                      <span className="text-xs font-bold text-slate-300">{currencyLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Message (Optional):</label>
                  <input
                    type="text"
                    value={tipNote}
                    onChange={(e) => setTipNote(e.target.value)}
                    placeholder="e.g. Good luck in Case Battles"
                    className="w-full bg-[#090e18] border border-[#1f2c42] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0074e4] transition"
                  />
                </div>

                {tipMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      tipMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/15 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {tipMsg.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{tipMsg.text}</span>
                  </div>
                )}

                <button
                  onClick={handleTip}
                  className="w-full py-3 rounded-xl bg-[#0074e4] hover:bg-[#0085ff] active:bg-[#0066cb] text-white font-extrabold text-xs shadow-lg shadow-[#0074e4]/30 transition flex items-center justify-center gap-2"
                >
                  <span>Send Player Tip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
