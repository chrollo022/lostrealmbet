import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Flame, User, TrendingUp, ShieldCheck, Gamepad2 } from 'lucide-react';

export const LiveBetsTable: React.FC = () => {
  const { liveBets, toActiveAmount, currencyLabel, currencyIcon, user } = useGame();
  const [filterTab, setFilterTab] = useState<'all' | 'high' | 'mine'>('all');

  const filteredBets = useMemo(() => {
    return liveBets.filter((b) => {
      if (filterTab === 'high') return b.betDls >= 50;
      if (filterTab === 'mine') return b.player === user.username;
      return true;
    });
  }, [liveBets, filterTab, user.username]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Live indicator & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="text-sm font-extrabold text-white">Supreme Live Bets Feed</h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            100% Real
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#0a101b] border border-[#1b263b] p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#18253c] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Bets
          </button>
          <button
            onClick={() => setFilterTab('high')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'high'
                ? 'bg-[#18253c] text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>High Rollers</span>
          </button>
          <button
            onClick={() => setFilterTab('mine')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'mine'
                ? 'bg-[#18253c] text-[#38bdf8] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3 h-3 text-[#38bdf8]" />
            <span>My Bets</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0b121e] border border-[#1b273d] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b273d] text-slate-400 bg-[#090e18]">
                <th className="py-3 px-4 font-bold">Game</th>
                <th className="py-3 px-4 font-bold">Player</th>
                <th className="py-3 px-4 font-bold">Bet Amount</th>
                <th className="py-3 px-4 font-bold">Multiplier</th>
                <th className="py-3 px-4 font-bold text-right">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152033]">
              {filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Gamepad2 className="w-8 h-8 text-slate-600 animate-pulse" />
                      <span className="text-xs font-bold text-slate-400">
                        {filterTab === 'mine'
                          ? 'No bets placed yet in this session'
                          : 'Waiting for live game bets...'}
                      </span>
                      <p className="text-[11px] text-slate-600">
                        Play Mines, Cases, Dice, Crash, or any Supreme game to see real rounds appear here in real time!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBets.map((b) => {
                  const betVal = toActiveAmount(b.betDls);
                  const payoutVal = toActiveAmount(b.payoutDls);
                  const isUser = b.player === user.username;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-[#101b2c] transition-colors ${
                        isUser ? 'bg-[#0074e4]/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0074e4] shadow-[0_0_8px_#0074e4]" />
                        <span>{b.game}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${isUser ? 'text-[#38bdf8] font-bold' : 'text-slate-300'}`}>
                            {b.player}
                          </span>
                          {isUser && (
                            <span className="text-[9px] bg-[#0074e4]/20 text-[#38bdf8] px-1.5 py-0.2 rounded font-black uppercase">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <img src={currencyIcon} alt={currencyLabel} className="w-3.5 h-3.5 object-contain" />
                          <span>{betVal.toLocaleString()} {currencyLabel}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-mono font-black px-2 py-0.5 rounded-md inline-block ${
                            b.won
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'text-slate-500 bg-slate-800/40 border border-slate-700/40'
                          }`}
                        >
                          {b.multiplier > 0 ? `${b.multiplier.toFixed(2)}x` : '0.00x'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {b.won ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-1">
                            +{payoutVal.toLocaleString()} {currencyLabel}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            0.00 {currencyLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
