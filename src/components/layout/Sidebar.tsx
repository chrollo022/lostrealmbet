import React, { useState } from 'react';
import {
  Search,
  Gamepad2,
  ShieldCheck,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ALL_15_GAMES, getGameIcon } from '../../data/games';

interface SidebarProps {
  onSelectGame?: (gameId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectGame }) => {
  const { sidebarOpen, activeGame, setActiveGame } = useGame();
  const [searchTerm, setSearchTerm] = useState('');

  const handleNavClick = (gameId?: string) => {
    sound.playClick();
    if (gameId) {
      setActiveGame(gameId);
      if (onSelectGame) onSelectGame(gameId);
    } else {
      setActiveGame(null);
    }
  };

  const filteredGames = ALL_15_GAMES.filter((g) =>
    g.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`fixed lg:static top-16 left-0 bottom-0 z-30 w-64 bg-[#0a0e16] border-r border-[#16202f] flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none'
      }`}
    >
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111724] border border-[#1d273a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0074e4] transition"
          />
        </div>

        {/* Supreme Games Navigation */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Supreme Games
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Live
            </span>
          </div>

          <button
            onClick={() => handleNavClick()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeGame === null
                ? 'bg-[#141d2c] text-white border border-[#202e45]'
                : 'text-slate-400 hover:text-white hover:bg-[#111724]'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-[#38bdf8]" />
            <span>All Games</span>
          </button>

          {/* List of all games */}
          <div className="flex flex-col gap-0.5 mt-1">
            {filteredGames.map((game) => {
              const Icon = getGameIcon(game.iconName);
              const isSelected = activeGame === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => handleNavClick(game.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition group ${
                    isSelected
                      ? 'bg-[#18253a] text-white border border-[#263c60]'
                      : 'text-slate-400 hover:text-white hover:bg-[#111724]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: game.color }} />
                    <span>{game.title}</span>
                  </div>

                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 opacity-70 group-hover:opacity-100 transition">
                    {game.badge || 'HOT'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Links */}
        <div className="flex flex-col gap-1 pt-2 border-t border-[#16202f]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Platform
          </span>
          <button
            onClick={() => {
              sound.playClick();
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#111724] transition"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Live Feed</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pt-4 border-t border-[#16202f] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Provably Fair RNG</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="w-4 h-4 text-[#0074e4]" />
            <span>Growtopia Cashier</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
