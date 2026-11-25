// Procedural 3D Three.js food meshes: raw produce, prepared components, mid-assembly plates, and plated dishes.

import * as THREE from 'three';

const matCache = new Map();

function getMat(color, roughness = 0.55, metalness = 0.05, emissive = 0x000000, emissiveIntensity = 0) {
  const key = `${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
  matCache.set(key, m);
  return m;
}

export function buildFoodMesh(item) {
  const root = new THREE.Group();
  if (!item) return root;

  if (item.burnt) {
    const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), getMat(0x211b18, 0.95));
    lump.scale.set(1.1, 0.55, 1.0);
    lump.position.y = 0.12;
    lump.castShadow = true;
    root.add(lump);
    return root;
  }

  if (item.kind === 'dirty_plate') {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.25, 0.055, 18), getMat(0xd9cfc0, 0.55));
    dish.position.y = 0.03;
    dish.castShadow = true;
    root.add(dish);
    const smudge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.015, 12), getMat(0x7a4a2a, 0.7));
    smudge.position.set(0.04, 0.06, -0.03);
    root.add(smudge);
    return root;
  }

  if (item.kind === 'extinguisher') {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.44, 14), getMat(0xc92a22, 0.3, 0.25));
    tank.position.y = 0.24;
    tank.castShadow = true;
    root.add(tank);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), getMat(0x222020, 0.4, 0.7));
    valve.position.y = 0.49;
    root.add(valve);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), getMat(0x1a1818, 0.5));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.44, 0.16);
    root.add(nozzle);
    return root;
  }

  if (item.kind === 'plate') {
    buildPlateMesh(root, item);
    return root;
  }

  if (item.kind === 'raw') {
    buildRawMesh(root, item.id);
    return root;
  }

  if (item.kind === 'prepared') {
    buildPreparedMesh(root, item.id, item.perfect);
    return root;
  }

  return root;
}

export function buildRawMesh(group, id) {
  switch (id) {
    case 'tomato': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 12), getMat(0xd93223, 0.32));
      body.scale.set(1.06, 0.86, 1.06);
      body.position.y = 0.19;
      body.castShadow = true;
      group.add(body);

      const stem = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.1, 5), getMat(0x3b8f44, 0.65));
      stem.position.y = 0.38;
      group.add(stem);
      break;
    }

    case 'herbs': {
      const leafMat = getMat(0x3a994d, 0.6);
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), leafMat);
        leaf.scale.set(1.3, 0.32, 0.75);
        leaf.position.set(Math.cos(i * 1.6) * 0.11, 0.1 + i * 0.03, Math.sin(i * 1.6) * 0.11);
        leaf.rotation.y = i * 1.1;
        leaf.castShadow = true;
        group.add(leaf);
      }
      const garlic = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), getMat(0xf5ebd4, 0.5));
      garlic.position.set(0.12, 0.12, 0.1);
      garlic.castShadow = true;
      group.add(garlic);
      break;
    }

    case 'steak': {
      const fat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 14), getMat(0xf2dfd3, 0.5));
      fat.scale.set(1.15, 1, 0.82);
      fat.position.y = 0.07;
      fat.castShadow = true;
      group.add(fat);

      const meat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.13, 14), getMat(0xb82c2c, 0.48));
      meat.scale.set(1.12, 1, 0.78);
      meat.position.y = 0.075;
      group.add(meat);
      break;
    }

    case 'salmon': {
      const skin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.28), getMat(0x4a5963, 0.55));
      skin.position.y = 0.04;
      skin.castShadow = true;
      group.add(skin);

      const flesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.26), getMat(0xf27652, 0.42));
      flesh.position.y = 0.11;
      flesh.castShadow = true;
      group.add(flesh);

      for (let i = -2; i <= 2; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.115, 0.27), getMat(0xffd9c4, 0.4));
        stripe.position.set(i * 0.09, 0.112, 0);
        stripe.rotation.y = 0.22;
        group.add(stripe);
      }
      break;
    }

    case 'dough': {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), getMat(0xf0d8b0, 0.82));
      ball.scale.set(1.15, 0.65, 1.05);
      ball.position.y = 0.14;
      ball.castShadow = true;
      group.add(ball);
      break;
    }

    case 'pasta': {
      const nestMat = getMat(0xf2c144, 0.48);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16 - i * 0.03, 0.045, 8, 16), nestMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.06 + i * 0.045;
        ring.castShadow = true;
        group.add(ring);
      }
      break;
    }

    case 'saffron': {
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.17, 0.3, 12),
        getMat(0xf08c18, 0.22, 0.08, 0xd96b0c, 0.25),
      );
      jar.position.y = 0.16;
      jar.castShadow = true;
      group.add(jar);

      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.1, 10), getMat(0xa6703d, 0.85));
      cork.position.y = 0.35;
      group.add(cork);
      break;
    }
  }
}

export function buildPreparedMesh(group, id, isPerfect = false) {
  switch (id) {
    case 'diced_tomato': {
      const mat = getMat(0xe03224, 0.35);
      const pts = [[-0.1, 0.06, -0.06], [0.09, 0.06, -0.08], [0, 0.07, 0.08], [-0.08, 0.06, 0.09], [0.1, 0.06, 0.05], [0, 0.13, 0]];
      for (const [px, py, pz] of pts) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.11), mat);
        cube.position.set(px, py, pz);
        cube.rotation.y = px * 5;
        cube.castShadow = true;
        group.add(cube);
      }
      break;
    }

    case 'minced_herbs': {
      const matG = getMat(0x38a34d, 0.65);
      const matW = getMat(0xf5ecd4, 0.6);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        const r = i % 2 === 0 ? 0.12 : 0.06;
        const bit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), i % 3 === 0 ? matW : matG);
        bit.position.set(Math.cos(a) * r, 0.04 + (i % 2) * 0.04, Math.sin(a) * r);
        bit.rotation.y = a;
        group.add(bit);
      }
      break;
    }

    case 'seared_steak': {
      const steak = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.13, 14), getMat(0x5e2614, 0.52));
      steak.scale.set(1.15, 1, 0.82);
      steak.position.y = 0.075;
      steak.castShadow = true;
      group.add(steak);

      // Grill marks
      const markMat = getMat(0x1f0d06, 0.8);
      for (let i = -1; i <= 1; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.03), markMat);
        bar.position.set(0, 0.145, i * 0.09);
        bar.rotation.y = 0.35;
        group.add(bar);
      }
      // Melting golden herb butter pat
      const butter = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.045, 0.11),
        getMat(0xffe470, 0.3, 0, isPerfect ? 0xf2b705 : 0x000000, isPerfect ? 0.3 : 0),
      );
      butter.position.set(0.02, 0.16, 0);
      butter.rotation.y = 0.4;
      group.add(butter);
      break;
    }

    case 'seared_salmon': {
      const fillet = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.25), getMat(0xe06834, 0.38));
      fillet.position.y = 0.08;
      fillet.castShadow = true;
      group.add(fillet);

      const crust = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.025, 0.23), getMat(0x9c3b18, 0.5));
      crust.position.y = 0.15;
      group.add(crust);
      break;
    }

    case 'toasted_flatbread': {
      const bread = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.28, 0.07, 16), getMat(0xd99b43, 0.72));
      bread.scale.set(1.1, 1, 0.88);
      bread.position.y = 0.045;
      bread.castShadow = true;
      group.add(bread);

      const charMat = getMat(0x522a10, 0.85);
      for (const [bx, bz] of [[-0.12, -0.05], [0.1, -0.06], [0.06, 0.09], [-0.08, 0.08]]) {
        const blister = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), charMat);
        blister.scale.set(1, 0.4, 1);
        blister.position.set(bx, 0.082, bz);
        group.add(blister);
      }
      break;
    }

    case 'simmered_pasta': {
      const mat = getMat(0xf5c542, 0.32);
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat);
      mound.scale.set(1.1, 0.6, 1.1);
      mound.position.y = 0.1;
      mound.castShadow = true;
      group.add(mound);
      const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 14), getMat(0xe3a120, 0.35));
      swirl.rotation.x = Math.PI / 2;
      swirl.position.y = 0.15;
      group.add(swirl);
      break;
    }

    case 'saffron': {
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.03, 14),
        getMat(0xf29418, 0.22, 0.05, 0xd96b0c, 0.22),
      );
      pool.position.y = 0.03;
      group.add(pool);
      break;
    }
  }
}

function buildPlateMesh(root, plate) {
  const isComplete = Boolean(plate.recipeId);

  // Porcelain plate rim
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.26, 0.06, 20), getMat(0xfaf6ee, 0.25, 0.04));
  dish.position.y = 0.035;
  dish.castShadow = true;
  dish.receiveShadow = true;
  root.add(dish);

  // Bistro gold/terracotta inner ring
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.015, 6, 22),
    getMat(isComplete ? 0xe3b34c : 0xc4aa8a, 0.3, 0.5),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.068;
  root.add(rim);

  // Glowing golden aura ring beneath completed dishes
  if (isComplete) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.025, 8, 24),
      getMat(0xffe052, 0.2, 0.3, 0xf2b705, 0.9),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.02;
    root.add(halo);
  }

  // Stack plated components visibly on the porcelain plate!
  const list = plate.ingredients || [];
  let yOffset = 0.065;
  for (const key of list) {
    const layer = new THREE.Group();
    buildPreparedMesh(layer, key, plate.perfectSear);
    layer.scale.setScalar(key === 'saffron' ? 1.05 : 0.85);
    layer.position.y = yOffset;
    root.add(layer);
    yOffset += key === 'saffron' ? 0.02 : 0.075;
  }
}
