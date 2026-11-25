// 12 fresh ingredients (Fridge produce, Freezer meats/seafood, Pantry staples) & 12 combinatorial recipes.

export const STORAGE_CATALOG = {
  fridge: ['tomato', 'herbs', 'mushroom', 'pepper'],
  freezer: ['steak', 'salmon', 'chicken', 'shrimp'],
  pantry: ['dough', 'pasta', 'cheese', 'saffron'],
};

export const INGREDIENTS = {
  // Produce Fridge
  tomato: { id: 'tomato', label: 'Tomato', short: 'Tom', color: '#d93829', accent: '#4a9e48', prep: 'chop', result: 'diced_tomato', rawPlateable: false, storage: 'fridge' },
  herbs: { id: 'herbs', label: 'Basil & Garlic', short: 'Herb', color: '#3c9952', accent: '#f5ebd6', prep: 'chop', result: 'minced_herbs', rawPlateable: false, storage: 'fridge' },
  mushroom: { id: 'mushroom', label: 'Shiitake', short: 'Mush', color: '#9c7352', accent: '#e8d8c3', prep: 'chop', result: 'sliced_mushroom', rawPlateable: false, storage: 'fridge' },
  pepper: { id: 'pepper', label: 'Bell Pepper', short: 'Pepp', color: '#e8a81c', accent: '#4a9e48', prep: 'chop', result: 'diced_pepper', rawPlateable: false, storage: 'fridge' },

  // Cold Meat & Seafood Freezer
  steak: { id: 'steak', label: 'Ribeye Cut', short: 'Steak', color: '#b83232', accent: '#f5d7c8', prep: 'grill', result: 'seared_steak', rawPlateable: false, storage: 'freezer' },
  salmon: { id: 'salmon', label: 'Wild Salmon', short: 'Salm', color: '#f07855', accent: '#ffd0ba', prep: 'grill', result: 'seared_salmon', rawPlateable: false, storage: 'freezer' },
  chicken: { id: 'chicken', label: 'Herb Chicken', short: 'Chick', color: '#e6b89c', accent: '#f5e1d3', prep: 'grill', result: 'seared_chicken', rawPlateable: false, storage: 'freezer' },
  shrimp: { id: 'shrimp', label: 'Tiger Shrimp', short: 'Shrimp', color: '#f26a5a', accent: '#ffe0d6', prep: 'grill', result: 'seared_shrimp', rawPlateable: false, storage: 'freezer' },

  // Artisan Pantry
  dough: { id: 'dough', label: 'Flatbread Dough', short: 'Bread', color: '#edd7b0', accent: '#cfa86e', prep: 'oven', result: 'toasted_flatbread', rawPlateable: false, storage: 'pantry' },
  pasta: { id: 'pasta', label: 'Golden Pasta', short: 'Pasta', color: '#f2c14e', accent: '#d99a26', prep: 'pot', result: 'simmered_pasta', rawPlateable: false, storage: 'pantry' },
  cheese: { id: 'cheese', label: 'Fresh Burrata', short: 'Cheese', color: '#faf4e3', accent: '#e8d7a5', prep: 'none', result: 'cheese', rawPlateable: true, storage: 'pantry' },
  saffron: { id: 'saffron', label: 'Saffron Glaze', short: 'Saff', color: '#e87a1c', accent: '#ffd24c', prep: 'none', result: 'saffron', rawPlateable: true, storage: 'pantry' },
};

