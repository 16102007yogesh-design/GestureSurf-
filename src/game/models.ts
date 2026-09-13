import * as THREE from 'three';
import { Materials } from './materials';
import { LANE_WIDTH, PlayerAnimationState } from '../types';

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  hoverboard: THREE.Group;
  shield: THREE.Mesh;
  jetpackMesh: THREE.Group;
  updateAnimation: (time: number, state: PlayerAnimationState, speedRatio: number, leanX: number) => void;
}

export function createCharacter(): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // 1. Torso (Hoodie)
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const torso = new THREE.Mesh(torsoGeo, Materials.hoodie);
  torso.position.y = 1.35;
  torso.castShadow = true;
  body.add(torso);

  // 2. Head & Cap
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const head = new THREE.Mesh(headGeo, Materials.skin);
  head.position.y = 1.95;
  head.castShadow = true;
  body.add(head);

  // Backwards Cap
  const capGeo = new THREE.SphereGeometry(0.33, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, Materials.cap);
  cap.rotation.x = -0.2;
  head.add(cap);

  // Cap visor (pointing backwards)
  const visorGeo = new THREE.BoxGeometry(0.32, 0.05, 0.28);
  const visor = new THREE.Mesh(visorGeo, Materials.cap);
  visor.position.set(0, 0.08, -0.32);
  head.add(visor);

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
  armGeo.translate(0, -0.3, 0); // pivot at shoulder

  const leftArm = new THREE.Mesh(armGeo, Materials.hoodie);
  leftArm.position.set(-0.48, 1.65, 0);
  leftArm.castShadow = true;
  body.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, Materials.hoodie);
  rightArm.position.set(0.48, 1.65, 0);
  rightArm.castShadow = true;
  body.add(rightArm);

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.24, 0.8, 0.24);
  legGeo.translate(0, -0.35, 0); // pivot at hip

  const leftLeg = new THREE.Mesh(legGeo, Materials.pants);
  leftLeg.position.set(-0.22, 0.8, 0);
  leftLeg.castShadow = true;
  body.add(leftLeg);

  // Left sneaker
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.42);
  const leftShoe = new THREE.Mesh(shoeGeo, Materials.sneakers);
  leftShoe.position.set(0, -0.7, 0.06);
  leftLeg.add(leftShoe);

  const rightLeg = new THREE.Mesh(legGeo, Materials.pants);
  rightLeg.position.set(0.22, 0.8, 0);
  rightLeg.castShadow = true;
  body.add(rightLeg);

  const rightShoe = new THREE.Mesh(shoeGeo, Materials.sneakers);
  rightShoe.position.set(0, -0.7, 0.06);
  rightLeg.add(rightShoe);

  // 5. Hoverboard (toggled when active)
  const hoverboard = new THREE.Group();
  const boardGeo = new THREE.BoxGeometry(0.75, 0.1, 1.7);
  const boardMesh = new THREE.Mesh(boardGeo, Materials.hoverboard);
  boardMesh.castShadow = true;
  hoverboard.add(boardMesh);

  // Neon thrusters under hoverboard
  const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8);
  const thrusterL = new THREE.Mesh(thrusterGeo, Materials.shieldBubble);
  thrusterL.position.set(-0.22, -0.08, 0.5);
  hoverboard.add(thrusterL);
  const thrusterR = new THREE.Mesh(thrusterGeo, Materials.shieldBubble);
  thrusterR.position.set(0.22, -0.08, 0.5);
  hoverboard.add(thrusterR);

  hoverboard.position.set(0, 0.1, 0);
  hoverboard.visible = false;
  root.add(hoverboard);

  // 6. Shield Bubble
  const shieldGeo = new THREE.SphereGeometry(1.4, 24, 24);
  const shield = new THREE.Mesh(shieldGeo, Materials.shieldBubble);
  shield.position.set(0, 1.2, 0);
  shield.visible = false;
  root.add(shield);

  // 7. Jetpack (backpack)
  const jetpackMesh = new THREE.Group();
  const jetTankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12);
  const tank1 = new THREE.Mesh(jetTankGeo, Materials.jetpack);
  tank1.position.set(-0.16, 0, 0);
  const tank2 = new THREE.Mesh(jetTankGeo, Materials.jetpack);
  tank2.position.set(0.16, 0, 0);
  jetpackMesh.add(tank1, tank2);
  jetpackMesh.position.set(0, 1.35, -0.32);
  jetpackMesh.visible = false;
  body.add(jetpackMesh);

  // Animation controller
  const updateAnimation = (time: number, state: PlayerAnimationState, speedRatio: number, leanX: number) => {
    // Lean into turns
    root.rotation.z = -leanX * 0.22;
    root.rotation.y = leanX * 0.18;

    if (state === 'idle') {
      body.position.y = Math.sin(time * 3) * 0.04;
      body.rotation.x = 0;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = Math.sin(time * 3) * 0.08;
      rightArm.rotation.x = -Math.sin(time * 3) * 0.08;
      return;
    }

    if (state === 'flying') {
      // Jetpack flight animation
      body.position.y = 0;
      body.rotation.x = 0.5; // fly horizontally
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      leftLeg.rotation.x = 0.4;
      rightLeg.rotation.x = 0.5;
      return;
    }

    if (state === 'sliding') {
      // Duck down low, slide feet forward in a sleek baseball slide
      body.position.y = -0.65;
      body.rotation.x = -0.55;
      leftLeg.rotation.x = -1.5;
      rightLeg.rotation.x = -1.3;
      leftArm.rotation.x = 0.9;
      rightArm.rotation.x = 0.9;
      return;
    }

    if (state === 'jumping') {
      // High athletic parkour tuck leap
      body.position.y = 0.2;
      body.rotation.x = 0.22;
      leftLeg.rotation.x = 0.9;
      rightLeg.rotation.x = 1.1;
      leftArm.rotation.x = -1.5;
      rightArm.rotation.x = -1.5;
      return;
    }

    // Default: Running animation cycle
    const runFreq = 16 * speedRatio;
    const swing = Math.sin(time * runFreq);

    body.position.y = Math.abs(Math.sin(time * runFreq * 2)) * 0.12;
    body.rotation.x = 0.12; // slight forward sprint lean

    leftLeg.rotation.x = swing * 0.85;
    rightLeg.rotation.x = -swing * 0.85;

    leftArm.rotation.x = -swing * 0.85;
    rightArm.rotation.x = swing * 0.85;
  };

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hoverboard,
    shield,
    jetpackMesh,
    updateAnimation,
  };
}

