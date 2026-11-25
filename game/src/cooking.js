// Station cooking logic: chopping, grilling (with Perfect Sear bonus window), simmering, plating, and serving.

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
  canAddToPlate,
  getPreparedKey,
  matchRecipe,
} from './recipes.js';
import { tileToWorld } from './kitchenMap.js';
import {
  addChopBurst,
  addFloatingText,
  addServeCelebration,
  addSizzleSparks,
  addSteam,
  triggerShake,
} from './particles.js';
import { serveDishOrder } from './orders.js';

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

  // Compost bin discards anything
  if (station.type === 'bin') {
    if (held) {
      chef.holding = null;
      audio.playDrop();
      addFloatingText(particles, pos.x, pos.y - 16, 'Discarded', '#d8c5a8', 14);
      return true;
    }
    return false;
  }

  // Clean plate stack
  if (station.type === 'plates') {
    if (!held) {
      chef.holding = makePlate([]);
      audio.playPlateClink();
      return true;
    }
    // If holding a prepared ingredient, plate it immediately!
    const key = getPreparedKey(held);
    if (key) {
      const plate = makePlate([]);
      if (tryCombineOntoPlate(plate, held)) {
        chef.holding = plate;
        audio.playPlateClink();
        return true;
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
    // Convenience: if holding a plate and crate is saffron (raw-plateable), add directly!
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

  // Brass Pass Window (serve plated dish)
  if (station.type === 'pass') {
    if (held && held.kind === 'plate' && held.recipeId) {
      const result = serveDishOrder(orders, held.recipeId, held.perfectSear);
      if (result.matched) {
        chef.holding = null;
        station.item = null;
        audio.playServeBell(result.combo);
        addServeCelebration(particles, pos.x, pos.y - 12);
        triggerShake(particles, 5, 0.16);
        const tag = result.perfectBonus > 0 ? ' PERFECT!' : '';
        const comboTag = result.combo > 1 ? ` x${result.combo}` : '';
        addFloatingText(
          particles,
          pos.x - 24,
          pos.y - 28,
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
    // Active chop tap if raw choppable item is already on the board
    if (station.item && station.item.kind === 'raw' && INGREDIENTS[station.item.id]?.prep === 'chop') {
      if (!held) {
        advanceChop(station, CHOP_TAP_BOOST, pos, audio, particles);
        chef.chopAnim = 0.22;
        return true;
      }
    }
    // Place raw choppable ingredient on empty board
    if (!station.item && held && held.kind === 'raw' && INGREDIENTS[held.id]?.prep === 'chop') {
      station.item = held;
      station.progress = 0;
      chef.holding = null;
      advanceChop(station, CHOP_TAP_BOOST * 0.7, pos, audio, particles);
      chef.chopAnim = 0.22;
      return true;
    }
    // Pick up finished chopped item (or plate directly if chef holds a plate!)
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

  // Charcoal Skillet / Grill
  if (station.type === 'grill') {
    if (!station.item && held && held.kind === 'raw' && INGREDIENTS[held.id]?.prep === 'grill') {
      station.item = held;
      station.cookTime = 0;
      station.perfect = false;
      station.burnt = false;
      chef.holding = null;
      audio.playSizzle();
      addSizzleSparks(particles, pos.x, pos.y - 6, 6);
      return true;
    }
    if (station.item) {
      const done = station.cookTime >= SEAR_PERFECT_START;
      const burnt = station.burnt;
      if (burnt && !held) {
        chef.holding = { kind: 'burnt', id: station.item.id, burnt: true };
        station.item = null;
        station.cookTime = 0;
        station.burnt = false;
        audio.playDrop();
        return true;
      }
      if (done && !burnt) {
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

  // Standard oak or marble counter (supports plating & mid-assembly!)
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
    // Combine held prepared item onto plate sitting on counter
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
    // Combine counter prepared item onto held plate
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

  for (const st of stations) {
    const pos = tileToWorld(st.col, st.row);

    // Hold-to-chop when standing at a chopping board with a raw item
    if (
      st.type === 'chop' &&
      st.item &&
      st.item.kind === 'raw' &&
      !chef.holding &&
      state.input.interactHeld &&
      chef.facingStation === st
    ) {
      st.progress += dt;
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

    // Active grill searing
    if (st.type === 'grill' && st.item) {
      st.cookTime += dt;
      if (st.cookTime >= SEAR_BURN_TIME && !st.burnt) {
        st.burnt = true;
        addFloatingText(particles, pos.x, pos.y - 24, 'Burnt!', '#ff624d', 15);
      }
      if (Math.random() < dt * (st.burnt ? 7 : 4.5)) {
        if (st.burnt) {
          addSteam(particles, pos.x, pos.y - 12, 'rgba(42, 34, 30, 0.55)');
        } else {
          addSizzleSparks(particles, pos.x, pos.y - 6, 2);
          addSteam(particles, pos.x, pos.y - 12, 'rgba(255, 245, 224, 0.42)');
        }
      }
    }

    // Active copper pot simmering
    if (st.type === 'pot' && st.item) {
      st.cookTime += dt;
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

    // Gentle steam off ready plated dishes on marble counters
    if (st.item && st.item.kind === 'plate' && st.item.recipeId && Math.random() < dt * 2.2) {
      addSteam(particles, pos.x, pos.y - 16, 'rgba(255, 252, 236, 0.42)');
    }
  }
}
