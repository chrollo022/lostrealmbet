import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Trophy, History, Users, ArrowDown, ChevronRight, Clock } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ActionButton, BetInput, GameShell, ResultPill } from './GamePrimitives';

interface SlideHistoryItem {
  id: string;
  multiplier: number;
}

interface SlidePlayerBet {
  user: string;
  avatar: string;
  target: number;
  bet: number;
  won?: boolean;
}

export const SlideGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    fromActiveAmount,
    toActiveAmount,
    activeCurrency,
    deductBet,
    awardPayout,
    recordLoss,
    currencyLabel,
    user,
    setAuthModalOpen,
  } = useGame();

  const [bet, setBet] = useState('10');
  const [targetMultiplier, setTargetMultiplier] = useState('2.00');

  // Game cycle states: 'betting' (countdown) | 'sliding' | 'ended'
  const [gameState, setGameState] = useState<'betting' | 'sliding' | 'ended'>('betting');
  const [countdown, setCountdown] = useState(5.0);
  const [resultMultiplier, setResultMultiplier] = useState(1.00);
  const [userBetPlaced, setUserBetPlaced] = useState<{ amount: number; target: number } | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);

  const [history, setHistory] = useState<SlideHistoryItem[]>([
    { id: '1', multiplier: 2.45 },
    { id: '2', multiplier: 1.12 },
    { id: '3', multiplier: 8.90 },
    { id: '4', multiplier: 1.01 },
    { id: '5', multiplier: 3.65 },
    { id: '6', multiplier: 1.55 },
    { id: '7', multiplier: 14.20 },
  ]);

  const [liveBets, setLiveBets] = useState<SlidePlayerBet[]>([]);

  // Strip offset in pixels for horizontal animation
  const [stripOffset, setStripOffset] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Generate random slide outcomes with Stake 99% RTP
  const generateOutcome = (): number => {
    const r = Math.random();
    if (r < 0.03) return 1.00; // 3% instant bust
    const outcome = 0.99 / (1 - r);
    return Math.min(1000, Number(outcome.toFixed(2)));
  };

  // Continuous background game loop
  useEffect(() => {
    let timer: any = null;

    if (gameState === 'betting') {
      const interval = 100;
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 0.1) {
            clearInterval(timer);
            startSlideRound();
            return 0;
          }
          return Number((c - 0.1).toFixed(1));
        });
      }, interval);
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const startSlideRound = () => {
    setGameState('sliding');
    const outcome = generateOutcome();
    setResultMultiplier(outcome);

    const startTime = performance.now();
    const duration = 4000; // 4 seconds spin
    const initialVelocity = 4000; // pixels to scroll

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setStripOffset(easeOut * initialVelocity);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Slide finished!
        finalizeRound(outcome);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const finalizeRound = (outcome: number) => {
    setGameState('ended');
    setHistory((prev) => [{ id: Date.now().toString(), multiplier: outcome }, ...prev.slice(0, 11)]);

    // Evaluate user bet
    if (userBetPlaced) {
      const won = outcome >= userBetPlaced.target;
      setHasWon(won);

      if (won) {
        sound.playCashout();
        sound.playWin();
        const payout = userBetPlaced.amount * userBetPlaced.target;
        awardPayout(payout, 'Slide', userBetPlaced.target, userBetPlaced.amount);
      } else {
        sound.playExplosion();
        recordLoss(userBetPlaced.amount, 'Slide');
      }
    }

    // Evaluate live bets
    setLiveBets((prev) =>
      prev.map((b) => ({
        ...b,
        won: outcome >= b.target,
      }))
    );

    // 3 seconds cool-down then reset to betting
    setTimeout(() => {
      setGameState('betting');
      setCountdown(5.0);
      setUserBetPlaced(null);
      setHasWon(null);
      setStripOffset(0);
      setLiveBets([]);
    }, 3000);
  };

  const placeBet = () => {
    if (!user.isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (userBetPlaced || gameState !== 'betting') return;

    const b = fromActiveAmount(Number(bet));
    const target = Number(targetMultiplier);

    if (!b || b <= 0 || !deductBet(b)) return;
    if (isNaN(target) || target < 1.01) return;

    sound.playClick();
    setUserBetPlaced({ amount: b, target });

    setLiveBets((prev) => [
      {
        user: user.username,
        avatar: user.avatar,
        target,
        bet: b,
      },
      ...prev,
    ]);
  };

  const winChance = targetMultiplier ? Number((99 / Number(targetMultiplier)).toFixed(2)) : 0;

  return (
    <GameShell
      title="SLIDE"
      badge="LIVE MULTIPLIER WHEEL"
      onBack={onBack}
      actions={
        <div className="flex items-center gap-2">
          <ResultPill
            label="Round Status"
            value={
              gameState === 'betting'
                ? `Starts in ${countdown}s`
                : gameState === 'sliding'
                ? 'Sliding...'
                : `Landed ${resultMultiplier.toFixed(2)}x`
            }
            tone={gameState === 'betting' ? 'neutral' : gameState === 'sliding' ? 'gold' : 'green'}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <BetInput
            value={bet}
            onChange={setBet}
            disabled={userBetPlaced !== null || gameState !== 'betting'}
            currencyLabel={currencyLabel}
            min={1}
          />

          {/* Target Multiplier Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-wider">Target Multiplier</span>
              <span className="text-emerald-400 font-mono">Win Chance: {Math.min(99, winChance)}%</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1.01"
                max="1000"
                value={targetMultiplier}
                disabled={userBetPlaced !== null || gameState !== 'betting'}
                onChange={(e) => setTargetMultiplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                x
              </span>
            </div>
          </div>

          {/* Quick Target Multiplier Pills */}
          <div className="grid grid-cols-4 gap-2">
            {['1.50', '2.00', '5.00', '10.00'].map((val) => (
              <button
                key={val}
                disabled={userBetPlaced !== null || gameState !== 'betting'}
                onClick={() => {
                  sound.playClick();
                  setTargetMultiplier(val);
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  targetMultiplier === val
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                } disabled:opacity-50`}
              >
                {val}x
              </button>
            ))}
          </div>

          <ActionButton
            onClick={placeBet}
            disabled={userBetPlaced !== null || gameState !== 'betting'}
            tone="accent"
            className="w-full py-4 text-base font-black"
          >
            {userBetPlaced
              ? `BET PLACED (${userBetPlaced.target}x)`
              : gameState === 'betting'
              ? 'PLACE BET'
              : 'WAITING FOR NEXT ROUND'}
          </ActionButton>

          {/* Live Bets Feed */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Players ({liveBets.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {liveBets.map((b, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
                    b.won === true
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : b.won === false
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={b.avatar} alt={b.user} className="w-4 h-4 rounded-full object-cover" />
                    <span className="font-semibold truncate max-w-[90px]">{b.user}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{b.bet} {currencyLabel}</span>
                    <span className="font-mono font-bold text-amber-400">@{b.target}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Carousel Track */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[440px] relative overflow-hidden">
          {/* History Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <History className="w-3.5 h-3.5" /> Recent:
            </span>
            {history.map((h) => (
              <span
                key={h.id}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border shrink-0 ${
                  h.multiplier >= 2.0
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                {h.multiplier.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Central Slide Display Box */}
          <div className="relative w-full h-44 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Center target cursor pointer */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-amber-400 z-30 shadow-[0_0_15px_rgba(251,191,36,0.8)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-amber-400" />
            </div>

            {/* Horizontal Tile Tape */}
            <div
              className="flex items-center gap-4 absolute left-1/2 transition-none will-change-transform"
              style={{
                transform: `translateX(-${stripOffset}px)`,
              }}
            >
              {/* Repeated multiplier cards */}
              {Array.from({ length: 60 }).map((_, i) => {
                const simulatedVal = Number((1.05 + ((i * 37) % 80) * 0.15).toFixed(2));
                const isTarget = gameState === 'ended' && Math.abs(stripOffset - 4000) < 50;

                return (
                  <div
                    key={i}
                    className={`w-28 h-28 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-all ${
                      isTarget
                        ? 'bg-amber-500/30 border-amber-400 scale-105'
                        : 'bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 uppercase">Multiplier</span>
                    <span className="text-2xl font-mono font-black text-white">
                      {gameState === 'ended' && i === 35 ? `${resultMultiplier.toFixed(2)}x` : `${simulatedVal}x`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Countdown Overlay when in betting phase */}
            {gameState === 'betting' && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4 animate-spin" /> Next round starting in
                </div>
                <div className="text-5xl font-black font-mono text-white tracking-wider">
                  {countdown.toFixed(1)}s
                </div>
              </div>
            )}
          </div>

          {/* Outcome notification banner */}
          <div className="mt-4 min-h-[48px] flex items-center justify-center">
            {gameState === 'ended' && hasWon === true && (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
                <Trophy className="w-5 h-5 text-amber-400" />
                ROUND WON! Hit {resultMultiplier.toFixed(2)}x (Target: {userBetPlaced?.target}x)! Payout: +{toActiveAmount(userBetPlaced!.amount * userBetPlaced!.target).toFixed(activeCurrency === 'BGLS' ? 4 : 2)} {currencyLabel}
              </div>
            )}
            {gameState === 'ended' && hasWon === false && (
              <div className="w-full py-3 px-4 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-sm font-bold flex items-center justify-center gap-2">
                BUST! Landed {resultMultiplier.toFixed(2)}x (Target was {userBetPlaced?.target}x)
              </div>
            )}
            {gameState === 'sliding' && (
              <div className="text-slate-400 text-sm font-bold animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" /> Wheel sliding in progress...
              </div>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