// 3D Subway Train Car
export function createTrain(color: 'red' | 'blue' | 'yellow', hasRamp: boolean = false): THREE.Group {
  const train = new THREE.Group();
  const trainMat = color === 'red' ? Materials.trainRed : color === 'blue' ? Materials.trainBlue : Materials.trainYellow;

  const length = 18;
  const width = 2.7;
  const height = 3.6;

  // Main Car Body
  const bodyGeo = new THREE.BoxGeometry(width, height, length);
  const body = new THREE.Mesh(bodyGeo, trainMat);
  body.position.y = height / 2 + 0.3;
  body.castShadow = true;
  body.receiveShadow = true;
  train.add(body);

  // Roof (Walkable track surface for running on train tops!)
  const roofGeo = new THREE.BoxGeometry(width - 0.1, 0.25, length);
  const roof = new THREE.Mesh(roofGeo, Materials.trainRoof);
  roof.position.y = height + 0.3;
  roof.receiveShadow = true;
  train.add(roof);

  // Headlights at front (+Z side)
  const lightGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
  lightGeo.rotateX(Math.PI / 2);
  const lightL = new THREE.Mesh(lightGeo, Materials.trainHeadlight);
  lightL.position.set(-0.85, 1.2, length / 2 + 0.06);
  const lightR = new THREE.Mesh(lightGeo, Materials.trainHeadlight);
  lightR.position.set(0.85, 1.2, length / 2 + 0.06);
  train.add(lightL, lightR);

  // Volumetric Headlight Beams (illuminating the tracks ahead)
  const beamGeo = new THREE.CylinderGeometry(0.25, 0.95, 9.0, 12, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamL = new THREE.Mesh(beamGeo, beamMat);
  beamL.position.set(-0.85, 1.1, length / 2 + 4.5);
  const beamR = new THREE.Mesh(beamGeo, beamMat);
  beamR.position.set(0.85, 1.1, length / 2 + 4.5);
  train.add(beamL, beamR);

  // Front Windshield Glass
  const frontWinGeo = new THREE.BoxGeometry(width * 0.76, 0.95, 0.08);
  const frontWin = new THREE.Mesh(frontWinGeo, Materials.trainWindow);
  frontWin.position.set(0, 2.45, length / 2 + 0.05);
  train.add(frontWin);

  // Illuminated Route Sign ("EXPRESS LINE")
  const signGeo = new THREE.BoxGeometry(width * 0.65, 0.32, 0.08);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x022c22,
    emissive: 0x10b981,
    emissiveIntensity: 0.8,
  });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 3.25, length / 2 + 0.06);
  train.add(signMesh);

  // Roof AC / Ventilation Units
  const acGeo = new THREE.BoxGeometry(1.6, 0.28, 2.6);
  const acMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 });
  const ac1 = new THREE.Mesh(acGeo, acMat);
  ac1.position.set(0, height + 0.45, -3.5);
  const ac2 = new THREE.Mesh(acGeo, acMat);
  ac2.position.set(0, height + 0.45, 3.5);
  train.add(ac1, ac2);

  // Windows along sides
  const windowGeo = new THREE.BoxGeometry(width + 0.08, 0.8, 1.6);
  for (let z = -length / 2 + 2.5; z < length / 2 - 2; z += 3.2) {
    const win = new THREE.Mesh(windowGeo, Materials.trainWindow);
    win.position.set(0, 2.4, z);
    train.add(win);
  }

  // Under-carriage wheels/bogies
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, width + 0.1, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const bogieFront = new THREE.Mesh(wheelGeo, Materials.barrierPost);
  bogieFront.position.set(0, 0.35, length / 2 - 2.5);
  const bogieBack = new THREE.Mesh(wheelGeo, Materials.barrierPost);
  bogieBack.position.set(0, 0.35, -length / 2 + 2.5);
  train.add(bogieFront, bogieBack);

  // Front Heavy Bumper with Yellow & Black Hazard Stripes
  const bumperGeo = new THREE.BoxGeometry(width - 0.2, 0.45, 0.35);
  const bumper = new THREE.Mesh(bumperGeo, Materials.trainBumperHazard);
  bumper.position.set(0, 0.5, length / 2 + 0.15);
  train.add(bumper);

  // Optional Ramp at front (slanted wedge allowing player to run up onto train roof!)
  if (hasRamp) {
    const rampLength = 4.5;
    const rampGeo = new THREE.BufferGeometry();
    // Triangular prism wedge for ramp
    const w2 = width / 2;
    const vertices = new Float32Array([
      // Bottom face
      -w2, 0.05, length / 2 + rampLength,
       w2, 0.05, length / 2 + rampLength,
       w2, 0.05, length / 2,
      -w2, 0.05, length / 2 + rampLength,
       w2, 0.05, length / 2,
      -w2, 0.05, length / 2,
      // Slanted top surface
      -w2, 0.05, length / 2 + rampLength,
       w2, 0.05, length / 2 + rampLength,
       w2, height + 0.3, length / 2,
      -w2, 0.05, length / 2 + rampLength,
       w2, height + 0.3, length / 2,
      -w2, height + 0.3, length / 2,
    ]);
    rampGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    rampGeo.computeVertexNormals();

    const rampMesh = new THREE.Mesh(rampGeo, Materials.trainYellow);
    rampMesh.receiveShadow = true;
    train.add(rampMesh);
  }

  return train;
}

