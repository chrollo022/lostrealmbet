import React, { useEffect, useRef, useState } from 'react';
import { Rocket, TrendingUp, ShieldAlert, Award, Clock } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ActionButton, BetInput, GameShell, ResultPill, ManualAutoTabs, PayoutMultiplierStats } from './GamePrimitives';

export const CrashGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    crashRoom,
    fromActiveAmount,
    toActiveAmount,
    activeCurrency,
    currencyLabel,
    user,
    setAuthModalOpen,
    checkCanPlayGame,
  } = useGame();

  const {
    phase,
    countdown,
    currentMultiplier,
    crashPoint,
    history,
    roomPlayers,
    userBet,
    joinNextRound,
    cancelQueuedBet,
    cashoutActiveBet,
  } = crashRoom;

  const [betMode, setBetMode] = useState<'manual' | 'auto'>('manual');
  const [bet, setBet] = useState('10');
  const [autoCashout, setAutoCashout] = useState('2.00');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Handle Bet placement
  const handlePlaceBet = () => {
    if (!user.isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!checkCanPlayGame('crash', 'Crash')) return;

    const b = fromActiveAmount(Number(bet));
    const auto = Number(autoCashout);

    if (!b || b <= 0) return;
    joinNextRound(b, isNaN(auto) ? 0 : auto);
  };

  // Canvas Rocket Graph Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid lines
      ctx.strokeStyle = '#141e2e';
      ctx.lineWidth = 1;
      for (let x = 40; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (phase === 'flying' || phase === 'crashed') {
        const originX = 50;
        const originY = height - 40;

        // Multiplier progression curve
        const progress = Math.min(1, (currentMultiplier - 1) / Math.max(2, (phase === 'crashed' ? crashPoint : currentMultiplier) * 1.2));
        const currentX = originX + progress * (width - 120);
        const currentY = originY - Math.pow(progress, 0.8) * (height - 90);

        // Draw curve
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(
          originX + (currentX - originX) * 0.5,
          originY,
          currentX,
          currentY
        );
        ctx.strokeStyle = phase === 'crashed' ? '#ef4444' : '#0074e4';
        ctx.lineWidth = 4;
        ctx.shadowColor = phase === 'crashed' ? '#ef4444' : '#0074e4';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Area under curve
        ctx.lineTo(currentX, originY);
        ctx.lineTo(originX, originY);
        const gradient = ctx.createLinearGradient(0, currentY, 0, originY);
        if (phase === 'crashed') {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 116, 228, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 116, 228, 0.0)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Rocket Mascot
        ctx.save();
        ctx.translate(currentX, currentY);
        const angle = -Math.atan2(originY - currentY, currentX - originX);
        ctx.rotate(angle * 0.4);

        if (phase === 'crashed') {
          // Explosion burst
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💥', 0, 0);
        } else {
          // Sleek neon rocket
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fill();

          // Engine trail flame
          ctx.beginPath();
          ctx.moveTo(-10, -4);
          ctx.lineTo(-24, 0);
          ctx.lineTo(-10, 4);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, currentMultiplier, crashPoint]);

  return (
    <GameShell
      title="Crash"
      icon="/assets/VoidPs_Originals_crash.png"
      badge="24/7 MULTIPLAYER ROOM · 99% RTP"
      onBack={onBack}
      controls={
        <>
          <div className="space-y-4">
            {/* Manual / Auto Pill */}
            <ManualAutoTabs mode={betMode} setMode={setBetMode} />

            {/* Bet Amount Input */}
            <BetInput
              value={bet}
              setValue={setBet}
              disabled={userBet?.status === 'queued' || userBet?.status === 'active'}
            />

            {/* Auto Cashout Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Auto Cashout (Multiplier)</span>
                <span className="text-cyan-400 font-mono text-[10px]">Optional</span>
              </div>
              <div className="bg-[#0b121e] border border-[#1a2638] rounded-xl flex items-center px-3 py-2 focus-within:border-[#0074e4] transition-colors">
                <input
                  type="number"
                  step="0.1"
                  min="1.01"
                  max="10000"
                  value={autoCashout}
                  disabled={userBet?.status === 'queued' || userBet?.status === 'active'}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  placeholder="2.00"
                  className="w-full bg-transparent text-white font-mono font-bold text-sm outline-none disabled:opacity-50"
                />
                <span className="text-slate-400 text-xs font-mono font-bold shrink-0">
                  ×
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            {userBet?.status === 'active' && phase === 'flying' ? (
              <button
                type="button"
                onClick={cashoutActiveBet}
                className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition cursor-pointer animate-pulse"
              >
                CASHOUT {toActiveAmount(userBet.amountDls * currentMultiplier).toFixed(activeCurrency === 'BGLS' ? 4 : 2)} {currencyLabel} ({currentMultiplier.toFixed(2)}×)
              </button>
            ) : userBet?.status === 'queued' ? (
              <button
                type="button"
                onClick={cancelQueuedBet}
                className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                BET QUEUED (CLICK TO CANCEL)
              </button>
            ) : (
              <ActionButton
                tone="blue"
                onClick={handlePlaceBet}
                disabled={phase === 'flying' && userBet !== null}
              >
                {phase === 'betting'
                  ? `BET FOR NEXT ROUND (${countdown.toFixed(1)}s)`
                  : 'BET FOR NEXT ROUND'}
              </ActionButton>
            )}
          </div>

          {/* Next Multiplier and Current Payout layout matching Mines */}
          <PayoutMultiplierStats
            hideNextMultiplier
            currentMultiplier={phase === 'flying' ? `${currentMultiplier.toFixed(2)}×` : undefined}
            currentPayout={
              userBet && phase === 'flying'
                ? userBet.amountDls * currentMultiplier
                : userBet?.status === 'cashed'
                ? userBet.amountDls * (userBet.cashedAt || 1)
                : 0
            }
          />

        </>
      }
    >
      {/* Central Crash Visualizer Area */}
      <div className="flex h-full max-h-[calc(100vh-170px)] flex-col items-center justify-between py-2 px-2 sm:px-4">
        {/* History Ribbon */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#142337]">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Recent:
          </span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded-md text-xs font-mono font-black border shrink-0 ${
                h >= 2.0
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-[#0f1726] border-[#1a2c45] text-slate-400'
              }`}
            >
              {h.toFixed(2)}×
            </span>
          ))}
        </div>

        {/* Big Graph Stage */}
        <div className="w-full flex-1 min-h-[320px] max-h-[440px] rounded-2xl bg-[#080e18] border border-[#142337] shadow-2xl relative overflow-hidden flex items-center justify-center my-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={420}
            className="w-full h-full object-cover"
          />

          {/* Central Overlay Multiplier & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            {phase === 'betting' ? (
              <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin" /> Next round starts in
                </span>
                <span className="text-6xl font-mono font-black text-white drop-shadow-2xl">
                  {countdown.toFixed(1)}s
                </span>
              </div>
            ) : phase === 'flying' ? (
              <div className="flex flex-col items-center">
                <span className="text-7xl sm:text-8xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]">
                  {currentMultiplier.toFixed(2)}×
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 mt-1 uppercase tracking-widest animate-pulse">
                  Current Multiplier
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in-95">
                <span className="text-7xl sm:text-8xl font-mono font-black text-red-500 tracking-tight drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">
                  {currentMultiplier.toFixed(2)}×
                </span>
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-500/40 uppercase tracking-widest mt-1">
                  CRASHED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Subtext */}
        <p className="mt-1 text-center text-[11px] text-slate-500 font-medium">
          Live Stake-Engine Crash · 1% House Edge ($99 / (1-r)$) · Synchronized 24/7 across all players
        </p>
      </div>
    </GameShell>
  );
};
