// 3D Venue & Environment catalog: Sunset Beachfront Pier (default), Spice Night Market,
// Luxury Sky Atrium Mall, and Heritage Mediterranean Bistro.

import * as THREE from 'three';
import { GRID_COLS, GRID_ROWS } from './config.js';

export const VENUES = [
  {
    id: 'beach',
    name: 'Sunset Pier',
    subtitle: 'Beachfront Boardwalk',
    badge: 'BEACH',
    accent: '#2ea8b8',
  },
  {
    id: 'market',
    name: 'Spice Bazaar',
    subtitle: 'Night Street Market',
    badge: 'MARKET',
    accent: '#e85d2a',
  },
  {
    id: 'mall',
    name: 'Sky Atrium',
    subtitle: 'Luxury Mall Food Court',
    badge: 'MALL',
    accent: '#5b8def',
  },
  {
    id: 'bistro',
    name: 'Heritage Bistro',
    subtitle: 'Courtyard Kitchen',
    badge: 'BISTRO',
    accent: '#d9a441',
  },
];

export function getVenueById(id) {
  return VENUES.find((v) => v.id === id) ?? VENUES[0];
}

export function applyVenueAtmosphere(venueId, lights) {
  const { scene, hemi, sun, fillLight, hearthLight, passLight, dinerCandleLight } = lights;
  if (venueId === 'beach') {
    scene.background = new THREE.Color(0xf2a66d);
    scene.fog = new THREE.Fog(0xf2a66d, 22, 46);
    hemi.color.setHex(0xfff4d6);
    hemi.groundColor.setHex(0x2c788a);
    hemi.intensity = 1.12;
    sun.color.setHex(0xffd28a);
    sun.intensity = 1.95;
    sun.position.set(-9.5, 11.5, 7.5);
    fillLight.color.setHex(0x52c4db);
    fillLight.intensity = 0.55;
    hearthLight.intensity = 2.4;
    passLight.color.setHex(0xffe08a);
    dinerCandleLight.color.setHex(0xffb652);
  } else if (venueId === 'market') {
    scene.background = new THREE.Color(0x16142b);
    scene.fog = new THREE.Fog(0x16142b, 20, 42);
    hemi.color.setHex(0xffc988);
    hemi.groundColor.setHex(0x281e3b);
    hemi.intensity = 0.88;
    sun.color.setHex(0xffb566);
    sun.intensity = 1.45;
    sun.position.set(-6.5, 12.5, 6.0);
    fillLight.color.setHex(0x7c6fd6);
    fillLight.intensity = 0.48;
    hearthLight.intensity = 3.2;
    passLight.color.setHex(0xffa83d);
    dinerCandleLight.color.setHex(0xff7733);
  } else if (venueId === 'mall') {
    scene.background = new THREE.Color(0xdbe8f5);
    scene.fog = new THREE.Fog(0xdbe8f5, 24, 48);
    hemi.color.setHex(0xffffff);
    hemi.groundColor.setHex(0xa8b5c4);
    hemi.intensity = 1.24;
    sun.color.setHex(0xfffaf0);
    sun.intensity = 1.65;
    sun.position.set(-5.0, 15.0, 6.0);
    fillLight.color.setHex(0xb8dcff);
    fillLight.intensity = 0.58;
    hearthLight.intensity = 2.2;
    passLight.color.setHex(0xfff1c9);
    dinerCandleLight.color.setHex(0xffe7b3);
  } else {
    scene.background = new THREE.Color(0x2a1d15);
    scene.fog = new THREE.Fog(0x2a1d15, 22, 42);
    hemi.color.setHex(0xfff2d9);
    hemi.groundColor.setHex(0x4a3020);
    hemi.intensity = 0.96;
    sun.color.setHex(0xffe7bd);
    sun.intensity = 1.7;
    sun.position.set(-7.5, 13.5, 6.5);
    fillLight.color.setHex(0x95c0de);
    fillLight.intensity = 0.34;
    hearthLight.intensity = 3.0;
    passLight.color.setHex(0xffd26b);
    dinerCandleLight.color.setHex(0xffb84d);
  }
}

