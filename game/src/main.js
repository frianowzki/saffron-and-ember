// Saffron & Ember bootstrap, fixed-timestep loop, scene management, and live gameplay showcase states.

import { CANVAS_H, CANVAS_W, SHIFTS } from './config.js';
import { createAudioEngine } from './audio.js';
import { createChef } from './chef.js';
import { makePlate, updateCookingStations } from './cooking.js';
import { createInputController } from './input.js';
import { buildStationGrid, createKitchenStations, tileToWorld } from './kitchenMap.js';
import { createOrderManager, spawnOrder, updateOrders } from './orders.js';
import {
  addChopBurst,
  addFloatingText,
  addSizzleSparks,
  addSteam,
  createParticleSystem,
  renderParticles,
  updateParticles,
} from './particles.js';
import { renderHud } from './renderHud.js';
import { renderKitchen } from './renderKitchen.js';
import { updateChef } from './chef.js';

const canvas = document.getElementById('kitchen-canvas');
const ctx = canvas.getContext('2d');

const audio = createAudioEngine();

const state = {
  mode: 'title',
  selectedShiftIndex: 1,
  shift: SHIFTS[1],
  timeLeft: SHIFTS[1].durationSec,
  stations: [],
  grid: [],
  chef: createChef(),
  orders: createOrderManager(SHIFTS[1]),
  particles: createParticleSystem(),
  audio,
  input: null,
  mouse: { x: 0, y: 0 },
  hoveredStation: null,
  uiButtons: [],
  elapsed: 0,
};

function setupKitchen(shiftIndex) {
  state.selectedShiftIndex = shiftIndex;
  state.shift = SHIFTS[shiftIndex];
  state.timeLeft = state.shift.durationSec;
  state.stations = createKitchenStations();
  state.grid = buildStationGrid(state.stations);
  state.chef = createChef();
  state.orders = createOrderManager(state.shift);
  state.particles = createParticleSystem();
  state.hoveredStation = null;

  // Populate two inviting opening orders right away
  const first = spawnOrder(state.orders, state.shift.allowedRecipes[0], false);
  const second = spawnOrder(state.orders, state.shift.allowedRecipes[1 % state.shift.allowedRecipes.length], false);
  if (first) first.slideIn = 0;
  if (second) second.slideIn = 0;
}

function startShift(shiftIndex) {
  setupKitchen(shiftIndex);
  state.mode = 'playing';
}

function handleButton(id) {
  if (id.startsWith('shift_')) {
    const idx = Number(id.slice(6));
    if (SHIFTS[idx]) {
      state.selectedShiftIndex = idx;
      state.shift = SHIFTS[idx];
      audio.playPickup();
    }
    return;
  }
  if (id === 'start_shift') {
    startShift(state.selectedShiftIndex);
    audio.playServeBell(1);
    return;
  }
  if (id === 'mute') {
    audio.toggleMute();
    return;
  }
  if (id === 'pause') {
    if (state.mode === 'playing') state.mode = 'paused';
    else if (state.mode === 'paused') state.mode = 'playing';
    return;
  }
  if (id === 'resume') {
    state.mode = 'playing';
    return;
  }
  if (id === 'restart') {
    startShift(state.selectedShiftIndex);
    return;
  }
  if (id === 'next_shift') {
    startShift(Math.min(SHIFTS.length - 1, state.selectedShiftIndex + 1));
    return;
  }
  if (id === 'to_title') {
    setupKitchen(state.selectedShiftIndex);
    state.mode = 'title';
  }
}

const inputController = createInputController(canvas, state, { startShift, handleButton });
state.input = inputController.state;

setupKitchen(1);

