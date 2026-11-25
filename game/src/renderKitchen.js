// 3/4 top-down Mediterranean open-flame kitchen renderer: tiled floor, counters, hearth, pass lamp, and Chef.

import {
  CHOP_DURATION,
  GRID_COLS,
  GRID_ROWS,
  KITCHEN_ORIGIN_X,
  KITCHEN_ORIGIN_Y,
  PALETTE,
  SEAR_BURN_TIME,
  SEAR_PERFECT_END,
  SEAR_PERFECT_START,
  SIMMER_BURN_TIME,
  SIMMER_DONE_TIME,
  TILE_SIZE,
} from './config.js';
import { INGREDIENTS } from './recipes.js';
import { drawItem, drawRawIngredient } from './renderFood.js';

export function renderKitchen(ctx, state, time) {
  const kitchenW = GRID_COLS * TILE_SIZE;
  const kitchenH = GRID_ROWS * TILE_SIZE;

  // Warm timber frame around kitchen
  ctx.save();
  ctx.fillStyle = '#261a13';
  ctx.beginPath();
  ctx.roundRect(KITCHEN_ORIGIN_X - 10, KITCHEN_ORIGIN_Y - 10, kitchenW + 20, kitchenH + 20, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.42)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sunlit terracotta & glazed sage checkerboard floor
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tx = KITCHEN_ORIGIN_X + c * TILE_SIZE;
      const ty = KITCHEN_ORIGIN_Y + r * TILE_SIZE;
      const isAlt = (r + c) % 2 === 0;
      ctx.fillStyle = isAlt ? PALETTE.floorLight : PALETTE.floorSage;
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

      // Subtle ceramic grout & sunlight sheen
      ctx.strokeStyle = 'rgba(130, 110, 88, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 0.5, ty + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }
  }

  // Warm sunlight beams streaming diagonally across the kitchen floor
  const sunGrad = ctx.createLinearGradient(
    KITCHEN_ORIGIN_X,
    KITCHEN_ORIGIN_Y,
    KITCHEN_ORIGIN_X + kitchenW * 0.7,
    KITCHEN_ORIGIN_Y + kitchenH,
  );
  sunGrad.addColorStop(0, 'rgba(255, 232, 175, 0.16)');
  sunGrad.addColorStop(0.5, 'rgba(255, 224, 150, 0.04)');
  sunGrad.addColorStop(1, 'rgba(255, 140, 60, 0.09)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(KITCHEN_ORIGIN_X, KITCHEN_ORIGIN_Y, kitchenW, kitchenH);

  // Soft cast shadows beneath counters
  ctx.fillStyle = 'rgba(32, 20, 12, 0.22)';
  for (const st of state.stations) {
    const sx = KITCHEN_ORIGIN_X + st.col * TILE_SIZE;
    const sy = KITCHEN_ORIGIN_Y + st.row * TILE_SIZE;
    ctx.fillRect(sx + 4, sy + 10, TILE_SIZE - 4, TILE_SIZE - 4);
  }

  // Click-to-move destination breadcrumbs
  if (state.chef.path.length > 0) {
    ctx.fillStyle = 'rgba(217, 164, 65, 0.35)';
    for (const node of state.chef.path) {
      const px = KITCHEN_ORIGIN_X + (node.col + 0.5) * TILE_SIZE;
      const py = KITCHEN_ORIGIN_Y + (node.row + 0.5) * TILE_SIZE;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw stations row by row for crisp 3/4 overlap
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const st = state.grid[r][c];
      if (st) {
        const isFocused = state.chef.facingStation === st || state.hoveredStation === st;
        drawStation(ctx, st, isFocused, time, state);
      }
    }
    // Render Chef in depth-sorted order
    const chefRow = Math.floor((state.chef.y - KITCHEN_ORIGIN_Y) / TILE_SIZE);
    if (chefRow === r) {
      drawChef(ctx, state.chef, time);
    }
  }

  // Overhead brass heat-lamp warm glow on the East Pass Window
  const passX = KITCHEN_ORIGIN_X + 11 * TILE_SIZE + TILE_SIZE * 0.5;
  const passY = KITCHEN_ORIGIN_Y + TILE_SIZE;
  const lampGrad = ctx.createRadialGradient(passX, passY, 10, passX, passY, 118);
  lampGrad.addColorStop(0, 'rgba(255, 214, 112, 0.28)');
  lampGrad.addColorStop(1, 'rgba(255, 214, 112, 0)');
  ctx.fillStyle = lampGrad;
  ctx.beginPath();
  ctx.arc(passX, passY, 118, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStation(ctx, st, isFocused, time, state) {
  const x = KITCHEN_ORIGIN_X + st.col * TILE_SIZE;
  const y = KITCHEN_ORIGIN_Y + st.row * TILE_SIZE;
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const faceH = 12;

  // Base cabinet body (3/4 front face + top surface)
  const isMarble = st.surface === 'marble' || st.type === 'plates';
  const topColor =
    st.type === 'pass'
      ? '#4d3522'
      : st.type === 'grill'
        ? '#332d2b'
        : st.type === 'pot'
          ? '#4a3529'
          : isMarble
            ? PALETTE.marbleTop
            : PALETTE.oakTop;
  const frontColor =
    st.type === 'pass'
      ? '#302014'
      : st.type === 'grill' || st.type === 'pot'
        ? '#211d1c'
        : isMarble
          ? PALETTE.marbleFront
          : PALETTE.oakFront;

  ctx.fillStyle = frontColor;
  ctx.fillRect(x + 2, y + TILE_SIZE - faceH, TILE_SIZE - 4, faceH - 2);

  ctx.fillStyle = topColor;
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - faceH);

  // Subtle top bevel & marble veining or wood grain
  ctx.strokeStyle = isMarble ? 'rgba(255,255,255,0.75)' : 'rgba(255, 232, 194, 0.32)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - faceH - 2);

  if (isMarble) {
    ctx.strokeStyle = 'rgba(182, 172, 155, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 14);
    ctx.quadraticCurveTo(x + 34, y + 24, x + 60, y + 18);
    ctx.moveTo(x + 16, y + 46);
    ctx.quadraticCurveTo(x + 42, y + 38, x + 62, y + 50);
    ctx.stroke();
  }

  // Station-specific fixtures
  if (st.type === 'crate') {
    drawIngredientCrate(ctx, st, x, y, cx, cy - 4);
  } else if (st.type === 'chop') {
    drawChoppingBoard(ctx, st, cx, cy - 5);
  } else if (st.type === 'grill') {
    drawCharcoalGrill(ctx, st, cx, cy - 5, time);
  } else if (st.type === 'pot') {
    drawCopperPot(ctx, st, cx, cy - 5, time);
  } else if (st.type === 'plates') {
    drawPlateStack(ctx, cx, cy - 6);
  } else if (st.type === 'pass') {
    drawPassWindow(ctx, st, x, y, cx, cy - 5, time, state);
  } else if (st.type === 'bin') {
    drawCompostBin(ctx, cx, cy - 4);
  }

  // Draw item resting on station (show cooked visual once seared/simmered)
  if (st.item) {
    let displayItem = st.item;
    if (st.burnt) {
      displayItem = { kind: 'burnt', id: st.item.id, burnt: true };
    } else if (st.type === 'grill' && st.item.kind === 'raw' && st.cookTime >= SEAR_PERFECT_START) {
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
    drawItem(ctx, displayItem, cx, cy - 6, 1.0, time);
  }

  // Live progress / heat / sear gauges right on the station
  drawStationGauge(ctx, st, cx, y + 6, time);

  // Focus / hover brass ring
  if (isFocused) {
    ctx.save();
    ctx.strokeStyle = '#ffd666';
    ctx.lineWidth = 2.6;
    ctx.shadowColor = 'rgba(255, 214, 102, 0.75)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(x + 3.5, y + 3.5, TILE_SIZE - 7, TILE_SIZE - 7);
    ctx.restore();
  }
}

function drawIngredientCrate(ctx, st, x, y, cx, cy) {
  // Recessed wooden crate box
  ctx.fillStyle = '#6e4521';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#d9a45b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw overflowing produce icon
  ctx.save();
  ctx.translate(cx, cy - 2);
  ctx.scale(0.86, 0.86);
  drawRawIngredient(ctx, st.ingredientId);
  ctx.restore();

  // Crisp readable label tag on front edge
  const ing = INGREDIENTS[st.ingredientId];
  ctx.fillStyle = 'rgba(34, 22, 14, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + TILE_SIZE - 23, TILE_SIZE - 16, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#fff3db';
  ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing?.short ?? st.label, cx, y + TILE_SIZE - 15.5);
}

function drawChoppingBoard(ctx, st, cx, cy) {
  // Thick end-grain maple cutting board
  ctx.fillStyle = '#e8c48e';
  ctx.beginPath();
  ctx.roundRect(cx - 26, cy - 19, 52, 38, 6);
  ctx.fill();
  ctx.strokeStyle = '#9e6d36';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wood groove border
  ctx.strokeStyle = 'rgba(158, 109, 54, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 22, cy - 15, 44, 30);

  // Chef's steel knife resting on right edge when empty
  if (!st.item) {
    ctx.save();
    ctx.translate(cx + 14, cy);
    ctx.rotate(0.28);
    ctx.fillStyle = '#cfd8df';
    ctx.beginPath();
    ctx.moveTo(-2, -13);
    ctx.lineTo(4, -13);
    ctx.lineTo(3, 5);
    ctx.lineTo(-2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(-1.5, 5, 4.5, 10);
    ctx.restore();
  }
}

function drawCharcoalGrill(ctx, st, cx, cy, time) {
  const active = Boolean(st.item);
  const pulse = 0.72 + Math.sin(time * 7 + st.col) * 0.22;

  // Glowing ember bed
  const ember = ctx.createRadialGradient(cx, cy, 4, cx, cy, 26);
  ember.addColorStop(0, active ? `rgba(255, 138, 42, ${pulse})` : 'rgba(235, 92, 32, 0.48)');
  ember.addColorStop(0.7, 'rgba(140, 32, 12, 0.65)');
  ember.addColorStop(1, '#261e1c');
  ctx.fillStyle = ember;
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();

  // Cast-iron skillet ring & handle
  ctx.strokeStyle = '#171413';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Grill grates
  ctx.strokeStyle = 'rgba(20, 16, 15, 0.72)';
  ctx.lineWidth = 2;
  for (let gx = -14; gx <= 14; gx += 7) {
    ctx.beginPath();
    ctx.moveTo(cx + gx, cy - 18);
    ctx.lineTo(cx + gx, cy + 18);
    ctx.stroke();
  }
}

function drawCopperPot(ctx, st, cx, cy, time) {
  // Hammered copper rim
  const potGrad = ctx.createRadialGradient(cx - 6, cy - 6, 4, cx, cy, 25);
  potGrad.addColorStop(0, '#f0a66b');
  potGrad.addColorStop(0.65, '#c46833');
  potGrad.addColorStop(1, '#7a3714');
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  // Brass side handles
  ctx.strokeStyle = '#e3b34c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx - 24, cy, 5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 24, cy, 5, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  // Simmering golden broth inside
  ctx.fillStyle = st.burnt ? '#2e2520' : st.item ? '#e8a838' : '#73b3c4';
  ctx.beginPath();
  ctx.arc(cx, cy, 18.5, 0, Math.PI * 2);
  ctx.fill();

  // Animated simmer bubbles
  ctx.strokeStyle = 'rgba(255, 252, 232, 0.65)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const bPhase = (time * 2.2 + i * 0.37) % 1;
    const bx = cx + Math.cos(i * 2.2) * 8;
    const by = cy + Math.sin(i * 2.2) * 7;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + bPhase * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlateStack(ctx, cx, cy) {
  for (let i = 2; i >= 0; i--) {
    ctx.fillStyle = i === 0 ? '#fcf9f2' : '#dfd7c8';
    ctx.strokeStyle = '#b89f82';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy + i * 3 - 3, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 15.5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPassWindow(ctx, st, x, y, cx, cy, time, state) {
  const readyInHand = state.chef.holding?.kind === 'plate' && state.chef.holding?.recipeId;
  const pulse = 0.5 + Math.sin(time * 6) * 0.25;

  // Brass pass rail stripes
  ctx.fillStyle = PALETTE.passBrass;
  ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, 5);
  ctx.fillRect(x + 4, y + TILE_SIZE - 19, TILE_SIZE - 8, 4);

  // Brass service bell icon
  if (!st.item) {
    ctx.fillStyle = readyInHand ? `rgba(255, 224, 102, ${0.4 + pulse * 0.4})` : 'rgba(227, 179, 76, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#5e3c05';
    ctx.fillRect(cx - 13, cy + 2, 26, 3.5);
    ctx.fillStyle = '#ffe58f';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // SERVE badge
  ctx.fillStyle = readyInHand ? '#f2b705' : 'rgba(42, 28, 16, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + TILE_SIZE - 23, TILE_SIZE - 20, 14, 4);
  ctx.fill();
  ctx.fillStyle = readyInHand ? '#211408' : '#f2d084';
  ctx.font = '800 9px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SERVE', cx, y + TILE_SIZE - 16);
}

function drawCompostBin(ctx, cx, cy) {
  ctx.fillStyle = '#4a4743';
  ctx.beginPath();
  ctx.roundRect(cx - 19, cy - 17, 38, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#292725';
  ctx.beginPath();
  ctx.roundRect(cx - 14, cy - 12, 28, 24, 4);
  ctx.fill();
  ctx.strokeStyle = '#858078';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 7);
  ctx.lineTo(cx + 7, cy + 7);
  ctx.moveTo(cx + 7, cy - 7);
  ctx.lineTo(cx - 7, cy + 7);
  ctx.stroke();
}

function drawStationGauge(ctx, st, cx, topY, time) {
  // Chopping progress arc
  if (st.type === 'chop' && st.item && st.item.kind === 'raw' && st.progress > 0) {
    const ratio = Math.min(1, st.progress / CHOP_DURATION);
    drawBar(ctx, cx, topY, ratio, '#52d178', null);
  }

  // Grill heat gauge with highlighted Golden Perfect Sear window!
  if (st.type === 'grill' && st.item) {
    if (st.burnt) {
      drawTag(ctx, cx, topY, 'BURNT!', '#e03e2d');
      return;
    }
    const ratio = Math.min(1, st.cookTime / SEAR_BURN_TIME);
    const perfectStart = SEAR_PERFECT_START / SEAR_BURN_TIME;
    const perfectEnd = SEAR_PERFECT_END / SEAR_BURN_TIME;
    const inPerfect = st.cookTime >= SEAR_PERFECT_START && st.cookTime <= SEAR_PERFECT_END;
    const overWarning = st.cookTime > SEAR_PERFECT_END;
    const fillCol = overWarning
      ? Math.sin(time * 18) > 0 ? '#ff3b2f' : '#ff9f43'
      : inPerfect ? '#ffd633' : '#f28c38';
    drawBar(ctx, cx, topY, ratio, fillCol, [perfectStart, perfectEnd]);
    if (inPerfect) {
      drawTag(ctx, cx, topY - 12, 'PERFECT!', '#f2b705', '#211408');
    }
  }

  // Copper pot simmer gauge
  if (st.type === 'pot' && st.item) {
    if (st.burnt) {
      drawTag(ctx, cx, topY, 'BURNT!', '#e03e2d');
      return;
    }
    const ratio = Math.min(1, st.cookTime / SIMMER_BURN_TIME);
    const doneRatio = SIMMER_DONE_TIME / SIMMER_BURN_TIME;
    const ready = st.cookTime >= SIMMER_DONE_TIME;
    const fillCol = st.cookTime > SIMMER_DONE_TIME + 2.8
      ? Math.sin(time * 16) > 0 ? '#ff3b2f' : '#ff9f43'
      : ready ? '#6ee88a' : '#f2b749';
    drawBar(ctx, cx, topY, ratio, fillCol, [doneRatio, Math.min(1, doneRatio + 0.3)]);
    if (ready && st.cookTime <= SIMMER_DONE_TIME + 2.8) {
      drawTag(ctx, cx, topY - 12, 'READY', '#3b8c52', '#ffffff');
    }
  }
}

function drawBar(ctx, cx, y, ratio, fillColor, sweetSpot) {
  const w = 54;
  const h = 8;
  ctx.fillStyle = 'rgba(20, 14, 10, 0.86)';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y, w, h, 4);
  ctx.fill();

  if (sweetSpot) {
    const [s0, s1] = sweetSpot;
    ctx.fillStyle = 'rgba(255, 224, 92, 0.36)';
    ctx.fillRect(cx - w / 2 + s0 * w, y + 1, (s1 - s0) * w, h - 2);
  }

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2 + 1, y + 1, Math.max(3, (w - 2) * ratio), h - 2, 3);
  ctx.fill();
}

function drawTag(ctx, cx, y, text, bg, fg = '#fff') {
  ctx.font = '800 9px "Segoe UI", system-ui, sans-serif';
  const tw = ctx.measureText(text).width + 10;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, y - 5, tw, 13, 4);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1.5);
}