// Low Hurdle Barrier (Must JUMP over)
export function createLowBarrier(): THREE.Group {
  const barrier = new THREE.Group();

  // Sawhorse horizontal board with high-contrast caution stripes
  const boardGeo = new THREE.BoxGeometry(2.7, 0.4, 0.16);
  const board = new THREE.Mesh(boardGeo, Materials.cautionStripe);
  board.position.y = 0.95;
  board.castShadow = true;
  barrier.add(board);

  // Floating Universal Green JUMP Badge (⬆️) - Instantly recognizable without reading
  const jumpBadgeGeo = new THREE.PlaneGeometry(0.75, 0.75);
  const jumpBadgeMesh = new THREE.Mesh(jumpBadgeGeo, Materials.jumpBadge);
  jumpBadgeMesh.position.set(0, 1.85, 0.02);
  barrier.add(jumpBadgeMesh);

  // Left & Right A-frame legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
  const legL1 = new THREE.Mesh(legGeo, Materials.barrierPost);
  legL1.position.set(-1.15, 0.55, 0.2);
  legL1.rotation.x = 0.25;

  const legL2 = new THREE.Mesh(legGeo, Materials.barrierPost);
  legL2.position.set(-1.15, 0.55, -0.2);
  legL2.rotation.x = -0.25;

  const legR1 = new THREE.Mesh(legGeo, Materials.barrierPost);
  legR1.position.set(1.15, 0.55, 0.2);
  legR1.rotation.x = 0.25;

  const legR2 = new THREE.Mesh(legGeo, Materials.barrierPost);
  legR2.position.set(1.15, 0.55, -0.2);
  legR2.rotation.x = -0.25;

  barrier.add(legL1, legL2, legR1, legR2);
  return barrier;
}

