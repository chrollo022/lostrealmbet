import React, { useState, useEffect } from 'react';
import { ShieldCheck, Flame, Trophy, AlertTriangle, Play, ChevronRight, Zap } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ActionButton, BetInput, GameShell, ResultPill } from './GamePrimitives';

type Difficulty = 'easy' | 'medium' | 'hard' | 'daredevil';

interface DifficultyConfig {
  label: string;
  lanes: number;
  crashChancePerLane: number;
  multipliers: number[];
}

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    lanes: 6,
    crashChancePerLane: 0.12,
    multipliers: [1.18, 1.45, 1.82, 2.35, 3.15, 4.50],
  },
  medium: {
    label: 'Medium',
    lanes: 7,
    crashChancePerLane: 0.20,
    multipliers: [1.32, 1.85, 2.70, 4.10, 6.60, 11.20, 20.00],
  },
  hard: {
    label: 'Hard',
    lanes: 8,
    crashChancePerLane: 0.30,
    multipliers: [1.50, 2.45, 4.30, 8.10, 16.50, 36.00, 85.00, 220.00],
  },
  daredevil: {
    label: 'Daredevil',
    lanes: 8,
    crashChancePerLane: 0.45,
    multipliers: [1.95, 4.20, 10.00, 26.00, 75.00, 240.00, 850.00, 3500.00],
  },
};

