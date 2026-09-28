import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { WalletModal } from './components/wallet/WalletModal';
import { AdminModal } from './components/admin/AdminModal';
import { AuthModal } from './components/auth/AuthModal';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { MinesGame } from './components/games/MinesGame';
import { TowersGame } from './components/games/TowersGame';
import { CoinflipGame } from './components/games/CoinflipGame';
import { CrashGame } from './components/games/CrashGame';
import { CasesGame } from './components/games/CasesGame';
import { CaseBattlesGame } from './components/games/CaseBattlesGame';
import { RouletteGame } from './components/games/RouletteGame';
import { BlackjackGame } from './components/games/BlackjackGame';
import { KenoGame } from './components/games/KenoGame';
import { GameDesignPreview } from './components/games/GameDesignPreview';
import { CornerMascots } from './components/common/CornerMascots';
import { Toast } from './components/common/Toast';
import { AlertCircle, X } from 'lucide-react';

const CasinoApp: React.FC = () => {
  const {
    activeGame,
    setActiveGame,
    authModalOpen,
    setAuthModalOpen,
    authMode,
    runningGameModal,
    setRunningGameModal,
    clearRunningGameSession,
  } = useGame();
  const [chatOpen, setChatOpen] = useState(false);

  const renderGameContent = () => {
    switch (activeGame) {
      case 'mines':
        return <MinesGame onBack={() => setActiveGame(null)} />;
      case 'towers':
        return <TowersGame onBack={() => setActiveGame(null)} />;
      case 'coinflip':
        return <CoinflipGame onBack={() => setActiveGame(null)} />;
      case 'crash':
        return <CrashGame onBack={() => setActiveGame(null)} />;
      case 'cases':
        return <CasesGame onBack={() => setActiveGame(null)} />;
      case 'casebattles':
        return <CaseBattlesGame onBack={() => setActiveGame(null)} />;
      case 'roulette':
        return <RouletteGame onBack={() => setActiveGame(null)} />;
      case 'blackjack':
        return <BlackjackGame onBack={() => setActiveGame(null)} />;
      case 'keno':
        return <KenoGame onBack={() => setActiveGame(null)} />;
      case null:
      case undefined:
        return <Dashboard onSelectGame={(gameId) => setActiveGame(gameId)} />;
      default:
        return <GameDesignPreview gameId={activeGame} onBack={() => setActiveGame(null)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans selection:bg-[#0074e4] selection:text-white relative">
      {/* Top Header */}
      <Header onToggleChat={() => setChatOpen(!chatOpen)} chatOpen={chatOpen} />

      {/* Running Game Conflict Alert Modal */}
      {runningGameModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0e1624] border border-[#1a283c] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Active Game in Progress</h3>
                <p className="text-xs text-slate-400">Finish your active round before starting another</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You already have a game running in <strong className="text-white font-bold">{runningGameModal.gameTitle}</strong> with active bets placed. Please complete or cash out your round.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveGame(runningGameModal.gameId);
                  setRunningGameModal(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#0074e4] hover:bg-[#0084ff] text-white text-xs font-black transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Resume {runningGameModal.gameTitle}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearRunningGameSession();
                }}
                className="px-3.5 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition cursor-pointer"
                title="Discard stuck round"
              >
                Clear Game
              </button>
              <button
                type="button"
                onClick={() => setRunningGameModal(null)}
                className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onSelectGame={(gameId) => setActiveGame(gameId)} />

        {/* Central Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderGameContent()}
        </main>

        {/* Community Chat Drawer */}
        <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      {/* Movable Corner Mascots (Tilted '\' on bottom-left, tilted '/' on bottom-right) */}
      <CornerMascots />

      {/* Wallet Cashier Modal */}
      <WalletModal />

      {/* Admin Management & GTPS Configuration Modal */}
      <AdminModal />

      {/* Auth Modal (Login / Register with 500 DLS bonus) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Bottom-Right Toast Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <CasinoApp />
    </GameProvider>
  );
}
