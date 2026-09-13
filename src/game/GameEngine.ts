import * as THREE from 'three';
import {
  Lane,
  PlayerAnimationState,
  ActivePowerUp,
  PowerUpType,
  ObstacleType,
  LANE_WIDTH,
  DEFAULT_SPEED,
  MAX_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  SUPER_JUMP_VELOCITY,
  SLIDE_DURATION,
} from '../types';
import {
  createCharacter,
  createTrain,
  createLowBarrier,
  createHighBarrier,
  createCoin,
  createPowerupMesh,
  createTrackSegment,
  CharacterRig,
} from './models';
import { Materials } from './materials';
import { sound } from '../services/audio';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, distance: number, coins: number, multiplier: number) => void;
  onPowerUpUpdate: (powerups: ActivePowerUp[]) => void;
  onGameOver: (finalScore: number, distance: number, coins: number) => void;
  onDodge: () => void;
  onPowerUpCollected?: (type: PowerUpType) => void;
  onHoverboardActivated?: () => void;
}

interface ObstacleItem {
  type: ObstacleType;
  group: THREE.Group;
  lane: Lane;
  hasRamp?: boolean;
  length: number;
  height: number;
  cleared: boolean;
  speed?: number; // for moving trains
}

interface CoinItem {
  group: THREE.Group;
  lane: Lane;
  y: number;
  collected: boolean;
}

interface PowerUpItem {
  type: PowerUpType;
  group: THREE.Group;
  lane: Lane;
  collected: boolean;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Track Chunks
  private trackSegments: THREE.Group[] = [];
  private readonly SEGMENT_LENGTH = 70;
  private readonly NUM_SEGMENTS = 4;

  // Character
  private player!: CharacterRig;
  private currentLane: Lane = 0;
  private targetX: number = 0;
  private currentX: number = 0;
  private handSteerAngle: number = 0;
  private playerY: number = 0;
  private jumpVelocity: number = 0;
  private isGrounded: boolean = true;
  private currentGroundY: number = 0; // 0 on tracks, ~3.9 on train roof
  private slideTimer: number = 0;
  private isSliding: boolean = false;
  private animState: PlayerAnimationState = 'running';
  private playerShadow!: THREE.Mesh;

  // 3D Laser Action Trajectory Guide ("Line the character wants to perform")
  private trajectoryLine!: THREE.Line;
  private trajectoryPoints!: Float32Array;

  // Pro Customization & Settings
  private currentTheme: string = 'neon-subway';
  private difficulty: string = 'pro';
  private cyanLight!: THREE.PointLight;
  private orangeLight!: THREE.PointLight;
  private dirLight!: THREE.DirectionalLight;

  // Game Loop & Progression
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private gameSpeed: number = DEFAULT_SPEED;
  private distanceTraveled: number = 0;
  private coinsCollected: number = 0;
  private score: number = 0;
  private baseMultiplier: number = 1;
  private dodgesCount: number = 0;
  private lastTime: number = 0;

  // Power-ups
  private activePowerUps: Map<PowerUpType, { remaining: number; total: number }> = new Map();
  private invulnerableTimer: number = 0; // After hoverboard crash

  // Obstacles & Pickups Pool
  private obstacles: ObstacleItem[] = [];
  private coins: CoinItem[] = [];
  private powerupPickups: PowerUpItem[] = [];
  private nextSpawnZ: number = -75;

