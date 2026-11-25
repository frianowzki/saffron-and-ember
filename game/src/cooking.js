// Realistic kitchen mechanics: chopping, grilling (with Perfect Sear & flare-up fire hazard), simmering,
// combinatorial plating, dirty plate return & sink washing, and fire extinguisher dousing.

import {
  CHOP_DURATION,
  CHOP_TAP_BOOST,
  SEAR_BURN_TIME,
  SEAR_PERFECT_END,
  SEAR_PERFECT_START,
  SIMMER_BURN_TIME,
  SIMMER_DONE_TIME,
} from './config.js';
import {
  INGREDIENTS,
  STORAGE_CATALOG,
  canAddToPlate,
  getPreparedKey,
  matchRecipe,
} from './recipes.js';
import { tileToWorld } from './kitchenMap.js';
import {
  addChopBurst,
  addFloatingText,
  addFlourPuff,
  addServeCelebration,
  addSizzleSparks,
  addSteam,
  triggerShake,
} from './particles.js';
import { serveDishOrder } from './orders.js';

const WASH_DURATION = 1.6;
const FIRE_IGNITE_DELAY = 3.2;

export function makePlate(ingredients = [], perfectSear = false) {
  const recipe = matchRecipe(ingredients);
  return {
    kind: 'plate',
    ingredients: [...ingredients],
    recipeId: recipe ? recipe.id : null,
    perfectSear,
  };
}

export function tryCombineOntoPlate(plate, item) {
  if (!plate || plate.kind !== 'plate' || !item) return false;
  const key = getPreparedKey(item);
  if (!key) return false;
  if (!canAddToPlate(plate.ingredients, key)) return false;
  plate.ingredients.push(key);
  if (item.perfect) plate.perfectSear = true;
  const matched = matchRecipe(plate.ingredients);
  plate.recipeId = matched ? matched.id : null;
  return true;
}