export function getVenueFloorMaterials(venueId, textures) {
  if (venueId === 'beach') {
    return {
      tileA: new THREE.MeshStandardMaterial({ map: textures.floorLight, color: 0xf7ebd2, roughness: 0.55 }),
      tileB: new THREE.MeshStandardMaterial({ map: textures.oak, color: 0xd9b382, roughness: 0.62 }),
      plinth: new THREE.MeshStandardMaterial({ map: textures.oak, color: 0x9c6e44, roughness: 0.78 }),
    };
  }
  if (venueId === 'market') {
    return {
      tileA: new THREE.MeshStandardMaterial({ map: textures.floorLight, color: 0xe3c39d, roughness: 0.58 }),
      tileB: new THREE.MeshStandardMaterial({ map: textures.floorSage, color: 0xc29269, roughness: 0.6 }),
      plinth: new THREE.MeshStandardMaterial({ color: 0x453530, roughness: 0.85 }),
    };
  }
  if (venueId === 'mall') {
    return {
      tileA: new THREE.MeshStandardMaterial({ map: textures.marble, color: 0xfafcff, roughness: 0.24, metalness: 0.06 }),
      tileB: new THREE.MeshStandardMaterial({ map: textures.floorSage, color: 0xd8e8ec, roughness: 0.28, metalness: 0.05 }),
      plinth: new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.32, metalness: 0.12 }),
    };
  }
  return {
    tileA: new THREE.MeshStandardMaterial({ map: textures.floorLight, roughness: 0.42 }),
    tileB: new THREE.MeshStandardMaterial({ map: textures.floorSage, roughness: 0.42 }),
    plinth: new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.72 }),
  };
}

export function buildVenueEnvironment(venueId, group, textures, buildLegacyBistroEnv) {
  if (venueId === 'beach') return buildBeachPierEnvironment(group, textures);
  if (venueId === 'market') return buildNightMarketEnvironment(group, textures);
  if (venueId === 'mall') return buildMallAtriumEnvironment(group, textures);

  // Heritage Bistro fallback
  const diningFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 24),
    new THREE.MeshStandardMaterial({ map: textures.walnut, roughness: 0.78 }),
  );
  diningFloor.rotation.x = -Math.PI / 2;
  diningFloor.position.y = -0.35;
  diningFloor.receiveShadow = true;
  group.add(diningFloor);
  buildLegacyBistroEnv(group, textures);
  return { waves: [], palms: [], lanterns: [] };
}

