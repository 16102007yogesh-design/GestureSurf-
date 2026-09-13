import React from 'react';
import { X, Hand, ArrowLeftRight, ArrowUp, ArrowDown, Shield, Keyboard, Smartphone, Sparkles, Check, Zap, Flame, ThumbsUp } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div
      id="tutorial-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          id="close-tutorial-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Biometric Hand Line Controls Guide
            </h2>
            <p className="text-xs text-cyan-300/80 font-medium">
              Raise your hand to scan biometric lines. The character moves continuously according to your hand's lines!
            </p>
          </div>
        </div>

        {/* Colorful High-Impact Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* CONTINUOUS LINE STEERING */}
          <div className="p-3.5 bg-cyan-950/30 rounded-2xl border-2 border-cyan-500/50 flex flex-col justify-between shadow-lg shadow-cyan-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs">
                〰️ CONTINUOUS LINE STEER
              </span>
              <span className="text-xl">🛤️</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-black text-xl shadow-inner">
                <ArrowLeftRight className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-cyan-200 text-sm">Tilt Hand Line Left or Right 🖐️</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Character glides smoothly anywhere across the subway road</p>
              </div>
            </div>
            <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-mono text-cyan-400/90 font-bold">
              <span>Lines: Real-time hand orientation</span>
              <span>Keys: A / D or ← / →</span>
            </div>
          </div>

          {/* JUMP UP */}
          <div className="p-3.5 bg-emerald-950/30 rounded-2xl border-2 border-emerald-500/50 flex flex-col justify-between shadow-lg shadow-emerald-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                ⬆️ JUMP VECTOR LINE
              </span>
              <span className="text-xl">🏃‍♂️💨</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-xl shadow-inner">
                <ArrowUp className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-emerald-200 text-sm">Raise Hand UP 🖐️</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Trajectory line arcs upward to leap over trains & hurdles</p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-400/90 font-bold">
              <span>Trajectory: Arc Guide</span>
              <span>Keys: W or ↑</span>
            </div>
          </div>

          {/* SLIDE DOWN */}
          <div className="p-3.5 bg-amber-950/30 rounded-2xl border-2 border-amber-500/50 flex flex-col justify-between shadow-lg shadow-amber-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                ⬇️ SLIDE VECTOR LINE
              </span>
              <span className="text-xl">🤸‍♂️</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xl shadow-inner">
                <ArrowDown className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-amber-200 text-sm">Push Hand DOWN 🖐️</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Duck low into high-speed slide under hazard signs</p>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] font-mono text-amber-400/90 font-bold">
              <span>Trajectory: Low Slide</span>
              <span>Keys: S or ↓</span>
            </div>
          </div>

          {/* HOVERBOARD / SHIELD */}
          <div className="p-3.5 bg-purple-950/30 rounded-2xl border-2 border-purple-500/50 flex flex-col justify-between shadow-lg shadow-purple-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white font-black text-xs">
                ✊ CLENCH FIST
              </span>
              <span className="text-xl">🏄‍♂️🛡️</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-black text-xl shadow-inner">
                <Shield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-purple-200 text-sm">Clench Fist ✊</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Hoverboard shield & crash protection</p>
              </div>
            </div>
            <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] font-mono text-purple-400/90 font-bold">
              <span>Keys: Space or B</span>
              <span>Touch: Tap Shield</span>
            </div>
          </div>

          {/* PALM THRUST NITRO BOOST */}
          <div className="p-3.5 bg-sky-950/30 rounded-2xl border-2 border-sky-500/50 flex flex-col justify-between shadow-lg shadow-sky-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black text-xs">
                🖐️ PALM THRUST BOOST
              </span>
              <span className="text-xl">⚡🧲</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center font-black text-xl shadow-inner">
                <Zap className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-sky-200 text-sm">Open Hand & Push Forward</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Supersonic speed + Coin Magnet!</p>
              </div>
            </div>
            <div className="pt-2 border-t border-sky-500/20 flex items-center justify-between text-[10px] font-mono text-sky-300 font-bold">
              <span>Gesture: 5 Fingers Spread Forward</span>
            </div>
          </div>

          {/* PEACE SIGN 2X COINS */}
          <div className="p-3.5 bg-yellow-950/30 rounded-2xl border-2 border-yellow-500/50 flex flex-col justify-between shadow-lg shadow-yellow-950/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-xs">
                ✌️ PEACE / 2X COINS
              </span>
              <span className="text-xl">💰✨</span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center font-black text-xl shadow-inner">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-yellow-200 text-sm">Show Peace Sign (V) ✌️</p>
                <p className="text-slate-300 text-[11px] mt-0.5">Double score & coin multiplier frenzy</p>
              </div>
            </div>
            <div className="pt-2 border-t border-yellow-500/20 flex items-center justify-between text-[10px] font-mono text-yellow-300 font-bold">
              <span>Gesture: 2 Fingers Up</span>
            </div>
          </div>
        </div>

        {/* Alternative Controls Footer */}
        <div className="mt-4 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Auto Hand Acquisition:</span>
            <span className="text-slate-400">Position your hand in camera frame to lock tracking!</span>
          </div>
          <Smartphone className="w-4 h-4 text-amber-400" />
        </div>

        <button
          id="got-it-tutorial-btn"
          onClick={onClose}
          className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          READY TO PLAY!
        </button>
      </div>
    </div>
  );
};
