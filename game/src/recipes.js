// Ingredient catalog, prep/cooking transformations, and combinatorial recipe matcher.

export const INGREDIENTS = {
  tomato: {
    id: 'tomato',
    label: 'Tomato',
    short: 'Tom',
    color: '#d93829',
    accent: '#4a9e48',
    prep: 'chop',
    result: 'diced_tomato',
    rawPlateable: false,
  },
  herbs: {
    id: 'herbs',
    label: 'Basil & Garlic',
    short: 'Herb',
    color: '#3c9952',
    accent: '#f5ebd6',
    prep: 'chop',
    result: 'minced_herbs',
    rawPlateable: false,
  },
  steak: {
    id: 'steak',
    label: 'Ribeye Cut',
    short: 'Steak',
    color: '#b83232',
    accent: '#f5d7c8',
    prep: 'grill',
    result: 'seared_steak',
    rawPlateable: false,
  },
  salmon: {
    id: 'salmon',
    label: 'Wild Salmon',
    short: 'Salm',
    color: '#f07855',
    accent: '#ffd0ba',
    prep: 'grill',
    result: 'seared_salmon',
    rawPlateable: false,
  },
  dough: {
    id: 'dough',
    label: 'Flatbread Dough',
    short: 'Bread',
    color: '#edd7b0',
    accent: '#cfa86e',
    prep: 'grill',
    result: 'toasted_flatbread',
    rawPlateable: false,
  },
  pasta: {
    id: 'pasta',
    label: 'Golden Pasta',
    short: 'Pasta',
    color: '#f2c14e',
    accent: '#d99a26',
    prep: 'pot',
    result: 'simmered_pasta',
    rawPlateable: false,
  },
  saffron: {
    id: 'saffron',
    label: 'Saffron Glaze',
    short: 'Saff',
    color: '#e87a1c',
    accent: '#ffd24c',
    prep: 'none',
    result: 'saffron',
    rawPlateable: true,
  },
};

export const PREPARED = {
  diced_tomato: { id: 'diced_tomato', label: 'Diced Tomato', short: 'Diced Tom', base: 'tomato', method: 'chop' },
  minced_herbs: { id: 'minced_herbs', label: 'Herb Gremolata', short: 'Herbs', base: 'herbs', method: 'chop' },
  seared_steak: { id: 'seared_steak', label: 'Seared Ribeye', short: 'Steak', base: 'steak', method: 'grill' },
  seared_salmon: { id: 'seared_salmon', label: 'Crispy Salmon', short: 'Salmon', base: 'salmon', method: 'grill' },
  toasted_flatbread: { id: 'toasted_flatbread', label: 'Char Flatbread', short: 'Bread', base: 'dough', method: 'grill' },
  simmered_pasta: { id: 'simmered_pasta', label: 'Silky Pasta', short: 'Pasta', base: 'pasta', method: 'pot' },
  saffron: { id: 'saffron', label: 'Saffron Glaze', short: 'Saffron', base: 'saffron', method: 'none' },
};

export const RECIPES = [
  {
    id: 'bruschetta',
    name: 'Herb Bruschetta',
    shortName: 'Bruschetta',
    ingredients: ['toasted_flatbread', 'diced_tomato', 'minced_herbs'],
    basePrice: 36,
    timeLimit: 48,
    accent: '#d94832',
  },
  {
    id: 'herb_steak',
    name: 'Charred Herb Steak',
    shortName: 'Herb Steak',
    ingredients: ['seared_steak', 'minced_herbs'],
    basePrice: 44,
    timeLimit: 44,
    accent: '#8f2d24',
  },
  {
    id: 'saffron_pasta',
    name: 'Saffron Tomato Pasta',
    shortName: 'Saffron Pasta',
    ingredients: ['simmered_pasta', 'diced_tomato', 'saffron'],
    basePrice: 48,
    timeLimit: 50,
    accent: '#e08b1b',
  },
  {
    id: 'seared_salmon',
    name: 'Pan-Seared Salmon',
    shortName: 'Saffron Salmon',
    ingredients: ['seared_salmon', 'saffron', 'minced_herbs'],
    basePrice: 54,
    timeLimit: 48,
    accent: '#e86842',
  },
  {
    id: 'ember_flatbread',
    name: 'Ember Steak Flatbread',
    shortName: 'Steak Bread',
    ingredients: ['toasted_flatbread', 'seared_steak', 'diced_tomato'],
    basePrice: 58,
    timeLimit: 52,
    accent: '#b54626',
  },
  {
    id: 'bouillabaisse',
    name: 'Saffron Bouillabaisse',
    shortName: 'Bouillabaisse',
    ingredients: ['seared_salmon', 'simmered_pasta', 'diced_tomato', 'saffron'],
    basePrice: 78,
    timeLimit: 62,
    accent: '#d95d1e',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function isPreparedItem(item) {
  if (!item || item.burnt) return false;
  if (item.kind === 'prepared') return true;
  if (item.kind === 'raw' && INGREDIENTS[item.id]?.rawPlateable) return true;
  return false;
}

export function getPreparedKey(item) {
  if (!item || item.burnt) return null;
  if (item.kind === 'prepared') return item.id;
  if (item.kind === 'raw' && INGREDIENTS[item.id]?.rawPlateable) return item.id;
  return null;
}

export function matchRecipe(plateIngredients) {
  if (!plateIngredients || plateIngredients.length === 0) return null;
  const sorted = [...plateIngredients].sort().join('|');
  for (const recipe of RECIPES) {
    const target = [...recipe.ingredients].sort().join('|');
    if (sorted === target) return recipe;
  }
  return null;
}

export function canAddToPlate(plateIngredients, candidateKey) {
  if (!candidateKey || plateIngredients.includes(candidateKey)) return false;
  const nextSet = [...plateIngredients, candidateKey];
  return RECIPES.some((recipe) =>
    nextSet.every((ing) => recipe.ingredients.includes(ing)),
  );
}

export function getPossibleRecipes(plateIngredients) {
  if (!plateIngredients || plateIngredients.length === 0) return [];
  return RECIPES.filter((recipe) =>
    plateIngredients.every((ing) => recipe.ingredients.includes(ing)),
  );
}
