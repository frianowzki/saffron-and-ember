// Procedural PBR CanvasTextures for tactile 3D materials (wood grain, marble veins, tiles, brick, grates).

import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function createKitchenTextures() {
  return {
    oak: createWoodTexture('#b87c42', '#945d2a', '#d19b62'),
    walnut: createWoodTexture('#523522', '#382214', '#6b472f'),
    marble: createMarbleTexture(),
    floorLight: createCeramicTileTexture('#efe2cc', '#dfd0b6', '#b8a68a'),
    floorSage: createCeramicTileTexture('#d0dec7', '#bfd0b5', '#9fb096'),
    plaster: createPlasterTexture(),
    brick: createBrickTexture(),
    grate: createGrateTexture(),
  };
}

function createWoodTexture(base, dark, light) {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 3) {
    ctx.strokeStyle = y % 6 === 0 ? dark : light;
    ctx.globalAlpha = 0.16 + ((y * 17) % 10) * 0.015;
    ctx.lineWidth = 1.5 + ((y * 7) % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) {
      const wave = Math.sin(x * 0.03 + y * 0.08) * 3.5;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#29170b';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 254, 254);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMarbleTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#f8f5ef');
  grad.addColorStop(0.5, '#f0ebe1');
  grad.addColorStop(1, '#f7f3ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Soft Carrara veins
  const veins = [
    [10, 40, 110, 95, 245, 70],
    [0, 165, 130, 130, 256, 210],
    [45, 0, 95, 120, 180, 256],
    [160, 10, 195, 110, 250, 145],
  ];
  for (const [x0, y0, cx, cy, x1, y1] of veins) {
    ctx.strokeStyle = 'rgba(160, 152, 138, 0.28)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(130, 122, 110, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0 + 4, y0 - 2);
    ctx.quadraticCurveTo(cx - 5, cy + 4, x1, y1 + 3);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCeramicTileTexture(base, shade, grout) {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 128, 128);

  const grad = ctx.createLinearGradient(4, 4, 124, 124);
  grad.addColorStop(0, base);
  grad.addColorStop(1, shade);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(4, 4, 120, 120, 6);
  ctx.fill();

  // Ceramic glaze highlight on upper-left edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 114);
  ctx.lineTo(10, 10);
  ctx.lineTo(114, 10);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPlasterTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#c89b6e');
  grad.addColorStop(1, '#9e6f46');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 600; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,240,215,0.08)' : 'rgba(65,38,18,0.08)';
    ctx.fillRect(x, y, 4, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrickTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5c4b3f';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const bh = 256 / rows;
  const bw = 256 / cols;
  const tones = ['#9e4a32', '#8a3d27', '#b0563b', '#7d3420'];

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw / 2);
    for (let col = -1; col <= cols; col++) {
      ctx.fillStyle = tones[(r * 3 + col + 4) % tones.length];
      ctx.fillRect(col * bw + offset + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGrateTexture() {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = '#1b1817';
  for (let x = 14; x < 120; x += 16) {
    ctx.fillRect(x, 8, 6, 112);
  }
  ctx.strokeStyle = '#2d2826';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