export const CrossroadGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    fromActiveAmount,
    deductBet,
    awardPayout,
    recordLoss,
    currencyLabel,
    user,
    setAuthModalOpen,
    setActiveGameSession,
  } = useGame();

  const [bet, setBet] = useState('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLane, setCurrentLane] = useState(0); // 0 = start curb, 1..lanes
  const [isCrossing, setIsCrossing] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'crashed' | null>(null);

  const cfg = CONFIGS[difficulty];
  const currentMultiplier = currentLane === 0 ? 1.0 : cfg.multipliers[currentLane - 1];

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voidps_crossroad_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isPlaying) {
          setIsPlaying(true);
          setCurrentLane(parsed.currentLane || 0);
          setDifficulty(parsed.difficulty || 'medium');
          setBet(parsed.bet || '10');
          setActiveGameSession({ game: 'Crossroad', active: true, betAmount: Number(parsed.bet) });
        }
      }
    } catch {}
  }, []);

  const saveState = (playing: boolean, lane: number, diff: Difficulty, betVal: string) => {
    if (playing) {
      localStorage.setItem('voidps_crossroad_state', JSON.stringify({
        isPlaying: true,
        currentLane: lane,
        difficulty: diff,
        bet: betVal
      }));
    } else {
      localStorage.removeItem('voidps_crossroad_state');
    }
  };

  const startGame = () => {
    if (!user.isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const b = fromActiveAmount(Number(bet));
    if (!b || b <= 0 || !deductBet(b)) return;

    sound.playClick();
    setIsPlaying(true);
    setCurrentLane(0);
    setGameResult(null);
    setActiveGameSession({ game: 'Crossroad', active: true, betAmount: b });
    saveState(true, 0, difficulty, bet);
  };

  const crossNextLane = () => {
    if (!isPlaying || isCrossing || currentLane >= cfg.lanes) return;

    sound.playSuspenseTick();
    setIsCrossing(true);

    setTimeout(() => {
      setIsCrossing(false);
      const crashed = Math.random() < cfg.crashChancePerLane;

      if (crashed) {
        sound.playExplosion();
        setIsPlaying(false);
        setGameResult('crashed');
        const b = fromActiveAmount(Number(bet));
        recordLoss(b, 'Crossroad');
        setActiveGameSession(null);
        saveState(false, currentLane, difficulty, bet);
      } else {
        sound.playGemChime();
        const next = currentLane + 1;
        setCurrentLane(next);

        if (next === cfg.lanes) {
          // Reached the other side! Auto cashout top prize
          sound.playCashout();
          sound.playWin();
          const b = fromActiveAmount(Number(bet));
          const topMult = cfg.multipliers[cfg.lanes - 1];
          awardPayout(b * topMult, 'Crossroad', topMult, b);
          setIsPlaying(false);
          setGameResult('win');
          setActiveGameSession(null);
          saveState(false, next, difficulty, bet);
        } else {
          saveState(true, next, difficulty, bet);
        }
      }
    }, 280);
  };

  const handleCashout = () => {
    if (!isPlaying || currentLane === 0 || isCrossing) return;

    sound.playCashout();
    sound.playWin();

    const b = fromActiveAmount(Number(bet));
    const payout = b * currentMultiplier;
    awardPayout(payout, 'Crossroad', currentMultiplier, b);

    setIsPlaying(false);
    setGameResult('win');
    setActiveGameSession(null);
    saveState(false, currentLane, difficulty, bet);
  };

  return (
    <GameShell
      title="CROSSROAD"
      badge="HIGHWAY MULTIPLIER"
      onBack={onBack}
      actions={
        <div className="flex items-center gap-2">
          <ResultPill
            label="Multiplier"
            value={`${currentMultiplier.toFixed(2)}x`}
            tone={currentMultiplier > 1 ? 'gold' : 'neutral'}
          />
          <ResultPill
            label="Lanes Safe"
            value={`${currentLane}/${cfg.lanes}`}
            tone={currentLane > 0 ? 'green' : 'neutral'}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <BetInput
            value={bet}
            onChange={setBet}
            disabled={isPlaying}
            currencyLabel={currencyLabel}
            min={1}
          />

          {/* Difficulty Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CONFIGS) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  disabled={isPlaying}
                  onClick={() => {
                    sound.playClick();
                    setDifficulty(d);
                  }}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs capitalize transition-all cursor-pointer border ${
                    difficulty === d
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  } disabled:opacity-50`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {!isPlaying ? (
            <ActionButton onClick={startGame} tone="accent" className="w-full py-4 text-base font-black">
              CROSS HIGHWAY
            </ActionButton>
          ) : (
            <div className="space-y-3">
              <ActionButton
                onClick={crossNextLane}
                disabled={isCrossing || currentLane >= cfg.lanes}
                tone="accent"
                className="w-full py-4 text-base font-black flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-5 h-5" />
                DASH NEXT LANE ({cfg.multipliers[currentLane]}x)
              </ActionButton>

              <ActionButton
                onClick={handleCashout}
                disabled={currentLane === 0 || isCrossing}
                tone="green"
                className="w-full py-3.5 text-base font-black"
              >
                CASHOUT {(Number(bet) * currentMultiplier).toFixed(2)} {currencyLabel}
              </ActionButton>
            </div>
          )}
        </div>

        {/* Highway Track Display */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[440px]">
          {/* Street Header / Finish Line */}
          <div className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" /> SAFE ZONE / FINISH LINE
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/40">
              TOP PRIZE: {cfg.multipliers[cfg.lanes - 1]}x
            </span>
          </div>

          {/* Highway Lanes */}
          <div className="my-4 flex flex-col-reverse gap-2 w-full">
            {/* Start Sidewalk */}
            <div className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
              currentLane === 0 && isPlaying
                ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-300 ring-2 ring-indigo-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                STARTING CURB (1.00x)
              </div>
              {currentLane === 0 && isPlaying && (
                <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                  PLAYER HERE
                </span>
              )}
            </div>

            {/* Road Lanes */}
            {cfg.multipliers.map((m, idx) => {
              const laneNum = idx + 1;
              const isCurrent = currentLane === laneNum;
              const isPast = currentLane > laneNum;
              const isCrashLane = gameResult === 'crashed' && currentLane + 1 === laneNum;

              return (
                <div
                  key={laneNum}
                  className={`w-full py-2.5 px-4 rounded-xl border relative transition-all duration-300 flex items-center justify-between overflow-hidden ${
                    isCrashLane
                      ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/50'
                      : isCurrent
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-2 ring-amber-500/40'
                      : isPast
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  {/* Road markings */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 border-b border-dashed border-slate-700/40" />

                  <div className="flex items-center gap-3 z-10">
                    <span className="text-xs font-mono font-bold text-slate-500">Lane {laneNum}</span>
                    {isCurrent && (
                      <span className="text-xs font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-slate-950" /> PLAYER HERE
                      </span>
                    )}
                    {isCrashLane && (
                      <span className="text-xs font-black bg-rose-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> CRASHED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 z-10">
                    <span className={`text-sm font-black font-mono ${
                      isCurrent || isPast ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {m.toFixed(2)}x
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({(Number(bet) * m).toFixed(2)} {currencyLabel})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outcome banner */}
          {gameResult === 'win' && (
            <div className="w-full py-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-5 h-5 text-amber-400" />
              SAFELY CASHED OUT! Won +{(Number(bet) * currentMultiplier).toFixed(2)} {currencyLabel}!
            </div>
          )}
          {gameResult === 'crashed' && (
            <div className="w-full py-3 px-4 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              HIT BY TRAFFIC! Lost {Number(bet).toFixed(2)} {currencyLabel}
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
};