  // Particles
  private particles: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }> = [];

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initThree();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 300);
    this.camera.position.set(0, 4.2, 5.8);
    this.camera.lookAt(0, 1.6, -10);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    this.dirLight.position.set(12, 28, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -15;
    this.scene.add(this.dirLight);

    // Neon accent point lights for subway atmosphere
    this.cyanLight = new THREE.PointLight(0x06b6d4, 2, 25);
    this.cyanLight.position.set(-6, 3, -10);
    this.scene.add(this.cyanLight);

    this.orangeLight = new THREE.PointLight(0xf97316, 2, 25);
    this.orangeLight.position.set(6, 3, -30);
    this.scene.add(this.orangeLight);

    // Build Track Chunks
    for (let i = 0; i < this.NUM_SEGMENTS; i++) {
      const segment = createTrackSegment(this.SEGMENT_LENGTH);
      segment.position.z = -i * this.SEGMENT_LENGTH;
      this.scene.add(segment);
      this.trackSegments.push(segment);
    }

    // Build Player Drop Shadow (Subway Surfers depth cue)
    const shadowGeo = new THREE.PlaneGeometry(1.3, 1.3);
    shadowGeo.rotateX(-Math.PI / 2);
    this.playerShadow = new THREE.Mesh(shadowGeo, Materials.dropShadow);
    this.playerShadow.position.set(0, 0.04, 0);
    this.scene.add(this.playerShadow);

    // Build Player
    this.player = createCharacter();
    this.player.root.position.set(0, 0, 0);
    this.scene.add(this.player.root);

    // Build 3D Laser Action Trajectory Guide
    this.initTrajectoryGuide();

    window.addEventListener('resize', this.onResize);
    // Start render loop immediately so character and tracks are rendered and hand lines steer the character
    this.lastTime = performance.now();
    this.loop();
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public start() {
    this.isGameOver = false;
    this.isPaused = false;
    this.isRunning = true;
    this.lastTime = performance.now();
    sound.startMusic();
  }

  public pause() {
    this.isPaused = true;
    sound.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    sound.startMusic();
  }

  public restart() {
    // Clear all obstacles, coins, powerups
    for (const obs of this.obstacles) this.scene.remove(obs.group);
    for (const c of this.coins) this.scene.remove(c.group);
    for (const p of this.powerupPickups) this.scene.remove(p.group);
    for (const part of this.particles) this.scene.remove(part.mesh);

    this.obstacles = [];
    this.coins = [];
    this.powerupPickups = [];
    this.particles = [];
    this.activePowerUps.clear();

    // Reset player
    this.currentLane = 0;
    this.targetX = 0;
    this.currentX = 0;
    this.playerY = 0;
    this.currentGroundY = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.slideTimer = 0;
    this.isSliding = false;
    this.invulnerableTimer = 0;
    this.player.hoverboard.visible = false;
    this.player.shield.visible = false;
    this.player.jetpackMesh.visible = false;
    this.player.root.position.set(0, 0, 0);

    // Reset stats
    const baseSpeed = this.difficulty === 'rookie' ? 17 : this.difficulty === 'master' ? 25 : DEFAULT_SPEED;
    this.gameSpeed = baseSpeed;
    this.distanceTraveled = 0;
    this.coinsCollected = 0;
    this.score = 0;
    this.dodgesCount = 0;
    this.nextSpawnZ = -75;
    this.isGameOver = false;
    this.isPaused = false;

    // Reset tracks
    for (let i = 0; i < this.NUM_SEGMENTS; i++) {
      this.trackSegments[i].position.z = -i * this.SEGMENT_LENGTH;
    }

    this.start();
  }

  public resetToMenu() {
    for (const obs of this.obstacles) this.scene.remove(obs.group);
    for (const c of this.coins) this.scene.remove(c.group);
    for (const p of this.powerupPickups) this.scene.remove(p.group);
    for (const part of this.particles) this.scene.remove(part.mesh);

    this.obstacles = [];
    this.coins = [];
    this.powerupPickups = [];
    this.particles = [];
    this.activePowerUps.clear();

    // Reset player to center idle
    this.currentLane = 0;
    this.targetX = 0;
    this.currentX = 0;
    this.playerY = 0;
    this.currentGroundY = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.slideTimer = 0;
    this.isSliding = false;
    this.invulnerableTimer = 0;
    this.player.hoverboard.visible = false;
    this.player.shield.visible = false;
    this.player.jetpackMesh.visible = false;
    this.player.root.position.set(0, 0, 0);

    // Reset game state to idle/menu mode
    this.isRunning = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.gameSpeed = DEFAULT_SPEED;
    this.distanceTraveled = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.nextSpawnZ = -75;

    // Reset tracks
    for (let i = 0; i < this.NUM_SEGMENTS; i++) {
      this.trackSegments[i].position.z = -i * this.SEGMENT_LENGTH;
    }

    // Camera reset
    this.camera.position.set(0, 4.2, 5.8);
    this.camera.lookAt(0, 1.6, -10);

    sound.stopMusic();
  }

  public setTheme(theme: string) {
    this.currentTheme = theme;
    if (theme === 'cyberpunk-tunnel') {
      this.scene.background = new THREE.Color(0x020617);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x020617);
      }
      this.cyanLight.color.setHex(0xec4899); // Neon Pink
      this.orangeLight.color.setHex(0xa855f7); // Neon Purple
      this.dirLight.color.setHex(0xd8b4fe);
    } else if (theme === 'sunset-metro') {
      this.scene.background = new THREE.Color(0x1c1917);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x1c1917);
      }
      this.cyanLight.color.setHex(0xf97316); // Sunset Orange
      this.orangeLight.color.setHex(0xfacc15); // Golden Amber
      this.dirLight.color.setHex(0xffedd5);
    } else {
      // Default: neon-subway
      this.scene.background = new THREE.Color(0x0f172a);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x0f172a);
      }
      this.cyanLight.color.setHex(0x06b6d4); // Electric Cyan
      this.orangeLight.color.setHex(0xf97316); // Amber Orange
      this.dirLight.color.setHex(0xffeedd);
    }
  }

  public setDifficulty(diff: string) {
    this.difficulty = diff;
  }

  public setOutfit(outfit: string) {
    Materials.applyOutfit(outfit);
  }

  public getCurrentLane(): Lane {
    return this.currentLane;
  }

  public changeLane(direction: Lane) {
    if (this.isGameOver || this.isPaused) return;
    const oldLane = this.currentLane;
    this.currentLane = direction;
    this.targetX = this.currentLane * LANE_WIDTH;

    if (oldLane !== this.currentLane) {
      sound.playLaneChange(direction > oldLane ? 'right' : 'left');
    }
  }

  public setContinuousHandPosition(continuousX: number, continuousY: number, steerAngle: number) {
    if (this.isGameOver) return;

    // Continuous hand line navigation: smooth analog position across tracks
    const maxTrackBound = LANE_WIDTH * 1.35; // ~4.32
    this.targetX = Math.max(-maxTrackBound, Math.min(maxTrackBound, continuousX * maxTrackBound));
    this.handSteerAngle = steerAngle;

    const oldLane = this.currentLane;
    if (this.currentX < -1.1) {
      this.currentLane = -1;
    } else if (this.currentX > 1.1) {
      this.currentLane = 1;
    } else {
      this.currentLane = 0;
    }

    if (this.isRunning && !this.isPaused && oldLane !== this.currentLane && Math.abs(this.targetX - this.currentX) > 0.8) {
      sound.playLaneChange(this.currentLane > oldLane ? 'right' : 'left');
    }
  }

  public jump() {
    if (this.isGameOver || this.isPaused) return;

    // Jumping immediately interrupts active slide (Subway Surfers standard)
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    // Can jump if grounded or on train roof
    if (this.isGrounded) {
      this.jumpVelocity = JUMP_VELOCITY;
      this.isGrounded = false;
      this.animState = 'jumping';
      sound.playJump();
      this.createJumpParticles();
    }
  }

  public slide() {
    if (this.isGameOver || this.isPaused) return;

    // Fast fall dive slam if airborne (essential Subway Surfers mechanic!)
    if (!this.isGrounded) {
      this.jumpVelocity = -GRAVITY * 1.5; // Slam straight down!
    }

    this.slideTimer = SLIDE_DURATION;
    this.isSliding = true;
    this.animState = 'sliding';
    sound.playSlide();
    this.createSlideSparks();
  }

  public activateHoverboard() {
    if (this.isGameOver || this.isPaused) return;
    // Activate hoverboard powerup
    this.activePowerUps.set('hoverboard', { remaining: 20, total: 20 });
    this.player.hoverboard.visible = true;
    this.player.shield.visible = true;
    sound.playHoverboard();
    this.callbacks.onHoverboardActivated?.();
  }

  public superJump() {
    if (this.isGameOver || this.isPaused) return;
    if (this.isGrounded && !this.isSliding) {
      this.jumpVelocity = SUPER_JUMP_VELOCITY;
      this.isGrounded = false;
      this.animState = 'jumping';
      sound.playSuperJump();
      this.createSuperJumpParticles();
    }
  }

  public activateBoost() {
    if (this.isGameOver || this.isPaused) return;
    this.activePowerUps.set('magnet', { remaining: 16, total: 16 });
    this.gameSpeed = Math.min(MAX_SPEED, this.gameSpeed + 10);
    sound.playBoost();
    this.createBoostParticles();
  }

  public activateMultiplier() {
    if (this.isGameOver || this.isPaused) return;
    this.activePowerUps.set('multiplier', { remaining: 20, total: 20 });
    sound.playPowerup();
    this.createMultiplierSparks();
  }

  private loop = () => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.isRunning && !this.isPaused && !this.isGameOver) {
      this.update(dt, now);
    } else {
      this.updateIdle(dt, now);
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private updateIdle(dt: number, timeMs: number) {
    const prevX = this.currentX;
    this.currentX = THREE.MathUtils.damp(this.currentX, this.targetX, 18, dt);
    const leanX = (this.currentX - prevX) / Math.max(0.001, dt);

    this.player.root.position.set(this.currentX, this.playerY, 0);
    this.player.updateAnimation(timeMs * 0.001, 'idle', 1, leanX * 0.08);

    if (this.playerShadow) {
      this.playerShadow.position.set(this.currentX, 0.04, 0);
      this.playerShadow.scale.set(1.0, 1.0, 1.0);
    }

    this.updateTrajectoryGuide();
  }

  private update(dt: number, timeMs: number) {
    // 1. Progression & Speed Scaling (Balanced, pro-level smooth arcade pacing)
    const baseSpeed = this.difficulty === 'rookie' ? 17 : this.difficulty === 'master' ? 25 : DEFAULT_SPEED;
    const accelRate = this.difficulty === 'rookie' ? 0.002 : this.difficulty === 'master' ? 0.005 : 0.0035;
    this.gameSpeed = Math.min(MAX_SPEED + (this.difficulty === 'master' ? 6 : 0), baseSpeed + this.distanceTraveled * accelRate);
    const speedMultiplier = this.activePowerUps.has('multiplier') ? 2 : 1;
    const distanceDelta = this.gameSpeed * dt;
    this.distanceTraveled += distanceDelta;
    this.score += distanceDelta * 2.5 * speedMultiplier;

    // 2. Power-ups Countdown
    const powerUpsArray: ActivePowerUp[] = [];
    for (const [type, data] of this.activePowerUps.entries()) {
      data.remaining -= dt;
      if (data.remaining <= 0) {
        this.activePowerUps.delete(type);
        if (type === 'hoverboard') {
          this.player.hoverboard.visible = false;
          this.player.shield.visible = false;
        } else if (type === 'jetpack') {
          this.player.jetpackMesh.visible = false;
        }
      } else {
        powerUpsArray.push({
          type,
          remainingTime: Math.ceil(data.remaining),
          totalDuration: data.total,
        });
      }
    }
    this.callbacks.onPowerUpUpdate(powerUpsArray);

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.player.shield.visible = Math.floor(timeMs / 100) % 2 === 0;
    } else if (!this.activePowerUps.has('hoverboard')) {
      this.player.shield.visible = false;
    }

    // 3. Move Track Segments
    for (const seg of this.trackSegments) {
      seg.position.z += distanceDelta;
      if (seg.position.z > this.SEGMENT_LENGTH) {
        seg.position.z -= this.NUM_SEGMENTS * this.SEGMENT_LENGTH;
      }
    }

    // 4. Player Physics & Lane Movement
    // Smooth lane transition
    const prevX = this.currentX;
    this.currentX = THREE.MathUtils.damp(this.currentX, this.targetX, 18, dt);
    const leanX = (this.currentX - prevX) / Math.max(0.001, dt);

    // Jetpack flight state
    const isFlying = this.activePowerUps.has('jetpack');
    if (isFlying) {
      this.player.jetpackMesh.visible = true;
      this.playerY = THREE.MathUtils.damp(this.playerY, 9.5, 6, dt);
      this.animState = 'flying';
      this.createJetpackTrail();
    } else {
      // Sliding Timer
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        }
      }

      // Gravity & Jumping Physics
      if (!this.isGrounded) {
        this.playerY += this.jumpVelocity * dt;
        this.jumpVelocity -= GRAVITY * dt;

        // Check if landing on ground or on train roof
        if (this.playerY <= this.currentGroundY) {
          this.playerY = this.currentGroundY;
          this.jumpVelocity = 0;
          this.isGrounded = true;
          this.animState = this.isSliding ? 'sliding' : 'running';
        }
      } else {
        // Fall down if walked off train roof
        if (this.playerY > this.currentGroundY) {
          this.isGrounded = false;
          this.jumpVelocity = 0;
        }
      }

      if (this.isGrounded) {
        this.animState = this.isSliding ? 'sliding' : 'running';
      }
    }

    this.player.root.position.set(this.currentX, this.playerY, 0);
    this.player.updateAnimation(timeMs * 0.001, this.animState, this.gameSpeed / DEFAULT_SPEED, leanX * 0.08);

    // Update Drop Shadow position & height-scaling
    if (this.playerShadow) {
      const heightAboveGround = Math.max(0, this.playerY - this.currentGroundY);
      const shadowScale = Math.max(0.4, 1.0 - heightAboveGround * 0.12);
      this.playerShadow.scale.set(shadowScale, shadowScale, shadowScale);
      this.playerShadow.position.set(this.currentX, this.currentGroundY + 0.04, 0);
    }

    // Update 3D Laser Action Trajectory Guide ("Line the character wants to perform")
    this.updateTrajectoryGuide();

    // Camera follow with slight dynamic bounce
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.currentX * 0.5, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 4.2 + this.playerY * 0.5, 8, dt);

    // 5. Spawn & Move Obstacles
    this.updateObstacles(distanceDelta, dt);

    // 6. Spawn & Move Coins & Magnet
    this.updateCoins(distanceDelta, dt);

    // 7. Update Particles
    this.updateParticles(dt);

    // 8. Callbacks
    this.callbacks.onScoreUpdate(
      Math.floor(this.score),
      Math.floor(this.distanceTraveled),
      this.coinsCollected,
      speedMultiplier
    );
  }

  private updateObstacles(distanceDelta: number, dt: number) {
    // Spawning new obstacles ahead with balanced spacing
    while (this.nextSpawnZ > -220) {
      this.spawnObstaclePattern(this.nextSpawnZ);
      this.nextSpawnZ -= 38 + Math.random() * 20;
    }

    let roofGroundY = 0;
    const playerZ = 0;
    const playerLane = this.currentLane;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Move toward player
      const obsSpeed = obs.speed ? (this.gameSpeed + obs.speed) * dt : distanceDelta;
      obs.group.position.z += obsSpeed;

      const halfLen = obs.length / 2;
      const frontZ = obs.group.position.z - halfLen;
      const backZ = obs.group.position.z + halfLen;

      // Check if player is within the obstacle's horizontal hitbox
      const obsX = obs.lane * LANE_WIDTH;
      const distX = Math.abs(this.currentX - obsX);
      const inObstacleX = distX < 1.18;
      const inRoofZoneX = distX < 1.45;

      // Ramp interaction for trains with ramps
      if (obs.type === 'train_ramp' && inRoofZoneX) {
        // If in ramp zone (in front of train)
        const rampStartZ = obs.group.position.z + halfLen + 4.5;
        const rampEndZ = obs.group.position.z + halfLen;
        if (playerZ >= rampEndZ && playerZ <= rampStartZ) {
          // Smoothly slide up the ramp
          const progress = (rampStartZ - playerZ) / 4.5;
          const targetRampY = progress * 3.9;
          if (this.playerY <= targetRampY + 0.5) {
            this.playerY = targetRampY;
            this.currentGroundY = targetRampY;
            this.isGrounded = true;
          }
        }
      }

      // Check if player is currently above the train roof
      if ((obs.type === 'train' || obs.type === 'train_ramp') && inRoofZoneX) {
        if (playerZ >= frontZ - 1.2 && playerZ <= backZ + 1.2) {
          if (this.playerY >= 3.2) {
            roofGroundY = 3.9; // Player is running on top of train!
          }
        }
      }

      // Collision Detection
      if (inObstacleX && !this.activePowerUps.has('jetpack') && this.invulnerableTimer <= 0) {
        // Continuous swept Z window prevents tunneling at fast speeds
        const sweptFrontZ = frontZ - Math.max(0.4, obsSpeed * 0.8);
        const sweptBackZ = backZ;
        if (playerZ >= sweptFrontZ && playerZ <= sweptBackZ) {
          let hit = false;

          if (obs.type === 'train' || obs.type === 'train_ramp') {
            // Hit front or side of train if not landed on roof
            if (this.playerY < 3.2) {
              hit = true;
            }
          } else if (obs.type === 'barrier_low') {
            // Must JUMP over hurdle barrier (board at 0.95m)
            if (this.playerY < 1.05) {
              hit = true;
            }
          } else if (obs.type === 'barrier_high') {
            // Must SLIDE under barrier (bottom of overhead sign at ~1.3m)
            // When sliding, player ducks low (height ~0.5m) and passes under safely!
            if (!this.isSliding) {
              hit = true;
            }
          }

          if (hit) {
            this.handleCollision(obs);
            return;
          }
        }
      }

      // Score dodge count when passing obstacle safely
      if (!obs.cleared && obs.group.position.z > playerZ + 4) {
        obs.cleared = true;
        this.dodgesCount++;
        this.callbacks.onDodge();
      }

      // Recycle past camera
      if (obs.group.position.z > 25) {
        this.scene.remove(obs.group);
        this.obstacles.splice(i, 1);
      }
    }

    this.currentGroundY = roofGroundY;
    this.nextSpawnZ += distanceDelta;
  }

  private handleCollision(obs: ObstacleItem) {
    if (this.activePowerUps.has('hoverboard')) {
      // Hoverboard saves the player!
      this.activePowerUps.delete('hoverboard');
      this.player.hoverboard.visible = false;
      this.invulnerableTimer = 1.6;
      sound.playCrash();
      this.createExplosionSparks(this.player.root.position);
      // knock obstacle away
      obs.group.position.y = -10;
      return;
    }

    // Game Over Crash
    this.isGameOver = true;
    this.isRunning = false;
    sound.stopMusic();
    sound.playCrash();
    sound.playGameOver();
    this.createExplosionSparks(this.player.root.position);
    this.callbacks.onGameOver(Math.floor(this.score), Math.floor(this.distanceTraveled), this.coinsCollected);
  }

  private spawnObstaclePattern(z: number) {
    const patternType = Math.floor(Math.random() * 5);
    const lanes: Lane[] = [-1, 0, 1];

    if (patternType === 0) {
      // Train on one lane, barrier on another
      const trainLane = lanes[Math.floor(Math.random() * 3)];
      const hasRamp = Math.random() > 0.4;
      const train = createTrain(Math.random() > 0.5 ? 'red' : 'blue', hasRamp);
      train.position.set(trainLane * LANE_WIDTH, 0, z);
      this.scene.add(train);
      this.obstacles.push({
        type: hasRamp ? 'train_ramp' : 'train',
        group: train,
        lane: trainLane,
        hasRamp,
        length: 18,
        height: 3.9,
        cleared: false,
      });

      // Place rooftop coins if ramp exists!
      if (hasRamp) {
        for (let cz = z - 8; cz <= z + 8; cz += 2.5) {
          this.spawnCoin(trainLane, 4.3, cz);
        }
      }

      // Add low hurdle or high barrier in one of other lanes
      const otherLanes = lanes.filter((l) => l !== trainLane);
      const barrierLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      if (Math.random() > 0.5) {
        const barrier = createLowBarrier();
        barrier.position.set(barrierLane * LANE_WIDTH, 0, z);
        this.scene.add(barrier);
        this.obstacles.push({
          type: 'barrier_low',
          group: barrier,
          lane: barrierLane,
          length: 1.5,
          height: 1.1,
          cleared: false,
        });
        // Coin arc jumping over barrier!
        this.spawnCoin(barrierLane, 1.2, z - 3);
        this.spawnCoin(barrierLane, 2.2, z);
        this.spawnCoin(barrierLane, 1.2, z + 3);
      } else {
        const gantry = createHighBarrier();
        gantry.position.set(barrierLane * LANE_WIDTH, 0, z);
        this.scene.add(gantry);
        this.obstacles.push({
          type: 'barrier_high',
          group: gantry,
          lane: barrierLane,
          length: 1.5,
          height: 2.8,
          cleared: false,
        });
      }
    } else if (patternType === 1) {
      // 2 Trains blocking two lanes, leaving 1 open lane or ramp
      const openLane = lanes[Math.floor(Math.random() * 3)];
      for (const lane of lanes) {
        if (lane !== openLane) {
          const hasRamp = Math.random() > 0.6;
          const train = createTrain('yellow', hasRamp);
          train.position.set(lane * LANE_WIDTH, 0, z);
          this.scene.add(train);
          this.obstacles.push({
            type: hasRamp ? 'train_ramp' : 'train',
            group: train,
            lane,
            hasRamp,
            length: 18,
            height: 3.9,
            cleared: false,
          });
        }
      }
      // Line of coins in the open lane
      for (let cz = z - 8; cz <= z + 8; cz += 2.5) {
        this.spawnCoin(openLane, 0.8, cz);
      }
    } else if (patternType === 2) {
      // Two barriers side by side
      const barrierType = Math.random() > 0.5 ? 'barrier_low' : 'barrier_high';
      const emptyLane = lanes[Math.floor(Math.random() * 3)];
      for (const lane of lanes) {
        if (lane !== emptyLane) {
          const bMesh = barrierType === 'barrier_low' ? createLowBarrier() : createHighBarrier();
          bMesh.position.set(lane * LANE_WIDTH, 0, z);
          this.scene.add(bMesh);
          this.obstacles.push({
            type: barrierType,
            group: bMesh,
            lane,
            length: 1.5,
            height: barrierType === 'barrier_low' ? 1.1 : 2.8,
            cleared: false,
          });
        }
      }
    } else {
      // Oncoming train on one lane
      // (After 100m distance, oncoming trains move at a gentle, readable 4.5m/s pace with forward headlight beams)
      const trainLane = lanes[Math.floor(Math.random() * 3)];
      const isMoving = this.distanceTraveled > 100;
      const train = createTrain('blue', false);
      train.position.set(trainLane * LANE_WIDTH, 0, z);
      this.scene.add(train);
      this.obstacles.push({
        type: 'train',
        group: train,
        lane: trainLane,
        length: 18,
        height: 3.9,
        cleared: false,
        speed: isMoving ? 4.5 : 0,
      });
    }

    // Occasional power-up spawn (15% chance)
    if (Math.random() < 0.15) {
      const pLane = lanes[Math.floor(Math.random() * 3)];
      const types: PowerUpType[] = ['magnet', 'jetpack', 'multiplier', 'hoverboard'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      this.spawnPowerUp(chosenType, pLane, z - 12);
    }
  }

  private spawnCoin(lane: Lane, y: number, z: number) {
    const coinMesh = createCoin();
    coinMesh.position.set(lane * LANE_WIDTH, y, z);
    this.scene.add(coinMesh);
    this.coins.push({
      group: coinMesh,
      lane,
      y,
      collected: false,
    });
  }

  private spawnPowerUp(type: PowerUpType, lane: Lane, z: number) {
    const mesh = createPowerupMesh(type);
    mesh.position.set(lane * LANE_WIDTH, 1.2, z);
    this.scene.add(mesh);
    this.powerupPickups.push({
      type,
      group: mesh,
      lane,
      collected: false,
    });
  }

  private updateCoins(distanceDelta: number, dt: number) {
    const playerPos = this.player.root.position;
    const hasMagnet = this.activePowerUps.has('magnet');

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.group.position.z += distanceDelta;
      coin.group.rotation.z += dt * 4.5;

      // Magnet attraction effect
      if (hasMagnet && !coin.collected) {
        const distToPlayer = coin.group.position.distanceTo(playerPos);
        if (distToPlayer < 24) {
          coin.group.position.lerp(playerPos, dt * 14);
        }
      }

      // Check pickup
      const dist = coin.group.position.distanceTo(
        new THREE.Vector3(playerPos.x, playerPos.y + 0.8, playerPos.z)
      );

      if (dist < 1.4 && !coin.collected) {
        coin.collected = true;
        this.coinsCollected++;
        this.score += 50 * (this.activePowerUps.has('multiplier') ? 2 : 1);
        sound.playCoin();
        this.createCoinSparkles(coin.group.position);
        this.scene.remove(coin.group);
        this.coins.splice(i, 1);
        continue;
      }

      if (coin.group.position.z > 20) {
        this.scene.remove(coin.group);
        this.coins.splice(i, 1);
      }
    }

    // Power-up Pickups
    for (let i = this.powerupPickups.length - 1; i >= 0; i--) {
      const p = this.powerupPickups[i];
      p.group.position.z += distanceDelta;
      p.group.rotation.y += dt * 3;

      const dist = p.group.position.distanceTo(
        new THREE.Vector3(playerPos.x, playerPos.y + 0.8, playerPos.z)
      );

      if (dist < 1.6 && !p.collected) {
        p.collected = true;
        this.activatePowerUp(p.type);
        this.scene.remove(p.group);
        this.powerupPickups.splice(i, 1);
        continue;
      }

      if (p.group.position.z > 20) {
        this.scene.remove(p.group);
        this.powerupPickups.splice(i, 1);
      }
    }
  }

  private activatePowerUp(type: PowerUpType) {
    sound.playPowerup();
    const durations: Record<PowerUpType, number> = {
      magnet: 16,
      jetpack: 12,
      multiplier: 18,
      hoverboard: 24,
    };
    const dur = durations[type];
    this.activePowerUps.set(type, { remaining: dur, total: dur });

    if (type === 'hoverboard') {
      this.player.hoverboard.visible = true;
      this.player.shield.visible = true;
      sound.playHoverboard();
    }

    this.callbacks.onPowerUpCollected?.(type);
  }

  // Particle Emitters
  private createCoinSparkles(pos: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.35 });
    }
  }

  private createJumpParticles() {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.currentX + (Math.random() - 0.5) * 0.5, this.playerY + 0.1, (Math.random() - 0.5) * 0.5);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        -Math.random() * 3 - 1,
        (Math.random() - 0.5) * 4 + 2
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.3 });
    }
  }

  private createSlideSparks() {
    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.currentX + (Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        Math.random() * 4 + 4
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.3 });
    }
  }

  private createJetpackTrail() {
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xef4444 : 0xf59e0b });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(this.currentX, this.playerY + 0.5, 0.5);
    this.scene.add(mesh);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 2, -Math.random() * 4 - 2, 8);
    this.particles.push({ mesh, vel, life: 0, maxLife: 0.25 });
  }

  private createSuperJumpParticles() {
    const geo = new THREE.SphereGeometry(0.1, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.currentX + (Math.random() - 0.5) * 0.6, this.playerY, (Math.random() - 0.5) * 0.6);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        -Math.random() * 6 - 2,
        (Math.random() - 0.5) * 6
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.45 });
    }
  }

  private createBoostParticles() {
    const geo = new THREE.SphereGeometry(0.14, 6, 6);
    const colors = [0x06b6d4, 0x38bdf8, 0xffffff];
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.currentX + (Math.random() - 0.5) * 0.8, this.playerY + 0.4, 0.4);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        Math.random() * 12 + 6
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.4 });
    }
  }

  private createMultiplierSparks() {
    const geo = new THREE.SphereGeometry(0.1, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.currentX + (Math.random() - 0.5) * 1.0, this.playerY + 0.8, (Math.random() - 0.5) * 1.0);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.5 });
    }
  }

  private createExplosionSparks(pos: THREE.Vector3) {
    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const colors = [0xef4444, 0xf97316, 0xfacc15, 0x38bdf8];
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        Math.random() * 12 + 4,
        (Math.random() - 0.5) * 14
      );
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.8 });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= GRAVITY * 0.4 * dt;
      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private initTrajectoryGuide() {
    const numPoints = 24;
    this.trajectoryPoints = new Float32Array(numPoints * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.trajectoryPoints, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    this.trajectoryLine = new THREE.Line(geometry, material);
    this.trajectoryLine.frustumCulled = false;
    this.scene.add(this.trajectoryLine);
  }

  private updateTrajectoryGuide() {
    if (!this.trajectoryLine || !this.trajectoryPoints) return;
    const numPoints = 24;
    const startX = this.currentX;
    const startY = this.playerY + 0.12;
    const startZ = 0;
    const endX = this.targetX;
    const endZ = -22;
    const endY = this.currentGroundY + 0.12;

    // Dynamically color-code the laser trajectory line to show what action the character performs!
    const mat = this.trajectoryLine.material as THREE.LineBasicMaterial;
    if (this.jumpVelocity > 0 || !this.isGrounded) {
      mat.color.setHex(0x10b981); // Emerald Jump trajectory
    } else if (this.isSliding) {
      mat.color.setHex(0xf59e0b); // Amber Slide trajectory
    } else if (this.activePowerUps.has('hoverboard')) {
      mat.color.setHex(0xa855f7); // Violet Hoverboard Shield
    } else if (Math.abs(this.targetX - this.currentX) > 0.15) {
      mat.color.setHex(0x06b6d4); // Cyan Lane Shift
    } else {
      mat.color.setHex(0x38bdf8); // Sky Blue Straight Run
    }

    const steerOffset = Math.tan((this.handSteerAngle * Math.PI) / 180) * 10;
    const projectedEndX = THREE.MathUtils.clamp(this.targetX + steerOffset * 0.4, -4.4, 4.4);

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const z = startZ + (endZ - startZ) * t;
      // Smooth curve following the hand's direction line
      const x = THREE.MathUtils.lerp(startX, projectedEndX, Math.pow(t, 0.75));

      let y = THREE.MathUtils.lerp(startY, endY, t);
      if (!this.isGrounded) {
        // Parabolic jump trajectory arc
        const arc = Math.sin(t * Math.PI) * Math.max(0, (this.playerY - this.currentGroundY) * 0.8);
        y += arc;
      }

      this.trajectoryPoints[i * 3] = x;
      this.trajectoryPoints[i * 3 + 1] = Math.max(0.08, y);
      this.trajectoryPoints[i * 3 + 2] = z;
    }

    this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.isRunning = false;
    sound.stopMusic();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      (this.trajectoryLine.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }
}
