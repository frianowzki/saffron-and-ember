// Open-flame kitchen floorplan (12x7 grid) with prep, hearth, marble island, sink, dirty return, and extinguisher.

import { GRID_COLS, GRID_ROWS, KITCHEN_ORIGIN_X, KITCHEN_ORIGIN_Y, TILE_SIZE } from './config.js';

export function createKitchenStations() {
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
      plateCount: type === 'plates' ? 4 : 0,
      dirtyCount: 0,
      washProgress: 0,
      ...extra,
    });
  };

  // North counter (row 0): Fresh produce crates, maple chopping boards, saffron, pasta, copper pot & clean plates
  add(0, 0, 'crate', { ingredientId: 'tomato', label: 'Tomatoes' });
  add(1, 0, 'crate', { ingredientId: 'herbs', label: 'Basil & Garlic' });
  add(2, 0, 'chop', { label: 'Maple Board' });
  add(3, 0, 'counter', { surface: 'oak', label: 'Prep Counter' });
  add(4, 0, 'chop', { label: 'Maple Board' });
  add(5, 0, 'crate', { ingredientId: 'dough', label: 'Flatbread' });
  add(6, 0, 'crate', { ingredientId: 'saffron', label: 'Saffron' });
  add(7, 0, 'crate', { ingredientId: 'pasta', label: 'Pasta' });
  add(8, 0, 'pot', { label: 'Copper Pot' });
  add(9, 0, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(10, 0, 'plates', { label: 'Clean Plates', plateCount: 4 });
  add(11, 0, 'pass', { label: 'Brass Pass' });

  // East wall (col 11): Dual brass pass window, dirty plate return, ceramic wash sink & bin
  add(11, 1, 'pass', { label: 'Brass Pass' });
  add(11, 2, 'counter', { surface: 'marble', label: 'Pass Staging' });
  add(11, 3, 'dirty_return', { label: 'Dirty Return' });
  add(11, 4, 'sink', { label: 'Wash Sink' });
  add(11, 5, 'counter', { surface: 'marble', label: 'Drying Rack' });
  add(11, 6, 'bin', { label: 'Compost Bin' });

  // West wall (col 0): Cold larder, butcher block, fire extinguisher & compost bin
  add(0, 1, 'crate', { ingredientId: 'steak', label: 'Ribeye Cut' });
  add(0, 2, 'crate', { ingredientId: 'salmon', label: 'Wild Salmon' });
  add(0, 3, 'counter', { surface: 'oak', label: 'Butcher Block' });
  add(0, 4, 'extinguisher', { label: 'Fire Extinguisher' });
  add(0, 5, 'bin', { label: 'Compost Bin' });
  add(0, 6, 'counter', { surface: 'oak', label: 'Spice Shelf' });

  // South hearth (row 6): Charcoal skillets, copper stock pot & marble garnish counters
  add(1, 6, 'grill', { label: 'Charcoal Skillet' });
  add(2, 6, 'grill', { label: 'Charcoal Skillet' });
  add(3, 6, 'counter', { surface: 'oak', label: 'Hearth Counter' });
  add(4, 6, 'grill', { label: 'Charcoal Skillet' });
  add(5, 6, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(6, 6, 'pot', { label: 'Copper Pot' });
  add(7, 6, 'counter', { surface: 'oak', label: 'Garnish Counter' });
  add(8, 6, 'counter', { surface: 'marble', label: 'Plating Marble' });
  add(9, 6, 'counter', { surface: 'oak', label: 'Pass Bench' });
  add(10, 6, 'counter', { surface: 'oak', label: 'Tray Bench' });

  // Central Marble Island (row 3, cols 4..7): dual-lane routing hub for assembly
  add(4, 3, 'counter', { surface: 'marble', label: 'Island Marble' });
  add(5, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
  add(6, 3, 'counter', { surface: 'marble', label: 'Island Assembly' });
  add(7, 3, 'counter', { surface: 'marble', label: 'Island Marble' });

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
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
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
