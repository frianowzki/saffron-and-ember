// Overcooked 2 style 3D Mediterranean Bistro diorama: PBR textures, dining room tables & candles,
// stove flame rings, flowing sink water + soap bubbles, boiling pot bubbles, 3D thrown items, and dual HD chefs.

import * as THREE from 'three';
import {
  CANVAS_H,
  CANVAS_W,
  CHOP_DURATION,
  GRID_COLS,
  GRID_ROWS,
  KITCHEN_ORIGIN_X,
  KITCHEN_ORIGIN_Y,
  SEAR_PERFECT_END,
  SEAR_PERFECT_START,
  SIMMER_DONE_TIME,
  TILE_SIZE,
} from './config.js';
import { INGREDIENTS } from './recipes.js';
import { buildHDChefRig } from './chef3d.js';
import { buildFoodMesh, buildRawMesh } from './meshFood.js';
import { createKitchenTextures } from './textures3d.js';
import { applyVenueAtmosphere, buildVenueEnvironment, getVenueFloorMaterials } from './venues3d.js';

const CELL = 1.0;

export function createKitchen3D(canvas, state) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setSize(CANVAS_W, CANVAS_H, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a1d15);
  scene.fog = new THREE.Fog(0x2a1d15, 22, 42);

  // Dynamic Overcooked 2 angled 3/4 overhead camera framing the kitchen + dining room edges
  const camera = new THREE.PerspectiveCamera(35, CANVAS_W / CANVAS_H, 0.5, 65);
  const baseCamPos = new THREE.Vector3(0, 9.25, 9.8);
  const baseLookAt = new THREE.Vector3(0, 0.15, -0.35);
  camera.position.copy(baseCamPos);
  camera.lookAt(baseLookAt);

  // Warm Mediterranean studio lighting
  const hemi = new THREE.HemisphereLight(0xfff2d9, 0x4a3020, 0.96);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe7bd, 1.7);
  sun.position.set(-7.5, 13.5, 6.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10.5;
  sun.shadow.camera.right = 10.5;
  sun.shadow.camera.top = 8.5;
  sun.shadow.camera.bottom = -8.5;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0x95c0de, 0.34);
  fillLight.position.set(8, 7, -6);
  scene.add(fillLight);

  const hearthLight = new THREE.PointLight(0xff6b24, 3.0, 9.0);
  hearthLight.position.set(-3.0, 1.5, 3.0);
  scene.add(hearthLight);

  const passLight = new THREE.PointLight(0xffd26b, 2.8, 8.0);
  passLight.position.set(5.4, 2.4, -2.0);
  scene.add(passLight);

  // Warm flickering candlelight over the bistro dining room tables
  const dinerCandleLight = new THREE.PointLight(0xffb84d, 2.0, 6.5);
  dinerCandleLight.position.set(7.6, 1.4, 0);
  scene.add(dinerCandleLight);

  const textures = createKitchenTextures();
  const kitchenGroup = new THREE.Group();
  scene.add(kitchenGroup);

  const stationNodes = new Map();
  let venueAnim = { waves: [], palms: [], lanterns: [] };
  const focusRing = buildFocusRing();
  focusRing.visible = false;
  scene.add(focusRing);

  const chefRigs = {
    marco: buildHDChefRig('marco'),
    sofia: buildHDChefRig('sofia'),
  };
  scene.add(chefRigs.marco.root, chefRigs.sofia.root);

  const particleGroup = new THREE.Group();
  scene.add(particleGroup);

  const thrownGroup = new THREE.Group();
  scene.add(thrownGroup);

  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.45);
  const hitPoint = new THREE.Vector3();

  function gridToWorld3D(col, row) {
    return {
      x: (col - (GRID_COLS - 1) / 2) * CELL,
      z: (row - (GRID_ROWS - 1) / 2) * CELL,
    };
  }

  function simPosToWorld3D(simX, simY) {
    const colF = (simX - KITCHEN_ORIGIN_X) / TILE_SIZE - 0.5;
    const rowF = (simY - KITCHEN_ORIGIN_Y) / TILE_SIZE - 0.5;
    return {
      x: (colF - (GRID_COLS - 1) / 2) * CELL,
      z: (rowF - (GRID_ROWS - 1) / 2) * CELL,
    };
  }

  function rebuildKitchen(stations, venueId = state.venueId || 'beach') {
    while (kitchenGroup.children.length > 0) {
      kitchenGroup.remove(kitchenGroup.children[0]);
    }
    stationNodes.clear();

    applyVenueAtmosphere(venueId, {
      scene,
      hemi,
      sun,
      fillLight,
      hearthLight,
      passLight,
      dinerCandleLight,
    });

    const floorMats = getVenueFloorMaterials(venueId, textures);

    // Raised kitchen plinth styled per venue
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_COLS + 0.7, 0.36, GRID_ROWS + 0.7),
      floorMats.plinth,
    );
    plinth.position.y = -0.2;
    plinth.receiveShadow = true;
    kitchenGroup.add(plinth);

    // Venue-themed kitchen floor tiles
    const tileGeo = new THREE.BoxGeometry(0.98, 0.06, 0.98);

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const pos = gridToWorld3D(c, r);
        const tile = new THREE.Mesh(tileGeo, (r + c) % 2 === 0 ? floorMats.tileA : floorMats.tileB);
        tile.position.set(pos.x, -0.01, pos.z);
        tile.receiveShadow = true;
        kitchenGroup.add(tile);
      }
    }

    venueAnim = buildVenueEnvironment(venueId, kitchenGroup, textures, buildBistroRoomEnvironment);

    for (const st of stations) {
      const node = buildStationNode(st, textures);
      const pos = gridToWorld3D(st.col, st.row);
      node.root.position.set(pos.x, 0, pos.z);
      kitchenGroup.add(node.root);
      stationNodes.set(st.id, node);
    }
  }

  function syncState(simState, time) {
    hearthLight.intensity = 2.6 + Math.sin(time * 10.5) * 0.45;
    dinerCandleLight.intensity = 1.85 + Math.sin(time * 7.2) * 0.25;

    // Animate venue atmosphere (ocean waves, coastal palms, swaying market lanterns)
    for (const w of venueAnim.waves) {
      w.mesh.position.x = w.baseX + Math.sin(time * 1.4 + w.phase) * 0.55;
      w.mesh.position.y = w.baseY + Math.sin(time * 2.3 + w.phase) * 0.03;
    }
    for (const p of venueAnim.palms) {
      p.crown.rotation.z = Math.sin(time * 1.6 + p.phase) * 0.07;
      p.crown.rotation.x = Math.cos(time * 1.2 + p.phase) * 0.04;
    }
    for (const l of venueAnim.lanterns) {
      l.mesh.rotation.z = Math.sin(time * 2.1 + l.phase) * 0.085;
    }

    // Apply live Chef Customization to Marco's 3D rig
    if (simState.activeCust && chefRigs.marco?.applyStyle) {
      chefRigs.marco.applyStyle(
        simState.activeCust.hat.id,
        simState.activeCust.color.scarf,
        simState.activeCust.color.apron,
      );
    }

    if (simState.mode === 'title') {
      camera.position.set(Math.sin(time * 0.35) * 1.1, 9.1, 9.9 + Math.cos(time * 0.35) * 0.35);
      camera.lookAt(0.2, 0.3, -0.4);
    } else if (simState.particles.shakeTime > 0) {
      const amt = simState.particles.shakePower * 0.022;
      camera.position.set(baseCamPos.x + (Math.random() - 0.5) * amt, baseCamPos.y + (Math.random() - 0.5) * amt, baseCamPos.z);
      camera.lookAt(baseLookAt);
    } else {
      camera.position.copy(baseCamPos);
      camera.lookAt(baseLookAt);
    }

    // Sync BOTH Overcooked 2 style HD Chefs (Marco & Sofia)
    for (const chefData of simState.chefs) {
      const rig = chefRigs[chefData.variant];
      if (!rig) continue;
      const isActive = chefData === simState.chef;
      const pos = simPosToWorld3D(chefData.x, chefData.y);
      const moving = Math.hypot(
        chefData.path.length > 0 ? 1 : 0,
        isActive ? Math.abs(simState.input.moveX) + Math.abs(simState.input.moveY) : 0,
      ) > 0.01;
      const stride = moving ? Math.sin(chefData.walkCycle) : 0;
      const bob = Math.abs(stride) * 0.075;

      rig.root.position.set(pos.x, 0, pos.z);
      rig.root.rotation.y = Math.atan2(chefData.facingX, chefData.facingY);
      rig.upperBody.position.y = 0.24 + bob + Math.sin(time * 3.4 + (isActive ? 0 : 2)) * 0.014;

      rig.leftLeg.rotation.x = stride * 0.7;
      rig.rightLeg.rotation.x = -stride * 0.7;
      rig.toqueGroup.rotation.x = -stride * 0.1;

      // Natural blinking every ~3.5 seconds
      const blinkPhase = (time + (isActive ? 0 : 1.7)) % 3.6;
      rig.eyesGroup.scale.y = blinkPhase > 3.46 ? 0.12 : 1.0;

      const dashSquash = chefData.dashTimer > 0 ? 1.15 : 1.0;
      rig.root.scale.set(1 / Math.sqrt(dashSquash), dashSquash, 1 / Math.sqrt(dashSquash));

      const chopping = chefData.chopAnim > 0;
      const chopWave = chopping ? Math.sin(time * 38) * 0.72 : 0;
      rig.handKnife.visible = chopping && !chefData.holding;

      if (chefData.holding) {
        rig.leftArm.rotation.x = -1.28;
        rig.rightArm.rotation.x = -1.28;
      } else if (chopping) {
        rig.rightArm.rotation.x = -1.08 + chopWave;
        rig.leftArm.rotation.x = -0.82;
      } else {
        rig.leftArm.rotation.x = -stride * 0.58;
        rig.rightArm.rotation.x = stride * 0.58;
      }

      rig.activeRing.visible = isActive && simState.mode === 'playing';
      syncItemSlot(rig.holdSlot, chefData.holding, `chef_${chefData.variant}`);
    }

    // Sync stations: stove flames, sink faucet water + bubbles, chopping bounce, pot boil, fire hazards!
    for (const st of simState.stations) {
      const node = stationNodes.get(st.id);
      if (!node) continue;

      let displayItem = st.item;
      if (st.item) {
        if (st.burnt) {
          displayItem = { kind: 'burnt', id: st.item.id, burnt: true };
        } else if ((st.type === 'grill' || st.type === 'oven') && st.item.kind === 'raw' && st.cookTime >= SEAR_PERFECT_START) {
          displayItem = {
            kind: 'prepared',
            id: INGREDIENTS[st.item.id].result,
            perfect: st.cookTime <= SEAR_PERFECT_END,
          };
        } else if (st.type === 'pot' && st.item.kind === 'raw' && st.cookTime >= SIMMER_DONE_TIME) {
          displayItem = {
            kind: 'prepared',
            id: INGREDIENTS[st.item.id].result,
            perfect: true,
          };
        }
      }
      syncItemSlot(node.itemSlot, displayItem, st.id);

      // Chopping squash/bounce animation on the maple board
      if (st.type === 'chop' && st.item && st.item.kind === 'raw' && st.progress > 0) {
        const chopRatio = Math.min(1, st.progress / CHOP_DURATION);
        const pulse = 1 + Math.abs(Math.sin(time * 28)) * 0.14;
        node.itemSlot.scale.set(pulse, 1 - chopRatio * 0.35, pulse);
      } else {
        node.itemSlot.scale.set(1, 1, 1);
      }

      if (node.knife) {
        const activeChop = st.type === 'chop' && st.item && st.item.kind === 'raw' && st.progress > 0;
        node.knife.visible = !activeChop;
      }

      // Live dancing burner flame ring on active grills & pots!
      if (node.burnerFlames) {
        const cooking = Boolean(st.item) && !st.onFire;
        node.burnerFlames.visible = cooking;
        if (cooking) {
          node.burnerFlames.rotation.y = time * 4.5 + st.col;
          const flick = 0.88 + Math.sin(time * 24 + st.col) * 0.22;
          node.burnerFlames.scale.set(1, flick, 1);
        }
      }

      if (node.emberMat) {
        node.emberMat.emissiveIntensity = st.onFire ? 2.8 : st.item ? 1.8 + Math.sin(time * 14 + st.col) * 0.5 : 0.75;
      }

      if (node.flameGroup) {
        node.flameGroup.visible = Boolean(st.onFire);
        if (st.onFire) {
          node.flameGroup.rotation.y = time * 7;
          const sc = 0.9 + Math.sin(time * 24) * 0.24;
          node.flameGroup.scale.set(1, sc, 1);
        }
      }

      // Animated boiling pot bubbles & broth level (cleanly above pot interior, zero Z-fighting)
      if (node.brothMesh) {
        node.brothMesh.position.y = 1.148 + Math.sin(time * 5 + st.col) * 0.005;
        node.brothMesh.material.color.setHex(st.burnt ? 0x2e241f : st.item ? 0xf2ad2e : 0x8cd9ed);
      }
      if (node.boilBubbles) {
        const boiling = Boolean(st.item) && !st.burnt;
        node.boilBubbles.visible = boiling;
        if (boiling) {
          node.boilBubbles.children.forEach((b, idx) => {
            const p = (time * 2.4 + idx * 0.33) % 1;
            b.position.y = 1.13 + p * 0.14;
            b.scale.setScalar(0.5 + Math.sin(p * Math.PI) * 0.9);
          });
        }
      }

      // Animated flowing faucet water stream + floating soap bubbles at Wash Sink!
      if (node.waterStream) {
        const washing = Boolean(st.isWashing || st.washProgress > 0);
        node.waterStream.visible = washing;
        if (washing) {
          const wobble = 0.9 + Math.sin(time * 28) * 0.12;
          node.waterStream.scale.set(wobble, 1, wobble);
        }
      }
      if (node.soapBubbles) {
        const washing = Boolean(st.isWashing || st.washProgress > 0 || st.dirtyCount > 0);
        node.soapBubbles.visible = washing;
        if (washing) {
          node.soapBubbles.children.forEach((b, idx) => {
            const p = (time * 1.4 + idx * 0.25) % 1;
            b.position.y = 0.95 + p * 0.45;
            b.position.x = -0.05 + Math.sin(time * 3 + idx * 2) * 0.14;
            b.scale.setScalar(0.65 + Math.sin(p * Math.PI) * 0.75);
          });
        }
      }

      if (node.plateMeshes) {
        node.plateMeshes.forEach((m, idx) => {
          m.visible = idx < st.plateCount;
        });
      }

      if (node.dirtyMeshes) {
        node.dirtyMeshes.forEach((m, idx) => {
          m.visible = idx < st.dirtyCount;
        });
      }

      if (node.extinguisherMesh) {
        const carried = simState.chefs.some((c) => c.holding?.kind === 'extinguisher');
        node.extinguisherMesh.visible = !carried;
      }
    }

    // Sync 3D parabolic thrown ingredients
    syncThrownItems3D(thrownGroup, simState.thrownItems, simPosToWorld3D);

    const activeStation = simState.hoveredStation || simState.chef.facingStation;
    if (activeStation && simState.mode === 'playing') {
      const pos = gridToWorld3D(activeStation.col, activeStation.row);
      focusRing.visible = true;
      focusRing.position.set(pos.x, 0.9, pos.z);
    } else {
      focusRing.visible = false;
    }

    syncParticles3D(particleGroup, simState.particles.particles, simPosToWorld3D);
    renderer.render(scene, camera);
  }

  function projectStationTop(col, row, yHeight = 1.35) {
    const pos = gridToWorld3D(col, row);
    const v = new THREE.Vector3(pos.x, yHeight, pos.z);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * CANVAS_W,
      y: (-v.y * 0.5 + 0.5) * CANVAS_H,
    };
  }

  function projectSimPos(simX, simY, yHeight = 1.45) {
    const pos = simPosToWorld3D(simX, simY);
    const v = new THREE.Vector3(pos.x, yHeight, pos.z);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * CANVAS_W,
      y: (-v.y * 0.5 + 0.5) * CANVAS_H,
    };
  }

  function pickTileAtScreen(canvasX, canvasY) {
    const ndcX = (canvasX / CANVAS_W) * 2 - 1;
    const ndcY = -(canvasY / CANVAS_H) * 2 + 1;
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return null;
    const col = Math.round(hitPoint.x / CELL + (GRID_COLS - 1) / 2);
    const row = Math.round(hitPoint.z / CELL + (GRID_ROWS - 1) / 2);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  rebuildKitchen(state.stations);

  return {
    rebuildKitchen,
    syncState,
    projectStationTop,
    projectSimPos,
    pickTileAtScreen,
  };
}

