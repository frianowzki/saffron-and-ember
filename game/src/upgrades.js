// Between-shift Kitchen Upgrade Shop: equipment upgrades, Signature Menu unlock, and Chef Perks.

export const UPGRADES = [
  {
    id: 'damascus_knife',
    name: 'Damascus Knife',
    desc: '+45% Chop Speed (All Chefs)',
    cost: 120,
    key: 'chopSpeed',
    bonus: 0.45,
  },
  {
    id: 'turbo_burners',
    name: 'Turbo Burners',
    desc: '+30% Grill Sear & Pot Boil',
    cost: 150,
    key: 'cookSpeed',
    bonus: 0.30,
  },
  {
    id: 'spray_faucet',
    name: 'Pressure Faucet',
    desc: '+60% Dish Wash Speed',
    cost: 110,
    key: 'washSpeed',
    bonus: 0.60,
  },
  {
    id: 'signature_menu',
    name: 'Signature Menu Unlock',
    desc: 'Unlocks VIP Dishes & +20% Revenue',
    cost: 180,
    key: 'scoreBonus',
    bonus: 0.20,
  },
  {
    id: 'extra_plates',
    name: 'Porcelain Stack + Boots',
    desc: '+2 Clean Plates & +18% Chef Speed',
    cost: 130,
    key: 'extraPlates',
    bonus: 2,
    moveBonus: 0.18,
  },
];

export function createUpgradeState() {
  return {
    wallet: 0,
    owned: new Set(),
  };
}

export function getUpgradeModifiers(upgradeState) {
  const mods = {
    chopSpeed: 1,
    cookSpeed: 1,
    washSpeed: 1,
    moveSpeed: 1,
    extraPlates: 0,
    scoreBonus: 1,
    unlockedSignature: false,
  };
  if (!upgradeState) return mods;
  for (const up of UPGRADES) {
    if (upgradeState.owned.has(up.id)) {
      mods[up.key] += up.bonus;
      if (up.moveBonus) mods.moveSpeed += up.moveBonus;
      if (up.id === 'signature_menu') mods.unlockedSignature = true;
    }
  }
  return mods;
}

export function buyUpgrade(upgradeState, upgradeId) {
  const up = UPGRADES.find((u) => u.id === upgradeId);
  if (!up || upgradeState.owned.has(up.id)) return false;
  if (upgradeState.wallet < up.cost) return false;
  upgradeState.wallet -= up.cost;
  upgradeState.owned.add(up.id);
  return true;
}
