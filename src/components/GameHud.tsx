import React from 'react';
import { ActivePowerUp, GameStats, HandTrackingResult, UserPreferences } from '../types';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  HelpCircle,
  Settings,
  Flame,
  Shield,
  Magnet,
  Zap,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Gauge,
  Activity,
  User,
  Radio,
  Compass,
  Home,
} from 'lucide-react';

interface GameHudProps {
  stats: GameStats;
  powerUps: ActivePowerUp[];
  isPaused: boolean;
  soundMuted: boolean;
  fps: number;
  preferences: UserPreferences;
  trackingResult: HandTrackingResult | null;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onOpenLocker: () => void;
  onGoHome?: () => void;
  onActionLane: (dir: -1 | 1) => void;
  onActionJump: () => void;
  onActionSlide: () => void;
  onActionHoverboard: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  powerUps,
  isPaused,
  soundMuted,
  fps,
  preferences,
  trackingResult,
  onTogglePause,
  onToggleSound,
  onOpenTutorial,
  onOpenSettings,
  onOpenLocker,
  onGoHome,
  onActionLane,
  onActionJump,
  onActionSlide,
  onActionHoverboard,
}) => {
  const laneName =
    trackingResult?.rawLane === -1 ? 'LEFT' : trackingResult?.rawLane === 1 ? 'RIGHT' : 'CENTER';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 select-none z-30 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left Stats: Distance, Dodges, Multiplier & Telemetry */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-cyan-500/30 shadow-lg flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                DISTANCE
              </span>
              <span className="font-mono text-lg font-black text-cyan-400">
                {stats.distance.toLocaleString()}{' '}
                <span className="text-xs text-cyan-200 font-semibold">m</span>
              </span>
            </div>

            {/* Live FPS Badge */}
            {preferences.showFps && (
              <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                <Gauge className="w-3.5 h-3.5" />
                <span>{fps} FPS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-400">Dodges:</span>
              <span className="font-bold font-mono text-amber-400">{stats.dodges}</span>
            </div>

            {/* Difficulty Badge */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {preferences.difficulty}
            </div>

            {stats.multiplier > 1 && (
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow-md shadow-purple-900/40 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {stats.multiplier}X MULTIPLIER
              </div>
            )}
          </div>

          {/* Continuous Hand Line Steering Telemetry Ribbon */}
          {preferences.showGestureTelemetry && (
            <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-[11px] font-mono text-slate-300 flex items-center gap-2.5 shadow-lg">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span className="font-bold">
                  LINE: {trackingResult?.continuousX !== undefined ? (trackingResult.continuousX < 0 ? '' : '+') + Math.round(trackingResult.continuousX * 100) + '%' : '0%'}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-amber-300">
                VECTOR: {trackingResult?.steerAngle !== undefined ? Math.round(trackingResult.steerAngle) + '°' : '0°'}
              </span>
              <span className="text-slate-600">|</span>
              <span className={trackingResult?.detected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {trackingResult?.detected ? 'SCAN LOCKED' : 'RAISE HAND'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Active Power-Ups Badges */}
        <div className="hidden sm:flex items-center gap-2">
          {powerUps.map((p) => {
            const pct = Math.round((p.remainingTime / p.totalDuration) * 100);
            return (
              <div
                key={p.type}
                className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 flex items-center gap-2.5 shadow-xl"
              >
                {p.type === 'magnet' && <Magnet className="w-4 h-4 text-blue-400 animate-pulse" />}
                {p.type === 'jetpack' && <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />}
                {p.type === 'multiplier' && <Zap className="w-4 h-4 text-purple-400 animate-spin" />}
                {p.type === 'hoverboard' && <Shield className="w-4 h-4 text-cyan-400" />}

                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">
                    {p.type}
                  </span>
                  <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">{p.remainingTime}s</span>
              </div>
            );
          })}
        </div>

        {/* Right Stats: Coins, Total Score & Pro Utility Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Controls Utility Buttons */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-lg">
            {onGoHome && (
              <button
                id="hud-home-btn"
                onClick={onGoHome}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Return to Home Page"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            <button
              id="hud-locker-btn"
              onClick={onOpenLocker}
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Locker & Customizer"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              id="hud-mute-btn"
              onClick={onToggleSound}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              id="hud-pause-btn"
              onClick={onTogglePause}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              id="hud-tutorial-btn"
              onClick={onOpenTutorial}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              id="hud-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Pro Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Score Display */}
          <div className="bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              SCORE
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Coins Display */}
          <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-yellow-500/30 shadow-lg flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-xs shadow">
              ★
            </div>
            <span className="font-mono text-base font-bold text-yellow-300">
              {stats.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Biometric Gesture Action HUD Banner */}
      {trackingResult?.gesture && trackingResult.gesture !== 'NONE' && (
        <div className="self-center -mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-cyan-500/40 shadow-2xl animate-bounce pointer-events-none z-30 font-black text-xs sm:text-sm uppercase tracking-wider bg-slate-950/90 text-white">
          {trackingResult.gesture === 'JUMP' && (
            <div className="flex items-center gap-2 text-emerald-400">
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>▲ JUMP LEAP EXECUTED</span>
            </div>
          )}
          {trackingResult.gesture === 'SLIDE' && (
            <div className="flex items-center gap-2 text-amber-400">
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>▼ DUCK SLIDE EXECUTED</span>
            </div>
          )}
          {trackingResult.gesture === 'LEFT' && (
            <div className="flex items-center gap-2 text-cyan-400">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>◄ HAND LINE GUIDED LEFT</span>
            </div>
          )}
          {trackingResult.gesture === 'RIGHT' && (
            <div className="flex items-center gap-2 text-purple-400">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>HAND LINE GUIDED RIGHT ►</span>
            </div>
          )}
          {trackingResult.gesture === 'BOOST' && (
            <div className="flex items-center gap-2 text-sky-400">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>⚡ NITRO BOOST ACTIVATED!</span>
            </div>
          )}
          {trackingResult.gesture === 'PEACE_MULTIPLIER' && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>✌️ 2X COIN FRENZY!</span>
            </div>
          )}
          {trackingResult.gesture === 'SUPER_JUMP' && (
            <div className="flex items-center gap-2 text-emerald-300">
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>👍 SUPER APEX JUMP!</span>
            </div>
          )}
          {trackingResult.gesture === 'HOVERBOARD' && (
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>🛡️ SHIELD MATRIX ACTIVE!</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile Power-Ups strip (if any active) */}
      <div className="sm:hidden flex items-center justify-center gap-2 my-2">
        {powerUps.map((p) => (
          <div
            key={p.type}
            className="bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300"
          >
            <span className="uppercase text-[10px]">{p.type}:</span>
            <span>{p.remainingTime}s</span>
          </div>
        ))}
      </div>

      {/* Bottom Touch / Precision Direct Controls Bar */}
      <div className="pointer-events-auto flex items-center justify-between w-full max-w-md mx-auto pb-2 px-1">
        {/* Left & Right Lane Controls */}
        <div className="flex items-center gap-2">
          <button
            id="touch-left-btn"
            onClick={() => onActionLane(-1)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/80 hover:bg-cyan-600 active:scale-90 text-cyan-300 hover:text-white border border-cyan-500/40 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Move Left (A / Left Arrow)"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase text-cyan-300">LEFT</span>
          </button>
          <button
            id="touch-right-btn"
            onClick={() => onActionLane(1)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/80 hover:bg-cyan-600 active:scale-90 text-cyan-300 hover:text-white border border-cyan-500/40 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Move Right (D / Right Arrow)"
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase text-cyan-300">RIGHT</span>
          </button>
        </div>

        {/* Hoverboard Quick Shield Summon */}
        <button
          id="touch-hoverboard-btn"
          onClick={onActionHoverboard}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 active:scale-90 text-white font-black text-xs shadow-xl border border-purple-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
          title="Summon Hoverboard Shield (Space / B / Fist)"
        >
          <Shield className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">SHIELD</span>
        </button>

        {/* Jump & Slide Controls */}
        <div className="flex items-center gap-2">
          <button
            id="touch-slide-btn"
            onClick={onActionSlide}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-950/80 hover:bg-amber-600 active:scale-90 text-amber-300 hover:text-white border border-amber-500/40 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Slide Down (S / Down Arrow)"
          >
            <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase text-amber-300">SLIDE</span>
          </button>
          <button
            id="touch-jump-btn"
            onClick={onActionJump}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-950/80 hover:bg-emerald-600 active:scale-90 text-emerald-300 hover:text-white border border-emerald-500/40 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Jump Up (W / Up Arrow)"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase text-emerald-300">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