function buildBistroRoomEnvironment(group, textures) {
  const wallZ = -(GRID_ROWS / 2) - 0.16;

  // Mediterranean plaster & brick back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(GRID_COLS + 0.9, 2.5, 0.24),
    new THREE.MeshStandardMaterial({ map: textures.plaster, roughness: 0.85 }),
  );
  backWall.position.set(0, 1.25, wallZ);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Hand-painted Mediterranean Azulejo ceramic tile backsplash along lower back wall
  const brickBase = new THREE.Mesh(
    new THREE.BoxGeometry(GRID_COLS + 0.92, 1.32, 0.26),
    new THREE.MeshStandardMaterial({ map: textures.azulejo, roughness: 0.36 }),
  );
  brickBase.position.set(0, 0.72, wallZ + 0.01);
  brickBase.receiveShadow = true;
  group.add(brickBase);

  // Left timber wainscoting wall with sunlit Mediterranean window glow
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 2.3, GRID_ROWS + 0.8),
    new THREE.MeshStandardMaterial({ map: textures.plaster, roughness: 0.85 }),
  );
  leftWall.position.set(-(GRID_COLS / 2) - 0.34, 1.15, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const windowGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.05, 2.3),
    new THREE.MeshBasicMaterial({ color: 0xffefc9 }),
  );
  windowGlow.position.set(-(GRID_COLS / 2) - 0.2, 1.65, -0.5);
  group.add(windowGlow);

  // Mediterranean wooden window mullions & sunlit herb planter box
  const frameMat = new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.6 });
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.08, 0.07), frameMat);
  mullionV.position.set(-(GRID_COLS / 2) - 0.18, 1.65, -0.5);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 2.34), frameMat);
  mullionH.position.set(-(GRID_COLS / 2) - 0.18, 1.65, -0.5);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 2.5), frameMat);
  sill.position.set(-(GRID_COLS / 2) - 0.15, 1.12, -0.5);
  group.add(mullionV, mullionH, sill);

  // Terracotta basil herb planter on window sill
  const planter = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.68),
    new THREE.MeshStandardMaterial({ color: 0xb85832, roughness: 0.8 }),
  );
  planter.position.set(-(GRID_COLS / 2) - 0.14, 1.24, -0.5);
  group.add(planter);
  const basilMat = new THREE.MeshStandardMaterial({ color: 0x3b964e, roughness: 0.65 });
  for (let i = -2; i <= 2; i++) {
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), basilMat);
    tuft.position.set(-(GRID_COLS / 2) - 0.14, 1.36, -0.5 + i * 0.12);
    group.add(tuft);
  }

  // Diagonal warm sunlight shaft projected softly onto kitchen floor
  const sunBeam = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.4),
    new THREE.MeshBasicMaterial({ color: 0xffe9b5, transparent: true, opacity: 0.11, depthWrite: false }),
  );
  sunBeam.rotation.x = -Math.PI / 2;
  sunBeam.position.set(-3.4, 0.03, -0.3);
  group.add(sunBeam);

  // Overhead warm bistro fairy string lights draped across back wall
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe494 });
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const lx = -5.6 + t * 11.2;
    const sag = Math.sin(t * Math.PI) * 0.28;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), bulbMat);
    bulb.position.set(lx, 2.38 - sag, wallZ + 0.18);
    group.add(bulb);
  }

  // Walnut floating shelf with olive oil bottles & spice crocks
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.1, 0.36),
    new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.6 }),
  );
  shelf.position.set(-2.2, 1.78, wallZ + 0.25);
  shelf.castShadow = true;
  group.add(shelf);

  const bottleColors = [0x4c7a34, 0xd49622, 0xb83824, 0x3b6e4c, 0xe0a229];
  bottleColors.forEach((col, i) => {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.38, 10),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.2, metalness: 0.1 }),
    );
    bottle.position.set(-4.3 + i * 0.52, 2.02, wallZ + 0.25);
    bottle.castShadow = true;
    group.add(bottle);
  });

  // Brass hanging copper pan rack
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xe3b34c, roughness: 0.25, metalness: 0.82 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xc96b34, roughness: 0.26, metalness: 0.78 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 3.8, 10), brassMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(2.4, 1.96, wallZ + 0.2);
  group.add(rail);

  for (let i = 0; i < 4; i++) {
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.07, 16), copperMat);
    pan.rotation.x = Math.PI / 2;
    pan.position.set(1.05 + i * 0.86, 1.58, wallZ + 0.2);
    pan.castShadow = true;
    group.add(pan);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), brassMat);
    stem.position.set(1.05 + i * 0.86, 1.85, wallZ + 0.2);
    group.add(stem);
  }

  // Glowing Brass Pendant Heat Lamps with soft volumetric light cones over East Pass Window
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffdf8a,
    transparent: true,
    opacity: 0.11,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const lz of [-2.8, -1.8]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), new THREE.MeshStandardMaterial({ color: 0x1c1816 }));
    cord.position.set(5.45, 2.8, lz);
    group.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.28, 16, 1, true), brassMat);
    shade.position.set(5.45, 2.18, lz);
    group.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe49c }));
    bulb.position.set(5.45, 2.06, lz);
    group.add(bulb);
    const lightCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.55, 18, 1, true), coneMat);
    lightCone.position.set(5.45, 1.32, lz);
    group.add(lightCone);
  }

  // Hanging Mediterranean garlic braid & red chili ristra on back wall
  const garlicMat = new THREE.MeshStandardMaterial({ color: 0xf7eed8, roughness: 0.5 });
  const chiliMat = new THREE.MeshStandardMaterial({ color: 0xcc2b1f, roughness: 0.35 });
  for (let i = 0; i < 4; i++) {
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), garlicMat);
    gBulb.position.set(-5.25 + (i % 2) * 0.06, 2.05 - i * 0.14, wallZ + 0.18);
    group.add(gBulb);
    const chili = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), chiliMat);
    chili.rotation.x = Math.PI;
    chili.position.set(-4.85 + (i % 2) * 0.05, 2.05 - i * 0.13, wallZ + 0.18);
    group.add(chili);
  }

  // Bistro Dining Room Tables with chairs, wine glasses, candles & seated 3D diners!
  const dinerOutfits = [0x3d5a80, 0x9e3b46];
  [-1.4, 1.4].forEach((tz, ti) => {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(7.6, -0.35, tz);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x3b2517 }));
    leg.position.y = 0.45;
    tableGroup.add(leg);

    const cloth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.78, 0.14, 18),
      new THREE.MeshStandardMaterial({ color: 0xd94832, roughness: 0.8 }),
    );
    cloth.position.y = 0.92;
    cloth.castShadow = true;
    tableGroup.add(cloth);

    const runner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.15, 18),
      new THREE.MeshStandardMaterial({ color: 0xf7efe0, roughness: 0.75 }),
    );
    runner.position.y = 0.925;
    tableGroup.add(runner);

    // Tabletop candle + wine bottle + served plate
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xfff8e6 }));
    candle.position.set(0, 1.07, 0);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd24c }));
    flame.position.set(0, 1.19, 0);
    const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x2f542a, roughness: 0.25 }));
    wine.position.set(-0.24, 1.12, -0.18);
    const dinerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.25 }));
    dinerPlate.position.set(0.28, 1.01, 0.15);
    tableGroup.add(candle, flame, wine, dinerPlate);

    // Seated 3D bistro guest on wooden chair facing the table!
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x4d301e, roughness: 0.7 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), chairMat);
    seat.position.set(0.95, 0.52, 0.1);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.42), chairMat);
    back.position.set(1.14, 0.85, 0.1);
    tableGroup.add(seat, back);

    const guestTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.48, 12),
      new THREE.MeshStandardMaterial({ color: dinerOutfits[ti % dinerOutfits.length], roughness: 0.65 }),
    );
    guestTorso.position.set(0.92, 0.82, 0.1);
    guestTorso.castShadow = true;
    const guestHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 14, 12),
      new THREE.MeshStandardMaterial({ color: ti === 0 ? 0xf2c59d : 0xdba57e, roughness: 0.5 }),
    );
    guestHead.position.set(0.9, 1.22, 0.1);
    guestHead.castShadow = true;
    const guestHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: ti === 0 ? 0x3b2618 : 0x241a15, roughness: 0.7 }),
    );
    guestHair.position.set(0.9, 1.24, 0.1);
    tableGroup.add(guestTorso, guestHead, guestHair);

    group.add(tableGroup);
  });
}