// High Gantry Barrier (Must SLIDE under)
export function createHighBarrier(): THREE.Group {
  const gantry = new THREE.Group();

  // Vertical steel posts on each side of lane
  const postGeo = new THREE.BoxGeometry(0.18, 3.2, 0.18);
  const postL = new THREE.Mesh(postGeo, Materials.barrierPost);
  postL.position.set(-1.3, 1.6, 0);
  const postR = new THREE.Mesh(postGeo, Materials.barrierPost);
  postR.position.set(1.3, 1.6, 0);
  gantry.add(postL, postR);

  // Overhead warning sign block hanging between 1.2m and 2.8m (must slide under 1.1m)
  const signGeo = new THREE.BoxGeometry(2.8, 1.4, 0.2);
  const sign = new THREE.Mesh(signGeo, Materials.cautionStripe);
  sign.position.set(0, 2.2, 0);
  sign.castShadow = true;
  gantry.add(sign);

  // Floating Universal Orange SLIDE Badge (⬇️) - Instantly recognizable without reading
  const slideBadgeGeo = new THREE.PlaneGeometry(0.75, 0.75);
  const slideBadgeMesh = new THREE.Mesh(slideBadgeGeo, Materials.slideBadge);
  slideBadgeMesh.position.set(0, 2.1, 0.14);
  gantry.add(slideBadgeMesh);

  // Red blinking hazard lights on sign corners
  const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const lightL = new THREE.Mesh(lightGeo, Materials.trainRed);
  lightL.position.set(-1.1, 2.7, 0.12);
  const lightR = new THREE.Mesh(lightGeo, Materials.trainRed);
  lightR.position.set(1.1, 2.7, 0.12);
  gantry.add(lightL, lightR);

  return gantry;
}

// 3D Spinning Gold Coin
export function createCoin(): THREE.Group {
  const coinGroup = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.09, 16);
  geo.rotateX(Math.PI / 2);
  const coinMesh = new THREE.Mesh(geo, Materials.coin);
  coinMesh.castShadow = true;
  coinGroup.add(coinMesh);

  // Inner star/ring detail
  const starGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16);
  const star = new THREE.Mesh(starGeo, Materials.coin);
  coinGroup.add(star);

  return coinGroup;
}

// Power-up Pickups (Magnet, Jetpack, Multiplier)
export function createPowerupMesh(type: 'magnet' | 'jetpack' | 'multiplier' | 'hoverboard'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'magnet') {
    // Horseshoe magnet
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.12, 12, 18, Math.PI),
      Materials.magnet
    );
    torus.rotation.z = Math.PI;
    group.add(torus);
  } else if (type === 'jetpack') {
    // Jetpack rockets
    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 12), Materials.jetpack);
    cyl1.position.x = -0.18;
    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 12), Materials.jetpack);
    cyl2.position.x = 0.18;
    group.add(cyl1, cyl2);
  } else if (type === 'multiplier') {
    // 2X Star
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), Materials.multiplier);
    group.add(star);
  } else {
    // Mini hoverboard
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.8), Materials.hoverboard);
    group.add(board);
  }

  // Surrounding energy halo ring
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.03, 8, 24),
    Materials.shieldBubble
  );
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  return group;
}

