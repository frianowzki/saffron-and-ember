// Order ticket queue, rush-wave scheduler, VIP priority orders, combo multiplier, and tip scoring.

import { MAX_ACTIVE_ORDERS } from './config.js';
import { RECIPE_BY_ID } from './recipes.js';

export function createOrderManager(shift) {
  return {
    shift,
    orders: [],
    nextOrderNum: 1,
    spawnTimer: 1.2,
    score: 0,
    tipsEarned: 0,
    servedCount: 0,
    expiredCount: 0,
    perfectCount: 0,
    combo: 0,
    bestCombo: 0,
    recipeCounts: {},
    rushActive: false,
    lastTicketPulse: 0,
  };
}

export function spawnOrder(mgr, forcedRecipeId = null, forcedVip = null) {
  if (mgr.orders.length >= MAX_ACTIVE_ORDERS) return null;
  const pool = mgr.shift.allowedRecipes;
  const recipeId = forcedRecipeId ?? pool[Math.floor(Math.random() * pool.length)];
  const recipe = RECIPE_BY_ID[recipeId];
  if (!recipe) return null;

  const isVip = forcedVip !== null ? forcedVip : Math.random() < mgr.shift.vipChance;
  const timeLimit = isVip ? Math.round(recipe.timeLimit * 0.86) : recipe.timeLimit;

  const ticket = {
    id: mgr.nextOrderNum++,
    recipeId: recipe.id,
    recipe,
    vip: isVip,
    timeLimit,
    timeLeft: timeLimit,
    createdAt: performance.now(),
    slideIn: 1,
    urgentWarned: false,
  };
  mgr.orders.push(ticket);
  return ticket;
}

export function updateOrders(mgr, dt, shiftTimeLeft, audio, particles) {
  const elapsed = mgr.shift.durationSec - shiftTimeLeft;
  mgr.rushActive = shiftTimeLeft <= mgr.shift.rushStartSec && shiftTimeLeft > 0;

  const progress = Math.min(1, Math.max(0, elapsed / mgr.shift.durationSec));
  const baseInterval =
    mgr.shift.spawnInterval - (mgr.shift.spawnInterval - mgr.shift.minInterval) * progress;
  const activeInterval = mgr.rushActive ? baseInterval * 0.72 : baseInterval;

  mgr.spawnTimer -= dt;
  if (mgr.spawnTimer <= 0 && mgr.orders.length < MAX_ACTIVE_ORDERS) {
    spawnOrder(mgr);
    mgr.spawnTimer = mgr.orders.length < 2 ? 2.4 : activeInterval;
  }

  let anyUrgent = false;
  for (let i = mgr.orders.length - 1; i >= 0; i--) {
    const order = mgr.orders[i];
    order.slideIn = Math.max(0, order.slideIn - dt * 4.5);
    order.timeLeft -= dt;
    const ratio = order.timeLeft / order.timeLimit;
    if (ratio < 0.25 && ratio > 0) {
      anyUrgent = true;
      if (!order.urgentWarned) {
        order.urgentWarned = true;
        audio?.playUrgentTick();
      }
    }
    if (order.timeLeft <= 0) {
      mgr.orders.splice(i, 1);
      mgr.expiredCount += 1;
      mgr.combo = 0;
      mgr.score = Math.max(0, mgr.score - 15);
      audio?.playOrderExpired();
      particles?.addFloatingText(640, 126, `Order #${order.id} Lost  -$15`, '#f05246', 18);
    }
  }

  if (anyUrgent) {
    mgr.lastTicketPulse += dt;
    if (mgr.lastTicketPulse >= 1.1) {
      mgr.lastTicketPulse = 0;
      audio?.playUrgentTick();
    }
  }
}

export function serveDishOrder(mgr, recipeId, isPerfectSear) {
  // Match the most urgent active order for this recipe
  let bestIdx = -1;
  let lowestTime = Infinity;
  for (let i = 0; i < mgr.orders.length; i++) {
    const o = mgr.orders[i];
    if (o.recipeId === recipeId && o.timeLeft < lowestTime) {
      lowestTime = o.timeLeft;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) {
    return { matched: false, totalEarned: 0, tip: 0, combo: mgr.combo, order: null };
  }

  const [order] = mgr.orders.splice(bestIdx, 1);
  mgr.combo += 1;
  if (mgr.combo > mgr.bestCombo) mgr.bestCombo = mgr.combo;
  mgr.servedCount += 1;
  mgr.recipeCounts[recipeId] = (mgr.recipeCounts[recipeId] || 0) + 1;

  const speedRatio = Math.max(0, Math.min(1, order.timeLeft / order.timeLimit));
  const base = order.recipe.basePrice * (order.vip ? 1.35 : 1);
  const speedTip = Math.round(base * 0.35 * speedRatio);
  const perfectBonus = isPerfectSear ? Math.round(base * 0.25) : 0;
  if (isPerfectSear) mgr.perfectCount += 1;
  const comboMultiplier = 1 + Math.min(4, mgr.combo - 1) * 0.15;
  const totalEarned = Math.round((base + speedTip + perfectBonus) * comboMultiplier);
  const tip = Math.max(0, totalEarned - Math.round(order.recipe.basePrice));

  mgr.score += totalEarned;
  mgr.tipsEarned += tip;

  if (mgr.orders.length === 0) {
    mgr.spawnTimer = Math.min(mgr.spawnTimer, 1.1);
  }

  return {
    matched: true,
    totalEarned,
    tip,
    perfectBonus,
    combo: mgr.combo,
    order,
  };
}

export function getStarRating(shift, score) {
  let stars = 0;
  for (const threshold of shift.starThresholds) {
    if (score >= threshold) stars += 1;
  }
  return stars;
}
