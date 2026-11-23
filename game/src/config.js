// Ember Duel — balance and card catalogue.
// Four elements, each with a colour AND a shape glyph, so a card is never
// identified by text alone. All numbers live here; the rules live in state.js.
export const START_HP = 30;
export const START_HAND = 4;
export const HAND_MAX = 10;
export const DECK_SIZE = 30;
export const MANA_START = 1;
export const MANA_MAX = 10;

export const ELEMENTS = {
  fire:  { key: 'fire',  name: 'Ember',  glyph: '🔥', color: '#e5484d', dark: '#8f1d22', light: '#ffd9d4', desc: 'Combo: +2 damage' },
  water: { key: 'water', name: 'Water',  glyph: '💧', color: '#2f7fe0', dark: '#144a8a', light: '#d4e8ff', desc: 'Combo: heal 3' },
  gale:  { key: 'gale',  name: 'Gale',   glyph: '🌀', color: '#2ea86a', dark: '#14532f', light: '#d2f5e1', desc: 'Combo: draw 1' },
  stone: { key: 'stone', name: 'Stone',  glyph: '⛰️', color: '#8a6d4b', dark: '#4d3a22', light: '#eadfd2', desc: 'Combo: +3 block' },
};
export const ELEMENT_KEYS = ['fire', 'water', 'gale', 'stone'];

// Combo bonus granted when a player plays two cards of the same element
// in a single turn (the second card triggers it, once per element per turn).
export const COMBO_BONUS = {
  fire:  { damage: 2, label: 'Ember Combo! +2 damage' },
  water: { heal: 3,   label: 'Water Combo! Heal 3' },
  gale:  { draw: 1,   label: 'Gale Combo! Draw 1' },
  stone: { block: 3,  label: 'Stone Combo! +3 block' },
};

// Card types. value = damage for Strike/Siphon, block for Guard, cards for Surge.
export const TYPES = {
  strike: { key: 'strike', name: 'Strike', verb: 'Deal' },
  guard:  { key: 'guard',  name: 'Guard',  verb: 'Block' },
  siphon: { key: 'siphon', name: 'Siphon', verb: 'Drain' },
  surge:  { key: 'surge',  name: 'Surge',  verb: 'Draw' },
};

// The 30-card deck, as [element, type, cost, value] rows. Balanced so every
// element has strikes, guards, one siphon and one surge, with a spread of costs.
export const DECK_ROWS = [
  ['fire', 'strike', 1, 3], ['fire', 'strike', 2, 5], ['fire', 'strike', 3, 7],
  ['fire', 'strike', 2, 4], ['fire', 'guard', 1, 4], ['fire', 'guard', 2, 6],
  ['fire', 'siphon', 3, 4], ['fire', 'surge', 2, 2],
  ['water', 'strike', 1, 2], ['water', 'strike', 2, 4], ['water', 'strike', 3, 6],
  ['water', 'guard', 1, 5], ['water', 'guard', 2, 7], ['water', 'guard', 3, 9],
  ['water', 'siphon', 2, 3], ['water', 'surge', 1, 2],
  ['gale', 'strike', 1, 3], ['gale', 'strike', 2, 5], ['gale', 'strike', 4, 8],
  ['gale', 'guard', 1, 4], ['gale', 'guard', 2, 5],
  ['gale', 'siphon', 3, 5], ['gale', 'surge', 2, 2], ['gale', 'surge', 3, 3],
  ['stone', 'strike', 2, 4], ['stone', 'strike', 3, 6],
  ['stone', 'guard', 1, 5], ['stone', 'guard', 2, 7], ['stone', 'guard', 4, 11],
  ['stone', 'siphon', 4, 6], ['stone', 'surge', 2, 2],
];

export const AI_NAMES = ['Ash', 'Bram', 'Cinder', 'Flint'];
