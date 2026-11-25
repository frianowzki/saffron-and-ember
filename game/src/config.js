// Core dimensions, kitchen layout geometry, timing constants, color palette, and shift definitions.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const ORDER_RAIL_H = 114;
export const HUD_BAR_H = 50;

export const GRID_COLS = 12;
export const GRID_ROWS = 7;
export const TILE_SIZE = 74;

export const KITCHEN_ORIGIN_X = Math.floor((CANVAS_W - GRID_COLS * TILE_SIZE) / 2);
export const KITCHEN_ORIGIN_Y = ORDER_RAIL_H + 22;

export const CHEF_SPEED = 290;
export const CHEF_DASH_SPEED = 620;
export const CHEF_DASH_DURATION = 0.14;
export const CHEF_DASH_COOLDOWN = 0.72;
export const CHEF_RADIUS = 22;

export const CHOP_DURATION = 1.45;
export const CHOP_TAP_BOOST = 0.32;
export const SEAR_PERFECT_START = 3.2;
export const SEAR_PERFECT_END = 5.4;
export const SEAR_BURN_TIME = 7.4;
export const SIMMER_DONE_TIME = 3.6;
export const SIMMER_BURN_TIME = 8.4;

export const MAX_ACTIVE_ORDERS = 5;

export const PALETTE = {
  bgDark: '#1c1511',
  railWood: '#2b1d15',
  railBrass: '#d9a441',
  floorLight: '#e9dcc6',
  floorSage: '#d4decb',
  floorGrout: '#c5b79f',
  wallWarm: '#3d2a1f',
  wallTrim: '#c88c42',
  oakTop: '#c48d53',
  oakFront: '#8c5a2b',
  oakEdge: '#e0b47c',
  marbleTop: '#f3efe6',
  marbleVein: '#dcd4c4',
  marbleFront: '#bdb4a4',
  ironDark: '#262322',
  ironRim: '#4a4340',
  emberGlow: '#ff6b2b',
  copperTop: '#c96f3b',
  copperHighlight: '#f2a66d',
  passBrass: '#e3b34c',
  passLampGlow: 'rgba(255, 214, 128, 0.34)',
  ticketPaper: '#fbf6e8',
  ticketInk: '#2c2017',
  urgentRed: '#d93829',
  perfectGold: '#f2b705',
  freshGreen: '#3b8c52',
  cream: '#fff9ed',
};

export const SHIFTS = [
  {
    id: 'lunch',
    name: 'Lunch Service',
    subtitle: 'Sunlit Bistro · Warm-Up Rush',
    durationSec: 150,
    spawnInterval: 10.5,
    minInterval: 6.2,
    rushStartSec: 45,
    starThresholds: [180, 320, 480],
    allowedRecipes: ['bruschetta', 'herb_steak', 'saffron_pasta'],
    vipChance: 0.14,
  },
  {
    id: 'twilight',
    name: 'Twilight Bistro',
    subtitle: 'Open-Flame Dinner · Dual Hearth',
    durationSec: 180,
    spawnInterval: 9.2,
    minInterval: 5.0,
    rushStartSec: 55,
    starThresholds: [260, 460, 680],
    allowedRecipes: ['bruschetta', 'herb_steak', 'saffron_pasta', 'seared_salmon', 'ember_flatbread'],
    vipChance: 0.22,
  },
  {
    id: 'grand',
    name: 'Grand Tasting',
    subtitle: 'Chef\'s Counter · Full Menu & VIPs',
    durationSec: 210,
    spawnInterval: 8.2,
    minInterval: 4.2,
    rushStartSec: 65,
    starThresholds: [360, 620, 900],
    allowedRecipes: ['bruschetta', 'herb_steak', 'saffron_pasta', 'seared_salmon', 'ember_flatbread', 'bouillabaisse'],
    vipChance: 0.32,
  },
];
