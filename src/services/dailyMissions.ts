import { DailyMission, DailyMissionType, DailyStreakState } from '../types';

const MISSIONS_STORAGE_KEY = 'subway_runner_daily_missions_v1';
const BANK_COINS_STORAGE_KEY = 'subway_runner_bank_coins_v1';
const STREAK_STORAGE_KEY = 'subway_runner_daily_streak_v1';

interface StoredMissionsData {
  date: string;
  missions: DailyMission[];
  rerollsAvailable: number;
}

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  type: DailyMissionType;
  target: number;
  rewardCoins: number;
  unit: string;
  icon: string;
}

// Mission Catalog divided into 3 distinct functional pillars
const DISTANCE_MISSIONS: MissionTemplate[] = [
  {
    id: 'dist_single_500',
    title: 'Speed Demon',
    description: 'Sprint 500m in a single run',
    type: 'distance_single',
    target: 500,
    rewardCoins: 60,
    unit: 'm',
    icon: '⚡',
  },
  {
    id: 'dist_single_750',
    title: 'Sonic Runner',
    description: 'Sprint 750m in a single run',
    type: 'distance_single',
    target: 750,
    rewardCoins: 100,
    unit: 'm',
    icon: '⚡',
  },
  {
    id: 'dist_total_1200',
    title: 'Tunnel Explorer',
    description: 'Cover 1,200m total distance today',
    type: 'distance_total',
    target: 1200,
    rewardCoins: 80,
    unit: 'm',
    icon: '🏃',
  },
  {
    id: 'dist_total_2000',
    title: 'Metro Marathon',
    description: 'Cover 2,000m total distance today',
    type: 'distance_total',
    target: 2000,
    rewardCoins: 130,
    unit: 'm',
    icon: '🏃',
  },
];

const COIN_MISSIONS: MissionTemplate[] = [
  {
    id: 'coins_single_15',
    title: 'Pocket Change',
    description: 'Collect 15 coins in a single run',
    type: 'coins_single',
    target: 15,
    rewardCoins: 50,
    unit: 'coins',
    icon: '🪙',
  },
  {
    id: 'coins_single_25',
    title: 'Coin Collector',
    description: 'Collect 25 coins in a single run',
    type: 'coins_single',
    target: 25,
    rewardCoins: 85,
    unit: 'coins',
    icon: '🪙',
  },
  {
    id: 'coins_total_40',
    title: 'Piggy Bank',
    description: 'Collect 40 coins total across runs',
    type: 'coins_total',
    target: 40,
    rewardCoins: 75,
    unit: 'coins',
    icon: '💰',
  },
  {
    id: 'coins_total_75',
    title: 'Golden Treasury',
    description: 'Collect 75 coins total across runs',
    type: 'coins_total',
    target: 75,
    rewardCoins: 125,
    unit: 'coins',
    icon: '💰',
  },
];

const SKILL_MISSIONS: MissionTemplate[] = [
  {
    id: 'dodge_12',
    title: 'Agile Acrobat',
    description: 'Dodge 12 trains or rail barriers',
    type: 'dodges',
    target: 12,
    rewardCoins: 65,
    unit: 'dodges',
    icon: '🛡️',
  },
  {
    id: 'score_single_3000',
    title: 'High Roller',
    description: 'Reach 3,000 points in a single run',
    type: 'score_single',
    target: 3000,
    rewardCoins: 70,
    unit: 'pts',
    icon: '🏆',
  },
  {
    id: 'score_single_5000',
    title: 'Arcade Legend',
    description: 'Reach 5,000 points in a single run',
    type: 'score_single',
    target: 5000,
    rewardCoins: 120,
    unit: 'pts',
    icon: '🏆',
  },
  {
    id: 'power_3',
    title: 'Power Surfer',
    description: 'Grab 3 power-ups in the subway',
    type: 'powerups',
    target: 3,
    rewardCoins: 70,
    unit: 'pickups',
    icon: '✨',
  },
  {
    id: 'hover_1',
    title: 'Board Master',
    description: 'Activate Hoverboard in any run',
    type: 'hoverboard',
    target: 1,
    rewardCoins: 50,
    unit: 'times',
    icon: '🛹',
  },
];

export interface RunProgressData {
  runDistance: number;
  runCoins: number;
  runScore: number;
  runDodges: number;
  powerUpsCollected: number;
  hoverboardUsed: boolean;
}

export const STREAK_REWARDS = [
  { day: 1, coins: 50, label: 'Day 1 Starter' },
  { day: 2, coins: 100, label: 'Day 2 Booster' },
  { day: 3, coins: 150, label: 'Day 3 Supply' },
  { day: 4, coins: 200, label: 'Day 4 Stash' },
  { day: 5, coins: 300, label: 'Day 5 Bounty' },
  { day: 6, coins: 450, label: 'Day 6 Fortune' },
  { day: 7, coins: 1000, label: 'Day 7 JACKPOT' },
];

