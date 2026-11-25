// Mouth-watering procedural Canvas 2D food, ingredients, mid-assembly plates, and finished gourmet dishes.

import { RECIPE_BY_ID } from './recipes.js';

export function drawItem(ctx, item, x, y, scale = 1, time = 0) {
  if (!item) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (item.burnt) {
    drawBurntMess(ctx);
    ctx.restore();
    return;
  }

  if (item.kind === 'plate') {
    drawPlate(ctx, item, time);
    ctx.restore();
    return;
  }

  if (item.kind === 'raw') {
    drawRawIngredient(ctx, item.id);
    ctx.restore();
    return;
  }

  if (item.kind === 'prepared') {
    drawPreparedIngredient(ctx, item.id, item.perfect);
    ctx.restore();
    return;
  }

  ctx.restore();
}

export function drawRawIngredient(ctx, id) {
  switch (id) {
    case 'tomato': {
      // Heirloom tomato with specular highlight and leafy green stem
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(-5, -5, 3, 0, 0, 17);
      grad.addColorStop(0, '#ff6a52');
      grad.addColorStop(0.55, '#d93223');
      grad.addColorStop(1, '#8c1911');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 1, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-6, -4, 5, 2.5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Green calyx star
      ctx.fillStyle = '#3d8f44';
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(Math.cos(a) * 8, -10 + Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a + 0.4) * 3, -10 + Math.sin(a + 0.4) * 2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'herbs': {
      // Lush basil leaves + ivory garlic clove
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const leaves = [
        [-8, -2, -0.5, '#2d7a40'],
        [7, -4, 0.45, '#3b9950'],
        [0, 3, 0.1, '#4db362'],
      ];
      for (const [lx, ly, rot, col] of leaves) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(220,255,220,0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Garlic bulb
      ctx.fillStyle = '#f7eed9';
      ctx.strokeStyle = '#cbb89a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(8, 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'steak': {
      // Marbled raw ribeye cut
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 19, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f2ded2';
      ctx.beginPath();
      ctx.ellipse(0, 1, 19, 13, -0.15, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createLinearGradient(-15, -8, 15, 10);
      grad.addColorStop(0, '#cc3d3d');
      grad.addColorStop(1, '#8f1f24');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 1, 16, 10.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Marbling veins
      ctx.strokeStyle = 'rgba(255, 232, 222, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.quadraticCurveTo(-2, 3, 5, -4);
      ctx.moveTo(-4, 6);
      ctx.quadraticCurveTo(3, 2, 11, 5);
      ctx.stroke();
      break;
    }

    case 'salmon': {
      // Coral wild salmon fillet with glistening white stripes
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 19, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4e5b63';
      ctx.beginPath();
      ctx.roundRect(-18, -7, 36, 17, 7);
      ctx.fill();

      const grad = ctx.createLinearGradient(-16, -9, 16, 8);
      grad.addColorStop(0, '#ff9872');
      grad.addColorStop(1, '#e65c3e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-17, -9, 34, 15, 6);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 232, 218, 0.78)';
      ctx.lineWidth = 1.7;
      for (let sx = -11; sx <= 11; sx += 6) {
        ctx.beginPath();
        ctx.moveTo(sx, -8);
        ctx.quadraticCurveTo(sx + 3, -1, sx - 1, 5);
        ctx.stroke();
      }
      break;
    }

    case 'dough': {
      // Flour-dusted artisan flatbread dough ball
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(-4, -5, 3, 0, 1, 17);
      grad.addColorStop(0, '#fff7e6');
      grad.addColorStop(0.65, '#ebd1a7');
      grad.addColorStop(1, '#c79f67');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 1, 17, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flour dusting marks
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(5, -6);
      ctx.moveTo(-5, 3);
      ctx.lineTo(8, 0);
      ctx.stroke();
      break;
    }

    case 'pasta': {
      // Golden hand-rolled tagliatelle nest
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d49422';
      ctx.lineWidth = 3.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 1, 14 - i * 2.3, 10 - i * 1.5, i * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffd966';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(-1, -1, 12 - i * 2.5, 8 - i * 1.5, i * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'cheese': {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 11, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf9ee';
      ctx.beginPath();
      ctx.ellipse(0, 1, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(232, 196, 72, 0.65)';
      ctx.beginPath();
      ctx.arc(-2, -1, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'saffron': {
      // Glowing glass apothecary jar of golden saffron glaze
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 13, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(-3, 0, 2, 0, 3, 14);
      grad.addColorStop(0, '#ffe46b');
      grad.addColorStop(0.55, '#f08c18');
      grad.addColorStop(1, '#b8480c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-11, -6, 22, 19, 6);
      ctx.fill();

      // Cork lid
      ctx.fillStyle = '#a87443';
      ctx.beginPath();
      ctx.roundRect(-7, -13, 14, 8, 2);
      ctx.fill();

      // Glass sheen
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-8, -3, 3.5, 11);
      break;
    }
  }
}

export function drawPreparedIngredient(ctx, id, isPerfect = false) {
  if (isPerfect) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 220, 90, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  switch (id) {
    case 'diced_tomato': {
      const pieces = [
        [-8, -4, '#e63929'], [3, -6, '#ff5b47'], [-2, 4, '#c92618'],
        [8, 2, '#e63929'], [-9, 5, '#ff5b47'], [2, -1, '#d93223'],
      ];
      for (const [px, py, col] of pieces) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(px - 4.5, py - 4, 9, 8, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(px - 2.5, py - 2.5, 3, 2);
      }
      break;
    }

    case 'minced_herbs': {
      const specks = [
        [-9, -3, '#2d8a42'], [-3, -7, '#4bbf63'], [5, -5, '#2b7a3d'],
        [9, 1, '#4bbf63'], [2, 6, '#369c4c'], [-6, 5, '#2d8a42'],
        [0, 0, '#f5ecd4'], [-4, 2, '#f5ecd4'], [6, -1, '#f5ecd4'],
      ];
      for (const [px, py, col] of specks) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(px, py, 4.2, 2.8, px * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'seared_steak': {
      const grad = ctx.createRadialGradient(-4, -3, 2, 0, 1, 18);
      grad.addColorStop(0, '#8c4427');
      grad.addColorStop(0.7, '#5c2614');
      grad.addColorStop(1, '#3b150a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 1, 17, 11.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Crosshatch grill marks
      ctx.strokeStyle = 'rgba(24, 10, 6, 0.8)';
      ctx.lineWidth = 2.2;
      for (let g = -9; g <= 9; g += 6) {
        ctx.beginPath();
        ctx.moveTo(g - 4, -7);
        ctx.lineTo(g + 4, 8);
        ctx.stroke();
      }
      // Melting herb butter pat
      ctx.fillStyle = '#ffe580';
      ctx.beginPath();
      ctx.ellipse(1, -1, 5, 3.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'seared_salmon': {
      const grad = ctx.createLinearGradient(-16, -9, 16, 9);
      grad.addColorStop(0, '#ffae70');
      grad.addColorStop(0.6, '#e06738');
      grad.addColorStop(1, '#9c3b1c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-16, -8, 32, 16, 6);
      ctx.fill();

      // Golden sear glaze lines
      ctx.strokeStyle = 'rgba(92, 28, 12, 0.65)';
      ctx.lineWidth = 2;
      for (let sx = -9; sx <= 9; sx += 6) {
        ctx.beginPath();
        ctx.moveTo(sx - 2, -7);
        ctx.lineTo(sx + 2, 7);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 240, 200, 0.45)';
      ctx.fillRect(-12, -5, 20, 3);
      break;
    }

    case 'toasted_flatbread': {
      const grad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 18);
      grad.addColorStop(0, '#f2c97d');
      grad.addColorStop(0.75, '#cc8e3d');
      grad.addColorStop(1, '#8c5319');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 1, 18, 12.5, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Blistered char bubbles
      ctx.fillStyle = 'rgba(66, 32, 12, 0.62)';
      for (const [bx, by, r] of [[-7, -3, 2.8], [5, -4, 2.4], [8, 4, 2.6], [-3, 5, 2.2]]) {
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'simmered_pasta': {
      ctx.fillStyle = '#f5c644';
      ctx.beginPath();
      ctx.ellipse(0, 1, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d98f18';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 1, 4 + i * 2.8, i * 0.7, i * 0.7 + Math.PI * 1.45);
        ctx.stroke();
      }
      ctx.strokeStyle = '#fff0a6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-2, -1, 7, 0.2, 2.4);
      ctx.stroke();
      break;
    }

    case 'cheese': {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 11, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf9ee';
      ctx.beginPath();
      ctx.ellipse(0, 1, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(232, 196, 72, 0.65)';
      ctx.beginPath();
      ctx.arc(-2, -1, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'saffron': {
      drawRawIngredient(ctx, 'saffron');
      break;
    }
  }
}

export function drawPlate(ctx, plate, time = 0) {
  const isComplete = Boolean(plate.recipeId);

  // Warm golden aura when a dish is finished and ready to serve
  if (isComplete) {
    const pulse = 0.24 + Math.sin(time * 5.5) * 0.08;
    ctx.fillStyle = `rgba(255, 212, 74, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.fill();
  }

  // Contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warm porcelain plate outer rim
  const rimGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 25);
  rimGrad.addColorStop(0, '#ffffff');
  rimGrad.addColorStop(0.8, '#f0e9dc');
  rimGrad.addColorStop(1, '#cfc5b4');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();

  // Inner well & subtle terracotta bistro rim stripe
  ctx.strokeStyle = isComplete ? '#d9a441' : '#b89f82';
  ctx.lineWidth = isComplete ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
  ctx.stroke();

  if (isComplete) {
    drawPlatedRecipe(ctx, plate.recipeId);
    if (plate.perfectSear) {
      // Small golden star badge for Perfect Sear
      ctx.fillStyle = '#ffe052';
      ctx.strokeStyle = '#5e3c05';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(17, -15, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5e3c05';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 17, -14.5);
    }
    return;
  }

  // Mid-assembly plate: render each added component visibly layered on the plate
  const list = plate.ingredients || [];
  const offsets = [
    [0, 2],
    [-6, -4],
    [6, -3],
    [0, -6],
  ];
  list.forEach((key, idx) => {
    const [ox, oy] = offsets[idx % offsets.length];
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(0.72, 0.72);
    if (key === 'saffron') {
      ctx.fillStyle = 'rgba(242, 148, 24, 0.72)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawPreparedIngredient(ctx, key, false);
    }
    ctx.restore();
  });

  // Subtle mid-assembly indicator dots along bottom edge of plate
  if (list.length > 0) {
    ctx.fillStyle = 'rgba(44, 32, 23, 0.72)';
    ctx.beginPath();
    ctx.roundRect(-14, 15, 28, 9, 4);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < list.length ? '#7ce896' : 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(-7 + i * 7, 19.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawPlatedRecipe(ctx, recipeId) {
  switch (recipeId) {
    case 'garlic_shrimp':
    case 'surf_and_turf': {
      ctx.fillStyle = 'rgba(232, 92, 52, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(0.84, 0.84);
      drawPreparedIngredient(ctx, 'seared_steak');
      ctx.translate(4, -3);
      drawPreparedIngredient(ctx, 'minced_herbs');
      ctx.restore();
      break;
    }
    case 'mushroom_pasta': {
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'simmered_pasta');
      ctx.fillStyle = '#8c5e3c';
      ctx.beginPath();
      ctx.arc(-5, -2, 5, 0, Math.PI * 2);
      ctx.arc(6, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf9ee';
      ctx.beginPath();
      ctx.arc(1, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'chicken_flatbread': {
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'toasted_flatbread');
      ctx.fillStyle = '#c97b38';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2b01e';
      ctx.fillRect(-6, -5, 5, 5);
      ctx.fillRect(3, 2, 5, 5);
      ctx.restore();
      break;
    }
    case 'burrata_flatbread': {
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'toasted_flatbread');
      ctx.translate(0, -1);
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.fillStyle = '#fdf9ee';
      ctx.beginPath();
      ctx.arc(0, -1, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'burrata_pasta': {
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'simmered_pasta');
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.fillStyle = '#fdf9ee';
      ctx.beginPath();
      ctx.arc(0, -1, 7.5, 0, Math.PI * 2);
      ctx.fill();
      drawPreparedIngredient(ctx, 'minced_herbs');
      ctx.restore();
      break;
    }
    case 'bruschetta': {
      // Toasted flatbread topped with jewel diced tomatoes & fresh basil drizzle
      ctx.save();
      ctx.scale(0.86, 0.86);
      drawPreparedIngredient(ctx, 'toasted_flatbread');
      ctx.translate(0, -2);
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.translate(0, -1);
      drawPreparedIngredient(ctx, 'minced_herbs');
      ctx.restore();
      break;
    }
    case 'herb_steak': {
      // Glazed ribeye steak sliced with emerald gremolata & jus
      ctx.fillStyle = 'rgba(110, 38, 18, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(0.9, 0.9);
      drawPreparedIngredient(ctx, 'seared_steak');
      ctx.translate(3, -3);
      ctx.scale(0.75, 0.75);
      drawPreparedIngredient(ctx, 'minced_herbs');
      ctx.restore();
      break;
    }
    case 'saffron_pasta': {
      // Golden saffron broth pool + twirled pasta + crimson tomato crown
      ctx.fillStyle = 'rgba(245, 166, 35, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'simmered_pasta');
      ctx.scale(0.72, 0.72);
      ctx.translate(0, -2);
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.restore();
      break;
    }
    case 'seared_salmon': {
      // Saffron velouté swoosh + crispy salmon + herb gremolata
      ctx.fillStyle = 'rgba(245, 152, 24, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 10, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'seared_salmon');
      ctx.translate(2, -4);
      ctx.scale(0.7, 0.7);
      drawPreparedIngredient(ctx, 'minced_herbs');
      ctx.restore();
      break;
    }
    case 'ember_flatbread': {
      // Artisan flatbread loaded with charred steak strips & heirloom tomatoes
      ctx.save();
      ctx.scale(0.92, 0.92);
      drawPreparedIngredient(ctx, 'toasted_flatbread');
      ctx.scale(0.78, 0.78);
      ctx.translate(-2, -1);
      drawPreparedIngredient(ctx, 'seared_steak');
      ctx.translate(6, 2);
      ctx.scale(0.72, 0.72);
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.restore();
      break;
    }
    case 'bouillabaisse': {
      // Grand saffron broth bowl with silky pasta, crispy salmon & tomato
      const broth = ctx.createRadialGradient(0, 0, 3, 0, 0, 17);
      broth.addColorStop(0, '#ffd452');
      broth.addColorStop(0.65, '#e87a1c');
      broth.addColorStop(1, '#a83c0c');
      ctx.fillStyle = broth;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(0.74, 0.74);
      drawPreparedIngredient(ctx, 'simmered_pasta');
      ctx.translate(0, -3);
      ctx.scale(0.88, 0.88);
      drawPreparedIngredient(ctx, 'seared_salmon');
      ctx.translate(4, 3);
      ctx.scale(0.65, 0.65);
      drawPreparedIngredient(ctx, 'diced_tomato');
      ctx.restore();
      break;
    }
  }
}

export function drawRecipeThumbnail(ctx, recipeId, x, y, scale = 0.82) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawPlate(ctx, { kind: 'plate', ingredients: RECIPE_BY_ID[recipeId]?.ingredients ?? [], recipeId }, 0);
  ctx.restore();
}

function drawBurntMess(ctx) {
  ctx.fillStyle = '#292220';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 11, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141110';
  ctx.beginPath();
  ctx.arc(-4, -1, 7, 0, Math.PI * 2);
  ctx.arc(5, 2, 6, 0, Math.PI * 2);
  ctx.fill();
}
