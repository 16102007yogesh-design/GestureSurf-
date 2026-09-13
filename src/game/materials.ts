import * as THREE from 'three';

// Procedural texture generators for subway walls, graffiti, rails, and hazard signs
function createRailTieTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Clean ballast gravel bed with high-contrast flecks
  ctx.fillStyle = '#1e2530';
  ctx.fillRect(0, 0, 128, 128);

  // Gravel flecks
  for (let i = 0; i < 300; i++) {
    const shade = Math.floor(Math.random() * 50 + 25);
    ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }

  // Heavy wooden railway cross-ties with steel fastener plates
  ctx.fillStyle = '#452b1b';
  ctx.fillRect(0, 40, 128, 48);
  ctx.fillStyle = '#2c190e';
  ctx.fillRect(0, 44, 128, 8);
  ctx.fillRect(0, 76, 128, 8);

  // Steel tie plates
  ctx.fillStyle = '#64748b';
  ctx.fillRect(16, 48, 18, 32);
  ctx.fillRect(94, 48, 18, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 20);
  return texture;
}

// High-contrast diagonal hazard caution stripes (Yellow & Black)
function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Bright yellow background
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 128, 128);

  // Diagonal black safety stripes
  ctx.fillStyle = '#0f172a';
  ctx.lineWidth = 24;
  ctx.strokeStyle = '#0f172a';

  for (let x = -128; x <= 256; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 128, 128);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

// Vibrant Jump Indicator Badge (Green circle with Up Arrow ⬆️)
function createJumpBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Outer glowing green ring
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Dark inner circle
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  // Crisp white UP arrow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 20);
  ctx.lineTo(100, 56);
  ctx.lineTo(80, 56);
  ctx.lineTo(80, 100);
  ctx.lineTo(48, 100);
  ctx.lineTo(48, 56);
  ctx.lineTo(28, 56);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Vibrant Slide Indicator Badge (Amber/Orange circle with Down Arrow ⬇️)
function createSlideBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Outer glowing amber ring
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Dark inner circle
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  // Crisp white DOWN arrow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 108);
  ctx.lineTo(100, 72);
  ctx.lineTo(80, 72);
  ctx.lineTo(80, 28);
  ctx.lineTo(48, 28);
  ctx.lineTo(48, 72);
  ctx.lineTo(28, 72);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createSubwayWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Crisp subway tile background with cool slate tint
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 256);

  // Tile grid
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  const tileSize = 32;
  for (let x = 0; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Colorful street art graffiti tags
  ctx.fillStyle = '#f97316';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('SUBWAY', 26, 75);
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('RUNNER', 120, 150);
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 3.5;
  ctx.strokeText('PRO SPEED', 40, 220);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 2);
  return texture;
}

function createDropShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createBillboardTexture(theme: 'surf' | 'metro' | 'neon'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const bgGrad = ctx.createLinearGradient(0, 0, 256, 128);
  if (theme === 'surf') {
    bgGrad.addColorStop(0, '#0284c7');
    bgGrad.addColorStop(1, '#0f172a');
  } else if (theme === 'metro') {
    bgGrad.addColorStop(0, '#ea580c');
    bgGrad.addColorStop(1, '#431407');
  } else {
    bgGrad.addColorStop(0, '#9333ea');
    bgGrad.addColorStop(1, '#1e1b4b');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.textAlign = 'center';
  if (theme === 'surf') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('SUBWAY SURF', 128, 52);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('DODGE • JUMP • SLIDE', 128, 86);
  } else if (theme === 'metro') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('METRO EXPRESS', 128, 52);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LIVE RAPID TRANSIT', 128, 86);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('HIGH VOLTAGE ⚡', 128, 52);
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ELECTRIC RUNNER', 128, 86);
  }

  return new THREE.CanvasTexture(canvas);
}