export function interactWithStation(state, station) {
  if (!station) return false;
  const { chef, orders, audio, particles } = state;
  const pos = tileToWorld(station.col, station.row);
  const held = chef.holding;

  // Douse an active pan fire!
  if (station.onFire) {
    const boost = held?.kind === 'extinguisher' ? 1.0 : 0.45;
    station.fireProgress += boost;
    addFlourPuff(particles, pos.x, pos.y - 8);
    audio.playDash();
    if (station.fireProgress >= 1.0) {
      station.onFire = false;
      station.fireProgress = 0;
      station.item = null;
      station.cookTime = 0;
      station.burnt = false;
      addFloatingText(particles, pos.x, pos.y - 24, 'Fire Out!', '#8ef5a2', 16);
    }
    return true;
  }

  // Fire Extinguisher station (pick up / return)
  if (station.type === 'extinguisher') {
    if (!held) {
      chef.holding = { kind: 'extinguisher', id: 'extinguisher' };
      audio.playPickup();
      return true;
    }
    if (held.kind === 'extinguisher') {
      chef.holding = null;
      audio.playDrop();
      return true;
    }
    return false;
  }

  // Compost bin discards food or burnt mess (never throws away the extinguisher)
  if (station.type === 'bin') {
    if (held && held.kind !== 'extinguisher') {
      chef.holding = null;
      audio.playDrop();
      addFloatingText(particles, pos.x, pos.y - 16, 'Discarded', '#d8c5a8', 14);
      return true;
    }
    return false;
  }

  // Dirty Plate Return tray
  if (station.type === 'dirty_return') {
    if (!held && station.dirtyCount > 0) {
      station.dirtyCount -= 1;
      chef.holding = { kind: 'dirty_plate', id: 'dirty_plate' };
      audio.playPlateClink();
      return true;
    }
    return false;
  }

  // Ceramic Wash Sink
  if (station.type === 'sink') {
    if (held?.kind === 'dirty_plate') {
      station.dirtyCount += 1;
      chef.holding = null;
      audio.playPlateClink();
      return true;
    }
    if (!held && station.dirtyCount > 0) {
      advanceWash(state, station, 0.52, pos);
      chef.chopAnim = 0.22;
      return true;
    }
    return false;
  }

  // Clean plate stack (finite stack replenished by washing dirty plates!)
  if (station.type === 'plates') {
    if (!held) {
      if (station.plateCount > 0) {
        station.plateCount -= 1;
        chef.holding = makePlate([]);
        audio.playPlateClink();
        return true;
      }
      addFloatingText(particles, pos.x, pos.y - 20, 'Wash dirty plates!', '#ff9f66', 14);
      return false;
    }
    const key = getPreparedKey(held);
    if (key && station.plateCount > 0) {
      const plate = makePlate([]);
      if (tryCombineOntoPlate(plate, held)) {
        station.plateCount -= 1;
        chef.holding = plate;
        audio.playPlateClink();
        return true;
      }
    }
    return false;
  }

  // Smart Storage Appliances (Fridge, Freezer, Pantry): open 4-item picker, or smart-grab on second Space!
  if (station.type === 'fridge' || station.type === 'freezer' || station.type === 'pantry') {
    const items = STORAGE_CATALOG[station.storageKind] ?? [];
    if (!held) {
      if (state.storagePicker && state.storagePicker.station === station) {
        // Second Space press instantly grabs the smart-recommended item!
        const smartId = pickSmartIngredient(state, items);
        chef.holding = { kind: 'raw', id: smartId };
        state.storagePicker = null;
        audio.playPickup();
        return true;
      }
      state.storagePicker = {
        station,
        kind: station.storageKind,
        label: station.label,
        items,
        recommended: pickSmartIngredient(state, items),
      };
      audio.playPickup();
      return true;
    }
    // Convenience: if holding a plate at Pantry, add Saffron or Cheese directly if compatible
    if (held.kind === 'plate' && station.type === 'pantry') {
      for (const id of ['cheese', 'saffron']) {
        if (tryCombineOntoPlate(held, { kind: 'raw', id })) {
          audio.playPlateClink();
          addFloatingText(particles, pos.x, pos.y - 20, `+${INGREDIENTS[id].short}`, '#ffd24c', 14);
          return true;
        }
      }
    }
    return false;
  }

  // Ingredient crate
  if (station.type === 'crate') {
    if (!held) {
      chef.holding = { kind: 'raw', id: station.ingredientId };
      audio.playPickup();
      return true;
    }
    if (held.kind === 'plate') {
      const candidate = { kind: 'raw', id: station.ingredientId };
      if (tryCombineOntoPlate(held, candidate)) {
        audio.playPlateClink();
        addFloatingText(particles, pos.x, pos.y - 20, '+Saffron', '#ffd24c', 14);
        return true;
      }
    }
    return false;
  }

  // Brass Pass Window (serve plated dish & queue dirty plate return!)
  if (station.type === 'pass') {
    if (held && held.kind === 'plate' && held.recipeId) {
      const result = serveDishOrder(orders, held.recipeId, held.perfectSear);
      if (result.matched) {
        chef.holding = null;
        station.item = null;
        state.pendingDirtyReturns.push(4.2);
        audio.playServeBell(result.combo);
        addServeCelebration(particles, pos.x, pos.y - 12);
        triggerShake(particles, 4.5, 0.14);
        const tag = result.perfectBonus > 0 ? ' PERFECT!' : '';
        const comboTag = result.combo > 1 ? ` x${result.combo}` : '';
        addFloatingText(
          particles,
          pos.x - 16,
          pos.y - 22,
          `+$${result.totalEarned}${tag}${comboTag}`,
          result.perfectBonus > 0 ? '#ffe066' : '#8ef5a2',
          20,
        );
        return true;
      }
      audio.playDrop();
      addFloatingText(particles, pos.x - 18, pos.y - 22, 'No matching ticket!', '#ff8b7b', 14);
      return false;
    }
    return false;
  }

  // Chopping board
  if (station.type === 'chop') {
    if (station.item && station.item.kind === 'raw' && INGREDIENTS[station.item.id]?.prep === 'chop') {
      if (!held) {
        advanceChop(station, CHOP_TAP_BOOST, pos, audio, particles);
        chef.chopAnim = 0.22;
        return true;
      }
    }
    if (!station.item && held && held.kind === 'raw' && INGREDIENTS[held.id]?.prep === 'chop') {
      station.item = held;
      station.progress = 0;
      chef.holding = null;
      advanceChop(station, CHOP_TAP_BOOST * 0.7, pos, audio, particles);
      chef.chopAnim = 0.22;
      return true;
    }
    if (station.item && station.item.kind === 'prepared') {
      if (!held) {
        chef.holding = station.item;
        station.item = null;
        station.progress = 0;
        audio.playPickup();
        return true;
      }
      if (held.kind === 'plate' && tryCombineOntoPlate(held, station.item)) {
        station.item = null;
        station.progress = 0;
        audio.playPlateClink();
        return true;
      }
    }
    return false;
  }

  // Charcoal Skillet / Grill & Brick Wood-Fired Oven
  if (station.type === 'grill' || station.type === 'oven') {
    const expectedPrep = station.type === 'oven' ? 'oven' : 'grill';
    if (!station.item && held && held.kind === 'raw' && INGREDIENTS[held.id]?.prep === expectedPrep) {
      station.item = held;
      station.cookTime = 0;
      station.perfect = false;
      station.burnt = false;
      station.onFire = false;
      chef.holding = null;
      audio.playSizzle();
      addSizzleSparks(particles, pos.x, pos.y - 6, 6);
      return true;
    }
    if (station.item) {
      const done = station.cookTime >= SEAR_PERFECT_START;
      if (station.burnt && !held) {
        chef.holding = { kind: 'burnt', id: station.item.id, burnt: true };
        station.item = null;
        station.cookTime = 0;
        station.burnt = false;
        audio.playDrop();
        return true;
      }
      if (done && !station.burnt) {
        const cookedItem = {
          kind: 'prepared',
          id: INGREDIENTS[station.item.id].result,
          perfect: station.cookTime <= SEAR_PERFECT_END,
        };
        if (!held) {
          chef.holding = cookedItem;
          station.item = null;
          station.cookTime = 0;
          audio.playPickup();
          if (cookedItem.perfect) {
            addFloatingText(particles, pos.x, pos.y - 24, 'Perfect Sear!', '#ffe066', 15);
          }
          return true;
        }
        if (held.kind === 'plate' && tryCombineOntoPlate(held, cookedItem)) {
          station.item = null;
          station.cookTime = 0;
          audio.playPlateClink();
          if (cookedItem.perfect) {
            addFloatingText(particles, pos.x, pos.y - 24, 'Perfect Sear!', '#ffe066', 15);
          }
          return true;
        }
      }
    }
    return false;
  }

  // Copper Stock Pot
  if (station.type === 'pot') {
    if (!station.item && held && held.kind === 'raw' && INGREDIENTS[held.id]?.prep === 'pot') {
      station.item = held;
      station.cookTime = 0;
      station.burnt = false;
      chef.holding = null;
      audio.playDrop();
      addSteam(particles, pos.x, pos.y - 10);
      return true;
    }
    if (station.item) {
      if (station.burnt && !held) {
        chef.holding = { kind: 'burnt', id: station.item.id, burnt: true };
        station.item = null;
        station.cookTime = 0;
        station.burnt = false;
        audio.playDrop();
        return true;
      }
      if (station.cookTime >= SIMMER_DONE_TIME && !station.burnt) {
        const cookedItem = {
          kind: 'prepared',
          id: INGREDIENTS[station.item.id].result,
          perfect: station.cookTime <= SIMMER_DONE_TIME + 2.4,
        };
        if (!held) {
          chef.holding = cookedItem;
          station.item = null;
          station.cookTime = 0;
          audio.playPickup();
          return true;
        }
        if (held.kind === 'plate' && tryCombineOntoPlate(held, cookedItem)) {
          station.item = null;
          station.cookTime = 0;
          audio.playPlateClink();
          return true;
        }
      }
    }
    return false;
  }

  // Oak or Marble counter (supports plating & mid-assembly!)
  if (station.type === 'counter') {
    if (!station.item && held) {
      station.item = held;
      chef.holding = null;
      audio.playDrop();
      return true;
    }
    if (station.item && !held) {
      chef.holding = station.item;
      station.item = null;
      audio.playPickup();
      return true;
    }
    if (station.item && station.item.kind === 'plate' && held && held.kind !== 'plate') {
      if (tryCombineOntoPlate(station.item, held)) {
        chef.holding = null;
        audio.playPlateClink();
        if (station.item.recipeId) {
          addFloatingText(particles, pos.x, pos.y - 24, 'Dish Ready!', '#8ef5a2', 15);
        }
        return true;
      }
    }
    if (held && held.kind === 'plate' && station.item && station.item.kind !== 'plate') {
      if (tryCombineOntoPlate(held, station.item)) {
        station.item = null;
        audio.playPlateClink();
        if (held.recipeId) {
          addFloatingText(particles, pos.x, pos.y - 24, 'Dish Ready!', '#8ef5a2', 15);
        }
        return true;
      }
    }
  }

  return false;
}

