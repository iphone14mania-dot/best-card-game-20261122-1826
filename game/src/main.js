// Ember Duel — boot and wiring.
// ?seed=N fixes the shuffle. ?shot=title|table|win|loss (with &seed=N)
// stages that scene instead of starting interactively, paints it, and sets
// window.__shotReady for the screenshot runner.
import { newGame, startGame, playCard, endPlayerTurn, beginAiTurn, beginPlayerTurn, PHASE_PLAYER, PHASE_AI, PHASE_OVER } from './state.js';
import { aiPlayOne } from './ai.js';
import { render, flashDamage } from './render.js';
import { bindInput } from './input.js';
import { sfx, toggleMute } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? undefined : Number(seedParam) || 0;
const shot = params.get('shot');

let game = shot ? stageShot(shot, seed) : newGame(seed);
let aiTimer = null;

function refresh() {
  render(game);
  if (game.phase === PHASE_OVER) {
    if (game.winner === 'player') sfx.win(); else sfx.lose();
  }
}

function playCardById(id, byKey) {
  if (game.phase !== PHASE_PLAYER) return;
  let card;
  if (byKey) {
    const index = Number(id) - 1;
    card = game.player.hand[index];
    if (!card) return;
  } else {
    card = game.player.hand.find((c) => c.id === id);
    if (!card) return;
  }
  const hpBefore = game.ai.hp;
  const result = playCard(game, game.player, card);
  if (!result.ok) { sfx.error(); return; }
  sfx.play();
  if (card.type === 'strike' || card.type === 'siphon') { sfx.strike(); if (game.ai.hp < hpBefore) flashDamage(); }
  if (card.type === 'guard') sfx.guard();
  if (card.type === 'surge') sfx.heal();
  if (game.lastCombo) sfx.combo();
  refresh();
}

function runAiTurn() {
  if (game.phase !== PHASE_AI) return;
  beginAiTurn(game);
  refresh();
  const step = () => {
    if (game.phase !== PHASE_AI) return;
    const card = aiPlayOne(game);
    if (card) {
      sfx.play();
      if (card.type === 'strike' || card.type === 'siphon') { sfx.strike(); flashDamage(); }
      if (game.lastCombo) sfx.combo();
      refresh();
      if (game.phase === PHASE_AI) { aiTimer = setTimeout(step, 650); return; }
    }
    if (game.phase === PHASE_AI) {
      beginPlayerTurn(game);
      sfx.turn();
    }
    refresh();
  };
  aiTimer = setTimeout(step, 700);
}

function endTurn() {
  if (game.phase !== PHASE_PLAYER) return;
  if (!endPlayerTurn(game)) return;
  sfx.turn();
  refresh();
  runAiTurn();
}

function restart() {
  clearTimeout(aiTimer);
  game = newGame(seed);
  startGame(game);
  refresh();
}

bindInput({
  onCard: (id, byKey) => playCardById(id, byKey),
  onEndTurn: () => { sfx.unlock(); endTurn(); },
  onPlay: () => { sfx.unlock(); startGame(game); refresh(); },
  onRestart: () => { sfx.unlock(); restart(); },
  onMute: () => { const muted = toggleMute(); document.title = muted ? 'Ember Duel (muted)' : 'Ember Duel'; },
});

refresh();
if (shot) {
  // Paint twice so CSS transitions settle, then signal the screenshot runner.
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
