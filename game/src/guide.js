// Contextual New-Player Hint & Next-Step Guide: reads live kitchen state & urgent order
// and displays a clear, single-line coaching tip so new players immediately know what to do.

import { INGREDIENTS, PREPARED, RECIPE_BY_ID } from './recipes.js';

export function getContextualHint(state) {
  const { chef, stations, orders } = state;

  // Priority 1: Pan fire emergency
  if (stations.some((s) => s.onFire)) {
    if (chef.holding?.kind === 'extinguisher') {
      return { text: 'PAN FIRE! Walk to the burning skillet and press Space to douse!', urgent: true };
    }
    return { text: 'PAN FIRE! Grab the Red Extinguisher on the left counter (or press Space at the fire)!', urgent: true };
  }

  // Priority 2: Low plates warning
  const platesSt = stations.find((s) => s.type === 'plates');
  const dirtyCount = stations.reduce((sum, s) => sum + (s.dirtyCount || 0), 0);
  if (platesSt && platesSt.plateCount === 0 && dirtyCount > 0 && chef.holding?.kind !== 'plate') {
    return { text: 'Out of clean plates! Pick up Dirty Plates on the right and wash them at the Sink [Space].', urgent: true };
  }

  // Priority 3: Advice based on what the player is currently holding
  const held = chef.holding;
  if (held) {
    if (held.burnt) {
      return { text: 'Food burnt — drop it in a dark Compost Bin [Space] or press Q to discard.', urgent: false };
    }
    if (held.kind === 'dirty_plate') {
      return { text: 'Holding Dirty Plate — drop into the blue Wash Sink [Space] and hold Space to wash!', urgent: false };
    }
    if (held.kind === 'plate') {
      if (held.recipeId) {
        const name = RECIPE_BY_ID[held.recipeId]?.shortName ?? 'Dish';
        return { text: `${name} is READY! Deliver it to the glowing Brass Pass [SERVE] on the right!`, urgent: false };
      }
      const nextOrd = orders.orders[0];
      if (nextOrd) {
        const missing = nextOrd.recipe.ingredients
          .filter((k) => !held.ingredients.includes(k))
          .map((k) => PREPARED[k]?.short ?? k);
        if (missing.length > 0) {
          return { text: `Plating ${nextOrd.recipe.shortName}: still needs ${missing.join(' + ')}. Combine on Marble Counters!`, urgent: false };
        }
      }
      return { text: 'Empty Plate — place on a Marble Island counter or pick up prepared food to combine!', urgent: false };
    }
    if (held.kind === 'raw') {
      const ing = INGREDIENTS[held.id];
      if (ing?.prep === 'chop') {
        return { text: `Holding ${ing.label} — take to a Maple Chopping Board (or press F to throw!) and hold Space.`, urgent: false };
      }
      if (ing?.prep === 'grill') {
        return { text: `Holding ${ing.label} — place on a bottom Charcoal Skillet [Space] and pull in the gold PERFECT zone!`, urgent: false };
      }
      if (ing?.prep === 'pot') {
        return { text: `Holding ${ing.label} — boil in a Copper Stock Pot [Space] until READY!`, urgent: false };
      }
      return { text: `Holding ${ing?.label ?? held.id} — ready to plate directly onto any Dish Plate!`, urgent: false };
    }
    if (held.kind === 'prepared') {
      const prep = PREPARED[held.id];
      return { text: `${prep?.label ?? held.id} ready! Combine with a Clean Plate [top-right] or a plate on the Marble Island.`, urgent: false };
    }
  }

  // Priority 4: Guide the player through the most urgent active order
  const urgentOrder = orders.orders[0];
  if (urgentOrder) {
    const steps = urgentOrder.recipe.ingredients
      .map((k) => {
        const p = PREPARED[k];
        const verb = p?.method === 'chop' ? 'Chop' : p?.method === 'grill' ? 'Grill' : p?.method === 'pot' ? 'Boil' : 'Add';
        return `${verb} ${p?.short ?? k}`;
      })
      .join(' -> ');
    return {
      text: `Next Order (${urgentOrder.recipe.shortName}): ${steps} -> Plate -> SERVE!  [1-4] Command AI Sofia`,
      urgent: false,
    };
  }

  return {
    text: 'WASD / Click to move · Space Act · F Throw · Tab Switch Chef · B Toggle AI Sofia · H Toggle Guide',
    urgent: false,
  };
}