function buildBurnerFlamesRing() {
  const ring = new THREE.Group();
  const blueMat = new THREE.MeshBasicMaterial({ color: 0x3ba8ff, transparent: true, opacity: 0.85 });
  const orangeMat = new THREE.MeshBasicMaterial({ color: 0xff8c24, transparent: true, opacity: 0.9 });

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    const r = 0.34;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 6), i % 2 === 0 ? orangeMat : blueMat);
    f.position.set(Math.cos(a) * r, 0.09, Math.sin(a) * r);
    ring.add(f);
  }
  ring.visible = false;
  return ring;
}

function buildStationNode(st, textures) {
  const root = new THREE.Group();
  const isMarble = st.surface === 'marble' || st.type === 'plates' || st.type === 'sink' || st.type === 'dirty_return';

  const bodyMat =
    st.type === 'pass'
      ? new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.65 })
      : st.type === 'grill' || st.type === 'pot'
        ? new THREE.MeshStandardMaterial({ color: 0x262120, roughness: 0.7 })
        : isMarble
          ? new THREE.MeshStandardMaterial({ color: 0xd6cec0, roughness: 0.55 })
          : new THREE.MeshStandardMaterial({ map: textures.oak, roughness: 0.68 });

  const topMat =
    st.type === 'pass'
      ? new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.5 })
      : st.type === 'grill'
        ? new THREE.MeshStandardMaterial({ color: 0x1c1918, roughness: 0.58, metalness: 0.38 })
        : st.type === 'pot'
          ? new THREE.MeshStandardMaterial({ color: 0x3b2b22, roughness: 0.6 })
          : isMarble
            ? new THREE.MeshStandardMaterial({ map: textures.marble, roughness: 0.25 })
            : new THREE.MeshStandardMaterial({ map: textures.oak, roughness: 0.55 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 0.95), bodyMat);
  base.position.y = 0.39;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.04, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xe3b34c, roughness: 0.25, metalness: 0.8 }),
  );
  handle.position.set(0, 0.56, 0.48);
  root.add(handle);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.99, 0.1, 0.99), topMat);
  slab.position.y = 0.83;
  slab.castShadow = true;
  slab.receiveShadow = true;
  root.add(slab);

  const itemSlot = new THREE.Group();
  itemSlot.position.y = 0.88;
  root.add(itemSlot);

  let knife = null;
  let emberMat = null;
  let burnerFlames = null;
  let flameGroup = null;
  let brothMesh = null;
  let boilBubbles = null;
  let waterStream = null;
  let soapBubbles = null;
  let plateMeshes = null;
  let dirtyMeshes = null;
  let extinguisherMesh = null;

  if (st.type === 'fridge') {
    // Tall stainless-steel Produce Fridge with glass front & visible colorful produce shelves!
    const steel = new THREE.MeshStandardMaterial({ color: 0xd5dfe6, roughness: 0.25, metalness: 0.72 });
    const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.38, 0.88), steel);
    fridgeBody.position.y = 0.72;
    fridgeBody.castShadow = true;
    root.add(fridgeBody);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.86, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xd9f5ff, transparent: true, opacity: 0.55 }),
    );
    glass.position.set(0, 0.82, 0.44);
    root.add(glass);

    // Colorful produce bins glowing inside the fridge window
    const shelfCols = [0xd93829, 0x3ba852, 0xf0a818];
    shelfCols.forEach((col, i) => {
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.06), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }));
      bin.position.set(0, 0.56 + i * 0.24, 0.42);
      root.add(bin);
    });
  } else if (st.type === 'freezer') {
    // Frosted ice-blue Chest Freezer for meats & seafood!
    const frostMat = new THREE.MeshStandardMaterial({ color: 0xbad9eb, roughness: 0.3, metalness: 0.35 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.92), frostMat);
    lid.position.y = 0.96;
    lid.castShadow = true;
    const frostTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.05, 0.86),
      new THREE.MeshBasicMaterial({ color: 0xe8f9ff }),
    );
    frostTrim.position.y = 1.05;
    const handleBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x456073, metalness: 0.75, roughness: 0.25 }),
    );
    handleBar.position.set(0.34, 1.08, 0);
    root.add(lid, frostTrim, handleBar);
  } else if (st.type === 'pantry') {
    // Warm Oak Artisan Pantry cabinet with dry goods & saffron jars on top!
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.18, 0.86),
      new THREE.MeshStandardMaterial({ map: textures.oak, roughness: 0.6 }),
    );
    cab.position.y = 0.62;
    cab.castShadow = true;
    const jar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.24, 10), new THREE.MeshStandardMaterial({ color: 0xf08c18, roughness: 0.25 }));
    jar1.position.set(-0.2, 1.32, 0);
    const dough = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf2dfc0, roughness: 0.8 }));
    dough.scale.set(1.1, 0.7, 1.1);
    dough.position.set(0.18, 1.29, 0.04);
    root.add(cab, jar1, dough);
  } else if (st.type === 'oven') {
    // Domed Mediterranean Brick Wood-Fired Oven with glowing hearth chamber!
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      new THREE.MeshStandardMaterial({ map: textures.brick, roughness: 0.82 }),
    );
    dome.position.y = 0.88;
    dome.castShadow = true;
    root.add(dome);

    const archGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14, 1, false, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xff7b24 }),
    );
    archGlow.rotation.z = Math.PI / 2;
    archGlow.rotation.y = Math.PI / 2;
    archGlow.position.set(0, 0.96, -0.38);
    root.add(archGlow);

    emberMat = new THREE.MeshStandardMaterial({ color: 0xff621f, emissive: 0xff4800, emissiveIntensity: 1.2 });
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.34, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b2a22, roughness: 0.7 }),
    );
    chimney.position.set(0, 1.38, 0.12);
    root.add(chimney);
    itemSlot.position.y = 0.96;
  } else if (st.type === 'crate') {
    const crateBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.22, 0.78),
      new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.85 }),
    );
    crateBox.position.y = 0.94;
    crateBox.castShadow = true;
    root.add(crateBox);

    const offsets = [[-0.14, 1.0, -0.1], [0.15, 1.0, -0.08], [0, 1.05, 0.12]];
    for (const [ox, oy, oz] of offsets) {
      const p = new THREE.Group();
      buildRawMesh(p, st.ingredientId);
      p.scale.setScalar(0.78);
      p.position.set(ox, oy, oz);
      root.add(p);
    }
  } else if (st.type === 'chop') {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.07, 0.58),
      new THREE.MeshStandardMaterial({ map: textures.oak, color: 0xf5dbb2, roughness: 0.58 }),
    );
    board.position.y = 0.9;
    board.receiveShadow = true;
    root.add(board);

    knife = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.14, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xe3eaef, roughness: 0.18, metalness: 0.88 }),
    );
    blade.position.set(0.24, 0.06, -0.05);
    knife.add(blade);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.06, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.7 }),
    );
    grip.position.set(0.24, 0.06, 0.18);
    knife.add(grip);
    knife.position.y = 0.9;
    root.add(knife);
    itemSlot.position.y = 0.93;
  } else if (st.type === 'grill') {
    emberMat = new THREE.MeshStandardMaterial({
      color: 0xff5a1f,
      emissive: 0xff4500,
      emissiveIntensity: 0.95,
      roughness: 0.55,
    });
    const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 18), emberMat);
    embers.position.y = 0.89;
    root.add(embers);

    const grate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.74, 0.74),
      new THREE.MeshStandardMaterial({ map: textures.grate, transparent: true, roughness: 0.5, metalness: 0.72 }),
    );
    grate.rotation.x = -Math.PI / 2;
    grate.position.y = 0.93;
    root.add(grate);

    // Cast-iron skillet pan handle protruding toward the chef
    const panHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x221f1e, roughness: 0.4, metalness: 0.75 }),
    );
    panHandle.position.set(0, 0.94, -0.42);
    root.add(panHandle);

    // Live gas/charcoal burner flame ring when cooking!
    burnerFlames = buildBurnerFlamesRing();
    burnerFlames.position.y = 0.92;
    root.add(burnerFlames);

    // Big 3D grease fire hazard if overcooked!
    flameGroup = new THREE.Group();
    flameGroup.position.y = 0.95;
    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.72, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4d00, transparent: true, opacity: 0.88 }),
    );
    outerFlame.position.y = 0.34;
    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.48, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe44d }),
    );
    innerFlame.position.y = 0.24;
    flameGroup.add(outerFlame, innerFlame);
    flameGroup.visible = false;
    root.add(flameGroup);

    itemSlot.position.y = 0.94;
  } else if (st.type === 'pot') {
    burnerFlames = buildBurnerFlamesRing();
    burnerFlames.position.y = 0.88;
    root.add(burnerFlames);

    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97a3e, roughness: 0.26, metalness: 0.72 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xe8bc55, roughness: 0.22, metalness: 0.85 });

    // Gleaming copper pot outer body (top at y=1.12)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.31, 0.26, 22), copperMat);
    pot.position.y = 0.99;
    pot.castShadow = true;
    root.add(pot);

    // Metallic brass rim (y=1.16) + two curved side loop handles
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.025, 8, 24), brassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.16;
    root.add(rim);

    for (const sx of [-1, 1]) {
      const potHandle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 14, Math.PI), brassMat);
      potHandle.rotation.z = sx * (-Math.PI / 2);
      potHandle.position.set(sx * 0.35, 1.04, 0);
      root.add(potHandle);
    }

    // Recessed dark steel pot interior (top at y=1.132)
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.318, 0.30, 0.02, 20),
      new THREE.MeshStandardMaterial({ color: 0x3b3330, roughness: 0.45, metalness: 0.55 }),
    );
    inner.position.y = 1.122;
    root.add(inner);

    // Translucent simmering water / golden broth surface cleanly above interior (y=1.148)
    brothMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.012, 20),
      new THREE.MeshStandardMaterial({
        color: 0x8cd9ed,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.72,
      }),
    );
    brothMesh.position.y = 1.148;
    root.add(brothMesh);

    boilBubbles = new THREE.Group();
    const bMat = new THREE.MeshBasicMaterial({ color: 0xfff8d9, transparent: true, opacity: 0.78 });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI * 2) / 4;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), bMat);
      b.position.set(Math.cos(a) * 0.15, 1.15, Math.sin(a) * 0.15);
      boilBubbles.add(b);
    }
    boilBubbles.visible = false;
    root.add(boilBubbles);

    itemSlot.position.y = 1.11;
  } else if (st.type === 'plates') {
    plateMeshes = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.25, 0.045, 18),
        new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.22 }),
      );
      p.position.y = 0.9 + i * 0.055;
      p.castShadow = true;
      root.add(p);
      plateMeshes.push(p);
    }
  } else if (st.type === 'dirty_return') {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.06, 0.76),
      new THREE.MeshStandardMaterial({ color: 0x5c4a3e, roughness: 0.7 }),
    );
    tray.position.y = 0.9;
    root.add(tray);

    dirtyMeshes = [];
    for (let i = 0; i < 5; i++) {
      const dp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.31, 0.24, 0.045, 16),
        new THREE.MeshStandardMaterial({ color: 0xcabca8, roughness: 0.6 }),
      );
      dp.position.y = 0.95 + i * 0.055;
      dp.visible = false;
      root.add(dp);
      dirtyMeshes.push(dp);
    }
  } else if (st.type === 'sink') {
    const basin = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x4ca9cc, roughness: 0.16, metalness: 0.18 }),
    );
    basin.position.y = 0.87;
    root.add(basin);

    const chrome = new THREE.MeshStandardMaterial({ color: 0xe3ebf0, roughness: 0.16, metalness: 0.9 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.38, 10), chrome);
    pipe.position.set(0.28, 1.06, 0);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 10), chrome);
    spout.rotation.z = Math.PI / 2;
    spout.position.set(0.17, 1.23, 0);
    root.add(pipe, spout);

    // Translucent flowing 3D faucet water stream!
    waterStream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.052, 0.34, 10),
      new THREE.MeshBasicMaterial({ color: 0x99e6ff, transparent: true, opacity: 0.78 }),
    );
    waterStream.position.set(0.07, 1.06, 0);
    waterStream.visible = false;
    root.add(waterStream);

    // Rising iridescent 3D soap bubbles!
    soapBubbles = new THREE.Group();
    const sMat = new THREE.MeshBasicMaterial({ color: 0xd9f5ff, transparent: true, opacity: 0.82 });
    for (let i = 0; i < 6; i++) {
      const sb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), sMat);
      sb.position.set(-0.08 + (i % 3) * 0.08, 1.0 + i * 0.06, (i - 2.5) * 0.06);
      soapBubbles.add(sb);
    }
    soapBubbles.visible = false;
    root.add(soapBubbles);

    dirtyMeshes = [];
    for (let i = 0; i < 4; i++) {
      const dp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.21, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4c8b8, roughness: 0.5 }),
      );
      dp.position.set(-0.06, 0.94 + i * 0.045, 0);
      dp.visible = false;
      root.add(dp);
      dirtyMeshes.push(dp);
    }
  } else if (st.type === 'extinguisher') {
    extinguisherMesh = buildFoodMesh({ kind: 'extinguisher' });
    extinguisherMesh.position.y = 0.88;
    root.add(extinguisherMesh);
  } else if (st.type === 'pass') {
    const brass = new THREE.MeshStandardMaterial({ color: 0xe3b34c, roughness: 0.22, metalness: 0.85 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.1), brass);
    rail.position.set(0, 0.9, -0.36);
    root.add(rail);

    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      brass,
    );
    bell.position.set(0.18, 0.9, 0.18);
    bell.castShadow = true;
    root.add(bell);
  } else if (st.type === 'bin') {
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.1, 0.68),
      new THREE.MeshStandardMaterial({ color: 0x3a3734, roughness: 0.7 }),
    );
    rim.position.y = 0.9;
    root.add(rim);
    const hole = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.11, 0.54),
      new THREE.MeshStandardMaterial({ color: 0x171514, roughness: 0.95 }),
    );
    hole.position.y = 0.905;
    root.add(hole);
  }

  return {
    root,
    itemSlot,
    knife,
    emberMat,
    burnerFlames,
    flameGroup,
    brothMesh,
    boilBubbles,
    waterStream,
    soapBubbles,
    plateMeshes,
    dirtyMeshes,
    extinguisherMesh,
  };
}