function buildBeachPierEnvironment(group, textures) {
  const wallZ = -(GRID_ROWS / 2) - 0.16;
  const waves = [];
  const palms = [];

  // Sparkling turquoise ocean surrounding the pier
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 36),
    new THREE.MeshStandardMaterial({ color: 0x1ca3b8, roughness: 0.22, metalness: 0.14 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.55, -2.0);
  ocean.receiveShadow = true;
  group.add(ocean);

  // Animated seafoam & wave crests across the water
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xbef5ff, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 14; i++) {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(2.8 + (i % 3) * 1.4, 0.04, 0.26), foamMat);
    const wx = -14 + (i % 7) * 4.6;
    const wz = i < 7 ? -6.2 - (i % 2) * 1.5 : 5.4 + (i % 2) * 1.3;
    crest.position.set(wx, -0.5, wz);
    group.add(crest);
    waves.push({ mesh: crest, baseX: wx, baseY: -0.5, phase: i * 0.85 });
  }

  // Golden sand beach strip along the right & back-left shore
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xf2d29b, roughness: 0.92 });
  const rightBeach = new THREE.Mesh(new THREE.BoxGeometry(10, 0.34, 20), sandMat);
  rightBeach.position.set(11.2, -0.44, 0.5);
  rightBeach.receiveShadow = true;
  group.add(rightBeach);

  const leftBeach = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.34, 18), sandMat);
  leftBeach.position.set(-10.8, -0.44, 1.0);
  leftBeach.receiveShadow = true;
  group.add(leftBeach);

  // Wooden pier deck pilings & warm coastal railing
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.oak, color: 0xb88454, roughness: 0.75 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xe3cfa6, roughness: 0.9 });
  for (let x = -6.2; x <= 6.2; x += 2.48) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.55, 8), woodMat);
    post.position.set(x, 0.32, wallZ - 0.25);
    post.castShadow = true;
    group.add(post);
  }
  const ropeRail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 13.0, 8), ropeMat);
  ropeRail.rotation.z = Math.PI / 2;
  ropeRail.position.set(0, 0.82, wallZ - 0.25);
  group.add(ropeRail);

  // Striped Coastal Cabana Awning behind the kitchen (coral & cream stripes!)
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 2.35, wallZ + 0.05);
  const stripeCount = 12;
  const stripeW = (GRID_COLS + 0.8) / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    const col = i % 2 === 0 ? 0xe85d3f : 0xfff6e3;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(stripeW + 0.01, 0.12, 1.2),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.72 }),
    );
    slat.position.set(-(GRID_COLS + 0.8) / 2 + stripeW * (i + 0.5), 0, 0);
    slat.rotation.x = 0.28;
    slat.castShadow = true;
    awningGroup.add(slat);
  }
  group.add(awningGroup);

  // Bamboo awning support poles + string Edison lights
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xc9a05d, roughness: 0.65 });
  for (const px of [-6.2, -2.0, 2.0, 6.2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 8), bambooMat);
    pole.position.set(px, 1.15, wallZ - 0.15);
    pole.castShadow = true;
    group.add(pole);
  }
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe799 });
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const lx = -5.8 + t * 11.6;
    const sag = Math.sin(t * Math.PI) * 0.24;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), bulbMat);
    bulb.position.set(lx, 2.15 - sag, wallZ + 0.5);
    group.add(bulb);
  }

  // Swaying 3D Palm Trees flanking the beachfront pier!
  const palmSpots = [
    { x: -7.8, z: -2.8, rot: 0.25, scale: 1.08 },
    { x: -8.3, z: 2.2, rot: -0.35, scale: 0.94 },
    { x: 8.6, z: -3.2, rot: -0.22, scale: 1.05 },
    { x: 9.2, z: 2.8, rot: 0.4, scale: 0.96 },
  ];
  for (const ps of palmSpots) {
    const palm = buildPalmTree(ps.scale);
    palm.root.position.set(ps.x, -0.32, ps.z);
    palm.root.rotation.y = ps.rot;
    group.add(palm.root);
    palms.push({ crown: palm.crown, phase: ps.x * 0.7 + ps.z });
  }

  // Colorful Surfboards propped on the left beach + Beach Umbrellas & Seaside Diners on right!
  const surfA = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 2.1, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xff6f47, roughness: 0.3 }),
  );
  surfA.position.set(-7.2, 0.65, 0.1);
  surfA.rotation.set(0.12, 0.4, -0.16);
  surfA.castShadow = true;
  const surfB = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.95, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2ec4b6, roughness: 0.3 }),
  );
  surfB.position.set(-7.55, 0.58, 0.65);
  surfB.rotation.set(-0.08, 0.65, -0.22);
  surfB.castShadow = true;
  group.add(surfA, surfB);

  // Seaside umbrella cafe tables with guests on the right sandy deck!
  buildOutdoorCafeTables(group, 7.6, -0.32, [0x2ec4b6, 0xff7b54], true);

  // Warm heat lamps over East Pass
  buildPassLamps(group);

  return { waves, palms, lanterns: [] };
}