class DailyMissionService {
  private getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pseudo-random deterministic hash based on date string
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private generateDailyMissions(dateStr: string): DailyMission[] {
    const seed = this.hashString(dateStr);

    const m1Template = DISTANCE_MISSIONS[seed % DISTANCE_MISSIONS.length];
    const m2Template = COIN_MISSIONS[(seed + 1) % COIN_MISSIONS.length];
    const m3Template = SKILL_MISSIONS[(seed + 2) % SKILL_MISSIONS.length];

    const templates = [m1Template, m2Template, m3Template];

    return templates.map((tmpl) => ({
      id: `${tmpl.id}_${dateStr}`,
      title: tmpl.title,
      description: tmpl.description,
      type: tmpl.type,
      target: tmpl.target,
      current: 0,
      rewardCoins: tmpl.rewardCoins,
      completed: false,
      claimed: false,
      icon: tmpl.icon,
      unit: tmpl.unit,
    }));
  }

  public getDailyMissions(): { missions: DailyMission[]; rerollsAvailable: number } {
    const today = this.getTodayDateString();
    try {
      const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
      if (raw) {
        const parsed: StoredMissionsData = JSON.parse(raw);
        if (parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length === 3) {
          return {
            missions: parsed.missions,
            rerollsAvailable: parsed.rerollsAvailable ?? 1,
          };
        }
      }
    } catch {
      // Fallback
    }

    // Generate fresh missions for today
    const newMissions = this.generateDailyMissions(today);
    const newData: StoredMissionsData = {
      date: today,
      missions: newMissions,
      rerollsAvailable: 1,
    };

    try {
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // ignore
    }

    return { missions: newMissions, rerollsAvailable: 1 };
  }

