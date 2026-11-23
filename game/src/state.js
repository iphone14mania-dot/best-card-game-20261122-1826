// Ember Duel — game state, turn flow and combat resolution.
// One game object holds both fighters; every rule (cost, block, combo,
// win/loss) is applied here so the renderer only ever displays state.
import {
  START_HP, START_HAND, HAND_MAX, MANA_START, MANA_MAX,
  COMBO_BONUS, ELEMENT_KEYS,
} from './config.js';
import { buildDeck, drawCards, makeRng, shuffle } from './cards.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAYER = 'player';
export const PHASE_AI = 'ai';
export const PHASE_OVER = 'over';

export function makeFighter(name, isAi) {
  return {
    name, isAi,
    hp: START_HP, maxHp: START_HP,
    block: 0, mana: MANA_START, maxMana: MANA_START,
    deck: [], hand: [], discard: [],
    playedThisTurn: [], comboDone: {},
  };
}

/** Fresh game. `seed` fixes the shuffle; omit it for a random game. */
export function newGame(seed) {
  const rng = makeRng(seed ?? ((Math.random() * 1e9) | 0));
  const game = {
    rng,
    seed,
    phase: PHASE_TITLE,
    turn: 1,
    player: makeFighter('You', false),
    ai: makeFighter('Ember Imp', true),
    log: [],
    winner: null,
    lastCombo: null,
    lastPlayed: null,
    aiThinking: false,
  };
  for (const side of [game.player, game.ai]) {
    side.deck = shuffle(buildDeck(), rng);
    drawCards(side.deck, side.discard, side.hand, START_HAND, rng, HAND_MAX);
  }
  log(game, 'The duel begins — 30 HP each. Match two cards of one element for a combo!');
  return game;
}

/** Start the first player turn from the title screen. */
export function startGame(game) {
  game.phase = PHASE_PLAYER;
  game.player.mana = MANA_START;
  game.player.maxMana = MANA_START;
  log(game, 'Your turn — play cards, then End Turn.');
  return game;
}

export function log(game, text) {
  game.log.unshift(text);
  if (game.log.length > 40) game.log.length = 40;
}

/** Damage after block: block absorbs first, the rest hits HP. */
export function dealDamage(game, target, amount) {
  let rest = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, rest);
    target.block -= absorbed;
    rest -= absorbed;
  }
  if (rest > 0) target.hp = Math.max(0, target.hp - rest);
  return rest;
}

export function heal(game, target, amount) {
  target.hp = Math.min(target.maxHp, target.hp + amount);
}

function checkEnd(game) {
  if (game.ai.hp <= 0) { game.phase = PHASE_OVER; game.winner = 'player'; log(game, 'Victory! The Ember Imp is defeated.'); return true; }
  if (game.player.hp <= 0) { game.phase = PHASE_OVER; game.winner = 'ai'; log(game, 'Defeat — the Ember Imp wins this duel.'); return true; }
  return false;
}

function applyCombo(game, side, card) {
  if (side.comboDone[card.element]) return;
  const playedSame = side.playedThisTurn.filter((c) => c.element === card.element).length;
  if (playedSame < 2) return;
  side.comboDone[card.element] = true;
  const bonus = COMBO_BONUS[card.element];
  const foe = side === game.player ? game.ai : game.player;
  game.lastCombo = { element: card.element, label: bonus.label, side: side.name };
  if (bonus.damage) { const dealt = dealDamage(game, foe, bonus.damage); log(game, `${bonus.label} — ${dealt} damage to ${foe.name}.`); }
  if (bonus.heal) { heal(game, side, bonus.heal); log(game, `${bonus.label}.`); }
  if (bonus.draw) { const drawn = drawCards(side.deck, side.discard, side.hand, bonus.draw, game.rng, HAND_MAX); log(game, `${bonus.label} — drew ${drawn.length}.`); }
  if (bonus.block) { side.block += bonus.block; log(game, `${bonus.label}.`); }
}

/**
 * Play `card` from `side`'s hand against the other fighter.
 * Returns { ok, reason } — reason explains why a play was refused.
 */
export function playCard(game, side, card) {
  if (game.phase !== PHASE_PLAYER && side === game.player) return { ok: false, reason: 'Not your turn' };
  if (game.phase !== PHASE_AI && side === game.ai) return { ok: false, reason: 'AI is not acting' };
  const at = side.hand.findIndex((c) => c.id === card.id);
  if (at < 0) return { ok: false, reason: 'Card not in hand' };
  if (side.mana < card.cost) return { ok: false, reason: `Need ${card.cost} mana` };
  side.mana -= card.cost;
  side.hand.splice(at, 1);
  side.discard.push(card);
  side.playedThisTurn.push(card);
  game.lastPlayed = { card, by: side.name };
  const foe = side === game.player ? game.ai : game.player;

  if (card.type === 'strike') {
    const dealt = dealDamage(game, foe, card.value);
    log(game, `${side.name} plays ${card.name} — ${dealt} damage to ${foe.name}.`);
  } else if (card.type === 'guard') {
    side.block += card.value;
    log(game, `${side.name} plays ${card.name} — gains ${card.value} block.`);
  } else if (card.type === 'siphon') {
    const dealt = dealDamage(game, foe, card.value);
    heal(game, side, card.value);
    log(game, `${side.name} plays ${card.name} — ${dealt} damage and heals ${card.value}.`);
  } else if (card.type === 'surge') {
    const drawn = drawCards(side.deck, side.discard, side.hand, card.value, game.rng, HAND_MAX);
    log(game, `${side.name} plays ${card.name} — draws ${drawn.length}.`);
  }
  applyCombo(game, side, card);
  if (checkEnd(game)) return { ok: true, reason: 'game over' };
  return { ok: true, reason: '' };
}

/** End the current side's turn: clear block, reset the combo tracker. */
function endSideTurn(side) {
  side.block = 0;
  side.playedThisTurn = [];
  side.comboDone = {};
}

/** Player ends their turn; the AI turn begins (driven by ai.js via callbacks). */
export function endPlayerTurn(game) {
  if (game.phase !== PHASE_PLAYER) return false;
  endSideTurn(game.player);
  game.phase = PHASE_AI;
  game.aiThinking = true;
  log(game, '— AI turn —');
  return true;
}

/** Start the AI's turn: mana grows, it draws, then it acts (see ai.js). */
export function beginAiTurn(game) {
  const ai = game.ai;
  ai.maxMana = Math.min(MANA_MAX, ai.maxMana + 1);
  ai.mana = ai.maxMana;
  drawCards(ai.deck, ai.discard, ai.hand, 1, game.rng, HAND_MAX);
  log(game, `Ember Imp draws. Mana ${ai.mana}/${ai.maxMana}.`);
}

/** Finish the AI turn and start the player's next turn. */
export function beginPlayerTurn(game) {
  endSideTurn(game.ai);
  game.aiThinking = false;
  game.turn += 1;
  const p = game.player;
  p.maxMana = Math.min(MANA_MAX, p.maxMana + 1);
  p.mana = p.maxMana;
  drawCards(p.deck, p.discard, p.hand, 1, game.rng, HAND_MAX);
  game.phase = PHASE_PLAYER;
  log(game, `Turn ${game.turn} — your mana is ${p.mana}/${p.maxMana}. You draw a card.`);
  checkEnd(game);
}

export { ELEMENT_KEYS };
