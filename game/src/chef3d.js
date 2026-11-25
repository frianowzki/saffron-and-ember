// Overcooked 2 inspired high-detail 3D Chef rigs (Head Chef Marco & Sous Chef Sofia):
// chunky expressive proportions, blinking eyes, smile/mouth, sculpted multi-puff toque,
// double-breasted coat with brass buttons, neckerchief, swinging clogs, and chopping knife.

import * as THREE from 'three';

export function buildHDChefRig(variant = 'marco') {
  const isSofia = variant === 'sofia';
  const root = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({ color: 0xfdfaf3, roughness: 0.48 });
  const skinMat = new THREE.MeshStandardMaterial({
    color: isSofia ? 0xeab892 : 0xf4c7a0,
    roughness: 0.46,
  });
  const scarfColor = isSofia ? 0x2f9454 : 0xe05e1b;
  const scarfMat = new THREE.MeshStandardMaterial({ color: scarfColor, roughness: 0.55 });
  const apronMat = new THREE.MeshStandardMaterial({ color: isSofia ? 0x244734 : 0x3d281d, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222026, roughness: 0.78 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2b160c, roughness: 0.38 });
  const hairMat = new THREE.MeshStandardMaterial({ color: isSofia ? 0x331b0e : 0x3d2314, roughness: 0.65 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xe3b34c, roughness: 0.22, metalness: 0.82 });

  // Ground indicator ring under active chef
  const activeRing = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 32),
    new THREE.MeshBasicMaterial({
      color: isSofia ? 0x5ee68a : 0xffd24c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  activeRing.rotation.x = -Math.PI / 2;
  activeRing.position.y = 0.04;
  root.add(activeRing);

  // Articulated legs + chunky chef clogs
  const makeLeg = (sx) => {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.13, 0.24, 0);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.13, 6, 10), pantsMat);
    shin.position.y = -0.06;
    shin.castShadow = true;
    const clog = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.24), bootMat);
    clog.position.set(0, -0.18, 0.05);
    clog.castShadow = true;
    leg.add(shin, clog);
    return leg;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  root.add(leftLeg, rightLeg);

  const upperBody = new THREE.Group();
  upperBody.position.y = 0.24;
  root.add(upperBody);

  // Chunky bistro apron + coat torso
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.29, 20), apronMat);
  apron.position.y = 0.14;
  apron.castShadow = true;
  upperBody.add(apron);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.42, 20), coatMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  upperBody.add(torso);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), coatMat);
  shoulders.scale.set(1.1, 0.56, 0.94);
  shoulders.position.y = 0.55;
  shoulders.castShadow = true;
  upperBody.add(shoulders);

  // 6 gleaming brass coat buttons
  const btnGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (let row = 0; row < 3; row++) {
    for (const bx of [-0.072, 0.072]) {
      const btn = new THREE.Mesh(btnGeo, brassMat);
      btn.position.set(bx, 0.48 - row * 0.09, 0.252);
      upperBody.add(btn);
    }
  }

  // Neckerchief collar & front knot
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.058, 10, 20), scarfMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.61;
  upperBody.add(collar);

  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), scarfMat);
  knot.position.set(0, 0.57, 0.23);
  upperBody.add(knot);

  // Larger, Overcooked-2 style expressive HD head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.88;
  upperBody.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.285, 24, 20), skinMat);
  head.scale.set(1.02, 1.0, 0.97);
  head.castShadow = true;
  headGroup.add(head);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.062, 10, 8);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.28, -0.01, 0);
  const earR = earL.clone();
  earR.position.x = 0.28;
  headGroup.add(earL, earR);

  // Cute sculpted nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), skinMat);
  nose.position.set(0, -0.015, 0.28);
  headGroup.add(nose);

  // Warm rosy cheeks
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xeb7f6c, roughness: 0.65 });
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), cheekMat);
  cheekL.scale.set(1.2, 0.72, 0.5);
  cheekL.position.set(-0.165, -0.06, 0.225);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.165;
  headGroup.add(cheekL, cheekR);

  // Blinking expressive eyes group
  const eyesGroup = new THREE.Group();
  headGroup.add(eyesGroup);
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a100a, roughness: 0.12 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (const ex of [-0.098, 0.098]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), scleraMat);
    sclera.scale.set(0.95, 1.12, 0.62);
    sclera.position.set(ex, 0.052, 0.242);
    eyesGroup.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.033, 10, 8), pupilMat);
    pupil.position.set(ex, 0.052, 0.268);
    eyesGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), glintMat);
    glint.position.set(ex + 0.014, 0.068, 0.292);
    eyesGroup.add(glint);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.026, 0.028), hairMat);
    brow.position.set(ex, 0.132, 0.246);
    brow.rotation.z = ex < 0 ? 0.12 : -0.12;
    headGroup.add(brow);
  }

  // Cheerful smile mouth
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.014, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x7a2b20, roughness: 0.5 }),
  );
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.095, 0.258);
  headGroup.add(mouth);

  if (isSofia) {
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.292, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.54), hairMat);
    hairCap.position.y = 0.025;
    headGroup.add(hairCap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), hairMat);
    bun.position.set(0, 0.03, -0.29);
    bun.castShadow = true;
    headGroup.add(bun);
  } else {
    const stacheL = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.095, 6, 8), hairMat);
    stacheL.rotation.z = Math.PI / 2 - 0.24;
    stacheL.position.set(-0.068, -0.072, 0.262);
    const stacheR = stacheL.clone();
    stacheR.rotation.z = -(Math.PI / 2 - 0.24);
    stacheR.position.x = 0.068;
    headGroup.add(stacheL, stacheR);
  }

  // Bouncy Multi-Puff Pleated Chef Toque Hat
  const toqueGroup = new THREE.Group();
  toqueGroup.position.y = 0.22;
  headGroup.add(toqueGroup);

  const toqueBand = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.245, 0.17, 20), coatMat);
  toqueBand.position.y = 0.075;
  toqueBand.castShadow = true;
  toqueGroup.add(toqueBand);

  const bandStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.258, 0.254, 0.036, 20), scarfMat);
  bandStripe.position.y = 0.02;
  toqueGroup.add(bandStripe);

  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), coatMat);
  crown.scale.set(1.06, 0.76, 1.06);
  crown.position.y = 0.25;
  crown.castShadow = true;
  toqueGroup.add(crown);

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), coatMat);
    puff.position.set(Math.cos(a) * 0.145, 0.24, Math.sin(a) * 0.145);
    puff.castShadow = true;
    toqueGroup.add(puff);
  }

  // Articulated Arms + Hands + Chef Knife
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.32, 0.52, 0.02);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.19, 6, 10), coatMat);
    sleeve.position.y = -0.11;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), skinMat);
    hand.position.set(0, -0.25, 0.03);
    hand.castShadow = true;
    pivot.add(hand);

    return pivot;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  upperBody.add(leftArm, rightArm);

  const handKnife = new THREE.Group();
  const kBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.1, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xe8eff5, roughness: 0.15, metalness: 0.9 }),
  );
  kBlade.position.set(0, -0.25, 0.25);
  const kHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.048, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x3b2214, roughness: 0.65 }),
  );
  kHandle.position.set(0, -0.25, 0.08);
  handKnife.add(kBlade, kHandle);
  handKnife.visible = false;
  rightArm.add(handKnife);

  const holdSlot = new THREE.Group();
  holdSlot.position.set(0, 0.34, 0.49);
  upperBody.add(holdSlot);

  return {
    root,
    upperBody,
    headGroup,
    eyesGroup,
    mouth,
    toqueGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    handKnife,
    holdSlot,
    activeRing,
  };
}
