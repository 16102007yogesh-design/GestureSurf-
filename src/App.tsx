import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { handTracker } from './services/handTracker';
import { sound } from './services/audio';
import { HandTrackingPip } from './components/HandTrackingPip';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { LockerModal } from './components/LockerModal';
import { DailyMissionsCard } from './components/DailyMissionsCard';
import { MissionToast } from './components/MissionToast';
import { dailyMissionService } from './services/dailyMissions';
import {
  ActivePowerUp,
  CharacterOutfit,
  DailyMission,
  GameStats,
  GameStatus,
  GameTheme,
  GestureType,
  HandTrackingResult,
  Lane,
  UserPreferences,
} from './types';
import { Play, Sparkles, Hand, HelpCircle, Trophy, Settings, User, Sliders, Shield, Camera, ExternalLink } from 'lucide-react';

const PREFS_KEY = 'hand_runner_prefs';
const HIGH_SCORE_KEY = 'hand_runner_high_score';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Game States
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    highScore: 0,
    multiplier: 1,
    dodges: 0,
  });
  const [powerUps, setPowerUps] = useState<ActivePowerUp[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [lastRunStats, setLastRunStats] = useState<{ score: number; distance: number; coins: number } | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'error' | 'no-camera'>('loading');
  const [trackingResult, setTrackingResult] = useState<HandTrackingResult | null>(null);
  const [fps, setFps] = useState<number>(60);

  // Daily Missions & Persistent Economy
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() => dailyMissionService.getDailyMissions().missions);
  const [rerollsAvailable, setRerollsAvailable] = useState<number>(() => dailyMissionService.getDailyMissions().rerollsAvailable);
  const [bankCoins, setBankCoins] = useState<number>(() => dailyMissionService.getBankCoins());
  const [activeMissionToast, setActiveMissionToast] = useState<DailyMission | null>(null);

  // Active run tracking for real-time mission updates
  const activeRunProgressRef = useRef({
    distance: 0,
    coins: 0,
    score: 0,
    dodges: 0,
    powerups: 0,
    hoverboard: false,
  });

  // Modals
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLocker, setShowLocker] = useState<boolean>(false);

  // FPS tracking loop
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measureFps);
    };

    animId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Preferences with pro options
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      sensitivity: 1.0,
      mirrorCamera: true,
      soundEnabled: true,
      musicEnabled: true,
      sfxVolume: 0.8,
      musicVolume: 0.7,
      autoCalibrate: true,
      showPip: true,
      theme: 'neon-subway',
      outfit: 'electric-runner',
      difficulty: 'pro',
      showFps: true,
      showGestureTelemetry: true,
    };
  });

  // Load High Score
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem(HIGH_SCORE_KEY);
      if (savedHigh) {
        setStats((prev) => ({ ...prev, highScore: parseInt(savedHigh, 10) || 0 }));
      }
    } catch {
      // fallback
    }
  }, []);

  // Save & Apply Preferences
  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      if (typeof newPrefs.soundEnabled === 'boolean') {
        sound.setMuted(!newPrefs.soundEnabled);
      }
      if (typeof newPrefs.musicEnabled === 'boolean') {
        sound.setMusicMuted(!newPrefs.musicEnabled);
      }
      if (typeof newPrefs.sfxVolume === 'number') {
        sound.setSfxVolume(newPrefs.sfxVolume);
      }
      if (typeof newPrefs.musicVolume === 'number') {
        sound.setMusicVolume(newPrefs.musicVolume);
      }
      if (typeof newPrefs.sensitivity === 'number') {
        handTracker.setSensitivity(newPrefs.sensitivity);
      }
      if (typeof newPrefs.mirrorCamera === 'boolean') {
        handTracker.setMirror(newPrefs.mirrorCamera);
      }
      if (newPrefs.theme && gameEngineRef.current) {
        gameEngineRef.current.setTheme(newPrefs.theme);
      }
      if (newPrefs.outfit && gameEngineRef.current) {
        gameEngineRef.current.setOutfit(newPrefs.outfit);
      }
      if (newPrefs.difficulty && gameEngineRef.current) {
        gameEngineRef.current.setDifficulty(newPrefs.difficulty);
      }
      return updated;
    });
  };

  // Sound sync
  useEffect(() => {
    sound.setMuted(!preferences.soundEnabled);
    sound.setMusicMuted(!preferences.musicEnabled);
    sound.setSfxVolume(preferences.sfxVolume ?? 0.8);
    sound.setMusicVolume(preferences.musicVolume ?? 0.7);
  }, [preferences.soundEnabled, preferences.musicEnabled, preferences.sfxVolume, preferences.musicVolume]);

  const gameStatusRef = useRef<GameStatus>(gameStatus);
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  const handleStartGameRef = useRef<() => void>(() => {});

  // Hand Tracker callbacks
  const handleGesture = useCallback((gesture: GestureType) => {
    if (gameStatusRef.current === 'menu') {
      if (gesture === 'JUMP' || gesture === 'SUPER_JUMP' || gesture === 'BOOST') {
        handleStartGameRef.current();
      }
      return;
    }
    if (!gameEngineRef.current) return;
    if (gesture === 'JUMP') {
      gameEngineRef.current.jump();
    } else if (gesture === 'SLIDE') {
      gameEngineRef.current.slide();
    } else if (gesture === 'HOVERBOARD') {
      gameEngineRef.current.activateHoverboard();
    } else if (gesture === 'BOOST') {
      gameEngineRef.current.activateBoost();
    } else if (gesture === 'PEACE_MULTIPLIER') {
      gameEngineRef.current.activateMultiplier();
    } else if (gesture === 'SUPER_JUMP') {
      gameEngineRef.current.superJump();
    }
  }, []);

  const handleLaneChange = useCallback((lane: Lane) => {
    if (!gameEngineRef.current) return;
    gameEngineRef.current.changeLane(lane);
  }, []);

  const handleTrackingUpdate = useCallback((result: HandTrackingResult) => {
    setTrackingResult(result);
    if (gameEngineRef.current && result.detected) {
      gameEngineRef.current.setContinuousHandPosition(
        result.continuousX,
        result.continuousY,
        result.steerAngle
      );
    }
  }, []);

  // Initialize Hand Tracker & Camera
  const handleOpenOrRetryCamera = useCallback(async () => {
    if (videoRef.current) {
      setCameraStatus('loading');
      const camOk = await handTracker.startCamera(videoRef.current);
      if (!camOk) {
        setCameraStatus('no-camera');
      } else {
        setCameraStatus(handTracker.isModelReady() ? 'ready' : 'loading');
      }
    }
  }, []);

  const initTracker = useCallback(async () => {
    handTracker.setSensitivity(preferences.sensitivity);
    handTracker.setMirror(preferences.mirrorCamera);

    // 1. Immediately request camera stream without blocking on AI model load
    if (videoRef.current) {
      handTracker.startCamera(videoRef.current).then((ok) => {
        if (!ok) {
          setCameraStatus('no-camera');
        }
      });
    }

    // 2. Initialize MediaPipe Vision AI in background
    await handTracker.initialize({
      onGesture: handleGesture,
      onLaneChange: handleLaneChange,
      onTrackingUpdate: handleTrackingUpdate,
      onStatusChange: (status) => setCameraStatus(status),
    });
  }, [handleGesture, handleLaneChange, handleTrackingUpdate, preferences.sensitivity, preferences.mirrorCamera]);

  useEffect(() => {
    initTracker();
    return () => {
      handTracker.stop();
    };
  }, [initTracker]);

  // Ensure camera connects if videoRef mounts shortly after load
  useEffect(() => {
    if (videoRef.current && !handTracker.isCameraActive() && cameraStatus !== 'no-camera') {
      handTracker.startCamera(videoRef.current);
    }
  }, [videoRef.current, cameraStatus]);

  // Initialize Game Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onScoreUpdate: (score, distance, coins, multiplier) => {
        setStats((prev) => ({
          ...prev,
          score,
          distance,
          coins,
          multiplier,
        }));

        activeRunProgressRef.current.distance = distance;
        activeRunProgressRef.current.coins = coins;
        activeRunProgressRef.current.score = score;

        // Check if any mission completed mid-run
        const res = dailyMissionService.recordRunProgress({
          runDistance: distance,
          runCoins: coins,
          runScore: score,
          runDodges: activeRunProgressRef.current.dodges,
          powerUpsCollected: activeRunProgressRef.current.powerups,
          hoverboardUsed: activeRunProgressRef.current.hoverboard,
        });

        if (res.newlyCompleted.length > 0) {
          sound.playMissionComplete();
          setActiveMissionToast(res.newlyCompleted[0]);
          setDailyMissions(res.missions);
        }
      },
      onPowerUpUpdate: (pu) => {
        setPowerUps(pu);
      },
      onGameOver: (finalScore, distance, coins) => {
        setGameStatus('gameover');
        setLastRunStats({ score: finalScore, distance, coins });

        // Add run coins to persistent bank balance
        const newBankBalance = dailyMissionService.addBankCoins(coins);
        setBankCoins(newBankBalance);

        // Finalize run missions
        const res = dailyMissionService.recordRunProgress({
          runDistance: distance,
          runCoins: coins,
          runScore: finalScore,
          runDodges: activeRunProgressRef.current.dodges,
          powerUpsCollected: activeRunProgressRef.current.powerups,
          hoverboardUsed: activeRunProgressRef.current.hoverboard,
        });
        setDailyMissions(res.missions);
        if (res.newlyCompleted.length > 0) {
          sound.playMissionComplete();
          setActiveMissionToast(res.newlyCompleted[0]);
        }

        setStats((prev) => {
          const isHigh = finalScore > prev.highScore;
          if (isHigh) {
            try {
              localStorage.setItem(HIGH_SCORE_KEY, finalScore.toString());
            } catch {
              // ignore
            }
          }
          setIsNewHighScore(isHigh);
          return {
            ...prev,
            score: finalScore,
            distance,
            coins,
            highScore: isHigh ? finalScore : prev.highScore,
          };
        });
      },
      onDodge: () => {
        setStats((prev) => ({ ...prev, dodges: prev.dodges + 1 }));
        activeRunProgressRef.current.dodges += 1;
        const res = dailyMissionService.recordRunProgress({
          runDistance: activeRunProgressRef.current.distance,
          runCoins: activeRunProgressRef.current.coins,
          runScore: activeRunProgressRef.current.score,
          runDodges: activeRunProgressRef.current.dodges,
          powerUpsCollected: activeRunProgressRef.current.powerups,
          hoverboardUsed: activeRunProgressRef.current.hoverboard,
        });
        if (res.newlyCompleted.length > 0) {
          sound.playMissionComplete();
          setActiveMissionToast(res.newlyCompleted[0]);
          setDailyMissions(res.missions);
        }
      },
      onPowerUpCollected: () => {
        activeRunProgressRef.current.powerups += 1;
        const res = dailyMissionService.recordRunProgress({
          runDistance: activeRunProgressRef.current.distance,
          runCoins: activeRunProgressRef.current.coins,
          runScore: activeRunProgressRef.current.score,
          runDodges: activeRunProgressRef.current.dodges,
          powerUpsCollected: activeRunProgressRef.current.powerups,
          hoverboardUsed: activeRunProgressRef.current.hoverboard,
        });
        if (res.newlyCompleted.length > 0) {
          sound.playMissionComplete();
          setActiveMissionToast(res.newlyCompleted[0]);
          setDailyMissions(res.missions);
        }
      },
      onHoverboardActivated: () => {
        activeRunProgressRef.current.hoverboard = true;
        const res = dailyMissionService.recordRunProgress({
          runDistance: activeRunProgressRef.current.distance,
          runCoins: activeRunProgressRef.current.coins,
          runScore: activeRunProgressRef.current.score,
          runDodges: activeRunProgressRef.current.dodges,
          powerUpsCollected: activeRunProgressRef.current.powerups,
          hoverboardUsed: true,
        });
        if (res.newlyCompleted.length > 0) {
          sound.playMissionComplete();
          setActiveMissionToast(res.newlyCompleted[0]);
          setDailyMissions(res.missions);
        }
      },
    });

    // Apply active theme, outfit, and difficulty
    engine.setTheme(preferences.theme);
    engine.setOutfit(preferences.outfit);
    engine.setDifficulty(preferences.difficulty);

    gameEngineRef.current = engine;

    return () => {
      engine.dispose();
      gameEngineRef.current = null;
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameEngineRef.current) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        const currentTarget = gameEngineRef.current.getCurrentLane();
        const nextLane = Math.max(-1, currentTarget - 1) as Lane;
        gameEngineRef.current.changeLane(nextLane);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        const currentTarget = gameEngineRef.current.getCurrentLane();
        const nextLane = Math.min(1, currentTarget + 1) as Lane;
        gameEngineRef.current.changeLane(nextLane);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        gameEngineRef.current.jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        gameEngineRef.current.slide();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        gameEngineRef.current.activateHoverboard();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'gameover') {
          handleRestart();
        } else if (gameStatus === 'menu') {
          handleStartGame();
        } else {
          gameEngineRef.current.jump();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, trackingResult]);

  // Touch Swipe on Game Canvas
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !gameEngineRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    // Minimum swipe threshold
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal Swipe
        if (dx < 0) {
          gameEngineRef.current.changeLane(-1);
        } else {
          gameEngineRef.current.changeLane(1);
        }
      } else {
        // Vertical Swipe
        if (dy < 0) {
          gameEngineRef.current.jump();
        } else {
          gameEngineRef.current.slide();
        }
      }
    } else if (dt < 250) {
      // Tap: summon hoverboard
      gameEngineRef.current.activateHoverboard();
    }
  };

  // Actions
  const handleStartGame = useCallback(() => {
    sound.startMusic();
    activeRunProgressRef.current = {
      distance: 0,
      coins: 0,
      score: 0,
      dodges: 0,
      powerups: 0,
      hoverboard: false,
    };
    setGameStatus('playing');
    gameEngineRef.current?.start();

    // Trigger camera on user gesture if not already active
    if (videoRef.current && !handTracker.isCameraActive()) {
      handleOpenOrRetryCamera();
    }
  }, [handleOpenOrRetryCamera]);

  useEffect(() => {
    handleStartGameRef.current = handleStartGame;
  }, [handleStartGame]);

  const handleRestart = () => {
    activeRunProgressRef.current = {
      distance: 0,
      coins: 0,
      score: 0,
      dodges: 0,
      powerups: 0,
      hoverboard: false,
    };
    setGameStatus('playing');
    setIsNewHighScore(false);
    gameEngineRef.current?.restart();
  };

  const handleClaimMissionReward = (missionId: string) => {
    const res = dailyMissionService.claimMissionReward(missionId);
    if (res.success) {
      setDailyMissions(res.missions);
      setBankCoins(dailyMissionService.getBankCoins());
    }
  };

  const handleRerollMission = (missionId: string) => {
    const res = dailyMissionService.rerollMission(missionId);
    if (res.success) {
      setDailyMissions(res.missions);
      setRerollsAvailable(res.rerollsAvailable);
    }
  };

  const handleStreakClaimed = () => {
    setBankCoins(dailyMissionService.getBankCoins());
  };

  const handleGoHome = () => {
    setGameStatus('menu');
    setIsNewHighScore(false);
    gameEngineRef.current?.resetToMenu();
  };

  const handleTogglePause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      gameEngineRef.current?.pause();
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
      gameEngineRef.current?.resume();
    }
  };

  const handleCalibrate = () => {
    handTracker.calibrate();
  };

  const handleResetHighScore = () => {
    localStorage.removeItem(HIGH_SCORE_KEY);
    setStats((prev) => ({ ...prev, highScore: 0 }));
  };

  const handleSelectOutfit = (outfit: CharacterOutfit) => {
    updatePreferences({ outfit });
  };

  const handleSelectTheme = (theme: GameTheme) => {
    updatePreferences({ theme });
  };

  return (
    <div
      id="subway-runner-app"
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Three.js Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Pro Game Menu Overlay */}
      {gameStatus === 'menu' && (
        <div
          id="menu-overlay"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md"
        >
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-center backdrop-blur-xl relative">
            {/* Top decorative gradient border */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400" />

            {/* High Score Chip */}
            {stats.highScore > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Best: {stats.highScore.toLocaleString()} pts
              </div>
            )}

            {/* Pro Title */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase tracking-widest">
                PRO EDITION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black uppercase tracking-wider">
                {preferences.difficulty.toUpperCase()}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 tracking-tight">
              SUBWAY RUNNER
            </h1>
            <p className="text-xs sm:text-sm text-cyan-300/80 font-medium mt-1 flex items-center justify-center gap-1.5">
              <Hand className="w-4 h-4 text-cyan-400" />
              AI Hand Gesture Tracking Engine
            </p>

            {/* Last Run Summary on Home Page (When returning from game over) */}
            {lastRunStats && (
              <div className="my-3.5 p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-between text-xs shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm shadow">
                    🏁
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">LAST RUN</span>
                    <span className="text-sm font-black font-mono text-amber-300">{lastRunStats.score.toLocaleString()} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Distance</span>
                    <span className="font-mono font-bold text-cyan-400">{lastRunStats.distance}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Coins</span>
                    <span className="font-mono font-bold text-yellow-400">+{lastRunStats.coins}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Missions & 7-Day Login Streak Hub Card */}
            <DailyMissionsCard
              missions={dailyMissions}
              rerollsAvailable={rerollsAvailable}
              bankCoins={bankCoins}
              onClaimReward={handleClaimMissionReward}
              onReroll={handleRerollMission}
              onStreakClaimed={handleStreakClaimed}
            />

            {/* Camera Status Card */}
            <div className="my-4 p-4 bg-slate-950/85 rounded-2xl border border-slate-800 text-left shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      trackingResult?.detected
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                        : cameraStatus === 'ready'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400 animate-ping'
                    }`}
                  />
                  Camera & AI Vision Status
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-black uppercase">
                  {trackingResult?.detected ? 'HAND DETECTED' : cameraStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {trackingResult?.detected
                  ? 'Ready! Hand actively calibrated in the tracking viewport.'
                  : cameraStatus === 'no-camera'
                  ? 'Camera permission disabled or blocked in iframe. You can still play with Keyboard (Arrow keys/WASD) or Touch swipes!'
                  : 'Place your hand in front of the webcam to steer railway lanes, jump, and slide.'}
              </p>

              {/* Camera Activation Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  id="menu-enable-camera-btn"
                  onClick={handleOpenOrRetryCamera}
                  className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Turn On / Allow Camera
                </button>
                <button
                  id="menu-open-tab-btn"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  Open in New Tab
                </button>
              </div>
            </div>

            {/* Pictorial Visual Gesture Legend - Instantly Recognized */}
            <div className="my-3 grid grid-cols-4 gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-sm mb-1">
                  ⬆️
                </div>
                <span className="text-[10px] font-black text-emerald-300 block">JUMP</span>
                <span className="text-[9px] text-emerald-400/80">Hand Up</span>
              </div>

              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-sm mb-1">
                  ⬇️
                </div>
                <span className="text-[10px] font-black text-amber-300 block">SLIDE</span>
                <span className="text-[9px] text-amber-400/80">Hand Down</span>
              </div>

              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <div className="w-7 h-7 mx-auto rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-sm mb-1">
                  ⬅️➡️
                </div>
                <span className="text-[10px] font-black text-cyan-300 block">STEER</span>
                <span className="text-[9px] text-cyan-400/80">Tilt Hand</span>
              </div>

              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-sm mb-1">
                  ✊
                </div>
                <span className="text-[10px] font-black text-purple-300 block">SHIELD</span>
                <span className="text-[9px] text-purple-400/80">Make Fist</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              id="start-run-btn"
              onClick={handleStartGame}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-slate-950 font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-slate-950 text-slate-950" />
              START RUN
            </button>

            {/* Pro Quick Navigation Bar */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                id="menu-locker-btn"
                onClick={() => setShowLocker(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Locker
              </button>
              <button
                id="menu-settings-btn"
                onClick={() => setShowSettings(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Settings
              </button>
              <button
                id="menu-tutorial-btn"
                onClick={() => setShowTutorial(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD (Visible during gameplay & pause) */}
      {(gameStatus === 'playing' || gameStatus === 'paused') && (
        <GameHud
          stats={stats}
          powerUps={powerUps}
          isPaused={gameStatus === 'paused'}
          soundMuted={!preferences.soundEnabled}
          fps={fps}
          preferences={preferences}
          trackingResult={trackingResult}
          onTogglePause={handleTogglePause}
          onToggleSound={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenLocker={() => setShowLocker(true)}
          onGoHome={handleGoHome}
          onActionLane={(dir) => {
            const cur = trackingResult?.rawLane ?? 0;
            const next = Math.max(-1, Math.min(1, cur + dir)) as Lane;
            gameEngineRef.current?.changeLane(next);
          }}
          onActionJump={() => gameEngineRef.current?.jump()}
          onActionSlide={() => gameEngineRef.current?.slide()}
          onActionHoverboard={() => gameEngineRef.current?.activateHoverboard()}
        />
      )}

      {/* Webcam Hand Tracking HUD (Always accessible) */}
      <HandTrackingPip
        trackingResult={trackingResult}
        videoRef={videoRef}
        cameraStatus={cameraStatus}
        onCalibrate={handleCalibrate}
        onRetryCamera={handleOpenOrRetryCamera}
        mirror={preferences.mirrorCamera}
      />

      {/* Game Over Modal */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          stats={stats}
          isNewHigh={isNewHighScore}
          onRestart={handleRestart}
          onGoHome={handleGoHome}
          onOpenLocker={() => setShowLocker(true)}
          unclaimedMissionsCount={dailyMissions.filter((m) => m.completed && !m.claimed).length}
        />
      )}

      {/* Tutorial Modal */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          onCalibrate={handleCalibrate}
          onResetHighScore={handleResetHighScore}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Locker & Customizer Modal */}
      {showLocker && (
        <LockerModal
          currentOutfit={preferences.outfit}
          currentTheme={preferences.theme}
          coins={bankCoins}
          onSelectOutfit={handleSelectOutfit}
          onSelectTheme={handleSelectTheme}
          onClose={() => setShowLocker(false)}
        />
      )}

      {/* Real-time In-Game Mission Toast */}
      <MissionToast
        mission={activeMissionToast}
        onDismiss={() => setActiveMissionToast(null)}
      />
    </div>
  );
}
