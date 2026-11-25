// Open-flame kitchen floorplan (12x7) with Fridge (produce), Freezer (meats), Pantry,
// Wood-Fired Oven, Charcoal Skillets, Copper Pots, Maple Boards, Sink, and zero unreachable corner crates!

import { GRID_COLS, GRID_ROWS, KITCHEN_ORIGIN_X, KITCHEN_ORIGIN_Y, TILE_SIZE } from './config.js';

export function createKitchenStations(layoutIndex = 1, extraPlates = 0) {
  const stations = [];
  const add = (col, row, type, extra = {}) => {
    stations.push({
      id: `${type}_${col}_${row}`,
      col,
      row,
      type,
      item: null,
      progress: 0,
      cookTime: 0,
      perfect: false,
      burnt: false,
      onFire: false,
      fireProgress: 0,
      plateCount: type === 'plates' ? 4 + extraPlates : 0,
      dirtyCount: 0,
      washProgress: 0,
      ...extra,
    });
  };

  // North row (row 0): Corner (0,0) is decorative shelf — ALL interactive stations easily reachable!
  add(0, 0, 'counter', { surface: 'oak', label: 'Spice Corner' });
  add(1, 0, 'fridge', { label: 'Produce Fridge', storageKind: 'fridge' });
  add(2, 0, 'chop', { label: 'Maple Board' });
  add(3, 0, 'counter', { surface: 'oak', label: 'Prep Counter' });
  add(4, 0, 'chop', { label: 'Maple Board' });
  add(5, 0, 'pantry', { label: 'Artisan Pantry', storageKind: 'pantry' });
  add(6, 0, 'counter', { surface: 'oak', label: 'Dry Prep' });
  add(7, 0, 'crate', { ingredientId: 'tomato', label: 'Fresh Tomatoes' });
  add(8, 0, 'pot', { label: 'Copper Pot' });
  add(9, 0, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(10, 0, 'plates', { label: 'Clean Plates', plateCount: 4 + extraPlates });
  add(11, 0, 'counter', { surface: 'oak', label: 'Pass Corner' });

  // East wall (col 11): Dual Brass Pass Window, Staging, Dirty Return, Ceramic Wash Sink
  add(11, 1, 'pass', { label: 'Brass Pass' });
  add(11, 2, 'pass', { label: 'Brass Pass' });
  add(11, 3, 'dirty_return', { label: 'Dirty Return' });
  add(11, 4, 'sink', { label: 'Wash Sink' });
  add(11, 5, 'counter', { surface: 'marble', label: 'Drying Rack' });
  add(11, 6, 'bin', { label: 'Compost Bin' });

  // West wall (col 0): Cold Meat/Seafood Freezer, Butcher Block, Fire Extinguisher, Bin
  add(0, 1, 'counter', { surface: 'oak', label: 'Larder Bench' });
  add(0, 2, 'freezer', { label: 'Meat Freezer', storageKind: 'freezer' });
  add(0, 3, 'counter', { surface: 'oak', label: 'Butcher Block' });
  add(0, 4, 'extinguisher', { label: 'Fire Extinguisher' });
  add(0, 5, 'bin', { label: 'Compost Bin' });
  add(0, 6, 'counter', { surface: 'oak', label: 'Herb Corner' });

  // South hearth (row 6): Cast-Iron Charcoal Skillets, Brick Wood-Fired Oven, Copper Stock Pot
  add(1, 6, 'grill', { label: 'Charcoal Skillet' });
  add(2, 6, 'grill', { label: 'Charcoal Skillet' });
  add(3, 6, 'counter', { surface: 'oak', label: 'Hearth Counter' });
  add(4, 6, 'oven', { label: 'Wood-Fired Oven' });
  add(5, 6, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(6, 6, 'pot', { label: 'Copper Pot' });
  add(7, 6, 'counter', { surface: 'oak', label: 'Garnish Counter' });
  add(8, 6, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(9, 6, 'counter', { surface: 'oak', label: 'Pass Bench' });
  add(10, 6, 'counter', { surface: 'oak', label: 'Tray Bench' });

  // Shift-specific central marble island layouts
  if (layoutIndex === 0) {
    add(5, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
    add(6, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
  } else if (layoutIndex === 2) {
    add(3, 3, 'counter', { surface: 'marble', label: 'West Island' });
    add(4, 3, 'counter', { surface: 'marble', label: 'West Assembly' });
    add(7, 3, 'counter', { surface: 'marble', label: 'East Assembly' });
    add(8, 3, 'counter', { surface: 'marble', label: 'East Island' });
  } else {
    add(4, 3, 'counter', { surface: 'marble', label: 'Island Marble' });
    add(5, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
    add(6, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
    add(7, 3, 'counter', { surface: 'marble', label: 'Island Marble' });
  }

  return stations;
}

export function buildStationGrid(stations) {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
  for (const st of stations) {
    if (st.row >= 0 && st.row < GRID_ROWS && st.col >= 0 && st.col < GRID_COLS) {
      grid[st.row][st.col] = st;
    }
  }
  return grid;
}

export function tileToWorld(col, row) {
  return {
    x: KITCHEN_ORIGIN_X + (col + 0.5) * TILE_SIZE,
    y: KITCHEN_ORIGIN_Y + (row + 0.5) * TILE_SIZE,
  };
}

export function worldToTile(x, y) {
  const col = Math.floor((x - KITCHEN_ORIGIN_X) / TILE_SIZE);
  const row = Math.floor((y - KITCHEN_ORIGIN_Y) / TILE_SIZE);
  return { col, row };
}

export function isWalkable(grid, col, row) {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  return grid[row][col] === null;
}

export function findPathToAdjacent(grid, startCol, startRow, targetCol, targetRow) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const goals = new Set();
  if (isWalkable(grid, targetCol, targetRow)) {
    goals.add(`${targetCol},${targetRow}`);
  } else {
    for (const [dc, dr] of dirs) {
      const nc = targetCol + dc;
      const nr = targetRow + dr;
      if (isWalkable(grid, nc, nr)) goals.add(`${nc},${nr}`);
    }
  }
  if (goals.size === 0) return [];
  const startKey = `${startCol},${startRow}`;
  if (goals.has(startKey)) return [{ col: startCol, row: startRow }];

  const queue = [{ col: startCol, row: startRow }];
  const parent = new Map([[startKey, null]]);

  while (queue.length > 0) {
    const cur = queue.shift();
    const curKey = `${cur.col},${cur.row}`;
    if (goals.has(curKey)) {
      const path = [];
      let node = cur;
      while (node) {
        path.push(node);
        node = parent.get(`${node.col},${node.row}`);
      }
      path.reverse();
      return path;
    }
    for (const [dc, dr] of dirs) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      const key = `${nc},${nr}`;
      if (!parent.has(key) && isWalkable(grid, nc, nr)) {
        parent.set(key, cur);
        queue.push({ col: nc, row: nr });
      }
    }
  }
  return [];
}
