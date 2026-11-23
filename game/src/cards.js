// Ember Duel — deck construction, seeded shuffle and drawing.
// A tiny mulberry32 generator keeps screenshot scenes repeatable: the same
// seed always deals the same opening hands.
import { DECK_ROWS, ELEMENTS, TYPES } from './config.js';

export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One card object: unique id, element, type, cost, value and a display name. */
export function makeCard(row, index) {
  const [element, type, cost, value] = row;
  const el = ELEMENTS[element];
  const ty = TYPES[type];
  return {
    id: `${element}-${type}-${index}`,
    element,
    type,
    cost,
    value,
    name: `${el.name} ${ty.name}`,
    glyph: el.glyph,
    color: el.color,
  };
}

/** A fresh 30-card deck in catalogue order (not yet shuffled). */
export function buildDeck() {
  return DECK_ROWS.map((row, i) => makeCard(row, i));
}

/** Fisher–Yates shuffle with the given rng; returns a new array. */
export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw up to `n` cards from `deck` into `hand` (hand max enforced by caller).
 * Reshuffles the discard pile into the deck when it runs out.
 * Returns the list of cards actually drawn.
 */
export function drawCards(deck, discard, hand, n, rng, handMax) {
  const drawn = [];
  for (let k = 0; k < n; k += 1) {
    if (hand.length >= handMax) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffle(discard.splice(0), rng));
    }
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}
