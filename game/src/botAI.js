// Autonomous & commandable AI Sous Chef (Sofia) for Solo Mode:
// Plays like a real co-op partner — douses pan fires, washes dirty plates, rescues Perfect Sears,
// and preps ingredients for active orders. Responds to player Ping commands [1: Auto, 2: Prep, 3: Wash, 4: Grill].

import { SEAR_PERFECT_START, SIMMER_DONE_TIME } from './config.js';
import { findPathToAdjacent, tileToWorld, worldToTile } from './kitchenMap.js';
import { INGREDIENTS } from './recipes.js';
import { interactWithStation } from './cooking.js';

export const BOT_MODES = {
  auto: { id: 'auto', label: 'AI: Auto', short: 'AUTO' },
  prep: { id: 'prep', label: 'AI: Prep', short: 'PREP' },
  wash: { id: 'wash', label: 'AI: Wash', short: 'WASH' },
  grill: { id: 'grill', label: 'AI: Grill', short: 'GRILL' },
};

export function createBotController() {
  return {
    enabled: true,
    mode: 'auto',
    taskLabel: 'Ready',
    thinkCooldown: 0.35,
    targetStation: null,
    workTimer: 0,
  };
}

export function updateBotChef(state, dt) {
  const bot = state.bot;
  if (!bot || !bot.enabled || state.mode !== 'playing') return;

  // Always control whichever chef the player is NOT currently controlling
  const aiChef = state.chefs.find((c) => c !== state.chef);
  if (!aiChef) return;

  // Temporarily run interaction helpers with aiChef as active target
  const interactAsBot = (station) => {
    const prev = state.chef;
    state.chef = aiChef;
    const ok = interactWithStation(state, station);
    state.chef = prev;
    return ok;
  };

  // Continue active chopping or washing while standing at station
  if (bot.targetStation) {
    const st = bot.targetStation;
    const cur = worldToTile(aiChef.x, aiChef.y);
    const distTiles = Math.abs(cur.col - st.col) + Math.abs(cur.row - st.row);

    if (distTiles <= 1 && aiChef.path.length === 0) {
      const tPos = tileToWorld(st.col, st.row);
      const dx = tPos.x - aiChef.x;
      const dy = tPos.y - aiChef.y;
      const len = Math.hypot(dx, dy) || 1;
      aiChef.facingX = dx / len;
      aiChef.facingY = dy / len;

      // Active hold-work on chop board or sink
      if (st.type === 'chop' && st.item && st.item.kind === 'raw' && !aiChef.holding) {
        bot.taskLabel = 'Chopping';
        bot.workTimer += dt;
        aiChef.chopAnim = 0.16;
        if (bot.workTimer >= 0.32) {
          bot.workTimer = 0;
          interactAsBot(st);
        }
        return;
      }
      if (st.type === 'sink' && st.dirtyCount > 0 && !aiChef.holding) {
        bot.taskLabel = 'Washing';
        st.isWashing = true;
        bot.workTimer += dt;
        aiChef.chopAnim = 0.16;
        if (bot.workTimer >= 0.35) {
          bot.workTimer = 0;
          interactAsBot(st);
        }
        return;
      }

      // Single interaction on arrival
      interactAsBot(st);
      bot.targetStation = null;
      bot.thinkCooldown = 0.28;
      return;
    }
  }

  // Follow current BFS path smoothly
  if (aiChef.path.length > 0) {
    const next = aiChef.path[0];
    const target = tileToWorld(next.col, next.row);
    const dx = target.x - aiChef.x;
    const dy = target.y - aiChef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      aiChef.path.shift();
    } else {
      const speed = 225 * (state.upgradeMods?.moveSpeed ?? 1);
      aiChef.facingX = dx / dist;
      aiChef.facingY = dy / dist;
      aiChef.x += (dx / dist) * speed * dt;
      aiChef.y += (dy / dist) * speed * dt;
      aiChef.walkCycle += dt * 10;
    }
    return;
  }

  // Think and pick next smart kitchen task
  bot.thinkCooldown -= dt;
  if (bot.thinkCooldown > 0) return;
  bot.thinkCooldown = 0.4;

  const decision = chooseNextBotTask(state, aiChef, bot.mode);
  if (!decision) {
    bot.taskLabel = 'Standby';
    return;
  }

  bot.taskLabel = decision.label;
  bot.targetStation = decision.station;
  const cur = worldToTile(aiChef.x, aiChef.y);
  const path = findPathToAdjacent(state.grid, cur.col, cur.row, decision.station.col, decision.station.row);
  if (path.length > 0) {
    aiChef.path = path.slice(1);
  } else {
    bot.targetStation = null;
  }
}