// Optional live preview presets for testing specific mid-shift states cleanly in desktop Chrome
function applyQueryPreset() {
  const params = new URLSearchParams(window.location.search);
  const preset = params.get('preset');
  if (!preset) return;

  if (preset === 'title') {
    setupKitchen(1);
    state.mode = 'title';
    return;
  }

  if (preset === 'rush') {
    setupKitchen(1);
    state.mode = 'playing';
    state.timeLeft = 42;
    state.orders.orders = [];
    const o1 = spawnOrder(state.orders, 'bruschetta', false);
    if (o1) { o1.timeLeft = 22; o1.slideIn = 0; }
    const o2 = spawnOrder(state.orders, 'seared_salmon', true);
    if (o2) { o2.timeLeft = 30; o2.slideIn = 0; }
    const o3 = spawnOrder(state.orders, 'herb_steak', false);
    if (o3) { o3.timeLeft = 10; o3.slideIn = 0; }
    const o4 = spawnOrder(state.orders, 'saffron_pasta', false);
    if (o4) { o4.timeLeft = 40; o4.slideIn = 0; }
    state.orders.score = 385;
    state.orders.tipsEarned = 94;
    state.orders.servedCount = 7;
    state.orders.perfectCount = 4;
    state.orders.combo = 4;
    state.orders.bestCombo = 4;
    state.orders.rushActive = true;

    // Ingredients on counters, chopping in progress, searing steak & salmon, simmering pasta,
    // dish mid-assembly on the marble island, and a finished plated dish ready on the brass pass!
    const at = (c, r) => state.grid[r][c];
    at(2, 0).item = { kind: 'raw', id: 'tomato' };
    at(2, 0).progress = 0.88;
    at(4, 0).item = { kind: 'prepared', id: 'minced_herbs' };
    at(3, 0).item = { kind: 'prepared', id: 'diced_tomato' };
    at(8, 0).item = { kind: 'raw', id: 'pasta' };
    at(8, 0).cookTime = 4.1;
    at(1, 6).item = { kind: 'raw', id: 'steak' };
    at(1, 6).cookTime = 4.2; // Golden Perfect Sear!
    at(2, 6).item = { kind: 'raw', id: 'salmon' };
    at(2, 6).cookTime = 2.4;
    at(4, 6).item = { kind: 'raw', id: 'dough' };
    at(4, 6).cookTime = 3.8;
    at(5, 3).item = makePlate(['toasted_flatbread', 'diced_tomato'], false); // Dish mid-assembly!
    at(6, 3).item = makePlate(['seared_salmon', 'saffron'], true); // Second dish mid-assembly!
    at(11, 2).item = makePlate(['seared_steak', 'minced_herbs'], true); // Finished plated dish ready beside pass!

    const chefPos = tileToWorld(9, 2);
    state.chef.x = chefPos.x;
    state.chef.y = chefPos.y;
    state.chef.facingX = 1;
    state.chef.facingY = 0;
    state.chef.holding = makePlate(['toasted_flatbread', 'diced_tomato', 'minced_herbs'], true);
    state.chef.facingStation = at(11, 1);

    // Rich live particles (steam, sizzle, floating tip popup)
    const pSteak = tileToWorld(1, 6);
    addSizzleSparks(state.particles, pSteak.x, pSteak.y - 6, 8);
    addSteam(state.particles, pSteak.x, pSteak.y - 16);
    const pPot = tileToWorld(8, 0);
    addSteam(state.particles, pPot.x, pPot.y - 16);
    const pPass = tileToWorld(11, 1);
    addFloatingText(state.particles, pPass.x - 42, pPass.y - 24, '+$62 PERFECT! x4', '#ffe066', 20);
    return;
  }

  if (preset === 'prep') {
    setupKitchen(2);
    state.mode = 'playing';
    state.timeLeft = 118;
    state.orders.orders = [];
    const o1 = spawnOrder(state.orders, 'bouillabaisse', true);
    if (o1) { o1.timeLeft = 44; o1.slideIn = 0; }
    const o2 = spawnOrder(state.orders, 'ember_flatbread', false);
    if (o2) { o2.timeLeft = 29; o2.slideIn = 0; }
    const o3 = spawnOrder(state.orders, 'seared_salmon', false);
    if (o3) { o3.timeLeft = 36; o3.slideIn = 0; }
    state.orders.score = 215;
    state.orders.tipsEarned = 48;
    state.orders.servedCount = 4;
    state.orders.perfectCount = 2;
    state.orders.combo = 2;
    state.orders.bestCombo = 3;

    const at = (c, r) => state.grid[r][c];
    at(2, 0).item = { kind: 'raw', id: 'tomato' };
    at(2, 0).progress = 0.95;
    at(3, 0).item = { kind: 'prepared', id: 'minced_herbs' };
    at(1, 6).item = { kind: 'raw', id: 'salmon' };
    at(1, 6).cookTime = 4.3;
    at(2, 6).item = { kind: 'raw', id: 'steak' };
    at(2, 6).cookTime = 2.6;
    at(6, 6).item = { kind: 'raw', id: 'pasta' };
    at(6, 6).cookTime = 3.9;
    at(5, 3).item = makePlate(['simmered_pasta', 'diced_tomato', 'saffron'], false);
    at(7, 3).item = makePlate(['toasted_flatbread', 'seared_steak', 'diced_tomato'], true);

    const chefPos = tileToWorld(2, 1);
    state.chef.x = chefPos.x;
    state.chef.y = chefPos.y;
    state.chef.facingX = 0;
    state.chef.facingY = -1;
    state.chef.chopAnim = 0.18;
    state.chef.facingStation = at(2, 0);

    const pBoard = tileToWorld(2, 0);
    addChopBurst(state.particles, pBoard.x, pBoard.y - 6, '#e63929', 10);
    const pGrill = tileToWorld(1, 6);
    addSizzleSparks(state.particles, pGrill.x, pGrill.y - 6, 8);
    return;
  }

  if (preset === 'summary') {
    setupKitchen(1);
    state.mode = 'summary';
    state.timeLeft = 0;
    state.orders.score = 724;
    state.orders.tipsEarned = 186;
    state.orders.servedCount = 13;
    state.orders.perfectCount = 8;
    state.orders.bestCombo = 6;
    state.orders.expiredCount = 1;
  }
}

applyQueryPreset();

let lastFrame = performance.now();

function tick(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state.elapsed += dt;

  inputController.poll();

  if (state.mode === 'playing') {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    updateChef(state, dt);
    updateCookingStations(state, dt);
    updateOrders(state.orders, dt, state.timeLeft, audio, state.particles);
    if (state.timeLeft <= 0) {
      state.mode = 'summary';
      audio.playShiftComplete();
    }
  }

  updateParticles(state.particles, dt);

  // Render scene
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#1b1410';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (state.particles.shakeTime > 0) {
    const sx = (Math.random() - 0.5) * state.particles.shakePower * 2;
    const sy = (Math.random() - 0.5) * state.particles.shakePower * 2;
    ctx.translate(sx, sy);
  }

  state.uiButtons = [];
  renderKitchen(ctx, state, state.elapsed);
  renderParticles(ctx, state.particles);
  renderHud(ctx, state, state.elapsed);
  ctx.restore();

  inputController.endFrame();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