function advanceWash(state, sink, amount, pos) {
  sink.washProgress = Math.min(WASH_DURATION, sink.washProgress + amount);
  addSteam(state.particles, pos.x, pos.y - 10, 'rgba(185, 232, 255, 0.65)');
  if (sink.washProgress >= WASH_DURATION) {
    sink.washProgress = 0;
    sink.dirtyCount = Math.max(0, sink.dirtyCount - 1);
    const platesStation = state.stations.find((s) => s.type === 'plates');
    if (platesStation) platesStation.plateCount += 1;
    state.audio.playPlateClink();
    addFloatingText(state.particles, pos.x, pos.y - 22, 'Plate Clean!', '#8ee8ff', 14);
  }
}

export function advanceChop(station, amount, pos, audio, particles) {
  station.progress = Math.min(CHOP_DURATION, station.progress + amount);
  const ing = INGREDIENTS[station.item.id];
  audio?.playChop();
  addChopBurst(particles, pos.x, pos.y - 6, ing?.color ?? '#d93829', 6);
  if (station.progress >= CHOP_DURATION) {
    station.item = {
      kind: 'prepared',
      id: ing.result,
      perfect: false,
    };
    station.progress = 0;
    addFloatingText(particles, pos.x, pos.y - 22, 'Chopped!', '#a3f0b5', 14);
  }
}