  private saveMissions(missions: DailyMission[], rerollsAvailable: number) {
    const today = this.getTodayDateString();
    try {
      const data: StoredMissionsData = {
        date: today,
        missions,
        rerollsAvailable,
      };
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  /**
   * Process progress from a run or mid-run event.
   * Returns newly completed missions for celebratory alerts.
   */
  public recordRunProgress(data: RunProgressData): {
    missions: DailyMission[];
    newlyCompleted: DailyMission[];
  } {
    const { missions, rerollsAvailable } = this.getDailyMissions();
    const newlyCompleted: DailyMission[] = [];

    const updatedMissions = missions.map((m) => {
      let progressInc = 0;
      let isSingleRun = false;
      let newCurrent = m.current;

      switch (m.type) {
        case 'distance_single':
          isSingleRun = true;
          newCurrent = Math.max(m.current, data.runDistance);
          break;
        case 'distance_total':
          progressInc = data.runDistance;
          newCurrent = Math.min(m.target, m.current + progressInc);
          break;
        case 'coins_single':
          isSingleRun = true;
          newCurrent = Math.max(m.current, data.runCoins);
          break;
        case 'coins_total':
          progressInc = data.runCoins;
          newCurrent = Math.min(m.target, m.current + progressInc);
          break;
        case 'score_single':
          isSingleRun = true;
          newCurrent = Math.max(m.current, data.runScore);
          break;
        case 'dodges':
          progressInc = data.runDodges;
          newCurrent = Math.min(m.target, m.current + progressInc);
          break;
        case 'powerups':
          progressInc = data.powerUpsCollected;
          newCurrent = Math.min(m.target, m.current + progressInc);
          break;
        case 'hoverboard':
          if (data.hoverboardUsed) {
            newCurrent = 1;
          }
          break;
      }

      const wasCompleted = m.completed;
      const isNowCompleted = newCurrent >= m.target;

      const updatedMission: DailyMission = {
        ...m,
        current: Math.min(m.target, newCurrent),
        completed: isNowCompleted || wasCompleted,
      };

      if (!wasCompleted && isNowCompleted) {
        newlyCompleted.push(updatedMission);
      }

      return updatedMission;
    });

    this.saveMissions(updatedMissions, rerollsAvailable);
    return { missions: updatedMissions, newlyCompleted };
  }

  /**
   * Claim reward for a completed mission.
   * Awards coins to the bank and marks mission as claimed.
   */
  public claimMissionReward(missionId: string): { success: boolean; coinsAwarded: number; missions: DailyMission[] } {
    const { missions, rerollsAvailable } = this.getDailyMissions();
    let coinsAwarded = 0;

    const updated = missions.map((m) => {
      if (m.id === missionId && m.completed && !m.claimed) {
        coinsAwarded = m.rewardCoins;
        return { ...m, claimed: true };
      }
      return m;
    });

    if (coinsAwarded > 0) {
      this.addBankCoins(coinsAwarded);
      this.saveMissions(updated, rerollsAvailable);
      return { success: true, coinsAwarded, missions: updated };
    }

    return { success: false, coinsAwarded: 0, missions };
  }

  /**
   * Reroll a single challenge (1 free reroll per day).
   */
  public rerollMission(missionId: string): { success: boolean; missions: DailyMission[]; rerollsAvailable: number } {
    const { missions, rerollsAvailable } = this.getDailyMissions();
    if (rerollsAvailable <= 0) {
      return { success: false, missions, rerollsAvailable: 0 };
    }

    const today = this.getTodayDateString();
    const targetIdx = missions.findIndex((m) => m.id === missionId);
    if (targetIdx === -1) return { success: false, missions, rerollsAvailable };

    // Select alternative catalog based on slot
    const catalog = targetIdx === 0 ? DISTANCE_MISSIONS : targetIdx === 1 ? COIN_MISSIONS : SKILL_MISSIONS;
    const existingIds = new Set(missions.map((m) => m.id.split('_')[0]));
    const available = catalog.filter((c) => !existingIds.has(c.id.split('_')[0]));
    const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : catalog[0];

    const replacement: DailyMission = {
      id: `${chosen.id}_${today}_reroll`,
      title: chosen.title,
      description: chosen.description,
      type: chosen.type,
      target: chosen.target,
      current: 0,
      rewardCoins: chosen.rewardCoins,
      completed: false,
      claimed: false,
      icon: chosen.icon,
      unit: chosen.unit,
    };

    const newMissions = [...missions];
    newMissions[targetIdx] = replacement;
    const newRerolls = rerollsAvailable - 1;

    this.saveMissions(newMissions, newRerolls);
    return { success: true, missions: newMissions, rerollsAvailable: newRerolls };
  }

  /**
   * Countdown to midnight when next daily missions reset.
   */
  public getTimeUntilReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const formatted = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    return { hours, minutes, seconds, formatted };
  }

  // --- Bank Coins (Cumulative Player Balance) ---

  public getBankCoins(): number {
    try {
      const saved = localStorage.getItem(BANK_COINS_STORAGE_KEY);
      if (saved) return parseInt(saved, 10) || 0;
    } catch {
      // ignore
    }
    return 0;
  }

  public addBankCoins(amount: number): number {
    const current = this.getBankCoins();
    const next = Math.max(0, current + amount);
    try {
      localStorage.setItem(BANK_COINS_STORAGE_KEY, next.toString());
    } catch {
      // ignore
    }
    return next;
  }

  public spendBankCoins(amount: number): { success: boolean; newBalance: number } {
    const current = this.getBankCoins();
    if (current >= amount) {
      const next = current - amount;
      try {
        localStorage.setItem(BANK_COINS_STORAGE_KEY, next.toString());
      } catch {
        // ignore
      }
      return { success: true, newBalance: next };
    }
    return { success: false, newBalance: current };
  }

  // --- 7-Day Login Streak System ---

  public getDailyStreak(): {
    currentStreak: number;
    claimedToday: boolean;
    todayReward: number;
    days: Array<{ day: number; coins: number; label: string; isToday: boolean; isPast: boolean }>;
  } {
    const today = this.getTodayDateString();
    let state: DailyStreakState = {
      currentStreak: 1,
      lastClaimDate: '',
      claimedToday: false,
    };

    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = {
          currentStreak: parsed.currentStreak ?? 1,
          lastClaimDate: parsed.lastClaimDate ?? '',
          claimedToday: parsed.lastClaimDate === today,
        };

        // Check if streak was broken (missed more than 1 day)
        if (state.lastClaimDate && state.lastClaimDate !== today) {
          const lastDate = new Date(state.lastClaimDate);
          const currDate = new Date(today);
          const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 1) {
            // Streak broken, reset to day 1
            state.currentStreak = 1;
          }
        }
      }
    } catch {
      // ignore
    }

    const effectiveDay = ((state.currentStreak - 1) % 7) + 1;
    const todayReward = STREAK_REWARDS[effectiveDay - 1].coins;

    const days = STREAK_REWARDS.map((r) => {
      const isToday = r.day === effectiveDay;
      const isPast = r.day < effectiveDay;
      return {
        day: r.day,
        coins: r.coins,
        label: r.label,
        isToday,
        isPast,
      };
    });

    return {
      currentStreak: state.currentStreak,
      claimedToday: state.lastClaimDate === today,
      todayReward,
      days,
    };
  }

  public claimDailyStreak(): { success: boolean; coinsAwarded: number; newStreak: number } {
    const today = this.getTodayDateString();
    const current = this.getDailyStreak();

    if (current.claimedToday) {
      return { success: false, coinsAwarded: 0, newStreak: current.currentStreak };
    }

    const effectiveDay = ((current.currentStreak - 1) % 7) + 1;
    const reward = STREAK_REWARDS[effectiveDay - 1].coins;
    const newStreak = current.currentStreak + 1;

    try {
      const newState: DailyStreakState = {
        currentStreak: newStreak,
        lastClaimDate: today,
        claimedToday: true,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore
    }

    const newBalance = this.addBankCoins(reward);

    return {
      success: true,
      coinsAwarded: reward,
      newStreak,
    };
  }
}

export const dailyMissionService = new DailyMissionService();
