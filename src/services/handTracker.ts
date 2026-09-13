import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandTrackingResult, GestureType, Lane, FingerStates, HandLandmark } from '../types';

export interface TrackerCallbacks {
  onGesture: (gesture: GestureType) => void;
  onLaneChange: (lane: Lane) => void;
  onTrackingUpdate: (result: HandTrackingResult) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'loading' | 'ready' | 'error' | 'no-camera') => void;
}

export class HandTrackerService {
  private video: HTMLVideoElement | null = null;
  private landmarker: HandLandmarker | null = null;
  private animFrameId: number | null = null;
  private callbacks: TrackerCallbacks | null = null;

  // Auto-locating and adaptive baseline
  private calibratedCenterX: number = 0.5;
  private calibratedCenterY: number = 0.5;
  private autoCalibrated: boolean = false;
  private handPresenceFrames: number = 0;
  private sensitivity: number = 1.0;
  private mirror: boolean = true;

  // Motion history for gesture velocity, push vector, & triggers
  private prevY: number = 0.5;
  private prevX: number = 0.5;
  private prevZ: number = 0.5;
  private prevRawX: number = 0.5;
  private prevRawY: number = 0.5;
  private prevTimestamp: number = 0;

  // Edge-triggered gesture states (prevents false reverse triggers on return-to-center)
  private verticalState: 'NEUTRAL' | 'HIGH' | 'LOW' = 'NEUTRAL';
  private horizontalState: 'CENTER' | 'LEFT' | 'RIGHT' = 'CENTER';

  // Cooldown timers to ensure crisp, responsive inputs without fluttering
  private lastJumpTime: number = 0;
  private lastSlideTime: number = 0;
  private lastLaneTime: number = 0;
  private lastHoverboardTime: number = 0;
  private lastBoostTime: number = 0;
  private lastPeaceTime: number = 0;
  private lastThumbsUpTime: number = 0;

  private fistFrameCount: number = 0;
  private openPalmFrameCount: number = 0;
  private peaceFrameCount: number = 0;
  private thumbsUpFrameCount: number = 0;
  private currentLane: Lane = 0;

  // Real-time telemetry
  private lastFpsCalcTime: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 60;

  private isRunning: boolean = false;
  private isCameraStreaming: boolean = false;
  private isModelLoading: boolean = false;
  private cameraErrorMessage: string = '';

  private lastInferenceTimestamp: number = 0;
  private lastVideoTime: number = -1;

  public getCameraError(): string {
    return this.cameraErrorMessage;
  }

  public isCameraActive(): boolean {
    return this.isCameraStreaming;
  }

  public isModelReady(): boolean {
    return this.landmarker !== null;
  }

