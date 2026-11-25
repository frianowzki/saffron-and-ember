// Handcrafted diegetic bistro HUD (zero emojis, zero clunky sidebars): brushed-steel order rail,
// analog brass kitchen clock, linen check-presenter service report, and clean vector icons over full-bleed 3D.

import {
  CANVAS_H,
  CANVAS_W,
  CHOP_DURATION,
  SEAR_BURN_TIME,
  SEAR_PERFECT_END,
  SEAR_PERFECT_START,
  SHIFTS,
  SIMMER_BURN_TIME,
  SIMMER_DONE_TIME,
} from './config.js';
import { INGREDIENTS, PREPARED, RECIPES } from './recipes.js';
import { getStarRating } from './orders.js';
import { drawRecipeThumbnail } from './renderFood.js';

export function renderHud(ctx, state, time) {
  if (state.scene3d) {
    drawWorldOverlays3D(ctx, state, time);
  }

  // Subtle crimson vignette heartbeat during Service Rush
  if (state.mode === 'playing' && state.orders.rushActive) {
    const pulse = 0.1 + Math.sin(time * 5.2) * 0.05;
    const grad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.42, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.65);
    grad.addColorStop(0, 'rgba(196, 42, 32, 0)');
    grad.addColorStop(1, `rgba(196, 42, 32, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (state.mode === 'playing' || state.mode === 'paused') {
    drawTicketRail(ctx, state, time);
    drawBottomLeftClockAndTips(ctx, state, time);
    drawBottomRightControls(ctx, state);
    if (state.showRecipeBook && state.mode === 'playing') {
      drawQuickRecipeCard(ctx, state);
    }
  }

  if (state.mode === 'title') {
    drawTitleOverlay(ctx, state, time);
  } else if (state.mode === 'paused') {
    drawPauseOverlay(ctx, state);
  } else if (state.mode === 'summary') {
    drawTicketRail(ctx, state, time);
    drawSummaryCheckPresenter(ctx, state);
  }
}

function drawTicketRail(ctx, state, time) {
  // Slim brushed-steel hanging ticket bar at top-left
  const count = state.orders.orders.length;
  const ticketW = 186;
  const gap = 10;
  const railW = Math.max(240, count * (ticketW + gap) + 28);

  const steelGrad = ctx.createLinearGradient(0, 0, 0, 12);
  steelGrad.addColorStop(0, '#59534c');
  steelGrad.addColorStop(0.5, '#8f877d');
  steelGrad.addColorStop(1, '#3b352f');
  ctx.fillStyle = steelGrad;
  ctx.beginPath();
  ctx.roundRect(14, 6, railW, 10, 4);
  ctx.fill();

  state.orders.orders.forEach((order, idx) => {
    const tx = 22 + idx * (ticketW + gap);
    const ty = 12 - order.slideIn * 28;
    drawOrderTicket(ctx, order, tx, ty, ticketW, 92, time);
  });
}

function drawOrderTicket(ctx, order, x, y, w, h, time) {
  const ratio = Math.max(0, Math.min(1, order.timeLeft / order.timeLimit));
  const urgent = ratio < 0.25;
  const jitter = urgent ? Math.sin(time * 28) * 1.4 : 0;

  ctx.save();
  ctx.translate(x + jitter, y);

  // Soft drop shadow on 3D kitchen behind ticket
  ctx.shadowColor = 'rgba(12, 7, 4, 0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  // Cream kraft paper slip
  ctx.fillStyle = order.vip ? '#fff5dc' : '#f7f1e1';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, [3, 3, 6, 6]);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Top progress timer strip integrated into ticket header
  const barCol = ratio > 0.5 ? '#3b8c52' : ratio > 0.25 ? '#d98a16' : '#c93226';
  ctx.fillStyle = '#e3dac6';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = barCol;
  ctx.fillRect(0, 0, w * ratio, 6);

  // Ticket title & price / VIP stamp
  ctx.fillStyle = '#291c13';
  ctx.font = '700 11.5px Georgia, "Palatino Linotype", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(order.recipe.shortName, 9, 19);

  ctx.textAlign = 'right';
  if (order.vip) {
    ctx.fillStyle = '#b56a08';
    ctx.font = '800 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('VIP', w - 9, 19);
  } else {
    ctx.fillStyle = '#78624d';
    ctx.font = '700 10.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`$${order.recipe.basePrice}`, w - 9, 19);
  }

  // Subtle perforated divider line
  ctx.strokeStyle = 'rgba(120, 98, 77, 0.25)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(8, 29);
  ctx.lineTo(w - 8, 29);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dish miniature on left
  drawRecipeThumbnail(ctx, order.recipeId, 28, 59, 0.72);

  // Clean ingredient pills with custom vector prep marks (no emojis!)
  const ings = order.recipe.ingredients;
  ctx.textAlign = 'left';
  ings.forEach((key, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 54 + col * 63;
    const by = 37 + row * 24;
    const prep = PREPARED[key];

    ctx.fillStyle = '#ebe2ce';
    ctx.beginPath();
    ctx.roundRect(bx, by, 59, 18, 3);
    ctx.fill();

    drawPrepDot(ctx, bx + 8, by + 9, prep?.method);

    ctx.fillStyle = '#332217';
    ctx.font = '700 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(prep?.short ?? key, bx + 15, by + 9.5);
  });

  // Urgent red border outline
  if (urgent) {
    ctx.strokeStyle = '#c93226';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, [3, 3, 6, 6]);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPrepDot(ctx, x, y, method) {
  ctx.save();
  if (method === 'grill') {
    ctx.fillStyle = '#d9531e';
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (method === 'chop') {
    ctx.fillStyle = '#3b8c52';
    ctx.fillRect(x - 3, y - 3, 6, 6);
  } else if (method === 'pot') {
    ctx.fillStyle = '#3c84a8';
    ctx.beginPath();
    ctx.arc(x, y, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#d99816';
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBottomLeftClockAndTips(ctx, state, time) {
  const cx = 56;
  const cy = CANVAS_H - 54;
  const r = 38;
  const isRush = state.orders.rushActive;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 12;

  // Brass-rimmed cream bistro wall clock
  ctx.fillStyle = isRush ? '#b82a20' : '#f7f1e1';
  ctx.strokeStyle = '#d4a142';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';

  // Remaining shift sweep wedge
  const ratio = Math.max(0, Math.min(1, state.timeLeft / state.shift.durationSec));
  ctx.fillStyle = isRush ? 'rgba(255, 224, 102, 0.28)' : 'rgba(212, 161, 66, 0.24)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
  ctx.closePath();
  ctx.fill();

  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  const clockStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  ctx.fillStyle = isRush ? '#fff9ed' : '#261a12';
  ctx.font = '800 19px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clockStr, cx, cy - 2);

  ctx.fillStyle = isRush ? '#ffe08a' : '#7a634d';
  ctx.font = '700 8.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(isRush ? 'RUSH' : 'SHIFT', cx, cy + 16);

  // Earnings & Combo plate beside clock
  const bx = 108;
  const by = CANVAS_H - 80;
  ctx.fillStyle = 'rgba(247, 241, 225, 0.94)';
  ctx.strokeStyle = 'rgba(212, 161, 66, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, 148, 52, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#261a12';
  ctx.font = '800 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`$${state.orders.score}`, bx + 14, by + 22);

  ctx.fillStyle = '#735c47';
  ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${state.orders.servedCount} served · Tips $${state.orders.tipsEarned}`, bx + 14, by + 40);

  if (state.orders.combo >= 2) {
    const pulse = 1 + Math.sin(time * 7) * 0.04;
    ctx.save();
    ctx.translate(bx + 126, by + 16);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#c95c16';
    ctx.beginPath();
    ctx.roundRect(-18, -11, 36, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#fff9ed';
    ctx.font = '800 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${state.orders.combo}`, 0, 1);
    ctx.restore();
  }

  ctx.restore();
}

function drawBottomRightControls(ctx, state) {
  const sy = CANVAS_H - 68;

  // Quick Recipe Card button [R]
  const rx = CANVAS_W - 352;
  state.uiButtons.push({ id: 'toggle_recipes', x: rx, y: sy, w: 78, h: 42 });
  ctx.fillStyle = state.showRecipeBook ? '#d96420' : 'rgba(247, 241, 225, 0.92)';
  ctx.strokeStyle = 'rgba(212, 161, 66, 0.75)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(rx, sy, 78, 42, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = state.showRecipeBook ? '#fff9ed' : '#261a12';
  ctx.font = '700 11.5px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Menu', rx + 39, sy + 15);
  ctx.fillStyle = state.showRecipeBook ? '#ffe6c2' : '#735c47';
  ctx.font = '700 9px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Key R', rx + 39, sy + 30);

  // Active Chef Switch pill
  const sx = CANVAS_W - 266;
  state.uiButtons.push({ id: 'switch_chef', x: sx, y: sy, w: 164, h: 42 });

  const isSofia = state.chef.variant === 'sofia';
  ctx.fillStyle = 'rgba(247, 241, 225, 0.92)';
  ctx.strokeStyle = isSofia ? '#3b8c52' : '#d96420';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(sx, sy, 164, 42, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isSofia ? '#3b8c52' : '#d96420';
  ctx.beginPath();
  ctx.arc(sx + 18, sy + 21, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#261a12';
  ctx.font = '700 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Chef ${state.chef.name}`, sx + 32, sy + 15);
  ctx.fillStyle = '#735c47';
  ctx.font = '700 9.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Tab · Switch Chef', sx + 32, sy + 30);

  // Compact vector Mute & Pause buttons
  drawIconSquare(ctx, state, 'mute', CANVAS_W - 92, sy, 38, 42, (cx, cy) => {
    ctx.fillStyle = '#261a12';
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 4);
    ctx.lineTo(cx - 2, cy - 4);
    ctx.lineTo(cx + 4, cy - 9);
    ctx.lineTo(cx + 4, cy + 9);
    ctx.lineTo(cx - 2, cy + 4);
    ctx.lineTo(cx - 7, cy + 4);
    ctx.closePath();
    ctx.fill();
    if (state.audio.isMuted()) {
      ctx.strokeStyle = '#c93226';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 5);
      ctx.lineTo(cx + 13, cy + 5);
      ctx.moveTo(cx + 13, cy - 5);
      ctx.lineTo(cx + 7, cy + 5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#261a12';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx + 5, cy, 5, -0.7, 0.7);
      ctx.stroke();
    }
  });

  drawIconSquare(ctx, state, 'pause', CANVAS_W - 48, sy, 38, 42, (cx, cy) => {
    ctx.fillStyle = '#261a12';
    ctx.fillRect(cx - 5, cy - 7, 3.5, 14);
    ctx.fillRect(cx + 2, cy - 7, 3.5, 14);
  });
}

