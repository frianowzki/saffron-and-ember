// Unified keyboard and mouse input controller (WASD/Arrows + Space/E + Shift + Click-to-walk/interact).

import { CANVAS_H, CANVAS_W, GRID_COLS, GRID_ROWS } from './config.js';
import { worldToTile } from './kitchenMap.js';
import { commandChefToStation, commandChefToTile } from './chef.js';

export function createInputController(canvas, state, callbacks) {
  const keys = new Set();
  const input = {
    moveX: 0,
    moveY: 0,
    interactPressed: false,
    interactHeld: false,
    dashPressed: false,
    discardPressed: false,
  };

  const toCanvasCoords = (evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((evt.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  window.addEventListener('keydown', (evt) => {
    const code = evt.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      evt.preventDefault();
    }
    state.audio.unlock();

    if (code === 'KeyP' || code === 'Escape') {
      if (state.mode === 'playing') state.mode = 'paused';
      else if (state.mode === 'paused') state.mode = 'playing';
      return;
    }
    if (code === 'KeyM') {
      state.audio.toggleMute();
      return;
    }
    if (state.mode === 'title' && (code === 'Enter' || code === 'Space')) {
      callbacks.startShift(state.selectedShiftIndex);
      return;
    }

    if (!keys.has(code)) {
      if (code === 'Space' || code === 'KeyE') input.interactPressed = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') input.dashPressed = true;
      if (code === 'KeyQ' || code === 'KeyX') input.discardPressed = true;
    }
    keys.add(code);
  });

  window.addEventListener('keyup', (evt) => {
    keys.delete(evt.code);
  });

  canvas.addEventListener('mousemove', (evt) => {
    const pt = toCanvasCoords(evt);
    state.mouse.x = pt.x;
    state.mouse.y = pt.y;

    if (state.mode === 'playing') {
      const { col, row } = worldToTile(pt.x, pt.y);
      if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        state.hoveredStation = state.grid[row][col];
      } else {
        state.hoveredStation = null;
      }
    } else {
      state.hoveredStation = null;
    }
  });

  canvas.addEventListener('mousedown', (evt) => {
    state.audio.unlock();
    const pt = toCanvasCoords(evt);
    state.mouse.x = pt.x;
    state.mouse.y = pt.y;

    // Check UI overlay / sidebar buttons first
    for (let i = state.uiButtons.length - 1; i >= 0; i--) {
      const btn = state.uiButtons[i];
      if (pt.x >= btn.x && pt.x <= btn.x + btn.w && pt.y >= btn.y && pt.y <= btn.y + btn.h) {
        callbacks.handleButton(btn.id);
        return;
      }
    }

    if (state.mode !== 'playing') return;

    const { col, row } = worldToTile(pt.x, pt.y);
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      const station = state.grid[row][col];
      if (station) {
        commandChefToStation(state, station);
      } else {
        commandChefToTile(state, col, row);
      }
    }
  });

  return {
    state: input,
    poll() {
      let mx = 0;
      let my = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
      input.moveX = mx;
      input.moveY = my;
      input.interactHeld = keys.has('Space') || keys.has('KeyE');
    },
    endFrame() {
      input.interactPressed = false;
      input.dashPressed = false;
      input.discardPressed = false;
    },
  };
}
