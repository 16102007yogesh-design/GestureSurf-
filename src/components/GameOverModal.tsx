import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Award, Navigation, Coins, ShieldAlert, Sparkles, User, Home } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  isNewHigh: boolean;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenLocker?: () => void;
  unclaimedMissionsCount?: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHigh,
  onRestart,
  onGoHome,
  onOpenLocker,
  unclaimedMissionsCount = 0,
}) => {
  useEffect(() => {
    if (isNewHigh) {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHigh]);

  // Keyboard shortcut listener: H or Escape for Home, Space or Enter for Play Again
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' || e.code === 'Escape') {
        e.preventDefault();
        onGoHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoHome]);

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500" />

        {/* Header Badge */}
        {isNewHigh ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-3 shadow-lg shadow-amber-950/40 animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            NEW RECORD ACHIEVED!
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            SUBWAY RUN TERMINATED
          </div>
        )}

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">RUN COMPLETED</h2>
        <p className="text-xs text-slate-400 mt-1">Check out your tournament stats and coin haul</p>

        {/* Pro Score Card */}
        <div className="my-5 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
            FINAL SCORE
          </span>
          <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 drop-shadow-md">
            {stats.score.toLocaleString()}
          </span>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold mb-0.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Distance</span>
              </div>
              <span className="font-mono font-bold text-white text-base">
                {stats.distance} <span className="text-[11px] text-slate-400">m</span>
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-yellow-400 text-xs font-semibold mb-0.5">
                <Coins className="w-3.5 h-3.5" />
                <span>Coins</span>
              </div>
              <span className="font-mono font-bold text-white text-base">+{stats.coins}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-purple-400 text-xs font-semibold mb-0.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Best</span>
              </div>
              <span className="font-mono font-bold text-white text-base">
                {Math.max(stats.score, stats.highScore).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Mission Completion Notice */}
        {unclaimedMissionsCount > 0 && (
          <div className="mb-4 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-yellow-500/20 border border-amber-500/40 flex items-center justify-between text-xs text-amber-300 shadow-md">
            <div className="flex items-center gap-2 font-bold text-left">
              <span className="text-lg">🎯</span>
              <div>
                <span className="block font-black text-amber-300">
                  {unclaimedMissionsCount} Daily Challenge{unclaimedMissionsCount > 1 ? 's' : ''} Completed!
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">Claim your coin rewards on the Home Page</span>
              </div>
            </div>
            <button
              id="gameover-claim-home-btn"
              onClick={onGoHome}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all"
            >
              Claim →
            </button>
          </div>
        )}

        {/* Action Buttons: Home Page + Play Again */}
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="gameover-home-btn"
              onClick={onGoHome}
              className="py-3.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-98 text-slate-100 font-extrabold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:border-cyan-500/40"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              HOME PAGE
            </button>

            <button
              id="restart-game-btn"
              onClick={onRestart}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-950" />
              PLAY AGAIN
            </button>
          </div>

          {onOpenLocker && (
            <button
              id="gameover-locker-btn"
              onClick={onOpenLocker}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Open Locker & Outfits
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-3">Press Space for Play Again • Press H for Home Page</p>
      </div>
    </div>
  );
};