function drawChef(ctx, chef, time) {
  const bob = Math.sin(chef.walkCycle) * 2.2;
  const chopDip = chef.chopAnim > 0 ? Math.sin(chef.chopAnim * 28) * 4 : 0;

  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.5);

  // Soft floor shadow
  ctx.fillStyle = 'rgba(24, 14, 8, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bistro apron & chef coat
  ctx.fillStyle = '#faf6ee';
  ctx.strokeStyle = '#332419';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 20, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Saffron bistro neckerchief / apron trim
  ctx.fillStyle = '#d96b27';
  ctx.beginPath();
  ctx.arc(0, 5, 11, 0.15, Math.PI - 0.15);
  ctx.fill();

  // Chef head
  ctx.fillStyle = '#f2c8a2';
  ctx.beginPath();
  ctx.arc(0, -8 + chopDip * 0.4, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#332419';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Expressive eyes facing movement direction
  const ex = chef.facingX * 4;
  const ey = chef.facingY * 2.5;
  ctx.fillStyle = '#241810';
  ctx.beginPath();
  ctx.arc(-4 + ex, -8 + ey, 2, 0, Math.PI * 2);
  ctx.arc(4 + ex, -8 + ey, 2, 0, Math.PI * 2);
  ctx.fill();

  // Crisp pleated chef toque hat
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbbca8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -21 + chopDip * 0.5, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f5efe4';
  ctx.fillRect(-10, -17 + chopDip * 0.5, 20, 6);

  // Held ingredient or plated dish carried in front of Chef
  if (chef.holding) {
    const hx = chef.facingX * 22;
    const hy = chef.facingY * 18 + 2;
    drawItem(ctx, chef.holding, hx, hy, 0.88, time);
  }

  ctx.restore();
}