export function updateCookingStations(state, dt) {
  const { stations, chef, particles, audio } = state;

  // Return dirty plates to the dirty_return tray after dishes are eaten
  if (state.pendingDirtyReturns.length > 0) {
    const tray = stations.find((s) => s.type === 'dirty_return');
    for (let i = state.pendingDirtyReturns.length - 1; i >= 0; i--) {
      state.pendingDirtyReturns[i] -= dt;
      if (state.pendingDirtyReturns[i] <= 0) {
        state.pendingDirtyReturns.splice(i, 1);
        if (tray) tray.dirtyCount += 1;
      }
    }
  }

  // Active washing flag for faucet water stream & bubbles
  for (const st of stations) {
    st.isWashing = false;
  }

  // Update Overcooked-2 style thrown 3D ingredients in parabolic flight!
  updateThrownItems(state, dt);

  const chopMult = state.upgradeMods?.chopSpeed ?? 1;
  const cookMult = state.upgradeMods?.cookSpeed ?? 1;
  const washMult = state.upgradeMods?.washSpeed ?? 1;

  for (const st of stations) {
    const pos = tileToWorld(st.col, st.row);

    // Hold-to-chop on chopping board
    if (
      st.type === 'chop' &&
      st.item &&
      st.item.kind === 'raw' &&
      !chef.holding &&
      state.input.interactHeld &&
      chef.facingStation === st
    ) {
      st.progress += dt * chopMult;
      chef.chopAnim = 0.16;
      if (Math.random() < dt * 8) {
        const ing = INGREDIENTS[st.item.id];
        addChopBurst(particles, pos.x, pos.y - 6, ing?.color ?? '#d93829', 3);
        audio.playChop();
      }
      if (st.progress >= CHOP_DURATION) {
        const ing = INGREDIENTS[st.item.id];
        st.item = { kind: 'prepared', id: ing.result, perfect: false };
        st.progress = 0;
        addFloatingText(particles, pos.x, pos.y - 22, 'Chopped!', '#a3f0b5', 14);
      }
    }

    // Hold-to-wash at ceramic sink
    if (
      st.type === 'sink' &&
      st.dirtyCount > 0 &&
      !chef.holding &&
      state.input.interactHeld &&
      chef.facingStation === st
    ) {
      st.isWashing = true;
      advanceWash(state, st, dt * washMult, pos);
      chef.chopAnim = 0.16;
    }

    // Active grill searing & brick oven baking + realistic grease fire if left burning too long
    if ((st.type === 'grill' || st.type === 'oven') && st.item) {
      st.cookTime += dt * (st.cookTime < SEAR_PERFECT_START ? cookMult : 1);
      if (st.cookTime >= SEAR_BURN_TIME && !st.burnt) {
        st.burnt = true;
        addFloatingText(particles, pos.x, pos.y - 24, 'Burnt!', '#ff624d', 15);
      }
      if (st.burnt && !st.onFire && st.cookTime >= SEAR_BURN_TIME + FIRE_IGNITE_DELAY) {
        st.onFire = true;
        addFloatingText(particles, pos.x, pos.y - 28, 'PAN FIRE!', '#ff3b2f', 17);
        audio.playOrderExpired();
      }
      if (Math.random() < dt * (st.onFire ? 10 : st.burnt ? 7 : 4.5)) {
        if (st.onFire) {
          addSizzleSparks(particles, pos.x, pos.y - 10, 4);
          addSteam(particles, pos.x, pos.y - 14, 'rgba(38, 28, 24, 0.65)');
        } else if (st.burnt) {
          addSteam(particles, pos.x, pos.y - 12, 'rgba(42, 34, 30, 0.55)');
        } else {
          addSizzleSparks(particles, pos.x, pos.y - 6, 2);
          addSteam(particles, pos.x, pos.y - 12, 'rgba(255, 245, 224, 0.42)');
        }
      }
    }

    // Active copper pot simmering
    if (st.type === 'pot' && st.item) {
      st.cookTime += dt * (st.cookTime < SIMMER_DONE_TIME ? cookMult : 1);
      if (st.cookTime >= SIMMER_BURN_TIME && !st.burnt) {
        st.burnt = true;
        addFloatingText(particles, pos.x, pos.y - 24, 'Overboiled!', '#ff624d', 15);
      }
      if (Math.random() < dt * 4.5) {
        addSteam(
          particles,
          pos.x,
          pos.y - 14,
          st.burnt ? 'rgba(55, 45, 38, 0.55)' : 'rgba(255, 248, 225, 0.48)',
        );
      }
    }

    // Gentle steam off ready plated dishes
    if (st.item && st.item.kind === 'plate' && st.item.recipeId && Math.random() < dt * 2.2) {
      addSteam(particles, pos.x, pos.y - 16, 'rgba(255, 252, 236, 0.42)');
    }
  }
}

