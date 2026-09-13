import React, { useEffect, useRef, useState } from 'react';
import { HandTrackingResult, GestureType } from '../types';
import {
  Camera,
  CameraOff,
  Crosshair,
  Maximize2,
  Minimize2,
  Sparkles,
  ExternalLink,
  Scan,
  Activity,
  Zap,
  Shield,
  Compass,
} from 'lucide-react';
import { handTracker } from '../services/handTracker';

interface HandTrackingPipProps {
  trackingResult: HandTrackingResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: 'loading' | 'ready' | 'error' | 'no-camera';
  onCalibrate: () => void;
  onRetryCamera: () => void;
  mirror: boolean;
}

export const HandTrackingPip: React.FC<HandTrackingPipProps> = ({
  trackingResult,
  videoRef,
  cameraStatus,
  onCalibrate,
  onRetryCamera,
  mirror,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showPalmScanLines, setShowPalmScanLines] = useState<boolean>(true);
  const [showLaserScan, setShowLaserScan] = useState<boolean>(true);
  const [isVirtualMode, setIsVirtualMode] = useState<boolean>(false);

  const trackingRef = useRef<HandTrackingResult | null>(trackingResult);
  const showPalmScanLinesRef = useRef<boolean>(showPalmScanLines);
  const showLaserScanRef = useRef<boolean>(showLaserScan);
  const mirrorRef = useRef<boolean>(mirror);

  useEffect(() => {
    trackingRef.current = trackingResult;
  }, [trackingResult]);

  useEffect(() => {
    showPalmScanLinesRef.current = showPalmScanLines;
  }, [showPalmScanLines]);

  useEffect(() => {
    showLaserScanRef.current = showLaserScan;
  }, [showLaserScan]);

  useEffect(() => {
    mirrorRef.current = mirror;
  }, [mirror]);

  // 60fps Biometric Hand HUD, Palm Scan Lines, and Dynamic Steering Vector Line
  useEffect(() => {
    let animId: number;
    let scanY = 0;
    let scanDir = 1;

    const render = (timeMs: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const result = trackingRef.current;
          const isMirrored = mirrorRef.current;
          const drawLines = showPalmScanLinesRef.current;
          const drawLaser = showLaserScanRef.current;

          ctx.clearRect(0, 0, w, h);

          // Subtle Continuous Grid Background
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 20; x < w; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 20; y < h; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Dynamic Center Reference Line (Subtle Cyber Guideline)
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();
          ctx.setLineDash([]);

          // 1. Active Sweeping Laser Scan Beam
          if (drawLaser) {
            scanY += scanDir * 2.2;
            if (scanY > h) {
              scanY = h;
              scanDir = -1;
            } else if (scanY < 0) {
              scanY = 0;
              scanDir = 1;
            }

            const laserGrad = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
            laserGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
            laserGrad.addColorStop(0.35, 'rgba(6, 182, 212, 0.25)');
            laserGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            laserGrad.addColorStop(0.65, 'rgba(6, 182, 212, 0.25)');
            laserGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

            ctx.fillStyle = laserGrad;
            ctx.fillRect(0, scanY - 12, w, 24);

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            ctx.lineTo(w, scanY);
            ctx.stroke();

            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('HAND BIO-SCANNER', 8, Math.max(12, scanY - 4));
          }

          // 2. Process Hand Landmarks: Render Palm Lines & Character Motion Steering Line
          if (result && result.landmarks && result.landmarks.length > 0 && drawLines) {
            const landmarks = result.landmarks;

            const pts = landmarks.map((p) => ({
              x: isMirrored ? (1 - p.x) * w : p.x * w,
              y: p.y * h,
            }));

            // A. Biometric Outer Hand Contour
            const contourIndices = [0, 1, 2, 3, 4, 8, 12, 16, 20, 17, 0];
            ctx.beginPath();
            contourIndices.forEach((idx, i) => {
              const pt = pts[idx];
              if (!pt) return;
              if (i === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // B. Digital Finger Skeleton Lines
            const fingerGroups = [
              { color: '#f59e0b', bones: [[0, 1], [1, 2], [2, 3], [3, 4]] },        // Thumb (Amber)
              { color: '#06b6d4', bones: [[0, 5], [5, 6], [6, 7], [7, 8]] },        // Index (Cyan)
              { color: '#10b981', bones: [[5, 9], [9, 10], [10, 11], [11, 12]] },   // Middle (Emerald)
              { color: '#a855f7', bones: [[9, 13], [13, 14], [14, 15], [15, 16]] }, // Ring (Violet)
              { color: '#ec4899', bones: [[13, 17], [17, 18], [18, 19], [19, 20]] },// Pinky (Fuchsia)
              { color: '#e0f2fe', bones: [[0, 17]] },                                // Base Web
            ];

            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            fingerGroups.forEach((group) => {
              ctx.strokeStyle = group.color;
              ctx.shadowColor = group.color;
              ctx.shadowBlur = 4;
              group.bones.forEach(([i, j]) => {
                const p1 = pts[i];
                const p2 = pts[j];
                if (!p1 || !p2) return;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              });
            });
            ctx.shadowBlur = 0;

            // C. Joint Nodes & Fingertips
            const tipIndices = [4, 8, 12, 16, 20];
            const tipColors = ['#f59e0b', '#06b6d4', '#10b981', '#a855f7', '#ec4899'];

            pts.forEach((pt, idx) => {
              const tipIdx = tipIndices.indexOf(idx);
              const isTip = tipIdx !== -1;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, isTip ? 5.5 : 3.2, 0, Math.PI * 2);
              ctx.fillStyle = isTip ? tipColors[tipIdx] : '#ffffff';
              ctx.fill();
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            });

            // D. INTRICATE PALM SCAN LINES (The lines scanned directly on the hand!)
            // 1. Life Line: curves from between thumb & index (pts[2] / pts[5]) around thenar eminence to wrist (pts[0])
            if (pts[0] && pts[2] && pts[5]) {
              const startX = (pts[2].x + pts[5].x) * 0.5;
              const startY = (pts[2].y + pts[5].y) * 0.5;
              const midX = (pts[0].x * 0.5 + pts[2].x * 0.5);
              const midY = (pts[0].y * 0.5 + pts[5].y * 0.5);

              ctx.save();
              ctx.strokeStyle = '#22d3ee';
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.quadraticCurveTo(midX, midY, pts[0].x, pts[0].y);
              ctx.stroke();

              // Animated electric pulse along Life Line
              const pulseT = (timeMs * 0.0015) % 1;
              const px = (1 - pulseT) * (1 - pulseT) * startX + 2 * (1 - pulseT) * pulseT * midX + pulseT * pulseT * pts[0].x;
              const py = (1 - pulseT) * (1 - pulseT) * startY + 2 * (1 - pulseT) * pulseT * midY + pulseT * pulseT * pts[0].y;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // 2. Head Line: slants across mid-palm from near index knuckle (pts[5]) across to hypothenar (pts[17] towards pts[0])
            if (pts[5] && pts[17] && pts[0]) {
              const startX = pts[5].x;
              const startY = pts[5].y + 6;
              const endX = (pts[17].x * 0.75 + pts[0].x * 0.25);
              const endY = (pts[17].y * 0.55 + pts[0].y * 0.45);

              ctx.save();
              ctx.strokeStyle = '#34d399';
              ctx.shadowColor = '#10b981';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();

              const pulseT = ((timeMs + 400) * 0.0015) % 1;
              const px = startX + (endX - startX) * pulseT;
              const py = startY + (endY - startY) * pulseT;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // 3. Heart Line: sweeps across upper palm under the knuckles (pts[5], pts[9], pts[13], pts[17])
            if (pts[5] && pts[9] && pts[13] && pts[17]) {
              const pA = { x: (pts[5].x + pts[9].x) * 0.5, y: (pts[5].y + pts[9].y) * 0.5 + 8 };
              const pB = { x: (pts[9].x + pts[13].x) * 0.5, y: (pts[9].y + pts[13].y) * 0.5 + 8 };
              const pC = { x: (pts[13].x + pts[17].x) * 0.5, y: (pts[13].y + pts[17].y) * 0.5 + 8 };

              ctx.save();
              ctx.strokeStyle = '#f472b6';
              ctx.shadowColor = '#ec4899';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(pA.x, pA.y);
              ctx.quadraticCurveTo(pB.x, pB.y, pC.x, pC.y);
              ctx.stroke();

              const pulseT = ((timeMs + 800) * 0.0015) % 1;
              const px = (1 - pulseT) * (1 - pulseT) * pA.x + 2 * (1 - pulseT) * pulseT * pB.x + pulseT * pulseT * pC.x;
              const py = (1 - pulseT) * (1 - pulseT) * pA.y + 2 * (1 - pulseT) * pulseT * pB.y + pulseT * pulseT * pC.y;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // 4. Central Fate / Motion Vector Spine: from wrist pts[0] right up through palm to middle knuckle pts[9]
            if (pts[0] && pts[9]) {
              ctx.save();
              ctx.strokeStyle = '#fbbf24';
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.8;
              ctx.beginPath();
              ctx.moveTo(pts[0].x, pts[0].y);
              ctx.lineTo(pts[9].x, pts[9].y);
              ctx.stroke();

              const pulseT = ((timeMs + 1200) * 0.002) % 1;
              const px = pts[0].x + (pts[9].x - pts[0].x) * pulseT;
              const py = pts[0].y + (pts[9].y - pts[0].y) * pulseT;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // E. Auto-Located Palm Centroid & Cyber Target Ring
            const palmX = (isMirrored ? 1 - result.normalizedX : result.normalizedX) * w;
            const palmY = result.normalizedY * h;

            // Rotating Cyber Target Reticle
            const rotAngle = timeMs * 0.0025;
            ctx.save();
            ctx.translate(palmX, palmY);
            ctx.rotate(rotAngle);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-9, -9, 18, 18);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(palmX, palmY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // F. THE STEERING LINE (The line according to which the character moves!)
            // Extends outward from the palm in the exact continuous direction of character movement
            const steerAngleDeg = result.steerAngle || 0;
            const continuousX = result.continuousX || 0;
            const flowOffset = (timeMs * 0.06) % 16;

            // Line length and endpoint
            const lineLength = 70;
            // Angle in radians (0 is pointing up, positive tilts right, negative tilts left)
            const steerRad = (steerAngleDeg * Math.PI) / 180;
            // Endpoint coordinates radiating from palm
            const endX = palmX + Math.sin(steerRad) * lineLength + continuousX * 35;
            const endY = palmY - Math.cos(steerRad) * lineLength;

            ctx.save();
            // Color according to action
            let lineColor = '#06b6d4';
            let lineLabel = `STEER: ${Math.round(steerAngleDeg)}°`;

            if (result.gesture === 'JUMP' || result.continuousY < -0.3) {
              lineColor = '#10b981';
              lineLabel = '▲ JUMP VECTOR LINE';
            } else if (result.gesture === 'SLIDE' || result.continuousY > 0.35) {
              lineColor = '#f59e0b';
              lineLabel = '▼ SLIDE VECTOR LINE';
            } else if (Math.abs(continuousX) > 0.15) {
              lineColor = continuousX < 0 ? '#38bdf8' : '#c084fc';
              lineLabel = continuousX < 0 ? `◄ STEER LINE ${Math.round(continuousX * 100)}%` : `STEER LINE +${Math.round(continuousX * 100)}% ►`;
            }

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = lineColor;
            ctx.shadowBlur = 14;
            ctx.setLineDash([8, 5]);
            ctx.lineDashOffset = -flowOffset;

            ctx.beginPath();
            ctx.moveTo(palmX, palmY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Target pointer head
            ctx.fillStyle = lineColor;
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.setLineDash([]);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(lineLabel, Math.max(6, Math.min(w - 120, endX - 30)), Math.max(16, endY - 10));
            ctx.restore();

            // G. Biometric Bounding Lock Frame
            let minX = w, maxX = 0, minY = h, maxY = 0;
            pts.forEach((p) => {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            });

            minX = Math.max(4, minX - 12);
            maxX = Math.min(w - 4, maxX + 12);
            minY = Math.max(4, minY - 12);
            maxY = Math.min(h - 4, maxY + 12);
            const cornerLen = 12;

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(minX, minY + cornerLen);
            ctx.lineTo(minX, minY);
            ctx.lineTo(minX + cornerLen, minY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(maxX - cornerLen, minY);
            ctx.lineTo(maxX, minY);
            ctx.lineTo(maxX, minY + cornerLen);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(minX, maxY - cornerLen);
            ctx.lineTo(minX, maxY);
            ctx.lineTo(minX + cornerLen, maxY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(maxX - cornerLen, maxY);
            ctx.lineTo(maxX, maxY);
            ctx.lineTo(maxX, maxY - cornerLen);
            ctx.stroke();

            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('HAND SCAN LOCKED', minX, minY - 4);
          }

          // Pro HUD Telemetry
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`FPS: ${result?.trackingFps ?? 60} | BIO-SCAN: ACTIVE`, 8, 14);

          const contX = result?.continuousX ?? 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`LINE VECTOR: ${contX < 0 ? '' : '+'}${Math.round(contX * 100)}% TRACK`, 8, 26);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isVirtualMode && cameraStatus !== 'no-camera') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    handTracker.simulateHand(x, y);
  };

  const gesture = trackingResult?.gesture || 'NONE';
  const detected = trackingResult?.detected ?? false;
  const isCameraLive = handTracker.isCameraActive();
  const fingerStates = trackingResult?.fingerStates;
  const continuousX = trackingResult?.continuousX ?? 0;
  const steerAngle = trackingResult?.steerAngle ?? 0;

  // Normalized continuous position slider percentage (0 to 100%)
  const trackPositionPercent = Math.max(0, Math.min(100, (continuousX + 1.0) * 50));

  return (
    <div
      id="hand-tracking-pip"
      className={`fixed bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl transition-all duration-300 overflow-hidden ${
        isMinimized ? 'w-56 h-14' : 'w-76 sm:w-84'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/70 text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-2">
          {isCameraLive ? (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
          ) : cameraStatus === 'loading' ? (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
          )}
          <span className="font-bold tracking-wide flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            {isMinimized ? (isCameraLive ? 'Hand Scanner Live' : 'Scanner Offline') : 'Hand Bio-Line Scanner'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMinimized && (
            <>
              <button
                id="toggle-lines-btn"
                onClick={() => setShowPalmScanLines(!showPalmScanLines)}
                title="Toggle Hand Scan Lines"
                className={`p-1.5 rounded transition-colors ${
                  showPalmScanLines
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              <button
                id="toggle-laser-btn"
                onClick={() => setShowLaserScan(!showLaserScan)}
                title="Toggle Sweeping Laser Scan Beam"
                className={`p-1.5 rounded transition-colors ${
                  showLaserScan
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
              </button>

              <button
                id="virtual-hand-btn"
                onClick={() => setIsVirtualMode(!isVirtualMode)}
                title="Toggle Virtual Pointer Fallback Mode"
                className={`p-1.5 rounded transition-colors ${
                  isVirtualMode
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            id="minimize-pip-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`p-3 transition-opacity duration-200 ${isMinimized ? 'opacity-0 pointer-events-none h-0 overflow-hidden !p-0' : 'opacity-100'}`}>
        {/* Camera Viewport with Biometric Canvas Overlay */}
          <div
            className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-700/60 flex items-center justify-center cursor-crosshair group select-none"
            onPointerMove={handlePointerMove}
          >
            {/* The Raw Webcam Video Feed */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
              playsInline
              muted
              autoPlay
            />

            {/* High-Performance Canvas for Biometric Hand Lines */}
            <canvas
              ref={canvasRef}
              width={336}
              height={252}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Fallback Screen if camera is not streaming */}
            {!isCameraLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 z-20">
                <CameraOff className="w-8 h-8 text-cyan-400/80 mb-2" />
                <p className="text-xs text-slate-200 font-semibold mb-1">
                  Camera Scanning Ready
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                  Raise your hand to scan lines and guide character movement.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    id="pip-enable-camera-btn"
                    onClick={onRetryCamera}
                    className="flex items-center justify-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Start Camera
                  </button>
                  <button
                    id="open-in-tab-pip-btn"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="flex items-center justify-center gap-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-medium border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}

            {/* Virtual Pointer Mode Active Banner */}
            {isVirtualMode && (
              <div className="absolute top-2 inset-x-2 bg-indigo-950/85 border border-indigo-500/40 rounded-lg p-1.5 text-center pointer-events-none z-20">
                <p className="text-[11px] text-indigo-200 font-bold">
                  🖱️ Virtual Hand: Drag pointer to steer & create motion lines!
                </p>
              </div>
            )}

            {/* Glowing Action Pill */}
            {gesture !== 'NONE' && (
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 text-slate-950 font-black text-xs rounded-full shadow-xl flex items-center gap-1.5 animate-bounce z-30 ${
                  gesture === 'JUMP'
                    ? 'bg-emerald-400 text-emerald-950 ring-2 ring-emerald-300'
                    : gesture === 'SLIDE'
                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                    : gesture === 'HOVERBOARD'
                    ? 'bg-purple-400 text-purple-950 ring-2 ring-purple-300'
                    : gesture === 'BOOST'
                    ? 'bg-cyan-300 text-cyan-950 ring-2 ring-cyan-200'
                    : gesture === 'PEACE_MULTIPLIER'
                    ? 'bg-yellow-400 text-yellow-950 ring-2 ring-yellow-200'
                    : gesture === 'SUPER_JUMP'
                    ? 'bg-emerald-300 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-cyan-400 text-cyan-950 ring-2 ring-cyan-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {gesture === 'JUMP' && '▲ JUMP LINE ACTIVE'}
                {gesture === 'SLIDE' && '▼ SLIDE LINE ACTIVE'}
                {gesture === 'HOVERBOARD' && '🛡️ SHIELD (FIST)'}
                {gesture === 'BOOST' && '⚡ NITRO BOOST'}
                {gesture === 'PEACE_MULTIPLIER' && '✌️ 2X COINS'}
                {gesture === 'SUPER_JUMP' && '👍 SUPER JUMP'}
              </div>
            )}
          </div>

          {/* Continuous Hand Line Navigation Gauge (NO Left/Center/Right!) */}
          <div className="mt-2.5 px-2.5 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Compass className="w-3.5 h-3.5" />
                LINE TRACK:
              </span>
              <span className="font-bold text-white">
                {continuousX < 0 ? '' : '+'}
                {Math.round(continuousX * 100)}%
                <span className="text-slate-500 ml-1">({Math.round(steerAngle)}°)</span>
              </span>
            </div>

            {/* Analog Continuous Position Rail */}
            <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex items-center px-1">
              {/* Center marker tick */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 z-0 -translate-x-1/2" />
              {/* Quarter ticks */}
              <div className="absolute left-1/4 top-1 bottom-1 w-0.5 bg-slate-800 z-0" />
              <div className="absolute left-3/4 top-1 bottom-1 w-0.5 bg-slate-800 z-0" />

              {/* Glowing Indicator Bead */}
              <div
                className="absolute top-0.5 bottom-0.5 w-4 -ml-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 transition-all duration-75 flex items-center justify-center z-10"
                style={{ left: `${trackPositionPercent}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>◄ LEFT BOUND</span>
              <span className="text-slate-400">CENTER VECTOR</span>
              <span>RIGHT BOUND ►</span>
            </div>
          </div>

          {/* Finger State LED Matrix */}
          {detected && fingerStates && (
            <div className="mt-2 flex items-center justify-between px-2 py-1 bg-slate-950/70 rounded-lg border border-slate-800 text-[10px] font-mono">
              <span className="text-slate-400 font-semibold">SCAN JOINTS:</span>
              <div className="flex items-center gap-1.5">
                <span
                  title="Thumb"
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    fingerStates.thumb ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  T
                </span>
                <span
                  title="Index"
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    fingerStates.index ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  I
                </span>
                <span
                  title="Middle"
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    fingerStates.middle ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  M
                </span>
                <span
                  title="Ring"
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    fingerStates.ring ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  R
                </span>
                <span
                  title="Pinky"
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    fingerStates.pinky ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  P
                </span>
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  detected ? 'bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              {detected
                ? 'Hand Lines Active & Steering'
                : isCameraLive
                ? 'Raise hand in front of camera'
                : 'Virtual Mode / Keyboard active'}
            </span>
            <button
              id="reset-center-btn"
              onClick={onCalibrate}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
            >
              Calibrate Center
            </button>
          </div>
        </div>
      </div>
    );
  };