// 3-Lane Track Segment Builder with Rails and Sleepers
export function createTrackSegment(length: number): THREE.Group {
  const segment = new THREE.Group();

  // Ground ballast
  const ballastGeo = new THREE.PlaneGeometry(16, length);
  ballastGeo.rotateX(-Math.PI / 2);
  const ballast = new THREE.Mesh(ballastGeo, Materials.ground);
  ballast.position.set(0, 0, 0);
  ballast.receiveShadow = true;
  segment.add(ballast);

  // 3 Lanes of Steel Rails (2 rails per lane = 6 rails total)
  const railGeo = new THREE.BoxGeometry(0.1, 0.12, length);
  const halfGauge = 0.75;
  const lanes = [-LANE_WIDTH, 0, LANE_WIDTH];

  for (const laneX of lanes) {
    const railL = new THREE.Mesh(railGeo, Materials.steelRail);
    railL.position.set(laneX - halfGauge, 0.08, 0);
    const railR = new THREE.Mesh(railGeo, Materials.steelRail);
    railR.position.set(laneX + halfGauge, 0.08, 0);
    segment.add(railL, railR);
  }

  // Glowing Lane Divider Dashes (Neon Cyan lines between the 3 lanes)
  const dashLength = 3.2;
  const dashSpacing = 7.0;
  const dashGeo = new THREE.PlaneGeometry(0.1, dashLength);
  dashGeo.rotateX(-Math.PI / 2);

  for (let z = -length / 2 + dashLength; z < length / 2; z += dashSpacing) {
    const dashLeft = new THREE.Mesh(dashGeo, Materials.laneDivider);
    dashLeft.position.set(-LANE_WIDTH / 2, 0.03, z);
    const dashRight = new THREE.Mesh(dashGeo, Materials.laneDivider);
    dashRight.position.set(LANE_WIDTH / 2, 0.03, z);
    segment.add(dashLeft, dashRight);
  }

  // Overhead Neon Speed Tunnel Arch (Framing the runner's speed and flow)
  const archGeo = new THREE.TorusGeometry(8.5, 0.1, 6, 24, Math.PI);
  const archMesh = new THREE.Mesh(archGeo, Materials.tunnelArch);
  archMesh.position.set(0, 0, -length / 2);
  segment.add(archMesh);

  // Subway Side Walls with Graffiti & Lights
  const wallGeo = new THREE.BoxGeometry(0.5, 6, length);
  const wallLeft = new THREE.Mesh(wallGeo, Materials.subwayWall);
  wallLeft.position.set(-8.5, 3, 0);
  const wallRight = new THREE.Mesh(wallGeo, Materials.subwayWall);
  wallRight.position.set(8.5, 3, 0);
  segment.add(wallLeft, wallRight);

  // Overhead Catenary Power Wire Gantry (Subway infrastructure across tracks)
  const gantryBarGeo = new THREE.BoxGeometry(17, 0.25, 0.35);
  const gantryBar = new THREE.Mesh(gantryBarGeo, Materials.barrierPost);
  gantryBar.position.set(0, 5.4, -length / 4);
  segment.add(gantryBar);

  // Yellow Safety Platform Warning Strips along both track walls
  const safetyGeo = new THREE.PlaneGeometry(0.3, length);
  safetyGeo.rotateX(-Math.PI / 2);
  const safetyLeft = new THREE.Mesh(safetyGeo, Materials.cautionStripe);
  safetyLeft.position.set(-8.2, 0.04, 0);
  const safetyRight = new THREE.Mesh(safetyGeo, Materials.cautionStripe);
  safetyRight.position.set(8.2, 0.04, 0);
  segment.add(safetyLeft, safetyRight);

  // Glowing Subway Billboards mounted to walls
  const boardGeo = new THREE.PlaneGeometry(4.8, 2.4);
  const boardFrameGeo = new THREE.BoxGeometry(0.12, 2.6, 5.0);

  // Left wall billboard (facing inward)
  const bFrameL = new THREE.Mesh(boardFrameGeo, Materials.barrierPost);
  bFrameL.position.set(-8.2, 3.2, -length / 3);
  const bMeshL = new THREE.Mesh(boardGeo, Materials.billboardSurf);
  bMeshL.rotateY(Math.PI / 2);
  bMeshL.position.set(-8.12, 3.2, -length / 3);
  segment.add(bFrameL, bMeshL);

  // Right wall billboard (facing inward)
  const bFrameR = new THREE.Mesh(boardFrameGeo, Materials.barrierPost);
  bFrameR.position.set(8.2, 3.2, length / 4);
  const bMeshR = new THREE.Mesh(boardGeo, Materials.billboardMetro);
  bMeshR.rotateY(-Math.PI / 2);
  bMeshR.position.set(8.12, 3.2, length / 4);
  segment.add(bFrameR, bMeshR);

  return segment;
}