export function selectStorageItem(state, index) {
  if (!state.storagePicker) return false;
  const id = state.storagePicker.items[index];
  if (!id || state.chef.holding) return false;
  state.chef.holding = { kind: 'raw', id };
  state.storagePicker = null;
  state.audio.playPickup();
  return true;
}

function pickSmartIngredient(state, items) {
  const urgent = state.orders.orders[0];
  if (urgent) {
    for (const id of items) {
      const res = INGREDIENTS[id]?.result;
      if (urgent.recipe.ingredients.includes(res)) return id;
    }
  }
  return items[0];
}

export function throwHeldItem(state) {
  const { chef, audio } = state;
  const held = chef.holding;
  if (!held || held.kind !== 'raw') return false;

  const dist = 240;
  const startX = chef.x + chef.facingX * 18;
  const startY = chef.y + chef.facingY * 18;
  const targetX = startX + chef.facingX * dist;
  const targetY = startY + chef.facingY * dist;

  state.thrownItems.push({
    item: held,
    startX,
    startY,
    targetX,
    targetY,
    x: startX,
    y: startY,
    t: 0,
    duration: 0.36,
  });
  chef.holding = null;
  audio.playDash();
  return true;
}

function updateThrownItems(state, dt) {
  if (!state.thrownItems || state.thrownItems.length === 0) return;
  const { grid, chefs, audio, particles } = state;

  for (let i = state.thrownItems.length - 1; i >= 0; i--) {
    const proj = state.thrownItems[i];
    proj.t += dt / proj.duration;
    const progress = Math.min(1, proj.t);
    proj.x = proj.startX + (proj.targetX - proj.startX) * progress;
    proj.y = proj.startY + (proj.targetY - proj.startY) * progress;

    // Check catch by the other chef mid-flight
    for (const c of chefs) {
      if (!c.holding && progress > 0.25 && Math.hypot(c.x - proj.x, c.y - proj.y) < 42) {
        c.holding = proj.item;
        audio.playPickup();
        addFloatingText(particles, c.x, c.y - 24, 'Caught!', '#9ef0b0', 14);
        state.thrownItems.splice(i, 1);
        proj.caught = true;
        break;
      }
    }
    if (proj.caught) continue;

    if (progress >= 1) {
      // Land on target station if compatible (chop, grill, pot, or empty counter)
      const col = Math.floor((proj.x - 196) / 74);
      const row = Math.floor((proj.y - 136) / 74);
      const st = grid[row]?.[col] ?? null;
      const ing = INGREDIENTS[proj.item.id];
      if (st && !st.item && !st.onFire) {
        if (st.type === 'counter' || (st.type === 'chop' && ing?.prep === 'chop')) {
          st.item = proj.item;
          st.progress = 0;
          audio.playDrop();
        } else if (st.type === 'grill' && ing?.prep === 'grill') {
          st.item = proj.item;
          st.cookTime = 0;
          audio.playSizzle();
        } else if (st.type === 'pot' && ing?.prep === 'pot') {
          st.item = proj.item;
          st.cookTime = 0;
          audio.playDrop();
        }
      }
      state.thrownItems.splice(i, 1);
    }
  }
}