function buildNightMarketEnvironment(group, textures) {
  const wallZ = -(GRID_ROWS / 2) - 0.16;
  const lanterns = [];

  // Cobblestone night bazaar street
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 30),
    new THREE.MeshStandardMaterial({ color: 0x2e2833, roughness: 0.86 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.y = -0.38;
  street.receiveShadow = true;
  group.add(street);

  // Glowing market stall archway timber frame
  const darkTimber = new THREE.MeshStandardMaterial({ map: textures.walnut, color: 0x4a291a, roughness: 0.72 });
  for (const px of [-6.3, 0, 6.3]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.22), darkTimber);
    post.position.set(px, 1.25, wallZ - 0.1);
    post.castShadow = true;
    group.add(post);
  }
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.22, 0.26), darkTimber);
  topBeam.position.set(0, 2.6, wallZ - 0.1);
  group.add(topBeam);

  // Festive crimson & saffron market fabric canopy behind kitchen
  const canopyColors = [0xb8292f, 0xe89820, 0x26786b, 0xc93b2b];
  for (let i = 0; i < 4; i++) {
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.15, 0.1, 1.3),
      new THREE.MeshStandardMaterial({ color: canopyColors[i], roughness: 0.8 }),
    );
    awning.position.set(-4.75 + i * 3.16, 2.38, wallZ + 0.18);
    awning.rotation.x = 0.26;
    awning.castShadow = true;
    group.add(awning);
  }

  // Glowing Red & Gold Paper Lanterns swaying along the bazaar overhead!
  const lanternCoords = [-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4];
  lanternCoords.forEach((lx, i) => {
    const lGroup = new THREE.Group();
    const sag = Math.sin(((i + 0.5) / lanternCoords.length) * Math.PI) * 0.22;
    lGroup.position.set(lx, 2.48 - sag, wallZ + 0.72);
    const col = i % 2 === 0 ? 0xff4929 : 0xffb833;
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshBasicMaterial({ color: col }),
    );
    globe.scale.set(1, 1.25, 1);
    globe.position.y = -0.26;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 8), darkTimber);
    cap.position.y = -0.02;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.18, 6), new THREE.MeshBasicMaterial({ color: 0xffd24c }));
    tassel.position.y = -0.58;
    lGroup.add(globe, cap, tassel);
    group.add(lGroup);
    lanterns.push({ mesh: lGroup, phase: i * 1.1 });
  });

  // Left Spice Bazaar Stall: woven baskets with bright turmeric, paprika & saffron pyramids!
  const stallTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 4.4), darkTimber);
  stallTable.position.set(-7.6, 0.0, 0);
  stallTable.castShadow = true;
  group.add(stallTable);

  const spiceColors = [0xf2a71b, 0xd4311e, 0x5f9e38, 0xe86b1a];
  spiceColors.forEach((col, i) => {
    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.3, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.9 }),
    );
    basket.position.set(-7.5, 0.5, -1.5 + i * 1.0);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 }),
    );
    cone.position.set(-7.5, 0.74, -1.5 + i * 1.0);
    cone.castShadow = true;
    group.add(basket, cone);
  });

  // Side lantern post on right street + Night Market street-food tables & diners!
  buildOutdoorCafeTables(group, 7.6, -0.35, [0xd4311e, 0xe89820], false);
  buildPassLamps(group);

  return { waves: [], palms: [], lanterns };
}

function buildMallAtriumEnvironment(group, textures) {
  const wallZ = -(GRID_ROWS / 2) - 0.16;

  // Bright polished terrazzo mall concourse floor
  const concourse = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 32),
    new THREE.MeshStandardMaterial({ map: textures.marble, color: 0xeef3f8, roughness: 0.22, metalness: 0.08 }),
  );
  concourse.rotation.x = -Math.PI / 2;
  concourse.position.y = -0.36;
  concourse.receiveShadow = true;
  group.add(concourse);

  // Sleek modern glass & brushed-steel back atrium wall
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa8d5f2,
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.55,
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce4ec, roughness: 0.18, metalness: 0.88 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9a84e, roughness: 0.24, metalness: 0.82 });

  const glassWall = new THREE.Mesh(new THREE.BoxGeometry(GRID_COLS + 1.2, 2.2, 0.1), glassMat);
  glassWall.position.set(0, 1.1, wallZ - 0.12);
  group.add(glassWall);

  // Architectural white-steel skylight mullions & glowing modern food-court marquee
  for (let x = -6.4; x <= 6.4; x += 3.2) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 0.22), chromeMat);
    col.position.set(x, 1.35, wallZ - 0.1);
    col.castShadow = true;
    group.add(col);
  }
  const marqueeFrame = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.52, 0.24), new THREE.MeshStandardMaterial({ color: 0x1e2736, roughness: 0.35 }));
  marqueeFrame.position.set(0, 2.38, wallZ + 0.05);
  group.add(marqueeFrame);
  const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.12, 0.26), new THREE.MeshBasicMaterial({ color: 0x4de2ff }));
  neonStrip.position.set(0, 2.38, wallZ + 0.07);
  group.add(neonStrip);

  // Sleek glass & brass concourse railing on the left
  const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, GRID_ROWS + 1.4), glassMat);
  leftGlass.position.set(-(GRID_COLS / 2) - 0.6, 0.45, 0);
  const leftHandrail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, GRID_ROWS + 1.6), brassMat);
  leftHandrail.position.set(-(GRID_COLS / 2) - 0.6, 1.0, 0);
  group.add(leftGlass, leftHandrail);

  // Lush modern indoor mall planters (sculpted ceramic pots + ficus trees)
  const potMat = new THREE.MeshStandardMaterial({ color: 0xf7f9fc, roughness: 0.25 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.5 });
  const planterCoords = [[-7.6, -2.6], [-7.6, 2.4], [8.2, -3.1], [8.2, 3.0]];
  for (const [px, pz] of planterCoords) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 0.72, 14), potMat);
    pot.position.set(px, 0.0, pz);
    pot.castShadow = true;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x6b4b32 }));
    trunk.position.set(px, 0.75, pz);
    const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), leafMat);
    bush1.position.set(px, 1.38, pz);
    bush1.castShadow = true;
    const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: 0x3da862, roughness: 0.45 }));
    bush2.position.set(px + 0.22, 1.72, pz - 0.12);
    group.add(pot, trunk, bush1, bush2);
  }

  // Modern food-court cafe seating & diners on right side
  buildOutdoorCafeTables(group, 7.6, -0.36, [0x4c8bf5, 0x2ec4b6], false);
  buildPassLamps(group);

  return { waves: [], palms: [], lanterns: [] };
}

