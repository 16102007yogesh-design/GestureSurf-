export type Lane = -1 | 0 | 1; // -1: Left, 0: Center, 1: Right

export type PlayerAnimationState = 'running' | 'jumping' | 'sliding' | 'flying' | 'stumbling' | 'idle';

export type GestureType =
  | 'NONE'
  | 'LEFT'
  | 'RIGHT'
  | 'JUMP'
  | 'SLIDE'
  | 'HOVERBOARD'
  | 'BOOST'
  | 'PEACE_MULTIPLIER'
  | 'SUPER_JUMP';

export type GameStatus = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';

export type ObstacleType = 
  | 'train'            // Standard stationary or moving train
  | 'train_ramp'       // Train with accessible front ramp to run on roof
  | 'barrier_low'      // Hurdle to jump over
  | 'barrier_high';    // Sign to slide under

export type PowerUpType = 'magnet' | 'jetpack' | 'multiplier' | 'hoverboard';

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  totalDuration: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandTrackingResult {
  detected: boolean;
  landmarks: HandLandmark[] | null;
  normalizedX: number; // 0 (left) to 1 (right)
  normalizedY: number; // 0 (top) to 1 (bottom)
  continuousX: number; // Continuous track coordinate (-1.0 to 1.0, 0 = center line)
  continuousY: number; // Continuous vertical height (-1.0 to 1.0)
  steerAngle: number;  // Direction line angle in degrees (-60 to +60)
  isHandRaised: boolean;
  depthZ: number;      // relative depth estimation (0 to 1)
  velocityX: number;   // horizontal push velocity (units/sec)
  velocityY: number;   // vertical push velocity (units/sec)
  pushDirection: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FORWARD' | 'CENTER' | 'NONE';
  pushIntensity: number; // 0 to 1
  gesture: GestureType;
  gestureConfidence: number;
  isFist: boolean;
  isOpenPalm: boolean;
  isPeaceSign: boolean;
  isThumbsUp: boolean;
  fingerStates: FingerStates;
  rawLane: Lane;       // derived lane (-1, 0, 1) for compatibility
  trackingFps: number;
  autoLocked: boolean;
}

export type GameTheme = 'neon-subway' | 'cyberpunk-tunnel' | 'sunset-metro';

export type CharacterOutfit = 'electric-runner' | 'neon-phantom' | 'golden-striker' | 'cyber-stealth';

export type GameDifficulty = 'rookie' | 'pro' | 'master';

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  highScore: number;
  multiplier: number;
  dodges: number;
}

export type DailyMissionType =
  | 'distance_single'   // Run X meters in a single run
  | 'distance_total'    // Run X meters total across runs
  | 'coins_single'      // Collect X coins in a single run
  | 'coins_total'       // Collect X coins total across runs
  | 'score_single'      // Reach score of X in a single run
  | 'dodges'            // Dodge X obstacles
  | 'powerups'          // Collect X power-ups
  | 'hoverboard';       // Activate hoverboard

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: DailyMissionType;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  unit: string;
}

export interface DailyStreakState {
  currentStreak: number;
  lastClaimDate: string; // 'YYYY-MM-DD'
  claimedToday: boolean;
}

export interface UserPreferences {
  sensitivity: number;        // 0.5 to 1.5 (default 1.0)
  mirrorCamera: boolean;      // true by default
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;          // 0 to 1
  musicVolume: number;        // 0 to 1
  autoCalibrate: boolean;
  showPip: boolean;
  theme: GameTheme;
  outfit: CharacterOutfit;
  difficulty: GameDifficulty;
  showFps: boolean;
  showGestureTelemetry: boolean;
}

export const LANE_WIDTH = 3.2; // 3D units between tracks
export const DEFAULT_SPEED = 20;
export const MAX_SPEED = 40;
export const GRAVITY = 46;
export const JUMP_VELOCITY = 18.5;
export const SUPER_JUMP_VELOCITY = 27;
export const SLIDE_DURATION = 0.85;
