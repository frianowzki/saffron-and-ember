// Bistro HUD: walnut Order Ticket Rail, Shift Clock, Combo Meter, Visual Recipe Book, Title & Summary Overlays.

import {
  CANVAS_H,
  CANVAS_W,
  KITCHEN_ORIGIN_X,
  KITCHEN_ORIGIN_Y,
  ORDER_RAIL_H,
  PALETTE,
  SHIFTS,
  TILE_SIZE,
} from './config.js';
import { PREPARED, RECIPES } from './recipes.js';
import { getStarRating } from './orders.js';
import { drawRecipeThumbnail } from './renderFood.js';

export function renderHud(ctx, state, time) {
  // Subtle warm crimson pulse around screen edges during Service Rush
  if (state.mode === 'playing' && state.orders.rushActive) {
    const pulse = 0.12 + Math.sin(time * 5.2) * 0.06;
    const grad = ctx.createRadialGradient(
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_H * 0.38,
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.62,
    );
    grad.addColorStop(0, 'rgba(217, 56, 41, 0)');
    grad.addColorStop(1, `rgba(217, 56, 41, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  drawOrderRail(ctx, state, time);
  drawLeftRecipeSidebar(ctx, state);
  drawRightStatusSidebar(ctx, state, time);
  drawBottomActionHint(ctx, state);

  if (state.mode === 'title') {
    drawTitleOverlay(ctx, state, time);
  } else if (state.mode === 'paused') {
    drawPauseOverlay(ctx, state);
  } else if (state.mode === 'summary') {
    drawSummaryOverlay(ctx, state, time);
  }
}

function drawOrderRail(ctx, state, time) {
  // Dark walnut ticket rail backing
  const railGrad = ctx.createLinearGradient(0, 0, 0, ORDER_RAIL_H);
  railGrad.addColorStop(0, '#2e1f16');
  railGrad.addColorStop(1, '#1d130d');
  ctx.fillStyle = railGrad;
  ctx.fillRect(0, 0, CANVAS_W, ORDER_RAIL_H);

  // Brass rail bar
  ctx.fillStyle = PALETTE.railBrass;
  ctx.fillRect(0, 8, CANVAS_W, 4);
  ctx.fillStyle = 'rgba(217, 164, 65, 0.35)';
  ctx.fillRect(0, ORDER_RAIL_H - 2, CANVAS_W, 2);

  // Brand crest on far left
  ctx.fillStyle = '#f5d084';
  ctx.font = '700 18px Georgia, "Palatino Linotype", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAFFRON', 16, 36);
  ctx.fillStyle = '#e87a38';
  ctx.font = 'italic 700 16px Georgia, "Palatino Linotype", serif';
  ctx.fillText('& EMBER', 16, 56);
  ctx.fillStyle = '#bfa68a';
  ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(state.shift.name.toUpperCase(), 16, 82);

  // Order tickets pinned along the rail
  const startX = 148;
  const ticketW = 192;
  const ticketGap = 12;

  state.orders.orders.forEach((order, idx) => {
    const tx = startX + idx * (ticketW + ticketGap);
    const ty = 13 - order.slideIn * 36;
    drawOrderTicket(ctx, order, tx, ty, ticketW, 92, time);
  });

  // Shift Clock & Score on top-right
  const clockX = CANVAS_W - 188;
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  const clockStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isRush = state.orders.rushActive;

  ctx.fillStyle = isRush ? 'rgba(176, 36, 26, 0.85)' : 'rgba(46, 32, 22, 0.92)';
  ctx.strokeStyle = isRush ? '#ff8b7b' : PALETTE.railBrass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(clockX, 18, 170, 78, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isRush ? '#ffe066' : '#d6bfa0';
  ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isRush ? '🔥 SERVICE RUSH' : 'SHIFT TIMER', clockX + 85, 34);

  ctx.fillStyle = '#fff9ed';
  ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(clockStr, clockX + 85, 64);

  ctx.fillStyle = '#e8c47a';
  ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`$${state.orders.score}  ·  ${state.orders.servedCount} Served`, clockX + 85, 86);
}

function drawOrderTicket(ctx, order, x, y, w, h, time) {
  const ratio = Math.max(0, Math.min(1, order.timeLeft / order.timeLimit));
  const urgent = ratio < 0.25;
  const jitter = urgent ? Math.sin(time * 28) * 1.4 : 0;

  ctx.save();
  ctx.translate(x + jitter, y);

  // Brass clip pin
  ctx.fillStyle = '#e3b34c';
  ctx.fillRect(w / 2 - 12, -5, 24, 8);

  // Kraft paper ticket card
  ctx.fillStyle = order.vip ? '#fff4d6' : PALETTE.ticketPaper;
  ctx.strokeStyle = urgent ? '#d93829' : order.vip ? '#d9981e' : '#cbb99d';
  ctx.lineWidth = urgent || order.vip ? 2.4 : 1.5;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 7);
  ctx.fill();
  ctx.stroke();

  // Header strip
  ctx.fillStyle = order.vip ? '#c97b12' : '#3a261a';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 22, [7, 7, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#fff8eb';
  ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${order.id} ${order.recipe.shortName}`, 8, 11.5);

  if (order.vip) {
    ctx.fillStyle = '#ffe57f';
    ctx.textAlign = 'right';
    ctx.fillText('★ VIP', w - 8, 11.5);
  } else {
    ctx.fillStyle = '#e6c896';
    ctx.textAlign = 'right';
    ctx.fillText(`$${order.recipe.basePrice}`, w - 8, 11.5);
  }

  // Mini dish thumbnail
  drawRecipeThumbnail(ctx, order.recipeId, 28, 52, 0.72);

  // Ingredient badges
  const ings = order.recipe.ingredients;
  ctx.textAlign = 'left';
  ings.forEach((key, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 56 + col * 66;
    const by = 32 + row * 22;
    const prep = PREPARED[key];
    const icon = prep?.method === 'chop' ? '🔪' : prep?.method === 'grill' ? '🔥' : prep?.method === 'pot' ? '♨' : '✦';

    ctx.fillStyle = '#efe5d1';
    ctx.beginPath();
    ctx.roundRect(bx, by, 62, 17, 4);
    ctx.fill();

    ctx.fillStyle = '#38261a';
    ctx.font = '700 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${icon} ${prep?.short ?? key}`, bx + 4, by + 9);
  });

  // Live countdown timer bar at bottom of ticket
  const barColor = ratio > 0.5 ? '#3b8c52' : ratio > 0.25 ? '#e69b1e' : '#d93829';
  ctx.fillStyle = '#dfd5c3';
  ctx.beginPath();
  ctx.roundRect(8, h - 12, w - 16, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = barColor;
  ctx.beginPath();
  ctx.roundRect(8, h - 12, Math.max(4, (w - 16) * ratio), 7, 3.5);
  ctx.fill();

  ctx.restore();
}

function drawLeftRecipeSidebar(ctx, state) {
  const panelW = KITCHEN_ORIGIN_X - 24;
  const x = 10;
  const y = KITCHEN_ORIGIN_Y - 8;
  const h = 524;

  ctx.fillStyle = 'rgba(30, 20, 14, 0.88)';
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, panelW, h, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f2cc7e';
  ctx.font = '700 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('MENU RECIPES', x + panelW / 2, y + 20);

  const visible = RECIPES.filter((r) => state.shift.allowedRecipes.includes(r.id));
  const cardH = Math.min(76, Math.floor((h - 38) / Math.max(3, visible.length)) - 6);

  visible.forEach((recipe, idx) => {
    const cy = y + 34 + idx * (cardH + 6);
    const activeOrdered = state.orders.orders.some((o) => o.recipeId === recipe.id);

    ctx.fillStyle = activeOrdered ? 'rgba(82, 54, 34, 0.92)' : 'rgba(46, 33, 24, 0.72)';
    ctx.strokeStyle = activeOrdered ? 'rgba(242, 183, 5, 0.65)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 8, cy, panelW - 16, cardH, 7);
    ctx.fill();
    ctx.stroke();

    drawRecipeThumbnail(ctx, recipe.id, x + 32, cy + cardH / 2, 0.66);

    ctx.fillStyle = '#fff5e0';
    ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.shortName, x + 56, cy + 17);

    ctx.fillStyle = '#d9c3a3';
    ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
    const steps = recipe.ingredients.map((k) => PREPARED[k]?.short ?? k).join(' + ');
    const lines = wrapShort(steps, 21);
    lines.slice(0, 3).forEach((line, li) => {
      ctx.fillText(line, x + 56, cy + 31 + li * 11.5);
    });
  });
}

function drawRightStatusSidebar(ctx, state, time) {
  const x = KITCHEN_ORIGIN_X + 12 * TILE_SIZE + 14;
  const w = CANVAS_W - x - 10;
  const y = KITCHEN_ORIGIN_Y - 8;
  const h = 524;

  ctx.fillStyle = 'rgba(30, 20, 14, 0.88)';
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  // Combo Streak Medal
  const combo = state.orders.combo;
  const comboGlow = combo >= 2 ? 0.85 + Math.sin(time * 6) * 0.15 : 0.4;
  ctx.fillStyle = combo >= 2 ? `rgba(217, 128, 24, ${comboGlow * 0.32})` : 'rgba(48, 34, 24, 0.72)';
  ctx.strokeStyle = combo >= 2 ? '#f2b705' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 14, w - 20, 74, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d9bfa0';
  ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVICE COMBO', x + w / 2, y + 32);

  ctx.fillStyle = combo >= 2 ? '#ffe066' : '#fff5e0';
  ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`x${Math.max(1, combo)}`, x + w / 2, y + 63);

  // Star Target Progress
  const stars = getStarRating(state.shift, state.orders.score);
  ctx.fillStyle = '#f2cc7e';
  ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SHIFT RATING', x + w / 2, y + 110);

  ctx.font = '700 24px sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#f2b705' : 'rgba(255,255,255,0.18)';
    ctx.fillText('★', x + w / 2 - 30 + i * 30, y + 136);
  }

  ctx.fillStyle = '#c9b295';
  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Tips: $${state.orders.tipsEarned}`, x + w / 2, y + 162);
  ctx.fillText(`Perfect Sears: ${state.orders.perfectCount}`, x + w / 2, y + 178);

  // Station Legend / Controls Card
  ctx.fillStyle = 'rgba(46, 33, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 198, w - 20, 214, 8);
  ctx.fill();

  ctx.fillStyle = '#f2cc7e';
  ctx.font = '700 11px Georgia, serif';
  ctx.fillText('CONTROLS', x + w / 2, y + 216);

  const lines = [
    ['WASD / Arrows', 'Move Chef'],
    ['Space / E', 'Act / Chop'],
    ['Shift', 'Quick Dash'],
    ['Click Station', 'Auto-Walk'],
    ['Q / X', 'Discard'],
    ['P / Esc', 'Pause'],
  ];
  ctx.textAlign = 'left';
  lines.forEach(([key, desc], i) => {
    const ly = y + 240 + i * 27;
    ctx.fillStyle = '#ffe08a';
    ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(key, x + 18, ly);
    ctx.fillStyle = '#d9c5ab';
    ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(desc, x + 18, ly + 12);
  });

  // Audio & Pause buttons at bottom of right sidebar
  drawSidebarButton(ctx, state, 'mute', x + 10, y + 428, w - 20, 36, state.audio.isMuted() ? '🔇 Sound Off' : '🔊 Sound On');
  drawSidebarButton(ctx, state, 'pause', x + 10, y + 474, w - 20, 36, '⏸ Pause / Menu');
}

function drawSidebarButton(ctx, state, id, x, y, w, h, label) {
  state.uiButtons.push({ id, x, y, w, h });
  const hover = state.mouse.x >= x && state.mouse.x <= x + w && state.mouse.y >= y && state.mouse.y <= y + h;
  ctx.fillStyle = hover ? '#573c28' : '#3d2a1c';
  ctx.strokeStyle = hover ? '#f2b705' : 'rgba(217, 164, 65, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff5e0';
  ctx.font = '700 11.5px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawBottomActionHint(ctx, state) {
  const barY = CANVAS_H - 36;
  ctx.fillStyle = 'rgba(24, 16, 11, 0.92)';
  ctx.fillRect(0, barY, CANVAS_W, 36);

  const st = state.hoveredStation || state.chef.facingStation;
  let hint = 'Tip: Sear steaks & salmon in the Golden Perfect Zone (+25% tip) · Combine prepared items on Marble Counters!';
  if (st) {
    const heldLabel = state.chef.holding
      ? state.chef.holding.kind === 'plate'
        ? state.chef.holding.recipeId
          ? `Ready Dish (${state.chef.holding.recipeId.replace('_', ' ')})`
          : `Plate (${state.chef.holding.ingredients.length} items)`
        : state.chef.holding.id.replace('_', ' ')
      : 'Empty Hands';
    hint = `Target: ${st.label}   ·   Holding: ${heldLabel}   ·   Press Space / Click to interact`;
  }

  ctx.fillStyle = '#e8d4b4';
  ctx.font = '600 12.5px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hint, CANVAS_W / 2, barY + 18);
}

function drawTitleOverlay(ctx, state, time) {
  ctx.fillStyle = 'rgba(18, 12, 8, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const cardW = 760;
  const cardH = 510;
  const cx = (CANVAS_W - cardW) / 2;
  const cy = (CANVAS_H - cardH) / 2;

  ctx.fillStyle = '#241811';
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  // Bistro emblem & title
  ctx.fillStyle = '#e87a38';
  ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MEDITERRANEAN OPEN-FLAME BISTRO', CANVAS_W / 2, cy + 40);

  ctx.fillStyle = '#fff5df';
  ctx.font = '700 48px Georgia, "Palatino Linotype", serif';
  ctx.fillText('Saffron & Ember', CANVAS_W / 2, cy + 88);

  ctx.fillStyle = '#d9c2a3';
  ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(
    'Chop heirloom produce, nail the Golden Perfect Sear, plate combinatorial dishes, and conquer the rush.',
    CANVAS_W / 2,
    cy + 124,
  );

  // Decorative plated dish trio
  const showcase = ['bruschetta', 'herb_steak', 'saffron_pasta', 'seared_salmon', 'bouillabaisse'];
  showcase.forEach((id, i) => {
    const dx = CANVAS_W / 2 - 220 + i * 110;
    const dy = cy + 180 + Math.sin(time * 2.5 + i) * 3;
    drawRecipeThumbnail(ctx, id, dx, dy, 1.05);
  });

  // 3 Shift selection cards
  const shiftW = 216;
  const shiftGap = 18;
  const startX = CANVAS_W / 2 - (shiftW * 3 + shiftGap * 2) / 2;
  const shiftY = cy + 236;

  SHIFTS.forEach((sh, i) => {
    const sx = startX + i * (shiftW + shiftGap);
    const selected = state.selectedShiftIndex === i;
    state.uiButtons.push({ id: `shift_${i}`, x: sx, y: shiftY, w: shiftW, h: 146 });

    ctx.fillStyle = selected ? '#3f291a' : '#2d1e15';
    ctx.strokeStyle = selected ? '#f2b705' : 'rgba(217, 164, 65, 0.35)';
    ctx.lineWidth = selected ? 2.6 : 1.4;
    ctx.beginPath();
    ctx.roundRect(sx, shiftY, shiftW, 146, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = selected ? '#ffe066' : '#f5d9a6';
    ctx.font = '700 17px Georgia, serif';
    ctx.fillText(sh.name, sx + shiftW / 2, shiftY + 30);

    ctx.fillStyle = '#cbb396';
    ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(sh.subtitle, sx + shiftW / 2, shiftY + 52);

    ctx.fillStyle = '#e8c488';
    ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${Math.floor(sh.durationSec / 60)}:${(sh.durationSec % 60).toString().padStart(2, '0')} Shift`, sx + shiftW / 2, shiftY + 86);
    ctx.fillStyle = '#a8cfa0';
    ctx.fillText(`${sh.allowedRecipes.length} Menu Dishes`, sx + shiftW / 2, shiftY + 108);
    ctx.fillStyle = '#f2b705';
    ctx.fillText(`★★★ $${sh.starThresholds[2]}+`, sx + shiftW / 2, shiftY + 128);
  });

  // Start Service button
  const btnW = 280;
  const btnH = 54;
  const bx = CANVAS_W / 2 - btnW / 2;
  const by = cy + 412;
  state.uiButtons.push({ id: 'start_shift', x: bx, y: by, w: btnW, h: btnH });

  const btnGrad = ctx.createLinearGradient(bx, by, bx, by + btnH);
  btnGrad.addColorStop(0, '#f2b705');
  btnGrad.addColorStop(1, '#d47c15');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(bx, by, btnW, btnH, 10);
  ctx.fill();

  ctx.fillStyle = '#241408';
  ctx.font = '800 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('OPEN THE KITCHEN  →', CANVAS_W / 2, by + btnH / 2 + 1);

  ctx.fillStyle = '#bda58a';
  ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Play with Keyboard (WASD + Space + Shift) or Mouse (Click any station)', CANVAS_W / 2, cy + 486);
}

function drawPauseOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(18, 12, 8, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const w = 380;
  const h = 250;
  const x = (CANVAS_W - w) / 2;
  const y = (CANVAS_H - h) / 2;

  ctx.fillStyle = '#241811';
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff5df';
  ctx.font = '700 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Kitchen Paused', CANVAS_W / 2, y + 52);

  drawSidebarButton(ctx, state, 'resume', x + 50, y + 92, w - 100, 42, '▶ Resume Service');
  drawSidebarButton(ctx, state, 'restart', x + 50, y + 144, w - 100, 42, '↻ Restart Shift');
  drawSidebarButton(ctx, state, 'to_title', x + 50, y + 196, w - 100, 38, '⌂ Shift Select');
}

function drawSummaryOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(18, 12, 8, 0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const w = 560;
  const h = 440;
  const x = (CANVAS_W - w) / 2;
  const y = (CANVAS_H - h) / 2;

  ctx.fillStyle = '#241811';
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();

  const stars = getStarRating(state.shift, state.orders.score);

  ctx.fillStyle = '#e87a38';
  ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.shift.name.toUpperCase()} COMPLETE`, CANVAS_W / 2, y + 36);

  ctx.fillStyle = '#fff5df';
  ctx.font = '700 36px Georgia, serif';
  ctx.fillText('Service Report', CANVAS_W / 2, y + 76);

  // Star medals
  ctx.font = '700 44px sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#f2b705' : 'rgba(255,255,255,0.16)';
    ctx.fillText('★', CANVAS_W / 2 - 58 + i * 58, y + 132);
  }

  // Stats grid
  const stats = [
    ['Total Earnings', `$${state.orders.score}`],
    ['Dishes Served', `${state.orders.servedCount}`],
    ['Tips Earned', `$${state.orders.tipsEarned}`],
    ['Best Combo', `x${Math.max(1, state.orders.bestCombo)}`],
    ['Perfect Sears', `${state.orders.perfectCount}`],
    ['Missed Orders', `${state.orders.expiredCount}`],
  ];

  stats.forEach(([label, val], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = x + 36 + col * 252;
    const sy = y + 172 + row * 56;
    ctx.fillStyle = '#332218';
    ctx.beginPath();
    ctx.roundRect(sx, sy, 236, 46, 8);
    ctx.fill();

    ctx.fillStyle = '#c9b295';
    ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, sx + 14, sy + 23);

    ctx.fillStyle = '#ffe066';
    ctx.font = '800 18px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, sx + 222, sy + 23);
  });

  // Action buttons
  const hasNext = state.selectedShiftIndex < SHIFTS.length - 1;
  drawSidebarButton(ctx, state, 'restart', x + 40, y + 366, 224, 46, '↻ Replay Shift');
  drawSidebarButton(
    ctx,
    state,
    hasNext ? 'next_shift' : 'to_title',
    x + 296,
    y + 366,
    224,
    46,
    hasNext ? 'Next Shift →' : '⌂ Shift Select',
  );
}

function wrapShort(text, maxChars) {
  const words = text.split(' ');
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      out.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) out.push(line.trim());
  return out;
}
