import React, { useEffect } from 'react';
import { Target, Sparkles } from 'lucide-react';
import { DailyMission } from '../types';

interface MissionToastProps {
  mission: DailyMission | null;
  onDismiss: () => void;
}

export const MissionToast: React.FC<MissionToastProps> = ({ mission, onDismiss }) => {
  useEffect(() => {
    if (!mission) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [mission, onDismiss]);

  if (!mission) return null;

  return (
    <div
      id="mission-completion-toast"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-slate-900/95 border border-amber-400/80 shadow-2xl backdrop-blur-md text-slate-100 ring-2 ring-amber-400/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
          {mission.icon || '🎯'}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              MISSION COMPLETED!
            </span>
          </div>
          <p className="text-xs font-black text-white">{mission.title}</p>
          <span className="text-[11px] font-mono font-bold text-amber-300">
            +{mission.rewardCoins} Coins Ready to Claim!
          </span>
        </div>
      </div>
    </div>
  );
};