function drawIconSquare(ctx, state, id, x, y, w, h, drawIcon) {
  state.uiButtons.push({ id, x, y, w, h });
  const hover = state.mouse.x >= x && state.mouse.x <= x + w && state.mouse.y >= y && state.mouse.y <= y + h;
  ctx.fillStyle = hover ? '#fff9ed' : 'rgba(247, 241, 225, 0.92)';
  ctx.strokeStyle = 'rgba(212, 161, 66, 0.7)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  drawIcon(x + w / 2, y + h / 2);
}

function drawTitleOverlay(ctx, state) {
  // Warm editorial left gradient so the live 3D kitchen shines brightly across the right & center!
  const grad = ctx.createLinearGradient(0, 0, CANVAS_W * 0.62, 0);
  grad.addColorStop(0, 'rgba(24, 15, 9, 0.92)');
  grad.addColorStop(0.62, 'rgba(24, 15, 9, 0.62)');
  grad.addColorStop(1, 'rgba(24, 15, 9, 0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const leftX = 64;

  // Handcrafted bistro masthead
  ctx.fillStyle = '#e89d42';
  ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OPEN-FLAME BISTRO KITCHEN', leftX, 118);

  ctx.fillStyle = '#fbf5e6';
  ctx.font = '700 62px Georgia, "Palatino Linotype", serif';
  ctx.fillText('Saffron', leftX, 180);
  ctx.fillStyle = '#e89d42';
  ctx.font = 'italic 700 56px Georgia, "Palatino Linotype", serif';
  ctx.fillText('& Ember', leftX + 6, 236);

  ctx.fillStyle = '#dfd0bc';
  ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Switch between Chef Marco & Sous Chef Sofia.', leftX, 286);
  ctx.fillText('Chop, sear, wash plates, douse pan fires, and beat the rush.', leftX, 308);

  // Clean vertical shift selector (linen paper tabs, no generic dark cards!)
  SHIFTS.forEach((sh, i) => {
    const sy = 348 + i * 68;
    const selected = state.selectedShiftIndex === i;
    state.uiButtons.push({ id: `shift_${i}`, x: leftX, y: sy, w: 350, h: 58 });

    ctx.fillStyle = selected ? '#f7f1e1' : 'rgba(247, 241, 225, 0.14)';
    ctx.strokeStyle = selected ? '#d4a142' : 'rgba(247, 241, 225, 0.25)';
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.roundRect(leftX, sy, 350, 58, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = selected ? '#261a12' : '#f7f1e1';
    ctx.font = '700 17px Georgia, serif';
    ctx.fillText(sh.name, leftX + 18, sy + 23);

    ctx.fillStyle = selected ? '#6e5742' : '#cbb8a1';
    ctx.font = '600 11.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${sh.allowedRecipes.length} dishes · ${Math.floor(sh.durationSec / 60)}:${(sh.durationSec % 60).toString().padStart(2, '0')} shift`, leftX + 18, sy + 43);

    ctx.textAlign = 'right';
    ctx.fillStyle = selected ? '#b56a08' : '#e8b85a';
    ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`Goal $${sh.starThresholds[2]}`, leftX + 332, sy + 32);
    ctx.textAlign = 'left';
  });

  // Primary brass-gold CTA button
  const btnY = 574;
  state.uiButtons.push({ id: 'start_shift', x: leftX, y: btnY, w: 260, h: 54 });
  ctx.fillStyle = '#d96420';
  ctx.beginPath();
  ctx.roundRect(leftX, btnY, 260, 54, 7);
  ctx.fill();

  ctx.fillStyle = '#fff9ed';
  ctx.font = '700 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Start Dinner Service', leftX + 130, btnY + 28);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#bfb09c';
  ctx.font = '600 11.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('WASD / Click · Space Act · F Throw · Shift Dash · Tab Switch Chef', leftX, 654);
}

function drawPauseOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(18, 12, 8, 0.58)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const w = 320;
  const h = 236;
  const x = (CANVAS_W - w) / 2;
  const y = (CANVAS_H - h) / 2;

  ctx.fillStyle = '#f7f1e1';
  ctx.strokeStyle = '#c49541';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#261a12';
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Service Paused', CANVAS_W / 2, y + 46);

  drawPaperButton(ctx, state, 'resume', x + 40, y + 82, w - 80, 40, 'Resume Service', true);
  drawPaperButton(ctx, state, 'restart', x + 40, y + 132, w - 80, 38, 'Restart Shift', false);
  drawPaperButton(ctx, state, 'to_title', x + 40, y + 180, w - 80, 36, 'Shift Select', false);
}

function drawSummaryCheckPresenter(ctx, state) {
  ctx.fillStyle = 'rgba(18, 12, 8, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Walnut check-presenter board
  const bw = 460;
  const bh = 490;
  const bx = (CANVAS_W - bw) / 2;
  const by = (CANVAS_H - bh) / 2 + 12;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#3b2517';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Cream linen bistro receipt slip pinned on the wooden board
  const rx = bx + 24;
  const ry = by + 22;
  const rw = bw - 48;
  const rh = bh - 44;
  ctx.fillStyle = '#faf4e6';
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 4);
  ctx.fill();

  // Brass clip at top of receipt
  ctx.fillStyle = '#d4a142';
  ctx.beginPath();
  ctx.roundRect(CANVAS_W / 2 - 44, by + 10, 88, 22, 4);
  ctx.fill();

  const stars = getStarRating(state.shift, state.orders.score);

  ctx.fillStyle = '#8f5829';
  ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SAFFRON & EMBER · ${state.shift.name.toUpperCase()}`, CANVAS_W / 2, ry + 34);

  ctx.fillStyle = '#261a12';
  ctx.font = '700 32px Georgia, serif';
  ctx.fillText('Nightly Ledger', CANVAS_W / 2, ry + 70);

  // Embossed wax-gold stars
  for (let i = 0; i < 3; i++) {
    drawVectorStar(ctx, CANVAS_W / 2 - 48 + i * 48, ry + 114, 16, i < stars ? '#d98a16' : '#dfd5c2');
  }

  // Receipt line items
  const rows = [
    ['Dishes Served', `${state.orders.servedCount}`],
    ['Perfect Sears', `${state.orders.perfectCount}`],
    ['Best Service Streak', `x${Math.max(1, state.orders.bestCombo)}`],
    ['Guest Tips', `$${state.orders.tipsEarned}`],
    ['Missed Tickets', `${state.orders.expiredCount}`],
  ];

  ctx.strokeStyle = '#d8ccb6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx + 28, ry + 146);
  ctx.lineTo(rx + rw - 28, ry + 146);
  ctx.stroke();

  rows.forEach(([label, val], idx) => {
    const ly = ry + 174 + idx * 32;
    ctx.fillStyle = '#5c4836';
    ctx.font = '600 13.5px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, rx + 32, ly);

    ctx.fillStyle = '#261a12';
    ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, rx + rw - 32, ly);
  });

  // Total line
  ctx.strokeStyle = '#261a12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx + 28, ry + 336);
  ctx.lineTo(rx + rw - 28, ry + 336);
  ctx.stroke();

  ctx.fillStyle = '#261a12';
  ctx.font = '700 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL REVENUE', rx + 32, ry + 362);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#b55214';
  ctx.font = '800 24px Georgia, serif';
  ctx.fillText(`$${state.orders.score}`, rx + rw - 32, ry + 362);

  const hasNext = state.selectedShiftIndex < SHIFTS.length - 1;
  drawPaperButton(ctx, state, 'restart', rx + 24, ry + 392, 174, 40, 'Replay Shift', false);
  drawPaperButton(ctx, state, hasNext ? 'next_shift' : 'to_title', rx + 214, ry + 392, 174, 40, hasNext ? 'Next Shift' : 'Shift Select', true);

  ctx.restore();
}

function drawPaperButton(ctx, state, id, x, y, w, h, label, primary) {
  state.uiButtons.push({ id, x, y, w, h });
  const hover = state.mouse.x >= x && state.mouse.x <= x + w && state.mouse.y >= y && state.mouse.y <= y + h;
  ctx.fillStyle = primary ? (hover ? '#c45414' : '#d96420') : (hover ? '#e8dec8' : '#efe7d6');
  ctx.strokeStyle = primary ? '#a3430c' : '#bfb096';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = primary ? '#fff9ed' : '#261a12';
  ctx.font = '700 13.5px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawVectorStar(ctx, cx, cy, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawWorldOverlays3D(ctx, state, time) {
  const proj = state.scene3d.projectStationTop;

  for (const st of state.stations) {
    if (st.type === 'crate') {
      const p = proj(st.col, st.row, 0.72);
      const ing = INGREDIENTS[st.ingredientId];
      drawWorldPill(ctx, p.x, p.y + 18, ing?.short ?? st.label, 'rgba(32, 20, 12, 0.84)', '#f7f1e1');
    } else if (st.type === 'pass') {
      const p = proj(st.col, st.row, 1.02);
      const ready = state.chef.holding?.kind === 'plate' && state.chef.holding?.recipeId;
      drawWorldPill(ctx, p.x, p.y + 10, 'SERVE', ready ? '#d98a16' : 'rgba(32, 20, 12, 0.86)', '#fff9ed');
    } else if (st.type === 'plates') {
      const p = proj(st.col, st.row, 1.28);
      drawWorldPill(ctx, p.x, p.y, `Plates: ${st.plateCount}`, 'rgba(32, 20, 12, 0.84)', st.plateCount > 0 ? '#f7f1e1' : '#ff8b7b');
    } else if (st.type === 'sink' && (st.dirtyCount > 0 || st.washProgress > 0)) {
      const p = proj(st.col, st.row, 1.38);
      if (st.washProgress > 0) {
        drawWorldBar(ctx, p.x, p.y, Math.min(1, st.washProgress / 1.6), '#52b8e8', null);
      } else {
        drawWorldPill(ctx, p.x, p.y, `WASH (${st.dirtyCount})`, '#2d7ea3', '#ffffff');
      }
    } else if (st.type === 'dirty_return' && st.dirtyCount > 0) {
      const p = proj(st.col, st.row, 1.32);
      drawWorldPill(ctx, p.x, p.y, `Dirty: ${st.dirtyCount}`, '#7d5232', '#fff5e0');
    }

    if (st.onFire) {
      const p = proj(st.col, st.row, 1.65);
      drawWorldPill(ctx, p.x, p.y, 'FIRE! DOUSE', Math.sin(time * 18) > 0 ? '#d92b1e' : '#f28c18', '#ffffff');
      continue;
    }

    if (st.type === 'chop' && st.item && st.item.kind === 'raw' && st.progress > 0) {
      const p = proj(st.col, st.row, 1.48);
      drawWorldBar(ctx, p.x, p.y, Math.min(1, st.progress / CHOP_DURATION), '#46b868', null);
    } else if (st.type === 'grill' && st.item) {
      const p = proj(st.col, st.row, 1.48);
      if (st.burnt) {
        drawWorldPill(ctx, p.x, p.y, 'BURNT', '#c93226', '#ffffff');
      } else {
        const ratio = Math.min(1, st.cookTime / SEAR_BURN_TIME);
        const s0 = SEAR_PERFECT_START / SEAR_BURN_TIME;
        const s1 = SEAR_PERFECT_END / SEAR_BURN_TIME;
        const inPerf = st.cookTime >= SEAR_PERFECT_START && st.cookTime <= SEAR_PERFECT_END;
        const warn = st.cookTime > SEAR_PERFECT_END;
        const col = warn ? (Math.sin(time * 18) > 0 ? '#e03426' : '#f29938') : inPerf ? '#f2c12e' : '#e07a2b';
        drawWorldBar(ctx, p.x, p.y, ratio, col, [s0, s1]);
        if (inPerf) drawWorldPill(ctx, p.x, p.y - 14, 'PERFECT', '#f2c12e', '#261a12');
      }
    } else if (st.type === 'pot' && st.item) {
      const p = proj(st.col, st.row, 1.62);
      if (st.burnt) {
        drawWorldPill(ctx, p.x, p.y, 'BURNT', '#c93226', '#ffffff');
      } else {
        const ratio = Math.min(1, st.cookTime / SIMMER_BURN_TIME);
        const done = SIMMER_DONE_TIME / SIMMER_BURN_TIME;
        const ready = st.cookTime >= SIMMER_DONE_TIME;
        drawWorldBar(ctx, p.x, p.y, ratio, ready ? '#52c472' : '#e8a838', [done, Math.min(1, done + 0.3)]);
        if (ready) drawWorldPill(ctx, p.x, p.y - 14, 'READY', '#3b8c52', '#ffffff');
      }
    } else if (st.item && st.item.kind === 'plate') {
      const p = proj(st.col, st.row, 1.42);
      if (st.item.recipeId) {
        drawWorldPill(ctx, p.x, p.y, 'READY', '#f2c12e', '#261a12');
      } else if (st.item.ingredients.length > 0) {
        drawWorldPill(ctx, p.x, p.y, `PLATING ${st.item.ingredients.length}`, 'rgba(32, 20, 12, 0.88)', '#9ef0b0');
      }
    }
  }

  for (const t of state.particles.popups) {
    const p = state.scene3d.projectSimPos(t.x, t.y, 1.85);
    const alpha = Math.max(0, Math.min(1, t.life / (t.maxLife * 0.6)));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${t.size}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20, 12, 8, 0.9)';
    ctx.strokeText(t.text, p.x, p.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, p.x, p.y);
    ctx.restore();
  }
}

function drawWorldBar(ctx, cx, y, ratio, fillColor, sweetSpot) {
  const w = 54;
  const h = 8;
  ctx.fillStyle = 'rgba(20, 12, 8, 0.88)';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  if (sweetSpot) {
    ctx.fillStyle = 'rgba(255, 224, 92, 0.38)';
    ctx.fillRect(cx - w / 2 + sweetSpot[0] * w, y - h / 2 + 1, (sweetSpot[1] - sweetSpot[0]) * w, h - 2);
  }
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2 + 1, y - h / 2 + 1, Math.max(3, (w - 2) * ratio), h - 2, 3);
  ctx.fill();
}

function drawQuickRecipeCard(ctx, state) {
  const w = 520;
  const h = 340;
  const x = (CANVAS_W - w) / 2;
  const y = (CANVAS_H - h) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#faf4e6';
  ctx.strokeStyle = '#c49541';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#261a12';
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Bistro Recipe Ledger', CANVAS_W / 2, y + 32);

  const visible = RECIPES.filter((r) => state.shift.allowedRecipes.includes(r.id));
  visible.forEach((recipe, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = x + 22 + col * 244;
    const cy = y + 58 + row * 86;

    ctx.fillStyle = '#efe7d6';
    ctx.beginPath();
    ctx.roundRect(cx, cy, 232, 76, 6);
    ctx.fill();

    drawRecipeThumbnail(ctx, recipe.id, cx + 32, cy + 38, 0.72);
    ctx.fillStyle = '#261a12';
    ctx.font = '700 12.5px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.shortName, cx + 62, cy + 22);

    ctx.fillStyle = '#634d39';
    ctx.font = '600 10.5px "Segoe UI", system-ui, sans-serif';
    const steps = recipe.ingredients.map((k) => PREPARED[k]?.short ?? k).join(' + ');
    ctx.fillText(steps.slice(0, 26), cx + 62, cy + 44);
    if (steps.length > 26) ctx.fillText(steps.slice(26), cx + 62, cy + 59);
  });

  ctx.fillStyle = '#7a634d';
  ctx.font = '600 10.5px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press R to close · F to throw raw ingredients across the island', CANVAS_W / 2, y + h - 16);
  ctx.restore();
}

function drawWorldPill(ctx, cx, y, text, bg, fg) {
  ctx.font = '800 9.5px "Segoe UI", system-ui, sans-serif';
  const tw = ctx.measureText(text).width + 10;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, y - 7, tw, 14, 4);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 0.5);
}
