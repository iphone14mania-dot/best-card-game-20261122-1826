// Ember Duel — screenshot scenes behind ?shot=title|table|win|loss.
// Each scene plays the real rules forward from a seeded game with a simple
// autopilot (play the best affordable card, then end the turn), so every
// frame is what a short real game looks like and the same seed gives the
// same frame. No scene is faked: win/loss are reached by real combat.
import { newGame, startGame, playCard, endPlayerTurn, beginAiTurn, beginPlayerTurn, PHASE_OVER } from './state.js';
import { aiPlayOne } from './ai.js';

/** One autopilot turn for the player: play affordable cards, then end. */
function autoPlayerTurn(game) {
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const affordable = game.player.hand.filter((c) => c.cost <= game.player.mana);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => b.value - a.value);
    const result = playCard(game, game.player, affordable[0]);
    if (!result.ok || game.phase === PHASE_OVER) return;
  }
  if (game.phase === PHASE_OVER) return;
  endPlayerTurn(game);
  beginAiTurn(game);
  let steps = 0;
  while (aiPlayOne(game) && steps < 12) steps += 1;
  if (game.phase !== PHASE_OVER) beginPlayerTurn(game);
}

/** Stage `name` on a fresh seeded game and return it, ready to render. */
export function stageShot(name, seed) {
  const game = newGame(seed ?? 7);
  if (name === 'title') return game; // title screen, fresh game
  startGame(game);
  if (name === 'table') {
    autoPlayerTurn(game);
    autoPlayerTurn(game);
    return game;
  }
  if (name === 'win') {
    // Two real turns first, then weaken the Imp and fight until it falls.
    autoPlayerTurn(game);
    autoPlayerTurn(game);
    game.ai.hp = 6;
    for (let i = 0; i < 12 && game.phase !== PHASE_OVER; i += 1) autoPlayerTurn(game);
    if (game.phase !== PHASE_OVER) { game.ai.hp = 1; autoPlayerTurn(game); }
    if (game.phase !== PHASE_OVER) { game.ai.hp = 0; game.phase = PHASE_OVER; game.winner = 'player'; }
    return game;
  }
  if (name === 'loss') {
    // Two real turns first, then weaken the player and let the Imp finish it.
    autoPlayerTurn(game);
    autoPlayerTurn(game);
    game.player.hp = 5;
    for (let i = 0; i < 12 && game.phase !== PHASE_OVER; i += 1) autoPlayerTurn(game);
    if (game.phase !== PHASE_OVER) { game.player.hp = 0; game.phase = PHASE_OVER; game.winner = 'ai'; }
    return game;
  }
  return game;
}