function buildPalmTree(scale = 1) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8f623d, roughness: 0.85 });

  // Slightly curved segmented trunk
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.14 - i * 0.012, 0.17 - i * 0.012, 0.56, 8), trunkMat);
    seg.position.set(i * 0.08, 0.28 + i * 0.5, 0);
    seg.rotation.z = -0.14;
    seg.castShadow = true;
    root.add(seg);
  }

  const crown = new THREE.Group();
  crown.position.set(0.46, 3.25, 0);
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b9c46, roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 0.36), frondMat);
    frond.position.set(Math.cos(ang) * 0.68, -0.06, Math.sin(ang) * 0.68);
    frond.rotation.y = -ang;
    frond.rotation.z = -0.34;
    frond.castShadow = true;
    crown.add(frond);
  }
  // Coconuts tucked under the fronds
  const cocoMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), cocoMat);
    coco.position.set(Math.cos(i * 2.1) * 0.14, -0.18, Math.sin(i * 2.1) * 0.14);
    crown.add(coco);
  }
  root.add(crown);
  return { root, crown };
}

function buildOutdoorCafeTables(group, baseX, baseY, clothColors, withUmbrella) {
  const dinerOutfits = [0x3d5a80, 0x9e3b46];
  [-1.4, 1.4].forEach((tz, ti) => {
    const tg = new THREE.Group();
    tg.position.set(baseX, baseY, tz);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x4a3222 }));
    leg.position.y = 0.45;
    const cloth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.74, 0.76, 0.12, 18),
      new THREE.MeshStandardMaterial({ color: clothColors[ti % clothColors.length], roughness: 0.72 }),
    );
    cloth.position.y = 0.92;
    cloth.castShadow = true;
    const runner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.54, 0.13, 18),
      new THREE.MeshStandardMaterial({ color: 0xfff8eb, roughness: 0.7 }),
    );
    runner.position.y = 0.925;
    tg.add(leg, cloth, runner);

    if (withUmbrella) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.35, 8), new THREE.MeshStandardMaterial({ color: 0xd9c29c }));
      pole.position.y = 1.65;
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: ti === 0 ? 0xff7b54 : 0x2ec4b6, roughness: 0.65 }),
      );
      canopy.position.y = 2.75;
      canopy.castShadow = true;
      tg.add(pole, canopy);
    }

    // Seated 3D diner
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x6b4b32, roughness: 0.7 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), chairMat);
    seat.position.set(0.95, 0.52, 0.1);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.42), chairMat);
    back.position.set(1.14, 0.85, 0.1);
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.48, 12),
      new THREE.MeshStandardMaterial({ color: dinerOutfits[ti % dinerOutfits.length], roughness: 0.65 }),
    );
    torso.position.set(0.92, 0.82, 0.1);
    torso.castShadow = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 14, 12),
      new THREE.MeshStandardMaterial({ color: ti === 0 ? 0xf2c59d : 0xdba57e, roughness: 0.5 }),
    );
    head.position.set(0.9, 1.22, 0.1);
    head.castShadow = true;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: ti === 0 ? 0x3b2618 : 0x241a15, roughness: 0.7 }),
    );
    hair.position.set(0.9, 1.24, 0.1);
    tg.add(seat, back, torso, head, hair);
    group.add(tg);
  });
}

function buildPassLamps(group) {
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xe3b34c, roughness: 0.25, metalness: 0.82 });
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffdf8a,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const lz of [-2.8, -1.8]) {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.26, 14, 1, true), brassMat);
    shade.position.set(5.45, 2.18, lz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe49c }));
    bulb.position.set(5.45, 2.06, lz);
    const lightCone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 16, 1, true), coneMat);
    lightCone.position.set(5.45, 1.32, lz);
    group.add(shade, bulb, lightCone);
  }
}
