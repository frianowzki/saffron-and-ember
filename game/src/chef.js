// Chef movement, dash boost, keyboard + mouse click-to-path steering, and station targeting.

import {
  CHEF_DASH_COOLDOWN,
  CHEF_DASH_DURATION,
  CHEF_DASH_SPEED,
  CHEF_RADIUS,
  CHEF_SPEED,
  GRID_COLS,
  GRID_ROWS,
  KITCHEN_ORIGIN_X,
  KITCHEN_ORIGIN_Y,
  TILE_SIZE,
} from './config.js';
import {
  findPathToAdjacent,
  isWalkable,
  tileToWorld,
  worldToTile,
} from './kitchenMap.js';
import { addFlourPuff } from './particles.js';
import { interactWithStation } from './cooking.js';

export function createChef() {
  const start = tileToWorld(5, 2);
  return {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    facingX: 0,
    facingY: 1,
    holding: null,
    facingStation: null,
    dashTimer: 0,
    dashCooldown: 0,
    walkCycle: 0,
    chopAnim: 0,
    path: [],
    queuedStation: null,
  };
}

export function commandChefToStation(state, station) {
  const { chef, grid } = state;
  const cur = worldToTile(chef.x, chef.y);
  const path = findPathToAdjacent(grid, cur.col, cur.row, station.col, station.row);
  if (path.length > 0) {
    chef.path = path.slice(1);
    chef.queuedStation = station;
  }
}

export function commandChefToTile(state, col, row) {
  const { chef, grid } = state;
  if (!isWalkable(grid, col, row)) return;
  const cur = worldToTile(chef.x, chef.y);
  const path = findPathToAdjacent(grid, cur.col, cur.row, col, row);
  if (path.length > 0) {
    chef.path = path.slice(1);
    chef.queuedStation = null;
  }
}

export function updateChef(state, dt) {
  const { chef, input, grid, audio, particles } = state;

  if (chef.dashCooldown > 0) chef.dashCooldown = Math.max(0, chef.dashCooldown - dt);
  if (chef.dashTimer > 0) chef.dashTimer = Math.max(0, chef.dashTimer - dt);
  if (chef.chopAnim > 0) chef.chopAnim = Math.max(0, chef.chopAnim - dt);

  let moveX = input.moveX;
  let moveY = input.moveY;

  // Manual keyboard movement cancels click-to-move path
  if (moveX !== 0 || moveY !== 0) {
    chef.path = [];
    chef.queuedStation = null;
  } else if (chef.path.length > 0) {
    const nextTile = chef.path[0];
    const target = tileToWorld(nextTile.col, nextTile.row);
    const dx = target.x - chef.x;
    const dy = target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      chef.path.shift();
    } else {
      moveX = dx / dist;
      moveY = dy / dist;
    }
  } else if (chef.queuedStation) {
    // Arrived adjacent to queued station: face it and interact
    const st = chef.queuedStation;
    const target = tileToWorld(st.col, st.row);
    const dx = target.x - chef.x;
    const dy = target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      chef.facingX = dx / dist;
      chef.facingY = dy / dist;
    }
    chef.facingStation = st;
    interactWithStation(state, st);
    chef.queuedStation = null;
  }

  const len = Math.hypot(moveX, moveY);
  if (len > 0.01) {
    moveX /= len;
    moveY /= len;
    chef.facingX = moveX;
    chef.facingY = moveY;
    chef.walkCycle += dt * (chef.dashTimer > 0 ? 18 : 11);
  }

  if (input.dashPressed && chef.dashCooldown <= 0 && (len > 0.01 || chef.facingX !== 0 || chef.facingY !== 0)) {
    chef.dashTimer = CHEF_DASH_DURATION;
    chef.dashCooldown = CHEF_DASH_COOLDOWN;
    audio.playDash();
    addFlourPuff(particles, chef.x, chef.y + 10);
  }

  const speed = chef.dashTimer > 0 ? CHEF_DASH_SPEED : CHEF_SPEED;
  const vx = (chef.dashTimer > 0 && len < 0.01 ? chef.facingX : moveX) * speed;
  const vy = (chef.dashTimer > 0 && len < 0.01 ? chef.facingY : moveY) * speed;

  moveWithCollision(chef, grid, vx * dt, 0);
  moveWithCollision(chef, grid, 0, vy * dt);

  chef.facingStation = findFacingStation(chef, grid);

  if (input.interactPressed && chef.facingStation) {
    interactWithStation(state, chef.facingStation);
  }
  if (input.discardPressed && chef.holding) {
    chef.holding = null;
    audio.playDrop();
  }
}

function moveWithCollision(chef, grid, dx, dy) {
  const nextX = chef.x + dx;
  const nextY = chef.y + dy;
  if (!collidesWithKitchen(grid, nextX, nextY, CHEF_RADIUS)) {
    chef.x = nextX;
    chef.y = nextY;
  }
}

function collidesWithKitchen(grid, x, y, radius) {
  const minX = KITCHEN_ORIGIN_X + radius;
  const maxX = KITCHEN_ORIGIN_X + GRID_COLS * TILE_SIZE - radius;
  const minY = KITCHEN_ORIGIN_Y + radius;
  const maxY = KITCHEN_ORIGIN_Y + GRID_ROWS * TILE_SIZE - radius;
  if (x < minX || x > maxX || y < minY || y > maxY) return true;

  const sampleOffsets = [
    [-radius, -radius],
    [radius, -radius],
    [-radius, radius],
    [radius, radius],
  ];
  for (const [ox, oy] of sampleOffsets) {
    const { col, row } = worldToTile(x + ox, y + oy);
    if (!isWalkable(grid, col, row)) return true;
  }
  return false;
}

function findFacingStation(chef, grid) {
  const probeDist = TILE_SIZE * 0.68;
  const px = chef.x + chef.facingX * probeDist;
  const py = chef.y + chef.facingY * probeDist;
  const primary = worldToTile(px, py);
  if (
    primary.col >= 0 && primary.col < GRID_COLS &&
    primary.row >= 0 && primary.row < GRID_ROWS &&
    grid[primary.row][primary.col]
  ) {
    return grid[primary.row][primary.col];
  }

  // Fallback: nearest adjacent station within interaction reach
  const cur = worldToTile(chef.x, chef.y);
  let best = null;
  let bestDist = Infinity;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const c = cur.col + dc;
    const r = cur.row + dr;
    if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS && grid[r][c]) {
      const w = tileToWorld(c, r);
      const d = Math.hypot(w.x - px, w.y - py);
      if (d < bestDist) {
        bestDist = d;
        best = grid[r][c];
      }
    }
  }
  return bestDist < TILE_SIZE * 1.15 ? best : null;
}
