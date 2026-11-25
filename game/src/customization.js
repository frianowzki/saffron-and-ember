// Chef customization catalog: 3D Hat styles, Bistro Apron/Scarf palettes, and Chef Role Perks.

export const HAT_STYLES = [
  { id: 'toque', name: 'Pleated Toque' },
  { id: 'beret', name: 'Bistro Beret' },
  { id: 'bandana', name: 'Ember Bandana' },
  { id: 'crown', name: 'Master Crown' },
];

export const OUTFIT_COLORS = [
  { id: 'saffron', name: 'Saffron', scarf: 0xe05e1b, apron: 0x3d281d, hex: '#e05e1b' },
  { id: 'sage', name: 'Emerald', scarf: 0x2f9454, apron: 0x244734, hex: '#2f9454' },
  { id: 'cobalt', name: 'Cobalt', scarf: 0x2b6cb0, apron: 0x1e354f, hex: '#2b6cb0' },
  { id: 'burgundy', name: 'Burgundy', scarf: 0x9e2a3b, apron: 0x3d1920, hex: '#9e2a3b' },
  { id: 'gold', name: 'Gold', scarf: 0xd99816, apron: 0x3b2e17, hex: '#d99816' },
];

export const CHEF_PERKS = [
  { id: 'blade', name: 'Blade Master', desc: '+25% Chop Speed', chopBonus: 0.25, cookBonus: 0, speedBonus: 0 },
  { id: 'flame', name: 'Flame Tamer', desc: '+22% Sear Speed', chopBonus: 0, cookBonus: 0.22, speedBonus: 0 },
  { id: 'turbo', name: 'Turbo Dash', desc: '+18% Move Speed', chopBonus: 0, cookBonus: 0, speedBonus: 0.18 },
];

export function createCustomizationState() {
  return {
    hatIndex: 0,
    colorIndex: 0,
    perkIndex: 0,
  };
}

export function getActiveCustomization(cust) {
  return {
    hat: HAT_STYLES[cust.hatIndex % HAT_STYLES.length],
    color: OUTFIT_COLORS[cust.colorIndex % OUTFIT_COLORS.length],
    perk: CHEF_PERKS[cust.perkIndex % CHEF_PERKS.length],
  };
}