  // Open camera immediately on user request or mount
  public async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    this.video = videoElement;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraErrorMessage =
        'Webcam access is restricted in this window. Open in New Tab or use Touch/Mouse Simulator!';
      console.warn('getUserMedia is not supported or restricted in this context');
      this.callbacks?.onStatusChange?.('no-camera');
      return false;
    }

    try {
      this.cameraErrorMessage = '';
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Ideal camera constraint failed, retrying with basic video constraint:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('muted', 'true');

      try {
        await this.video.play();
      } catch (playErr) {
        console.warn('video.play() deferred until user interaction:', playErr);
        const triggerPlay = () => {
          this.video?.play().catch(() => {});
          window.removeEventListener('pointerdown', triggerPlay);
          window.removeEventListener('keydown', triggerPlay);
        };
        window.addEventListener('pointerdown', triggerPlay);
        window.addEventListener('keydown', triggerPlay);
      }

      this.isCameraStreaming = true;
      this.isRunning = true;

      if (this.landmarker) {
        this.callbacks?.onStatusChange?.('ready');
      }

      if (!this.animFrameId) {
        this.loop();
      }

      return true;
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.cameraErrorMessage =
          'Camera permission was blocked. Click "Start Camera" to grant access, or use the Hand Simulator!';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.cameraErrorMessage = 'No webcam was detected on this device. You can use the Hand Simulator or Arrow keys!';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.cameraErrorMessage = 'Webcam is occupied by another program. Close Zoom/Meet or use the Hand Simulator!';
      } else {
        this.cameraErrorMessage = err.message || 'Unable to open camera in current window.';
      }
      this.isCameraStreaming = false;
      this.callbacks?.onStatusChange?.('no-camera');
      return false;
    }
  }

  // Load Vision Model asynchronously in background
  public async initialize(callbacks: TrackerCallbacks): Promise<boolean> {
    this.callbacks = callbacks;
    if (this.landmarker) {
      if (this.isCameraStreaming) {
        this.callbacks.onStatusChange?.('ready');
      }
      return true;
    }

    try {
      this.isModelLoading = true;
      if (!this.isCameraStreaming) {
        this.callbacks.onStatusChange?.('loading');
      }

      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );
      } catch (e1) {
        console.warn('Wasm 1.0.1 cdn failed, trying latest wasm cdn:', e1);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed on this device, falling back to CPU:', gpuErr);
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }

      this.isModelLoading = false;
      if (this.isCameraStreaming) {
        this.callbacks.onStatusChange?.('ready');
      }
      return true;
    } catch (err) {
      console.warn('MediaPipe HandLandmarker init error:', err);
      this.isModelLoading = false;
      if (!this.isCameraStreaming) {
        this.callbacks.onStatusChange?.('error');
      }
      this.callbacks.onError?.(err as Error);
      return false;
    }
  }

  public async start(videoElement: HTMLVideoElement): Promise<boolean> {
    return await this.startCamera(videoElement);
  }

  public calibrate() {
    this.calibratedCenterX = this.prevX;
    this.calibratedCenterY = this.prevY;
    this.verticalState = 'NEUTRAL';
    this.horizontalState = 'CENTER';
    this.autoCalibrated = true;
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0.5, Math.min(2.0, val));
  }

  public setMirror(val: boolean) {
    this.mirror = val;
  }

  public simulateHand(normX: number, normY: number, gesture?: GestureType) {
    // Generate full 21-joint hand skeleton centered at (normX, normY)
    const simX = this.mirror ? 1 - normX : normX;
    const wristX = simX;
    const wristY = normY + 0.14;
    const palmY = normY + 0.05;

    const simulatedLandmarks: HandLandmark[] = [
      { x: wristX, y: wristY, z: 0 }, // 0: Wrist
      // Thumb
      { x: wristX - 0.05, y: wristY - 0.04, z: 0 },
      { x: wristX - 0.08, y: wristY - 0.09, z: 0 },
      { x: wristX - 0.11, y: wristY - 0.14, z: 0 },
      { x: wristX - 0.13, y: wristY - 0.18, z: 0 },
      // Index
      { x: wristX - 0.045, y: palmY - 0.04, z: 0 },
      { x: wristX - 0.05, y: palmY - 0.10, z: 0 },
      { x: wristX - 0.055, y: palmY - 0.16, z: 0 },
      { x: wristX - 0.06, y: palmY - 0.22, z: 0 },
      // Middle
      { x: wristX, y: palmY - 0.05, z: 0 },
      { x: wristX, y: palmY - 0.12, z: 0 },
      { x: wristX, y: palmY - 0.18, z: 0 },
      { x: wristX, y: palmY - 0.25, z: 0 },
      // Ring
      { x: wristX + 0.045, y: palmY - 0.04, z: 0 },
      { x: wristX + 0.05, y: palmY - 0.10, z: 0 },
      { x: wristX + 0.055, y: palmY - 0.16, z: 0 },
      { x: wristX + 0.06, y: palmY - 0.21, z: 0 },
      // Pinky
      { x: wristX + 0.08, y: palmY - 0.02, z: 0 },
      { x: wristX + 0.09, y: palmY - 0.07, z: 0 },
      { x: wristX + 0.10, y: palmY - 0.12, z: 0 },
      { x: wristX + 0.11, y: palmY - 0.16, z: 0 },
    ];
    this.processLandmarks(simulatedLandmarks, performance.now(), gesture);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsCalcTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    if (this.video && this.video.readyState >= 2 && !this.video.paused && this.landmarker) {
      try {
        if (this.video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = this.video.currentTime;
          const timestamp = Math.max(now, this.lastInferenceTimestamp + 1);
          this.lastInferenceTimestamp = timestamp;
          const results = this.landmarker.detectForVideo(this.video, timestamp);

          if (results && results.landmarks && results.landmarks.length > 0) {
            const rawLandmarks = results.landmarks[0];
            this.processLandmarks(rawLandmarks, now);
          } else {
            this.handPresenceFrames = 0;
            this.callbacks?.onTrackingUpdate({
              detected: false,
              landmarks: null,
              normalizedX: this.prevX,
              normalizedY: this.prevY,
              continuousX: 0,
              continuousY: 0,
              steerAngle: 0,
              isHandRaised: false,
              depthZ: this.prevZ,
              velocityX: 0,
              velocityY: 0,
              pushDirection: 'NONE',
              pushIntensity: 0,
              gesture: 'NONE',
              gestureConfidence: 0,
              isFist: false,
              isOpenPalm: false,
              isPeaceSign: false,
              isThumbsUp: false,
              fingerStates: { thumb: false, index: false, middle: false, ring: false, pinky: false },
              rawLane: this.currentLane,
              trackingFps: this.currentFps,
              autoLocked: false,
            });
          }
        }
      } catch (e) {
        console.warn('Inference frame error:', e);
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private processLandmarks(
    landmarks: HandLandmark[],
    timestamp: number,
    forcedGesture?: GestureType
  ) {
    this.handPresenceFrames++;

    // 1. Calculate Palm Centroid (wrist:0, index MCP:5, pinky MCP:17)
    let rawX = landmarks.length >= 18
      ? (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3
      : landmarks[0].x;
    const rawY = landmarks.length >= 18
      ? (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3
      : landmarks[0].y;

    if (this.mirror) {
      rawX = 1 - rawX;
    }

    // 2. Relative Depth Estimation (Wrist-to-Middle MCP distance gives scale)
    let rawZ = 0.5;
    if (landmarks.length >= 13) {
      const dx = landmarks[0].x - landmarks[9].x;
      const dy = landmarks[0].y - landmarks[9].y;
      const handSpan = Math.sqrt(dx * dx + dy * dy);
      // Closer hand = larger span = larger depthZ
      rawZ = Math.min(1.0, Math.max(0.1, handSpan * 3.2));
    }

    const dt = Math.max(0.016, (timestamp - (this.prevTimestamp || timestamp - 16)) / 1000);
    const rawDx = (rawX - this.prevRawX) / dt;
    const rawDy = (rawY - this.prevRawY) / dt;
    const rawSpeed = Math.hypot(rawDx, rawDy);

    this.prevRawX = rawX;
    this.prevRawY = rawY;

    // 3. Auto-Locate and Adaptive Baseline
    // Automatically lock onto user's hand position within the first 6 frames
    if (!this.autoCalibrated || this.handPresenceFrames < 6) {
      this.calibratedCenterX = rawX;
      this.calibratedCenterY = rawY;
      this.autoCalibrated = true;
    } else {
      // Gentle adaptive baseline drift ONLY when hand is relaxed near center and moving slowly
      const distFromCenter = Math.hypot(rawX - this.calibratedCenterX, rawY - this.calibratedCenterY);
      if (distFromCenter < 0.12 && rawSpeed < 0.25) {
        const driftSpeed = 0.002;
        this.calibratedCenterX = (1 - driftSpeed) * this.calibratedCenterX + driftSpeed * rawX;
        this.calibratedCenterY = (1 - driftSpeed) * this.calibratedCenterY + driftSpeed * rawY;
      }
    }

    // 4. Adaptive One-Euro Style Smoothing
    // Slow speed = high smoothing (0.24) to eliminate webcam noise and hand tremors
    // Fast speed = low smoothing (0.86) for instant, zero-lag gesture reaction
    const minAlpha = 0.24;
    const maxAlpha = 0.86;
    const speedRatio = Math.min(1.0, rawSpeed / 1.5);
    const alpha = minAlpha + (maxAlpha - minAlpha) * Math.pow(speedRatio, 0.7);

    const smoothedX = alpha * rawX + (1 - alpha) * this.prevX;
    const smoothedY = alpha * rawY + (1 - alpha) * this.prevY;
    const smoothedZ = alpha * rawZ + (1 - alpha) * this.prevZ;

    const vx = (smoothedX - this.prevX) / dt; // Positive = pushing right, Negative = pushing left
    const vy = (smoothedY - this.prevY) / dt; // Negative = UP (jump), Positive = DOWN (slide)
    const vz = (smoothedZ - this.prevZ) / dt; // Positive = forward towards camera

    // 5. Detect Individual Finger States (Extended vs Curled)
    const fingerStates: FingerStates = {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    };

    if (landmarks.length >= 21) {
      // For thumb: distance from wrist(0) to tip(4) compared to IP(3)
      const thumbTipDist = Math.hypot(landmarks[4].x - landmarks[0].x, landmarks[4].y - landmarks[0].y);
      const thumbKnuckleDist = Math.hypot(landmarks[2].x - landmarks[0].x, landmarks[2].y - landmarks[0].y);
      fingerStates.thumb = thumbTipDist > thumbKnuckleDist * 1.15;

      // Index, Middle, Ring, Pinky: tip Y compared to PIP joint Y (in camera coordinates)
      // When tip is above PIP joint, finger is extended
      fingerStates.index = landmarks[8].y < landmarks[6].y;
      fingerStates.middle = landmarks[12].y < landmarks[10].y;
      fingerStates.ring = landmarks[16].y < landmarks[14].y;
      fingerStates.pinky = landmarks[20].y < landmarks[18].y;
    }

    const extendedCount = [
      fingerStates.index,
      fingerStates.middle,
      fingerStates.ring,
      fingerStates.pinky,
    ].filter(Boolean).length;

    const isFist = extendedCount === 0;
    const isOpenPalm = extendedCount >= 3 && fingerStates.thumb;
    const isPeaceSign = fingerStates.index && fingerStates.middle && !fingerStates.ring && !fingerStates.pinky;
    const isThumbsUp = fingerStates.thumb && extendedCount === 0 && (landmarks.length >= 5 ? landmarks[4].y < landmarks[3].y : false);

    // 6. Push Direction and Intensity
    let pushDirection: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FORWARD' | 'CENTER' | 'NONE' = 'CENTER';
    const pushSpeed = Math.hypot(vx, vy);
    const pushIntensity = Math.min(1.0, pushSpeed / 1.5);

    const dx = smoothedX - this.calibratedCenterX;
    const dy = smoothedY - this.calibratedCenterY;

    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx < -0.22 || dx < -0.05) pushDirection = 'LEFT';
      else if (vx > 0.22 || dx > 0.05) pushDirection = 'RIGHT';
    } else {
      if (vy < -0.22 || dy < -0.05) pushDirection = 'UP';
      else if (vy > 0.22 || dy > 0.05) pushDirection = 'DOWN';
    }

    if (vz > 0.5) {
      pushDirection = 'FORWARD';
    }

    let detectedGesture: GestureType = forcedGesture || 'NONE';
    const confidence = 0.94;

    // 7. Core Directional Action Logic (Edge-Triggered State Machine)
    // -------------------------------------------------------------
    // A. PUSH UP / LIFT HAND -> JUMP
    const jumpThreshold = 0.065 / this.sensitivity;
    const slideThreshold = 0.07 / this.sensitivity;
    const neutralBound = 0.038 / this.sensitivity;

    const isUpwardFlick = vy < -0.26;
    const isDownwardFlick = vy > 0.26;

    if (forcedGesture === 'JUMP') {
      detectedGesture = 'JUMP';
      this.lastJumpTime = timestamp;
      this.callbacks?.onGesture('JUMP');
    } else if (forcedGesture === 'SLIDE') {
      detectedGesture = 'SLIDE';
      this.lastSlideTime = timestamp;
      this.callbacks?.onGesture('SLIDE');
    } else {
      // Normal edge-triggered vertical transitions
      if (this.verticalState === 'NEUTRAL') {
        if ((dy < -jumpThreshold || isUpwardFlick) && timestamp - this.lastJumpTime > 260) {
          detectedGesture = 'JUMP';
          this.verticalState = 'HIGH';
          this.lastJumpTime = timestamp;
          this.callbacks?.onGesture('JUMP');
        } else if ((dy > slideThreshold || isDownwardFlick) && timestamp - this.lastSlideTime > 260) {
          detectedGesture = 'SLIDE';
          this.verticalState = 'LOW';
          this.lastSlideTime = timestamp;
          this.callbacks?.onGesture('SLIDE');
        }
      } else if (this.verticalState === 'HIGH') {
        // Must return down to neutral deadzone before another jump can trigger
        // This strictly prevents the return movement from triggering an accidental slide!
        if (dy > -neutralBound && vy >= -0.05) {
          this.verticalState = 'NEUTRAL';
        }
      } else if (this.verticalState === 'LOW') {
        // Must return up to neutral deadzone before another slide can trigger
        // This strictly prevents the return movement from triggering an accidental jump!
        if (dy < neutralBound && vy <= 0.05) {
          this.verticalState = 'NEUTRAL';
        }
      }
    }

    // B. PUSH LEFT / PUSH RIGHT (Lane Steer)
    const laneThreshold = 0.075 / this.sensitivity;
    const centerBound = 0.04 / this.sensitivity;
    const isLeftFlick = vx < -0.32;
    const isRightFlick = vx > 0.32;

    if (this.horizontalState === 'CENTER') {
      if ((dx < -laneThreshold || isLeftFlick) && timestamp - this.lastLaneTime > 180) {
        this.horizontalState = 'LEFT';
        this.currentLane = -1;
        this.lastLaneTime = timestamp;
        this.callbacks?.onLaneChange(-1);
        if (!detectedGesture || detectedGesture === 'NONE') detectedGesture = 'LEFT';
      } else if ((dx > laneThreshold || isRightFlick) && timestamp - this.lastLaneTime > 180) {
        this.horizontalState = 'RIGHT';
        this.currentLane = 1;
        this.lastLaneTime = timestamp;
        this.callbacks?.onLaneChange(1);
        if (!detectedGesture || detectedGesture === 'NONE') detectedGesture = 'RIGHT';
      }
    } else if (this.horizontalState === 'LEFT') {
      if (dx > -centerBound && timestamp - this.lastLaneTime > 150) {
        this.horizontalState = 'CENTER';
        this.currentLane = 0;
        this.lastLaneTime = timestamp;
        this.callbacks?.onLaneChange(0);
      }
    } else if (this.horizontalState === 'RIGHT') {
      if (dx < centerBound && timestamp - this.lastLaneTime > 150) {
        this.horizontalState = 'CENTER';
        this.currentLane = 0;
        this.lastLaneTime = timestamp;
        this.callbacks?.onLaneChange(0);
      }
    }

    // 8. Advanced Hand Gestures
    // A. CLENCH FIST -> HOVERBOARD / ENERGY SHIELD
    if (isFist) {
      this.fistFrameCount++;
      if (this.fistFrameCount >= 5 && timestamp - this.lastHoverboardTime > 1500) {
        detectedGesture = 'HOVERBOARD';
        this.lastHoverboardTime = timestamp;
        this.callbacks?.onGesture('HOVERBOARD');
      }
    } else {
      this.fistFrameCount = 0;
    }

    // B. OPEN PALM PUSH FORWARD -> NITRO BOOST / MAGNET RUSH
    if (isOpenPalm && (pushDirection === 'FORWARD' || vz > 0.45 || smoothedZ > 0.72)) {
      this.openPalmFrameCount++;
      if (this.openPalmFrameCount >= 4 && timestamp - this.lastBoostTime > 2500) {
        detectedGesture = 'BOOST';
        this.lastBoostTime = timestamp;
        this.callbacks?.onGesture('BOOST');
      }
    } else {
      this.openPalmFrameCount = 0;
    }

    // C. PEACE SIGN (✌️) -> 2x COIN MULTIPLIER FRENZY
    if (isPeaceSign) {
      this.peaceFrameCount++;
      if (this.peaceFrameCount >= 5 && timestamp - this.lastPeaceTime > 3000) {
        detectedGesture = 'PEACE_MULTIPLIER';
        this.lastPeaceTime = timestamp;
        this.callbacks?.onGesture('PEACE_MULTIPLIER');
      }
    } else {
      this.peaceFrameCount = 0;
    }

    // D. THUMBS UP (👍) -> SUPER APEX JUMP
    if (isThumbsUp) {
      this.thumbsUpFrameCount++;
      if (this.thumbsUpFrameCount >= 4 && timestamp - this.lastThumbsUpTime > 1500) {
        detectedGesture = 'SUPER_JUMP';
        this.lastThumbsUpTime = timestamp;
        this.callbacks?.onGesture('SUPER_JUMP');
      }
    } else {
      this.thumbsUpFrameCount = 0;
    }

    this.prevX = smoothedX;
    this.prevY = smoothedY;
    this.prevZ = smoothedZ;
    this.prevTimestamp = timestamp;

    // Continuous Hand Line Navigation
    // Continuous X maps hand position to the track range (-1.0 = far left, 1.0 = far right)
    const continuousX = Math.max(-1.0, Math.min(1.0, (smoothedX - this.calibratedCenterX) * (3.2 * this.sensitivity)));
    const continuousY = Math.max(-1.0, Math.min(1.0, (smoothedY - this.calibratedCenterY) * 2.6));

    // Dynamic hand orientation angle
    let steerAngle = 0;
    if (landmarks.length >= 10) {
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const dxHand = this.mirror ? -(middleMCP.x - wrist.x) : (middleMCP.x - wrist.x);
      const dyHand = middleMCP.y - wrist.y;
      steerAngle = Math.max(-60, Math.min(60, (Math.atan2(dxHand, -dyHand) * 180) / Math.PI));
    }

    const result: HandTrackingResult = {
      detected: true,
      landmarks,
      normalizedX: smoothedX,
      normalizedY: smoothedY,
      continuousX,
      continuousY,
      steerAngle,
      isHandRaised: true,
      depthZ: smoothedZ,
      velocityX: vx,
      velocityY: vy,
      pushDirection,
      pushIntensity,
      gesture: detectedGesture,
      gestureConfidence: confidence,
      isFist,
      isOpenPalm,
      isPeaceSign,
      isThumbsUp,
      fingerStates,
      rawLane: this.currentLane,
      trackingFps: this.currentFps,
      autoLocked: true,
    };

    this.callbacks?.onTrackingUpdate(result);
  }

  public stop() {
    this.isRunning = false;
    this.isCameraStreaming = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
  }
}

export const handTracker = new HandTrackerService();
