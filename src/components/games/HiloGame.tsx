import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, SkipForward, History, Sparkles, Coins, Trophy } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { ActionButton, BetInput, GameShell, ResultPill } from './GamePrimitives';

interface Card {
  rank: number; // 1 to 13 (1=A, 11=J, 12=Q, 13=K)
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  label: string;
}

const SUITS: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
const LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
};

const getRandomCard = (): Card => {
  const rank = Math.floor(Math.random() * 13) + 1;
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { rank, suit, label: LABELS[rank] };
};

export const HiloGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card>(getRandomCard());
  const [cardHistory, setCardHistory] = useState<Card[]>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  const [streak, setStreak] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | null>(null);

  // Restore saved game
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voidps_hilo_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isPlaying) {
          setIsPlaying(true);
          setCurrentCard(parsed.currentCard);
          setCardHistory(parsed.cardHistory || []);
          setMultiplier(parsed.multiplier || 1.0);
          setStreak(parsed.streak || 0);
          setBet(parsed.bet || '10');
          setActiveGameSession({ game: 'Hilo', active: true, betAmount: Number(parsed.bet) });
        }
      }
    } catch {}
  }, []);

  const saveState = (playing: boolean, card: Card, history: Card[], mult: number, strk: number, betVal: string) => {
    if (playing) {
      localStorage.setItem('voidps_hilo_state', JSON.stringify({
        isPlaying: true,
        currentCard: card,
        cardHistory: history,
        multiplier: mult,
        streak: strk,
        bet: betVal
      }));
    } else {
      localStorage.removeItem('voidps_hilo_state');
    }
  };

  // Odds calculation
  const higherCount = 13 - currentCard.rank + 1;
  const higherChance = (higherCount / 13) * 100;
  const higherMult = Number(((13 / higherCount) * 0.99).toFixed(2));

  const lowerCount = currentCard.rank;
  const lowerChance = (lowerCount / 13) * 100;
  const lowerMult = Number(((13 / lowerCount) * 0.99).toFixed(2));

  const startGame = () => {
    if (!user.isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const b = fromActiveAmount(Number(bet));
    if (!b || b <= 0 || !deductBet(b)) return;

    sound.playCard();
    const initialCard = getRandomCard();
    setCurrentCard(initialCard);
    setCardHistory([initialCard]);
    setMultiplier(1.0);
    setStreak(0);
    setIsPlaying(true);
    setGameResult(null);

    setActiveGameSession({ game: 'Hilo', active: true, betAmount: b });
    saveState(true, initialCard, [initialCard], 1.0, 0, bet);
  };

  const handleGuess = (guess: 'higher' | 'lower' | 'skip') => {
    if (!isPlaying || flipping) return;

    sound.playClick();
    setFlipping(true);

    setTimeout(() => {
      const nextCard = getRandomCard();
      const newHistory = [nextCard, ...cardHistory].slice(0, 10);
      setFlipping(false);

      if (guess === 'skip') {
        sound.playCard();
        setCurrentCard(nextCard);
        setCardHistory(newHistory);
        saveState(true, nextCard, newHistory, multiplier, streak, bet);
        return;
      }

      const isHigherWin = guess === 'higher' && nextCard.rank >= currentCard.rank;
      const isLowerWin = guess === 'lower' && nextCard.rank <= currentCard.rank;
      const won = isHigherWin || isLowerWin;

      if (won) {
        sound.playGemChime();
        const stepMult = guess === 'higher' ? higherMult : lowerMult;
        const newMult = Number((multiplier * stepMult).toFixed(2));
        const newStreak = streak + 1;

        setCurrentCard(nextCard);
        setCardHistory(newHistory);
        setMultiplier(newMult);
        setStreak(newStreak);
        saveState(true, nextCard, newHistory, newMult, newStreak, bet);
      } else {
        sound.playExplosion();
        setCurrentCard(nextCard);
        setCardHistory(newHistory);
        setIsPlaying(false);
        setGameResult('loss');
        const b = fromActiveAmount(Number(bet));
        recordLoss(b, 'Hilo');
        setActiveGameSession(null);
        saveState(false, nextCard, newHistory, 1.0, 0, bet);
      }
    }, 350);
  };

  const handleCashout = () => {
    if (!isPlaying || streak === 0) return;

    sound.playCashout();
    sound.playWin();

    const b = fromActiveAmount(Number(bet));
    const payout = b * multiplier;
    awardPayout(payout, 'Hilo', multiplier, b);

    setIsPlaying(false);
    setGameResult('win');
    setActiveGameSession(null);
    saveState(false, currentCard, cardHistory, 1.0, 0, bet);
  };

  const getSuitSymbol = (s: Card['suit']) => {
    switch (s) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const isRed = currentCard.suit === 'hearts' || currentCard.suit === 'diamonds';

  return (
    <GameShell
      title="HILO"
      badge="STAKE CLASSIC"
      onBack={onBack}
      actions={
        <div className="flex items-center gap-2">
          <ResultPill
            label="Multiplier"
            value={`${multiplier.toFixed(2)}x`}
            tone={multiplier > 1 ? 'gold' : 'neutral'}
          />
          <ResultPill
            label="Streak"
            value={`${streak}`}
            tone={streak > 0 ? 'green' : 'neutral'}
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
            disabled={isPlaying}
            currencyLabel={currencyLabel}
            min={1}
          />

          {!isPlaying ? (
            <ActionButton onClick={startGame} tone="accent" className="w-full py-4 text-base font-black">
              START GAME
            </ActionButton>
          ) : (
            <div className="space-y-3">
              {/* Higher Button */}
              <button
                onClick={() => handleGuess('higher')}
                disabled={flipping}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-600/40 text-emerald-300 font-bold transition-all disabled:opacity-50 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <ArrowUp className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black">HIGHER OR SAME</div>
                    <div className="text-xs text-emerald-400/80">{higherChance.toFixed(1)}% chance</div>
                  </div>
                </div>
                <span className="text-sm font-black bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {higherMult}x
                </span>
              </button>

              {/* Lower Button */}
              <button
                onClick={() => handleGuess('lower')}
                disabled={flipping}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-indigo-500/10 border border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-600/40 text-indigo-300 font-bold transition-all disabled:opacity-50 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black">LOWER OR SAME</div>
                    <div className="text-xs text-indigo-400/80">{lowerChance.toFixed(1)}% chance</div>
                  </div>
                </div>
                <span className="text-sm font-black bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                  {lowerMult}x
                </span>
              </button>

              {/* Skip Card */}
              <button
                onClick={() => handleGuess('skip')}
                disabled={flipping}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-slate-400" />
                SKIP CARD
              </button>

              {/* Cashout */}
              <ActionButton
                onClick={handleCashout}
                disabled={streak === 0 || flipping}
                tone="green"
                className="w-full py-3.5 text-base font-black shadow-lg shadow-emerald-950/40"
              >
                CASHOUT {(Number(bet) * multiplier).toFixed(2)} {currencyLabel}
              </ActionButton>
            </div>
          )}
        </div>

        {/* Card Table Visualizer */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
          {/* Subtle felt green glow background */}
          <div className="absolute inset-0 bg-emerald-950/10 radial-gradient pointer-events-none" />

          {/* Previous Cards History Ribbon */}
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-800/60">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <History className="w-3.5 h-3.5" /> History:
            </span>
            {cardHistory.map((c, i) => {
              const red = c.suit === 'hearts' || c.suit === 'diamonds';
              return (
                <div
                  key={i}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                    i === 0
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className={red ? 'text-rose-400' : 'text-slate-300'}>
                    {getSuitSymbol(c.suit)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active 3D Playing Card */}
          <div className="my-6 perspective-1000 flex flex-col items-center">
            <div
              className={`w-48 h-68 rounded-2xl border-4 shadow-2xl p-4 flex flex-col justify-between transition-all duration-300 transform select-none ${
                flipping
                  ? 'rotate-y-90 scale-95 opacity-50'
                  : 'rotate-y-0 scale-100 opacity-100'
              } ${
                isRed
                  ? 'bg-gradient-to-br from-white via-rose-50 to-rose-100 border-rose-400/80 text-rose-600 shadow-rose-950/30'
                  : 'bg-gradient-to-br from-white via-slate-50 to-slate-200 border-slate-400/80 text-slate-900 shadow-slate-950/40'
              }`}
              style={{
                boxShadow: isRed
                  ? '0 20px 40px -15px rgba(225, 29, 72, 0.3), inset 0 0 15px rgba(255,255,255,0.8)'
                  : '0 20px 40px -15px rgba(15, 23, 42, 0.6), inset 0 0 15px rgba(255,255,255,0.8)',
              }}
            >
              {/* Top Left Rank & Suit */}
              <div className="text-left leading-none">
                <div className="text-3xl font-black">{currentCard.label}</div>
                <div className="text-xl">{getSuitSymbol(currentCard.suit)}</div>
              </div>

              {/* Center Suit Symbol */}
              <div className="text-center text-6xl font-black select-none my-auto drop-shadow-sm">
                {getSuitSymbol(currentCard.suit)}
              </div>

              {/* Bottom Right Inverted Rank & Suit */}
              <div className="text-right leading-none transform rotate-180">
                <div className="text-3xl font-black">{currentCard.label}</div>
                <div className="text-xl">{getSuitSymbol(currentCard.suit)}</div>
              </div>
            </div>

            {/* Current Multiplier Badge */}
            <div className="mt-4 flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400 font-bold uppercase">Current Payout:</span>
              <span className="text-base font-black text-amber-400">
                {(Number(bet) * multiplier).toFixed(2)} {currencyLabel}
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* Outcome notification banner */}
          {gameResult === 'win' && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40 text-sm font-bold animate-bounce">
              <Trophy className="w-4 h-4 text-emerald-400" />
              CASHOUT SUCCESSFUL! +{(Number(bet) * multiplier).toFixed(2)} {currencyLabel}
            </div>
          )}
          {gameResult === 'loss' && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-950/60 px-4 py-2 rounded-xl border border-rose-500/40 text-sm font-bold">
              ROUND OVER - Incorrect prediction
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
};