export const Materials = {
  // Ground & Rails
  ground: new THREE.MeshStandardMaterial({
    map: createRailTieTexture(),
    roughness: 0.75,
    metalness: 0.15,
  }),
  steelRail: new THREE.MeshStandardMaterial({
    color: 0xdde4ed,
    roughness: 0.15,
    metalness: 0.95,
  }),
  subwayWall: new THREE.MeshStandardMaterial({
    map: createSubwayWallTexture(),
    roughness: 0.5,
    metalness: 0.25,
  }),

  // Drop Shadow
  dropShadow: new THREE.MeshBasicMaterial({
    map: createDropShadowTexture(),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  }),

  // Advertising Billboards
  billboardSurf: new THREE.MeshStandardMaterial({
    map: createBillboardTexture('surf'),
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
  }),
  billboardMetro: new THREE.MeshStandardMaterial({
    map: createBillboardTexture('metro'),
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0xea580c,
    emissiveIntensity: 0.25,
  }),
  billboardNeon: new THREE.MeshStandardMaterial({
    map: createBillboardTexture('neon'),
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x9333ea,
    emissiveIntensity: 0.25,
  }),

  // Glowing Lane Boundary Dash Marker
  laneDivider: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.7,
  }),

  // Overhead Tunnel Neon Arch
  tunnelArch: new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
  }),

  // Subway Train Materials (High-contrast bright lacquer)
  trainRed: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.25,
    metalness: 0.45,
  }),
  trainBlue: new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.25,
    metalness: 0.45,
  }),
  trainYellow: new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.45,
  }),
  trainRoof: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.45,
    metalness: 0.6,
  }),
  trainWindow: new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  }),
  trainHeadlight: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 2.2,
  }),
  trainBumperHazard: new THREE.MeshStandardMaterial({
    map: createHazardStripeTexture(),
    roughness: 0.4,
  }),

  // Obstacle Barriers
  cautionStripe: new THREE.MeshStandardMaterial({
    map: createHazardStripeTexture(),
    roughness: 0.4,
  }),
  barrierWood: new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.6,
  }),
  barrierPost: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.75,
  }),

  // Universal Action Hologram Badges (Self-Explanatory Visual Language)
  jumpBadge: new THREE.MeshBasicMaterial({
    map: createJumpBadgeTexture(),
    transparent: true,
    side: THREE.DoubleSide,
  }),
  slideBadge: new THREE.MeshBasicMaterial({
    map: createSlideBadgeTexture(),
    transparent: true,
    side: THREE.DoubleSide,
  }),

  // Collectibles (Vivid, Sparkling & High-Emissive)
  coin: new THREE.MeshStandardMaterial({
    color: 0xffe066,
    roughness: 0.15,
    metalness: 0.95,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.5,
  }),
  magnet: new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.25,
    metalness: 0.75,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.6,
  }),
  jetpack: new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.25,
    metalness: 0.8,
    emissive: 0x059669,
    emissiveIntensity: 0.6,
  }),
  multiplier: new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    roughness: 0.2,
    metalness: 0.85,
    emissive: 0x9333ea,
    emissiveIntensity: 0.6,
  }),
  hoverboard: new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.2,
    metalness: 0.85,
    emissive: 0x0891b2,
    emissiveIntensity: 0.7,
  }),
  shieldBubble: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
  }),

  // Character Base Materials
  hoodie: new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant cyan hoodie
    roughness: 0.55,
  }),
  pants: new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Denim navy
    roughness: 0.7,
  }),
  skin: new THREE.MeshStandardMaterial({
    color: 0xfcd34d,
    roughness: 0.8,
  }),
  sneakers: new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.4,
  }),
  cap: new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.5,
  }),

  // Outfit Customizer Presets
  applyOutfit(outfitId: string) {
    if (outfitId === 'neon-phantom') {
      this.hoodie.color.setHex(0x7e22ce); // Ultraviolet
      this.pants.color.setHex(0x09090b);
      this.cap.color.setHex(0xec4899); // Hot Pink
      this.sneakers.color.setHex(0xec4899);
    } else if (outfitId === 'golden-striker') {
      this.hoodie.color.setHex(0xeab308); // 24K Gold
      this.pants.color.setHex(0x1c1917);
      this.cap.color.setHex(0xf59e0b);
      this.sneakers.color.setHex(0xfef08a);
    } else if (outfitId === 'cyber-stealth') {
      this.hoodie.color.setHex(0x10b981); // Terminal Emerald
      this.pants.color.setHex(0x022c22);
      this.cap.color.setHex(0x065f46);
      this.sneakers.color.setHex(0x34d399);
    } else {
      // Default: electric-runner
      this.hoodie.color.setHex(0x0284c7);
      this.pants.color.setHex(0x1e293b);
      this.cap.color.setHex(0x0284c7);
      this.sneakers.color.setHex(0xf97316);
    }
  },
};