function chooseNextBotTask(state, aiChef, mode) {
  const { stations, orders } = state;
  const find = (pred) => stations.find(pred);

  // 1. Emergency: Pan fire!
  const fireGrill = find((s) => s.onFire);
  if (fireGrill) {
    if (aiChef.holding?.kind === 'extinguisher') {
      return { station: fireGrill, label: 'Dousing Fire' };
    }
    if (!aiChef.holding) {
      const ext = find((s) => s.type === 'extinguisher');
      if (ext) return { station: ext, label: 'Grabbing APAR' };
    }
  }

  // 2. If holding a finished item or burnt item, place it cleanly
  if (aiChef.holding) {
    if (aiChef.holding.kind === 'extinguisher' && !fireGrill) {
      const ext = find((s) => s.type === 'extinguisher');
      if (ext) return { station: ext, label: 'Returning APAR' };
    }
    if (aiChef.holding.burnt) {
      const bin = find((s) => s.type === 'bin');
      if (bin) return { station: bin, label: 'Trashing Burnt' };
    }
    if (aiChef.holding.kind === 'dirty_plate') {
      const sink = find((s) => s.type === 'sink');
      if (sink) return { station: sink, label: 'Loading Sink' };
    }
    if (aiChef.holding.kind === 'raw') {
      const prep = INGREDIENTS[aiChef.holding.id]?.prep;
      if (prep === 'chop') {
        const board = find((s) => s.type === 'chop' && !s.item);
        if (board) return { station: board, label: 'Chopping' };
      }
      if (prep === 'grill') {
        const grill = find((s) => s.type === 'grill' && !s.item && !s.onFire);
        if (grill) return { station: grill, label: 'Grilling' };
      }
      if (prep === 'pot') {
        const pot = find((s) => s.type === 'pot' && !s.item);
        if (pot) return { station: pot, label: 'Boiling' };
      }
    }
    if (aiChef.holding.kind === 'prepared') {
      // Place on an empty marble island counter for easy plating!
      const marble = find((s) => s.type === 'counter' && s.surface === 'marble' && !s.item);
      if (marble) return { station: marble, label: 'Staging Food' };
      const anyCounter = find((s) => s.type === 'counter' && !s.item);
      if (anyCounter) return { station: anyCounter, label: 'Staging Food' };
    }
    return null;
  }

  // 3. Rescue cooked items from grill or pot before they burn!
  if (mode === 'auto' || mode === 'grill') {
    const readyGrill = find((s) => s.type === 'grill' && s.item && !s.burnt && s.cookTime >= SEAR_PERFECT_START);
    if (readyGrill) return { station: readyGrill, label: 'Pulling Sear' };
    const readyPot = find((s) => s.type === 'pot' && s.item && !s.burnt && s.cookTime >= SIMMER_DONE_TIME);
    if (readyPot) return { station: readyPot, label: 'Pulling Pasta' };
  }

  // 4. Wash dirty plates if sink has plates or dirty tray has plates
  if (mode === 'auto' || mode === 'wash') {
    const sink = find((s) => s.type === 'sink' && s.dirtyCount > 0);
    if (sink) return { station: sink, label: 'Washing' };
    const dirtyTray = find((s) => s.type === 'dirty_return' && s.dirtyCount > 0);
    const plates = find((s) => s.type === 'plates');
    if (dirtyTray && (mode === 'wash' || (plates && plates.plateCount <= 2))) {
      return { station: dirtyTray, label: 'Fetching Dirty' };
    }
  }

  // 5. Finish any raw item already sitting on a chopping board
  if (mode === 'auto' || mode === 'prep') {
    const activeBoard = find((s) => s.type === 'chop' && s.item && s.item.kind === 'raw');
    if (activeBoard) return { station: activeBoard, label: 'Chopping' };

    // Grab tomato or herbs needed by the most urgent order if a board is free
    const freeBoard = find((s) => s.type === 'chop' && !s.item);
    if (freeBoard && orders.orders.length > 0) {
      const urgent = orders.orders[0];
      const wantsTom = urgent.recipe.ingredients.includes('diced_tomato');
      const wantsHerb = urgent.recipe.ingredients.includes('minced_herbs');
      const hasDiced = stations.some((s) => s.item?.id === 'diced_tomato');
      const hasHerbs = stations.some((s) => s.item?.id === 'minced_herbs');
      if (wantsTom && !hasDiced) {
        const crate = find((s) => s.type === 'crate' && s.ingredientId === 'tomato');
        if (crate) return { station: crate, label: 'Getting Tomato' };
      }
      if (wantsHerb && !hasHerbs) {
        const crate = find((s) => s.type === 'crate' && s.ingredientId === 'herbs');
        if (crate) return { station: crate, label: 'Getting Herbs' };
      }
    }
  }

  return null;
}
