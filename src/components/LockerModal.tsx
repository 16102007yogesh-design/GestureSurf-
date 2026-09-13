import React from 'react';
import { CharacterOutfit, GameTheme } from '../types';
import { User, Check, Palette, Sparkles, X, Shield, Zap } from 'lucide-react';

interface LockerModalProps {
  currentOutfit: CharacterOutfit;
  currentTheme: GameTheme;
  coins: number;
  onSelectOutfit: (outfit: CharacterOutfit) => void;
  onSelectTheme: (theme: GameTheme) => void;
  onClose: () => void;
}

interface OutfitItem {
  id: CharacterOutfit;
  name: string;
  tagline: string;
  previewColor: string;
  accentColor: string;
  badge: string;
}

interface ThemeItem {
  id: GameTheme;
  name: string;
  description: string;
  bgGrad: string;
  lightHex: string;
}

const OUTFITS: OutfitItem[] = [
  {
    id: 'electric-runner',
    name: 'Electric Cyan',
    tagline: 'Standard issue high-velocity runner gear',
    previewColor: 'bg-cyan-500',
    accentColor: 'border-cyan-400',
    badge: 'CLASSIC',
  },
  {
    id: 'neon-phantom',
    name: 'Neon Phantom',
    tagline: 'Ultraviolet syndicate stealth suit with hot pink accents',
    previewColor: 'bg-purple-600',
    accentColor: 'border-purple-400',
    badge: 'POPULAR',
  },
  {
    id: 'golden-striker',
    name: 'Golden Striker',
    tagline: '24-karat championship gilded track runner',
    previewColor: 'bg-amber-500',
    accentColor: 'border-amber-400',
    badge: 'CHAMPION',
  },
  {
    id: 'cyber-stealth',
    name: 'Cyber Stealth',
    tagline: 'Matrix green terminal hacker edition',
    previewColor: 'bg-emerald-500',
    accentColor: 'border-emerald-400',
    badge: 'PRO',
  },
];

const THEMES: ThemeItem[] = [
  {
    id: 'neon-subway',
    name: 'Neon Subway',
    description: 'Electric cyan and amber track spotlights in high-speed night metro',
    bgGrad: 'from-slate-900 via-cyan-950/40 to-slate-950',
    lightHex: '#06b6d4',
  },
  {
    id: 'cyberpunk-tunnel',
    name: 'Cyberpunk District',
    description: 'Deep magenta and ultraviolet neon with intense tunnel vibes',
    bgGrad: 'from-slate-950 via-purple-950/50 to-pink-950/40',
    lightHex: '#ec4899',
  },
  {
    id: 'sunset-metro',
    name: 'Sunset Metro',
    description: 'Warm golden twilight and amber signals cutting through dusk',
    bgGrad: 'from-stone-900 via-amber-950/40 to-orange-950/30',
    lightHex: '#f59e0b',
  },
];

export const LockerModal: React.FC<LockerModalProps> = ({
  currentOutfit,
  currentTheme,
  coins,
  onSelectOutfit,
  onSelectTheme,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'outfits' | 'themes'>('outfits');

  return (
    <div
      id="locker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          id="close-locker-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Coin Wallet */}
        <div className="flex items-center justify-between pr-10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Pro Locker & Customizer</h2>
              <p className="text-xs text-slate-400">Personalize your character skins & 3D subway environment</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
            <span>★</span>
            <span>{coins.toLocaleString()} Coins</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-5">
          <button
            id="tab-outfits-btn"
            onClick={() => setActiveTab('outfits')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'outfits'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Character Outfits
          </button>
          <button
            id="tab-themes-btn"
            onClick={() => setActiveTab('themes')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            World Themes
          </button>
        </div>

        {/* Outfits List */}
        {activeTab === 'outfits' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {OUTFITS.map((outfit) => {
              const isSelected = currentOutfit === outfit.id;
              return (
                <div
                  key={outfit.id}
                  id={`outfit-card-${outfit.id}`}
                  onClick={() => onSelectOutfit(outfit.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${outfit.previewColor} flex items-center justify-center shadow-lg text-white font-black text-sm relative`}>
                      <Shield className="w-6 h-6 text-white/90" />
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-slate-950 rounded-full flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{outfit.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {outfit.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{outfit.tagline}</p>
                    </div>
                  </div>

                  <button
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'EQUIPPED' : 'EQUIP'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Themes List */}
        {activeTab === 'themes' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  id={`theme-card-${theme.id}`}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.bgGrad} border border-slate-700/60 flex items-center justify-center shadow-lg relative`}>
                      <Zap className="w-6 h-6" style={{ color: theme.lightHex }} />
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-slate-950 rounded-full flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-white text-sm">{theme.name}</span>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{theme.description}</p>
                    </div>
                  </div>

                  <button
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'ACTIVE' : 'SELECT'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Applied instantly to the live 3D runner viewport
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