export const PREPARED = {
  diced_tomato: { id: 'diced_tomato', label: 'Diced Tomato', short: 'Diced Tom', base: 'tomato', method: 'chop' },
  minced_herbs: { id: 'minced_herbs', label: 'Herb Gremolata', short: 'Herbs', base: 'herbs', method: 'chop' },
  sliced_mushroom: { id: 'sliced_mushroom', label: 'Sliced Shiitake', short: 'Shiitake', base: 'mushroom', method: 'chop' },
  diced_pepper: { id: 'diced_pepper', label: 'Diced Pepper', short: 'Pepper', base: 'pepper', method: 'chop' },
  seared_steak: { id: 'seared_steak', label: 'Seared Ribeye', short: 'Steak', base: 'steak', method: 'grill' },
  seared_salmon: { id: 'seared_salmon', label: 'Crispy Salmon', short: 'Salmon', base: 'salmon', method: 'grill' },
  seared_chicken: { id: 'seared_chicken', label: 'Roasted Chicken', short: 'Chicken', base: 'chicken', method: 'grill' },
  seared_shrimp: { id: 'seared_shrimp', label: 'Garlic Shrimp', short: 'Shrimp', base: 'shrimp', method: 'grill' },
  toasted_flatbread: { id: 'toasted_flatbread', label: 'Oven Flatbread', short: 'Bread', base: 'dough', method: 'oven' },
  simmered_pasta: { id: 'simmered_pasta', label: 'Silky Pasta', short: 'Pasta', base: 'pasta', method: 'pot' },
  cheese: { id: 'cheese', label: 'Creamy Burrata', short: 'Burrata', base: 'cheese', method: 'none' },
  saffron: { id: 'saffron', label: 'Saffron Glaze', short: 'Saffron', base: 'saffron', method: 'none' },
};

export const RECIPES = [
  { id: 'bruschetta', name: 'Herb Bruschetta', shortName: 'Bruschetta', ingredients: ['toasted_flatbread', 'diced_tomato', 'minced_herbs'], basePrice: 36, timeLimit: 48, accent: '#d94832' },
  { id: 'burrata_flatbread', name: 'Burrata Flatbread', shortName: 'Burrata Bread', ingredients: ['toasted_flatbread', 'diced_tomato', 'cheese'], basePrice: 42, timeLimit: 46, accent: '#e0b048' },
  { id: 'herb_steak', name: 'Charred Herb Steak', shortName: 'Herb Steak', ingredients: ['seared_steak', 'minced_herbs'], basePrice: 44, timeLimit: 44, accent: '#8f2d24' },
  { id: 'saffron_pasta', name: 'Saffron Tomato Pasta', shortName: 'Saffron Pasta', ingredients: ['simmered_pasta', 'diced_tomato', 'saffron'], basePrice: 48, timeLimit: 50, accent: '#e08b1b' },
  { id: 'garlic_shrimp', name: 'Garlic Saffron Shrimp', shortName: 'Garlic Shrimp', ingredients: ['seared_shrimp', 'minced_herbs', 'saffron'], basePrice: 52, timeLimit: 46, accent: '#e85a3c' },
  { id: 'seared_salmon', name: 'Pan-Seared Salmon', shortName: 'Saffron Salmon', ingredients: ['seared_salmon', 'saffron', 'minced_herbs'], basePrice: 54, timeLimit: 48, accent: '#e86842' },
  { id: 'mushroom_pasta', name: 'Shiitake Burrata Pasta', shortName: 'Shiitake Pasta', ingredients: ['simmered_pasta', 'sliced_mushroom', 'cheese'], basePrice: 56, timeLimit: 52, accent: '#8c6239' },
  { id: 'chicken_flatbread', name: 'Oven Chicken Flatbread', shortName: 'Chicken Bread', ingredients: ['toasted_flatbread', 'seared_chicken', 'diced_pepper'], basePrice: 58, timeLimit: 52, accent: '#d98a2b' },
  { id: 'ember_flatbread', name: 'Ember Steak Flatbread', shortName: 'Steak Bread', ingredients: ['toasted_flatbread', 'seared_steak', 'diced_tomato'], basePrice: 60, timeLimit: 52, accent: '#b54626' },
  { id: 'burrata_pasta', name: 'Burrata Herb Pasta', shortName: 'Burrata Pasta', ingredients: ['simmered_pasta', 'cheese', 'minced_herbs', 'diced_tomato'], basePrice: 66, timeLimit: 56, accent: '#4a9e5c' },
  { id: 'bouillabaisse', name: 'Saffron Bouillabaisse', shortName: 'Bouillabaisse', ingredients: ['seared_salmon', 'simmered_pasta', 'diced_tomato', 'saffron'], basePrice: 78, timeLimit: 62, accent: '#d95d1e' },
  { id: 'surf_and_turf', name: 'Grand Surf & Turf', shortName: 'Surf & Turf', ingredients: ['seared_steak', 'seared_shrimp', 'sliced_mushroom', 'minced_herbs'], basePrice: 86, timeLimit: 64, accent: '#7a221d' },
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