function buildFocusRing() {
  const geo = new THREE.BoxGeometry(1.03, 0.06, 1.03);
  const edges = new THREE.EdgesGeometry(geo);
  return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffe066 }));
}

const slotSignatures = new Map();

function syncItemSlot(slot, item, key) {
  const sig = item
    ? `${item.kind}|${item.id ?? ''}|${item.recipeId ?? ''}|${item.perfect ? 1 : 0}|${item.burnt ? 1 : 0}|${(item.ingredients ?? []).join(',')}`
    : 'empty';
  if (slotSignatures.get(key) === sig) return;
  slotSignatures.set(key, sig);

  while (slot.children.length > 0) {
    slot.remove(slot.children[0]);
  }
  if (item) {
    slot.add(buildFoodMesh(item));
  }
}

function syncThrownItems3D(group, thrownItems, simPosToWorld3D) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  if (!thrownItems || thrownItems.length === 0) return;
  for (const proj of thrownItems) {
    const pos = simPosToWorld3D(proj.x, proj.y);
    const arcY = 0.95 + Math.sin(Math.min(1, proj.t) * Math.PI) * 1.15;
    const mesh = buildFoodMesh(proj.item);
    mesh.position.set(pos.x, arcY, pos.z);
    mesh.rotation.y = proj.t * 8;
    group.add(mesh);
  }
}

const steamGeo = new THREE.SphereGeometry(0.085, 8, 6);
const sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);

function syncParticles3D(group, particles, simPosToWorld3D) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  for (const p of particles) {
    const pos = simPosToWorld3D(p.x, p.y);
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    const mesh = new THREE.Mesh(
      p.kind === 'steam' ? steamGeo : sparkGeo,
      new THREE.MeshBasicMaterial({
        color: p.kind === 'steam' ? 0xfff8eb : new THREE.Color(p.color),
        transparent: true,
        opacity: alpha * (p.kind === 'steam' ? 0.5 : 0.95),
      }),
    );
    const height = p.kind === 'steam' ? 1.2 + (1 - alpha) * 0.95 : 1.05 + Math.sin(alpha * Math.PI) * 0.45;
    mesh.position.set(pos.x, height, pos.z);
    const s = p.kind === 'steam' ? 0.7 + (1 - alpha) * 1.45 : 0.9;
    mesh.scale.setScalar(s);
    group.add(mesh);
  }
}
