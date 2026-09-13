import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Target, Flame, Clock, RefreshCw, CheckCircle2, Gift, Sparkles, Coins, ChevronRight } from 'lucide-react';
import { DailyMission } from '../types';
import { dailyMissionService, STREAK_REWARDS } from '../services/dailyMissions';
import { sound } from '../services/audio';

interface DailyMissionsCardProps {
  missions: DailyMission[];
  rerollsAvailable: number;
  bankCoins: number;
  onClaimReward: (missionId: string) => void;
  onReroll: (missionId: string) => void;
  onStreakClaimed: (coinsAwarded: number) => void;
}

export const DailyMissionsCard: React.FC<DailyMissionsCardProps> = ({
  missions,
  rerollsAvailable,
  bankCoins,
  onClaimReward,
  onReroll,
  onStreakClaimed,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'streak'>('missions');
  const [resetCountdown, setResetCountdown] = useState<string>('');
  const [streakData, setStreakData] = useState(() => dailyMissionService.getDailyStreak());

  // Live countdown timer ticking down to midnight reset
  useEffect(() => {
    const updateTime = () => {
      const { formatted } = dailyMissionService.getTimeUntilReset();
      setResetCountdown(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = missions.filter((m) => m.completed).length;
  const claimableCount = missions.filter((m) => m.completed && !m.claimed).length;

  const handleClaim = (missionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { x, y },
      colors: ['#06b6d4', '#f59e0b', '#10b981', '#ffffff'],
    });

    sound.playRewardClaim();
    onClaimReward(missionId);
  };

  const handleClaimStreak = (e: React.MouseEvent) => {
    const res = dailyMissionService.claimDailyStreak();
    if (res.success) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { x, y },
        colors: ['#f59e0b', '#fbbf24', '#06b6d4', '#ffffff'],
      });

      sound.playRewardClaim();
      setStreakData(dailyMissionService.getDailyStreak());
      onStreakClaimed(res.coinsAwarded);
    }
  };

  return (
    <div
      id="daily-missions-container"
      className="w-full my-4 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden transition-all text-left"
    >
      {/* Top Header: Tabs & Bank Balance */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-missions-btn"
            onClick={() => setActiveTab('missions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'missions'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            DAILY MISSIONS
            {claimableCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            id="tab-streak-btn"
            onClick={() => setActiveTab('streak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-400" />
            7-DAY STREAK
            {!streakData.claimedToday && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Bank Coins Wallet Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-xs font-black text-amber-300">
            {bankCoins.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-400/70 font-semibold uppercase">Bank</span>
        </div>
      </div>

      {/* Tab 1: Daily Missions List */}
      {activeTab === 'missions' && (
        <div className="p-3.5 flex flex-col gap-2.5">
          {/* Subheader with reset countdown */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Resets in: <span className="text-cyan-300 font-mono font-bold">{resetCountdown || 'Loading...'}</span>
            </span>
            <span className="font-bold text-slate-300">
              Completed:{' '}
              <span className="text-cyan-400 font-mono">{completedCount}</span>
              <span className="text-slate-500">/3</span>
            </span>
          </div>

          {/* 3 Challenge Cards */}
          <div className="flex flex-col gap-2">
            {missions.map((mission, idx) => {
              const progressPct = Math.min(100, Math.round((mission.current / mission.target) * 100));
              const isDone = mission.completed;
              const isClaimed = mission.claimed;

              return (
                <div
                  key={mission.id}
                  id={`mission-card-${idx}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isClaimed
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                      : isDone
                      ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-slate-900/90 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Icon & Description */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        {mission.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-100 truncate">
                            {mission.title}
                          </h4>
                          {isClaimed && (
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              Claimed
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {mission.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Progress or Claim Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isDone && !isClaimed ? (
                        <button
                          id={`claim-mission-btn-${idx}`}
                          onClick={(e) => handleClaim(mission.id, e)}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 animate-bounce cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5 text-slate-950" />
                          CLAIM +{mission.rewardCoins}
                        </button>
                      ) : isClaimed ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-2 py-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>+{mission.rewardCoins}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                            +{mission.rewardCoins} 🪙
                          </span>
                          {rerollsAvailable > 0 && (
                            <button
                              id={`reroll-mission-btn-${idx}`}
                              onClick={() => onReroll(mission.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Reroll Challenge (1 free/day)"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Numeric Indicator */}
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                      {mission.current.toLocaleString()} / {mission.target.toLocaleString()} {mission.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 7-Day Login Streak Calendar */}
      {activeTab === 'streak' && (
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Current Streak:{' '}
              <span className="text-amber-400 font-mono font-black">
                {streakData.currentStreak} Days
              </span>
            </span>
            <span className="text-[11px] text-slate-400">Log in daily for Jackpots!</span>
          </div>

          {/* 7 Day Row */}
          <div className="grid grid-cols-7 gap-1.5">
            {streakData.days.map((d) => {
              const isJackpot = d.day === 7;
              return (
                <div
                  key={d.day}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                    d.isToday
                      ? streakData.claimedToday
                        ? 'bg-emerald-950/40 border-emerald-500/50'
                        : 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : d.isPast
                      ? 'bg-slate-900/60 border-slate-800 opacity-60'
                      : isJackpot
                      ? 'bg-purple-950/30 border-purple-500/30'
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase text-slate-400">
                    D{d.day}
                  </span>

                  <div className="my-1">
                    {isJackpot ? (
                      <span className="text-base">👑</span>
                    ) : (
                      <span className="text-xs">🪙</span>
                    )}
                  </div>

                  <span
                    className={`font-mono text-[10px] font-black ${
                      isJackpot ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    +{d.coins}
                  </span>

                  {d.isPast || (d.isToday && streakData.claimedToday) ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-1" />
                  ) : d.isToday ? (
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-tighter mt-1">
                      TODAY
                    </span>
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Claim Streak Action Button */}
          <div>
            {!streakData.claimedToday ? (
              <button
                id="claim-streak-btn"
                onClick={handleClaimStreak}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 active:scale-98 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                CLAIM TODAY'S REWARD (+{streakData.todayReward} COINS)
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Today's streak reward claimed! Next reward arrives at midnight.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
