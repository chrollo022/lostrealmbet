import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Layers,
  Flame,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Zap,
} from 'lucide-react';
import { GameCard } from './GameCard';
import { LiveBetsTable } from './LiveBetsTable';
import { PlayerProfileCard } from '../profile/PlayerProfileCard';
import { ALL_15_GAMES } from '../../data/games';
import { sound } from '../../utils/audio';
import { useGame } from '../../context/GameContext';

interface DashboardProps {
  onSelectGame: (gameId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectGame }) => {
  const { setWalletModalOpen, setWalletTab, currencyLabel, currencyIcon } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'hot' | 'table'>('all');

  const filteredGames = ALL_15_GAMES.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'hot') return ['mines', 'crash', 'towers', 'coinflip', 'plinko'].includes(g.id);
    if (activeCategory === 'table') return ['roulette', 'blackjack', 'dice', 'hilo', 'keno'].includes(g.id);
    return true;
  });

  return (
    <div className="relative flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Animated Cyber Grid Background Layer */}
      <div className="absolute -inset-4 cyber-grid-bg pointer-events-none rounded-3xl -z-10 opacity-60" />

      {/* Animated Neon Ambient Orbs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-[#0074e4]/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow -z-10" />
      <div className="absolute top-96 -right-20 w-80 h-80 bg-[#a855f7]/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow -z-10" />

      {/* 1. Player Profile Card with Animated set.png & Live Stats */}
      <PlayerProfileCard />

      {/* 2. Instant Growtopia Deposit & Withdraw Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c182c] via-[#0f2340] to-[#0a1424] border border-[#1e3862] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="z-10 flex flex-col gap-2.5 max-w-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff88] bg-[#00ff88]/15 px-2.5 py-1 rounded-full border border-[#00ff88]/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Bot Deposit</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8] bg-[#38bdf8]/15 px-2.5 py-1 rounded-full border border-[#38bdf8]/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>World: SUPREME77</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              100 DLS = 1 BGL
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Supreme In-Game Deposit & Cashier
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Deposit Diamond Locks and Blue Gem Locks directly in-game! Drop your locks with bot <strong className="text-[#38bdf8]">SupremeBot_01</strong> in world <strong className="text-white">SUPREME77</strong>. Credited within seconds with 0% fees on Server Supreme.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              onClick={() => {
                sound.playClick();
                setWalletTab('deposit');
                setWalletModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#0074e4] hover:bg-[#0085ff] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#0074e4]/35 transition flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Deposit Locks</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setWalletTab('withdraw');
                setWalletModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#14233a] hover:bg-[#1a3052] text-slate-200 border border-[#234375] text-xs font-bold transition flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ArrowUpFromLine className="w-4 h-4 text-[#38bdf8]" />
              <span>Withdraw Locks</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setWalletTab('tip');
                setWalletModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#131b28] hover:bg-[#192436] text-slate-300 border border-[#1e2a3c] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tip Player</span>
            </button>
          </div>
        </div>

        {/* Deposit Showcase Visual Card */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0a121e]/80 border border-[#1b2f4c] shadow-xl min-w-[210px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#0f1b2b] border border-[#233a5e] p-2 flex items-center justify-center shadow-inner">
              <img src="/assets/BGLS.png" alt="BGLS" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0f1b2b] border border-[#233a5e] p-2 flex items-center justify-center shadow-inner">
              <img src="/assets/DLS.png" alt="DLS" className="w-full h-full object-contain filter drop-shadow" />
            </div>
          </div>
          <div className="text-center">
            <span className="text-[11px] font-bold text-white block">In-Game Cashier Bot</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online (0s Latency)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across all 15 games..."
            className="w-full bg-[#0d131f] border border-[#1b273b] rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0074e4] transition shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0d131f] border border-[#1b273b] p-1 rounded-xl">
          <button
            onClick={() => {
              sound.playClick();
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCategory === 'all'
                ? 'bg-[#0074e4] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c]'
            }`}
          >
            All 15
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveCategory('hot');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCategory === 'hot'
                ? 'bg-[#0074e4] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c]'
            }`}
          >
            Hot Games
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveCategory('table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCategory === 'table'
                ? 'bg-[#0074e4] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c]'
            }`}
          >
            Table & Dice
          </button>
        </div>
      </div>

      {/* 4. All 15 Games Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
              Void-Ps Game Library ({filteredGames.length} Games)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            DLS & BGLS Compatible
          </span>
        </div>

        {/* Responsive Grid showcasing all games */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onSelectGame} />
          ))}
        </div>
      </div>

      {/* 5. Live Bets Feed Table */}
      <LiveBetsTable />
    </div>
  );
};
