import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  Disc,
  Footprints,
  Grid3X3,
  Dices,
  ArrowUpDown,
  Spade,
  Waves,
  Coins,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ALL_15_GAMES, getGameIcon } from '../../data/games';
import { sound } from '../../utils/audio';

interface GameDesignPreviewProps {
  gameId: string;
  onBack: () => void;
}

export const GameDesignPreview: React.FC<GameDesignPreviewProps> = ({ gameId, onBack }) => {
  const { balance, currencyLabel, formatBalance, toActiveAmount } = useGame();
  const game = ALL_15_GAMES.find((g) => g.id === gameId) || ALL_15_GAMES[6];
  const Icon = getGameIcon(game.iconName);

  const [betAmount, setBetAmount] = useState('10');
  const [targetMulti, setTargetMulti] = useState('2.00');
  const [selectedKeno, setSelectedKeno] = useState<number[]>([7, 13, 21, 33]);
  const [diceRollUnder, setDiceRollUnder] = useState(50);
  const [simulating, setSimulating] = useState(false);
  const [demoResult, setDemoResult] = useState<string | null>(null);

  const handleSimulate = () => {
    sound.playClick();
    setSimulating(true);
    setDemoResult(null);

    setTimeout(() => {
      sound.playWin();
      setSimulating(false);
      const isWin = Math.random() > 0.4;
      if (isWin) {
        setDemoResult(`Simulation Win: +${(parseFloat(betAmount || '10') * 1.98).toFixed(2)} ${currencyLabel}`);
      } else {
        setDemoResult(`Simulation Loss: -${betAmount} ${currencyLabel}`);
      }
    }, 900);
  };

  const renderGameSpecificMockup = () => {
    switch (game.id) {
      case 'roulette':
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="w-32 h-32 rounded-full border-4 border-[#e11d48] bg-gradient-to-tr from-[#161f30] via-[#0d1420] to-[#251218] flex items-center justify-center shadow-2xl relative animate-spin-slow">
              <div className="w-16 h-16 rounded-full bg-[#0a0e17] border-2 border-slate-700 flex items-center justify-center">
                <Disc className="w-8 h-8 text-[#e11d48]" />
              </div>
            </div>

            {/* Betting board preview */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-md">
              <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-center cursor-pointer hover:bg-red-900/60 transition">
                <span className="text-xs font-black text-red-400 block">RED</span>
                <span className="text-[10px] font-mono text-slate-400">2x Payout</span>
              </div>
              <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-center cursor-pointer hover:bg-emerald-900/60 transition">
                <span className="text-xs font-black text-emerald-400 block">BAIT 14x</span>
                <span className="text-[10px] font-mono text-slate-400">14x Payout</span>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-800 transition">
                <span className="text-xs font-black text-slate-200 block">BLACK</span>
                <span className="text-[10px] font-mono text-slate-400">2x Payout</span>
              </div>
            </div>
          </div>
        );

      case 'dice':
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="text-5xl sm:text-6xl font-black font-mono text-blue-400 tracking-tight">
              {diceRollUnder.toFixed(2)}
            </div>
            <div className="w-full max-w-md bg-[#0a111a] p-5 rounded-xl border border-[#162337] flex flex-col gap-3">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Roll Under: {diceRollUnder}</span>
                <span className="text-emerald-400">Win Chance: {diceRollUnder}%</span>
                <span className="text-blue-400">Multiplier: {(99 / diceRollUnder).toFixed(4)}x</span>
              </div>
              <input
                type="range"
                min="2"
                max="98"
                value={diceRollUnder}
                onChange={(e) => setDiceRollUnder(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        );

      case 'plinko':
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className="flex flex-col items-center gap-1.5 opacity-80">
              {[3, 4, 5, 6, 7, 8].map((count, rIdx) => (
                <div key={rIdx} className="flex gap-4 sm:gap-6 justify-center">
                  {Array.from({ length: count }).map((_, cIdx) => (
                    <div key={cIdx} className="w-2 h-2 rounded-full bg-[#ec4899] shadow-[0_0_6px_#ec4899]" />
                  ))}
                </div>
              ))}
            </div>

            {/* Plinko Buckets */}
            <div className="grid grid-cols-7 gap-1 mt-3 w-full max-w-sm text-center">
              {['110x', '18x', '3x', '0.5x', '3x', '18x', '110x'].map((val, idx) => (
                <div
                  key={idx}
                  className="bg-[#101b2a] border border-[#1a2d46] py-1.5 rounded text-[10px] font-mono font-black text-purple-300"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        );

      case 'keno':
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <span className="text-xs font-mono text-slate-400">Select your lucky numbers:</span>
            <div className="grid grid-cols-8 gap-1.5 max-w-sm w-full">
              {Array.from({ length: 32 }).map((_, i) => {
                const num = i + 1;
                const isPicked = selectedKeno.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => {
                      sound.playClick();
                      if (isPicked) {
                        setSelectedKeno(selectedKeno.filter((n) => n !== num));
                      } else if (selectedKeno.length < 10) {
                        setSelectedKeno([...selectedKeno, num]);
                      }
                    }}
                    className={`h-9 rounded-lg font-mono text-xs font-black transition ${
                      isPicked
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                        : 'bg-[#111927] border border-[#1c293e] text-slate-300 hover:border-purple-500'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'blackjack':
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Dealer Hand (17)
              </span>
              <div className="flex gap-2">
                <div className="w-14 h-20 bg-white rounded-lg border border-slate-300 text-black flex flex-col justify-between p-1.5 font-bold shadow-md">
                  <span>K</span>
                  <span className="text-center font-black">♠</span>
                  <span className="text-right">K</span>
                </div>
                <div className="w-14 h-20 bg-white rounded-lg border border-slate-300 text-red-600 flex flex-col justify-between p-1.5 font-bold shadow-md">
                  <span>7</span>
                  <span className="text-center font-black">♦</span>
                  <span className="text-right">7</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">
                Your Hand (20)
              </span>
              <div className="flex gap-2">
                <div className="w-14 h-20 bg-white rounded-lg border border-slate-300 text-black flex flex-col justify-between p-1.5 font-bold shadow-md">
                  <span>10</span>
                  <span className="text-center font-black">♣</span>
                  <span className="text-right">10</span>
                </div>
                <div className="w-14 h-20 bg-white rounded-lg border border-slate-300 text-black flex flex-col justify-between p-1.5 font-bold shadow-md">
                  <span>J</span>
                  <span className="text-center font-black">♠</span>
                  <span className="text-right">J</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: `${game.color}20`, border: `2px solid ${game.color}` }}
            >
              <Icon className="w-10 h-10" style={{ color: game.color }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{game.title}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">{game.tagline}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111724] border border-[#1b263b] text-slate-300 hover:text-white hover:bg-[#162133] text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Originals</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#38bdf8] bg-[#38bdf8]/15 px-2.5 py-1 rounded-full border border-[#38bdf8]/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Void-Ps Original</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {game.rtp}
          </span>
        </div>
      </div>

      {/* Main Game Showcase Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Top 2 Cols: Interactive Visual Board */}
        <div className="lg:col-span-2 bg-[#090f18] border border-[#18263a] rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[420px]">
          {/* Cyber Ambient background */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: game.color }}
          />

          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[#142031]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${game.color}25`, border: `1px solid ${game.color}` }}
              >
                <Icon className="w-5 h-5" style={{ color: game.color }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{game.title}</h2>
                <span className="text-xs text-slate-400 font-medium">{game.tagline}</span>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase text-slate-400 bg-[#111a28] px-2.5 py-1 rounded-md border border-[#1e2f46]">
              {game.badge}
            </span>
          </div>

          {/* Interactive Game Canvas / Mockup */}
          <div className="relative z-10 my-auto">
            {renderGameSpecificMockup()}
          </div>

          {/* Simulation Outcome Toast */}
          {demoResult && (
            <div className="relative z-10 mt-3 p-3 rounded-xl bg-[#101b2a] border border-[#1e3452] text-center font-mono text-xs font-black animate-in fade-in">
              <span className={demoResult.includes('Win') ? 'text-emerald-400' : 'text-rose-400'}>
                {demoResult}
              </span>
            </div>
          )}

          {/* Provably Fair Seed Footer */}
          <div className="relative z-10 pt-4 border-t border-[#142031] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Provably Fair SHA-256 Hash Seed</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">
              e3b0c44298fc1c149afbf4c8996fb924...
            </span>
          </div>
        </div>

        {/* Right 1 Col: Betting & Controls Panel */}
        <div className="bg-[#0b121c] border border-[#18263a] rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-xl">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Bet Amount ({currencyLabel})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-[#111824] border border-[#1c293d] rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#0074e4] transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  {currencyLabel}
                </span>
              </div>
            </div>

            {/* Quick Multiplier Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {['1/2', '2X', 'MAX', 'MIN'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    sound.playClick();
                    const cur = parseFloat(betAmount || '10');
                    if (btn === '1/2') setBetAmount(Math.max(1, Math.floor(cur / 2)).toString());
                    if (btn === '2X') setBetAmount((cur * 2).toString());
                    if (btn === 'MAX') setBetAmount(Math.min(1000, balance).toString());
                    if (btn === 'MIN') setBetAmount('1');
                  }}
                  className="py-1.5 bg-[#141e2e] hover:bg-[#1a283e] border border-[#1d2d44] text-[10px] font-mono font-bold text-slate-300 rounded-lg transition"
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Game Rules / Specs */}
            <div className="bg-[#0e1624] border border-[#19273b] p-3.5 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Game Specifications
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Theoretical RTP:</span>
                <span className="font-mono font-bold text-emerald-400">{game.rtp}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Type:</span>
                <span className="font-mono font-bold text-slate-200">Void-Ps Original</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Currency:</span>
                <span className="font-mono font-bold text-amber-400">DLS / BGLS</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0074e4] to-[#0284c7] hover:from-[#0082ff] hover:to-[#0396e3] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0074e4]/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {simulating ? 'Rolling...' : `Play ${game.title}`}
          </button>
        </div>
      </div>
    </div>
  );
};
