// Ember Duel — the opponent's strategy, readable and deterministic.
// Priority, in order:
//   1. Lethal: if a strike (or siphon) can finish the player, play it.
//   2. Survival: while HP is low, guard first with the biggest affordable guard.
//   3. Value: otherwise play the highest-value affordable card, preferring
//      strikes and siphons, and Surge when the hand is small.
//   4. Combo: prefer a card whose element the AI already played this turn,
//      so its combos fire too.
// The AI acts one card at a time; the caller waits between plays so each
// card is visible on the table.
import { playCard } from './state.js';

function scoreCard(game, ai, card) {
  const player = game.player;
  let score = card.value;
  if (card.type === 'strike' || card.type === 'siphon') score += 3;
  if (card.type === 'guard') score += ai.hp <= 12 ? 6 : 1;
  if (card.type === 'surge') score += ai.hand.length <= 3 ? 4 : 1;
  // Combo chase: same element as something already played this turn.
  if (ai.playedThisTurn.some((c) => c.element === card.element)) score += 5;
  // Cheap cards first when mana is tight (more plays per turn).
  score -= card.cost * 0.4;
  return score;
}

/** The AI's next card, or null when it should stop. */
export function chooseCard(game) {
  const ai = game.ai;
  const player = game.player;
  const affordable = ai.hand.filter((c) => c.cost <= ai.mana);
  if (affordable.length === 0) return null;

  // 1. Lethal — a strike/siphon that ends the player through their block.
  const lethal = affordable.find((c) =>
    (c.type === 'strike' || c.type === 'siphon') && c.value >= player.hp + player.block);
  if (lethal) return lethal;

  // 2. Survival — low HP: the biggest affordable guard wins.
  if (ai.hp <= 12) {
    const guards = affordable.filter((c) => c.type === 'guard');
    if (guards.length > 0) {
      guards.sort((a, b) => b.value - a.value);
      return guards[0];
    }
  }

  // 3 + 4. Best value, with the combo chase folded into the score.
  const ranked = affordable.slice().sort((a, b) => scoreCard(game, ai, b) - scoreCard(game, ai, a));
  return ranked[0];
}

/**
 * Play one AI card. Returns the card played, or null when the AI is done.
 * The caller (main.js) spaces calls out so the table animates.
 */
export function aiPlayOne(game) {
  const card = chooseCard(game);
  if (!card) return null;
  const result = playCard(game, game.ai, card);
  return result.ok ? card : null;
}
