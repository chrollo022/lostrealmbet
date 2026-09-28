import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Wallet, MessageSquare, Volume2, VolumeX, Settings, User, LogOut } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';

interface HeaderProps {
  onToggleChat?: () => void;
  chatOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleChat, chatOpen }) => {
  const {
    user,
    activeCurrency,
    setActiveCurrency,
    formatBalance,
    currencyIcon,
    currencyLabel,
    activeGameSession,
    setWalletModalOpen,
    setWalletTab,
    sidebarOpen,
    setSidebarOpen,
    soundMuted,
    setSoundMuted,
    setActiveGame,
    logout,
    setAuthModalOpen,
    setAuthMode,
    balanceGainAnim,
    showToast,
  } = useGame();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dlsTotal = user.balanceDls;
  const usdValue = (dlsTotal * 0.15).toFixed(2);
  const eurValue = (dlsTotal * 0.14).toFixed(2);

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0c1017] border-b border-[#1b2537] px-3 sm:px-5 flex items-center justify-between shadow-md">
      {/* Left side: Navigation & VoidPs Branding */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => {
            sound.playClick();
            setSidebarOpen(!sidebarOpen);
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#16202e] transition"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Supreme Official Branding */}
        <div
          onClick={() => {
            sound.playClick();
            setActiveGame(null);
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none group transition-transform hover:scale-105 active:scale-95"
        >
          <img
            src="/assets/void_logo.png"
            alt="Supreme Server"
            className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,116,228,0.4)]"
          />
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white uppercase">
                Supreme
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Server: Supreme (0s)
            </span>
          </div>
        </div>
      </div>

      {/* Center: ONLY VISIBLE WHEN USER IS AUTHENTICATED */}
      {user.isAuthenticated ? (
        <div className="relative flex items-center" ref={dropdownRef}>
          {/* Floating Balance Gain Animation (+10.00 DLS) Down of Wallet */}
          {balanceGainAnim && (
            <div
              key={balanceGainAnim.id}
              className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 font-black text-xs text-emerald-400 bg-[#07190f]/95 border border-emerald-500/60 shadow-xl shadow-emerald-950/80 rounded-full px-3 py-1 animate-balance-gain-down z-50 whitespace-nowrap"
            >
              <span>{balanceGainAnim.amount}</span>
              <img src={balanceGainAnim.icon} alt="" className="w-4 h-4 object-contain filter drop-shadow" />
              <span className="text-[10px] text-emerald-300 font-bold">{balanceGainAnim.currency}</span>
            </div>
          )}

          <div className="inline-flex rounded-xl bg-[#131b28] border border-[#1e2b40] overflow-hidden shadow-sm">
            {/* Balance display button */}
            <button
              onClick={() => {
                sound.playClick();
                if (activeGameSession) {
                  showToast(
                    `Cannot switch currency while in an active ${activeGameSession.gameTitle} round. Please cash out or finish the round first.`,
                    'warning',
                    'Game in Progress'
                  );
                  return;
                }
                setDropdownOpen(!dropdownOpen);
              }}
              title={activeGameSession ? `Finish ${activeGameSession.gameTitle} round to switch currency` : 'Change currency'}
              className="flex items-center gap-2.5 px-3 sm:px-4 py-2 hover:bg-[#182335] transition text-sm font-bold text-white"
            >
              <img
                src={currencyIcon}
                alt={currencyLabel}
                className="w-5 h-5 object-contain filter drop-shadow"
              />
              <span className="tracking-wide font-mono">
                {formatBalance()}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Blue Wallet Button */}
            <button
              onClick={() => {
                sound.playClick();
                setWalletTab('deposit');
                setWalletModalOpen(true);
              }}
              className="bg-[#0074e4] hover:bg-[#0085ff] active:bg-[#0066cb] text-white px-3 sm:px-4 py-2 flex items-center gap-1.5 font-bold text-xs transition shadow-md shadow-[#0074e4]/25"
              title="Open Wallet"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden md:inline">Wallet</span>
            </button>
          </div>

          {/* Currency Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-[#0e1420] border border-[#1e2a3e] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 py-1">
                <span>In-Game Currencies</span>
                <Settings className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
              </div>

              {/* DLS Option */}
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveCurrency('DLS');
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition mt-1 ${
                  activeCurrency === 'DLS'
                    ? 'bg-[#1a2538] text-white border border-[#2b3c58]'
                    : 'text-slate-300 hover:bg-[#141d2c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#14233a] border border-[#22385c] flex items-center justify-center p-0.5">
                    <img src="/assets/DLS.png" alt="DLS" className="w-4 h-4 object-contain" />
                  </div>
                  <span>DLS</span>
                </div>
                <span className="text-slate-200 font-mono text-sm">
                  {user.balanceDls.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </button>

              {/* BGLS Option */}
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveCurrency('BGLS');
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition mt-1.5 ${
                  activeCurrency === 'BGLS'
                    ? 'bg-[#1a2538] text-white border border-[#2b3c58]'
                    : 'text-slate-300 hover:bg-[#141d2c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#14233a] border border-[#22385c] flex items-center justify-center p-0.5">
                    <img src="/assets/BGLS.png" alt="BGLS" className="w-4 h-4 object-contain" />
                  </div>
                  <span>BGLS</span>
                </div>
                <span className="text-slate-200 font-mono text-sm">
                  {(user.balanceDls / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div /> /* Empty center when guest */
      )}

      {/* Right side: Sound toggle, Auth/User, Chat toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#16202e] transition"
          title={soundMuted ? 'Unmute' : 'Mute'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* If user is NOT logged in: show Sign In and Sign Up in top right corner */}
        {!user.isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-[#141c2b] hover:bg-[#1a2538] border border-[#223147] transition"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-[#0074e4] hover:bg-[#0085ff] active:bg-[#0066cb] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#0074e4]/30 transition"
            >
              Sign Up
            </button>
          </div>
        ) : (
          /* User Profile Dropdown when logged in */
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                sound.playClick();
                setUserDropdownOpen(!userDropdownOpen);
              }}
              className="flex items-center gap-2 bg-[#131b28] hover:bg-[#182335] border border-[#1e2a3e] px-2.5 py-1.5 rounded-xl transition"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0074e4]/20 border border-[#0074e4]/40 flex items-center justify-center text-[#38bdf8]">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline">{user.username}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute top-12 right-0 w-44 bg-[#0e1420] border border-[#1e2a3e] rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#1a2538] mb-1">
                  <span className="text-xs font-bold text-white block">{user.username}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatBalance()} {currencyLabel}</span>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            if (onToggleChat) onToggleChat();
          }}
          className={`p-2 rounded-lg transition ${
            chatOpen ? 'bg-[#0074e4] text-white' : 'text-slate-400 hover:text-white hover:bg-[#16202e]'
          }`}
          title="Toggle Community Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
