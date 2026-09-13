import React from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Music,
  FlipHorizontal,
  RotateCcw,
  Crosshair,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react';
import { GameDifficulty, UserPreferences } from '../types';

interface SettingsModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onCalibrate: () => void;
  onResetHighScore: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onCalibrate,
  onResetHighScore,
  onClose,
}) => {
  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          id="close-settings-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Pro System Settings</h2>
            <p className="text-xs text-slate-400">Audio mixer, difficulty, telemetry, and tracking precision</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Difficulty Selection */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">Game Speed & Difficulty</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['rookie', 'pro', 'master'] as GameDifficulty[]).map((diff) => {
                const isSelected = preferences.difficulty === diff;
                return (
                  <button
                    key={diff}
                    id={`diff-btn-${diff}`}
                    onClick={() => onUpdatePreferences({ difficulty: diff })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {diff === 'rookie' ? '🌱 Rookie' : diff === 'pro' ? '⚡ Pro' : '🔥 Master'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {preferences.difficulty === 'rookie'
                ? 'Gentle runner speed for comfortable gesture learning'
                : preferences.difficulty === 'master'
                ? 'Fast pace with rapid obstacle spacing and high-stakes speed'
                : 'Balanced tournament competitive runner pace'}
            </p>
          </div>

          {/* Hand Tracking Sensitivity Slider */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-200">Gesture Sensitivity</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {preferences.sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              id="sensitivity-slider"
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={preferences.sensitivity}
              onChange={(e) => onUpdatePreferences({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Low (Requires big physical moves)</span>
              <span>High (Fast twitch reflexes)</span>
            </div>
          </div>

          {/* Mirror Camera Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <FlipHorizontal className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-sm font-semibold text-slate-200 block">Mirror Camera</span>
                <span className="text-xs text-slate-400">Mirrored feed for natural left-right hand intuition</span>
              </div>
            </div>
            <input
              id="mirror-camera-toggle"
              type="checkbox"
              checked={preferences.mirrorCamera}
              onChange={(e) => onUpdatePreferences({ mirrorCamera: e.target.checked })}
              className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Pro Audio Mixer */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Audio Mixer & Volume
            </span>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  {preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  Sound FX
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {Math.round(preferences.sfxVolume * 100)}%
                </span>
              </div>
              <input
                id="sfx-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={preferences.sfxVolume}
                onChange={(e) => onUpdatePreferences({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Music Volume */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  Electronic Synth BGM
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {Math.round(preferences.musicVolume * 100)}%
                </span>
              </div>
              <input
                id="music-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={preferences.musicVolume}
                onChange={(e) => onUpdatePreferences({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Telemetry Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>FPS Counter</span>
              </div>
              <input
                id="fps-counter-toggle"
                type="checkbox"
                checked={preferences.showFps}
                onChange={(e) => onUpdatePreferences({ showFps: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Telemetry HUD</span>
              </div>
              <input
                id="gesture-telemetry-toggle"
                type="checkbox"
                checked={preferences.showGestureTelemetry}
                onChange={(e) => onUpdatePreferences({ showGestureTelemetry: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Calibration Action */}
          <button
            id="recalibrate-center-btn"
            onClick={() => {
              onCalibrate();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
            Calibrate Current Hand Position as Center
          </button>

          {/* Reset High Score */}
          <button
            id="reset-highscore-btn"
            onClick={() => {
              if (confirm('Are you sure you want to reset your local High Score?')) {
                onResetHighScore();
              }
            }}
            className="w-full py-2.5 px-4 text-slate-400 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset High Score Record
          </button>
        </div>

        <button
          id="close-settings-save-btn"
          onClick={onClose}
          className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-slate-950 font-black text-sm shadow-lg transition-all cursor-pointer"
        >
          Save & Return to Game
        </button>
      </div>
    </div>
  );
};
