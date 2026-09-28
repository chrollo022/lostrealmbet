import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Play, History, ChevronDown } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ActionButton, BetInput, GameShell, ResultPill } from './GamePrimitives';

type RiskLevel = 'Low' | 'Medium' | 'High';

// Stake.com Plinko Multipliers for different row counts & risk levels
const PLINKO_MULTIPLIERS: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    Low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    Medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    High: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  10: {
    Low: [8.9, 3, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3, 8.9],
    Medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    High: [76, 10, 3, 1.5, 0.3, 0.2, 0.3, 1.5, 3, 10, 76],
  },
  12: {
    Low: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    Medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    High: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  14: {
    Low: [15, 4.5, 2, 1.5, 1.3, 1.1, 1.0, 0.5, 1.0, 1.1, 1.3, 1.5, 2, 4.5, 15],
    Medium: [58, 15, 7, 4, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4, 7, 15, 58],
    High: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
  },
  16: {
    Low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    Medium: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
    High: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  currentRow: number;
  betDls: number;
}

export const PlinkoGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    fromActiveAmount,
    deductBet,
    awardPayout,
    recordLoss,
    currencyLabel,
    user,
    setAuthModalOpen,
  } = useGame();

  const [bet, setBet] = useState('10');
  const [rows, setRows] = useState<number>(12); // 8, 10, 12, 14, 16
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [activeHistory, setActiveHistory] = useState<number[]>([2, 11, 0.3, 1.1, 4, 0.6]);
  const [flashingBucket, setFlashingBucket] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const multipliers = PLINKO_MULTIPLIERS[rows][risk];

  // Spawn Ball from top funnel
  const dropBall = () => {
    if (!user.isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const b = fromActiveAmount(Number(bet));
    if (!b || b <= 0 || !deductBet(b)) return;

    sound.playClick();

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 500;

    const newBall: Ball = {
      id: `${Date.now()}-${Math.random()}`,
      x: width / 2 + (Math.random() * 6 - 3),
      y: 35,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.8,
      currentRow: 0,
      betDls: b,
    };

    ballsRef.current.push(newBall);
  };

  // Main Canvas Physics & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Pyramid pin layout configuration
    const startY = 60;
    const endY = height - 55;
    const rowSpacing = (endY - startY) / rows;
    const bottomWidth = width - 40;
    const pinRadius = 3.5;
    const ballRadius = 5.5;

    // Generate pin coordinates for all rows
    const pins: { x: number; y: number }[][] = [];
    for (let r = 0; r <= rows; r++) {
      const rowPins: { x: number; y: number }[] = [];
      const numPins = r + 3;
      const rowY = startY + r * rowSpacing;
      const currentWidth = (bottomWidth * (r + 2)) / (rows + 2);
      const startX = (width - currentWidth) / 2;
      const stepX = currentWidth / (numPins - 1);

      for (let c = 0; c < numPins; c++) {
        rowPins.push({ x: startX + c * stepX, y: rowY });
      }
      pins.push(rowPins);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Pins
      for (let r = 0; r <= rows; r++) {
        for (const pin of pins[r]) {
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, pinRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 2. Update & Draw Active Balls
      const activeBalls: Ball[] = [];

      for (const ball of ballsRef.current) {
        ball.vy += 0.22; // Gravity
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision detection with pins
        for (let r = 0; r <= rows; r++) {
          for (const pin of pins[r]) {
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < pinRadius + ballRadius) {
              sound.playTick();
              // Deflect ball left or right with impulse
              const angle = Math.atan2(dy, dx);
              const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 0.75;
              const randomDeflect = (Math.random() - 0.5) * 0.4;
              ball.vx = Math.cos(angle + randomDeflect) * speed;
              ball.vy = Math.abs(Math.sin(angle)) * speed + 0.4;

              // Prevent clipping
              ball.x = pin.x + Math.cos(angle) * (pinRadius + ballRadius + 0.5);
              ball.y = pin.y + Math.sin(angle) * (pinRadius + ballRadius + 0.5);
            }
          }
        }

        // Check landing in bottom bucket
        if (ball.y >= endY + 10) {
          // Determine bucket index
          const bucketCount = multipliers.length;
          const bucketWidth = bottomWidth / bucketCount;
          const bucketStartX = (width - bottomWidth) / 2;
          const rawIdx = Math.floor((ball.x - bucketStartX) / bucketWidth);
          const bucketIdx = Math.max(0, Math.min(bucketCount - 1, rawIdx));

          const mult = multipliers[bucketIdx];
          const payout = ball.betDls * mult;

          if (mult >= 1.0) {
            awardPayout(payout, 'Plinko', mult, ball.betDls);
            sound.playCashout();
            sound.playWin();
          } else {
            recordLoss(ball.betDls, 'Plinko');
            sound.playExplosion();
          }

          setActiveHistory((prev) => [mult, ...prev.slice(0, 7)]);
          setFlashingBucket(bucketIdx);
          setTimeout(() => setFlashingBucket(null), 300);
        } else {
          activeBalls.push(ball);

          // Draw Glowing Ball
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ballsRef.current = activeBalls;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [rows, risk, multipliers]);

  return (
    <GameShell
      title="Plinko"
      icon="/assets/VoidPs_Originals_plinko.png"
      badge="99% RTP · Real Physics"
      onBack={onBack}
      controls={
        <>
          {/* Bet Input */}
          <BetInput value={bet} setValue={setBet} />

          {/* Risk Level Selector */}
          <div className="mt-3">
            <label className="vp-label mb-1.5 block text-xs font-bold text-slate-300">
              Risk Profile
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Low', 'Medium', 'High'] as RiskLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setRisk(lvl);
                  }}
                  className={`vp-choice py-2 text-xs ${risk === lvl ? 'vp-choice-active font-black' : ''}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Rows Selector */}
          <div className="mt-3">
            <label className="vp-label mb-1.5 block text-xs font-bold text-slate-300">
              Pyramid Rows
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[8, 10, 12, 14, 16].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setRows(r);
                  }}
                  className={`vp-choice py-1.5 text-xs ${rows === r ? 'vp-choice-active font-black' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Box */}
          <div className="vp-statbox mt-3 py-2 text-xs">
            <div>
              <span>Max Multiplier</span>
              <b className="text-amber-400 font-mono font-black">{multipliers[0]}×</b>
            </div>
            <div>
              <span>Center Multiplier</span>
              <b className="text-slate-300 font-mono font-bold">
                {multipliers[Math.floor(multipliers.length / 2)]}×
              </b>
            </div>
            <div>
              <span>Active Balls</span>
              <b className="text-cyan-400 font-mono">{ballsRef.current.length}</b>
            </div>
          </div>

          {/* Drop Ball Action Button */}
          <div className="mt-3">
            <ActionButton tone="purple" onClick={dropBall}>
              Drop Ball
            </ActionButton>
          </div>
        </>
      }
    >
      {/* Plinko Board Stage: Viewport fitted */}
      <div className="flex h-full max-h-[calc(100vh-170px)] flex-col items-center justify-between py-1 px-2 sm:px-4">
        {/* Recent Hit Multipliers Strip */}
        <div className="w-full max-w-lg flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <History className="w-3 h-3" /> Recent:
          </span>
          {activeHistory.map((h, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all ${
                h >= 10
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : h >= 1.5
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#121c2c] text-slate-400 border border-[#1d2d47]'
              }`}
            >
              {h}×
            </span>
          ))}
        </div>

        {/* Peg Pyramid Canvas */}
        <div className="relative w-full max-w-lg aspect-[11/10] max-h-[min(52vh,420px)] rounded-2xl bg-[#090f19] border border-[#16253c] flex flex-col items-center justify-between overflow-hidden my-auto shadow-2xl p-2">
          <canvas
            ref={canvasRef}
            width={480}
            height={420}
            className="w-full h-full pointer-events-none select-none"
          />

          {/* Colored Multiplier Buckets at the bottom */}
          <div className="w-full px-4 flex items-center justify-between gap-1 absolute bottom-2 left-0 right-0">
            {multipliers.map((m, idx) => {
              const isFlashing = flashingBucket === idx;
              // Color gradient: higher edges are red/orange/gold, centers are cyan/blue
              const isEdge = idx === 0 || idx === multipliers.length - 1;
              const isMid = idx === 1 || idx === multipliers.length - 2;

              return (
                <div
                  key={idx}
                  className={`flex-1 py-1 rounded text-center font-mono font-black text-[9px] sm:text-[10px] transition-all select-none border ${
                    isFlashing
                      ? 'bg-white text-black scale-125 z-10 shadow-lg shadow-white'
                      : isEdge
                      ? 'bg-red-600/90 text-white border-red-400 shadow-sm shadow-red-500/30'
                      : isMid
                      ? 'bg-amber-600/90 text-white border-amber-400'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}
                >
                  {m >= 100 ? `${m}` : `${m}×`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Subtext */}
        <p className="mt-1 text-center text-[11px] text-slate-500 font-medium">
          Stake.com Plinko odds · Drop multiple balls concurrently
        </p>
      </div>
    </GameShell>
  );
};
