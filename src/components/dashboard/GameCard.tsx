import React from 'react';
import { Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';
import { getGameIcon } from '../../data/games';

export interface GameCardInfo {
  id: string;
  title: string;
  badge?: string;
  image?: string;
  iconName?: string;
  color?: string;
  rtp?: string;
  tagline?: string;
  isPlayable?: boolean;
}

interface GameCardProps {
  game: GameCardInfo;
  onPlay: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  const Icon = game.iconName ? getGameIcon(game.iconName) : null;
  const themeColor = game.color || '#0074e4';

  return (
    <div
      onClick={() => {
        sound.playClick();
        onPlay(game.id);
      }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-[#0e1522] border border-[#1b273b] hover:border-[#0074e4] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0074e4]/20 flex flex-col"
    >
      {/* Badge (NEW, HOT, POPULAR, etc.) */}
      {game.badge && (
        <div className="absolute top-2.5 left-2.5 z-20">
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md ${
              game.isPlayable !== false
                ? 'bg-emerald-500 text-black'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {game.badge}
          </span>
        </div>
      )}

      {/* Card Image / Visual Canvas */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0a101a] flex items-center justify-center">
        {game.image ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Ambient glowing radial backdrop */}
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 70%)`,
              }}
            />

            {/* Glowing Icon Artwork */}
            {Icon && (
              <div
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-lg"
                style={{
                  backgroundColor: `${themeColor}20`,
                  borderColor: `${themeColor}50`,
                  boxShadow: `0 0 20px ${themeColor}25`,
                }}
              >
                <Icon className="w-8 h-8" style={{ color: themeColor }} />
              </div>
            )}

            {game.tagline && (
              <p className="relative z-10 text-[10px] text-slate-400 text-center font-medium mt-3 px-2 line-clamp-2">
                {game.tagline}
              </p>
            )}
          </div>
        )}

        {/* Hover overlay with Action button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-3">
          <div className="px-4 py-2 rounded-xl bg-[#0074e4] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xl shadow-[#0074e4]/50 transform scale-90 group-hover:scale-100 transition-transform">
            <span>BET NOW</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0d131f] border-t border-[#182335] flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <h4 className="text-xs font-black text-white group-hover:text-[#38bdf8] transition tracking-wide truncate">
            {game.title}
          </h4>
          <span className="text-[9px] text-slate-400 font-semibold block truncate">
            Void-Ps Originals
          </span>
        </div>
        <span className="shrink-0 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          {game.rtp || '99%'}
        </span>
      </div>
    </div>
  );
};
