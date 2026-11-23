// Ember Duel — DOM rendering and animation.
// The game is one page; render() redraws the table from state on every
// change. Cards are DOM nodes (big numbers, element colour + glyph, cost
// gem) so they stay legible at thumbnail size. Animations are CSS classes:
// played cards fly to the middle, new cards deal in, the combo banner pops.
import { ELEMENTS, TYPES } from './config.js';
import { PHASE_TITLE, PHASE_OVER } from './state.js';

const $ = (sel) => document.querySelector(sel);

function hpBar(fighter) {
  const pct = Math.max(0, Math.round((fighter.hp / fighter.maxHp) * 100));
  const cls = pct > 50 ? 'hp-high' : pct > 25 ? 'hp-mid' : 'hp-low';
  return `<div class="hpbar ${cls}"><div class="hpfill" style="width:${pct}%"></div>` +
    `<span class="hptext">❤ ${fighter.hp} / ${fighter.maxHp}</span></div>`;
}

function manaGems(fighter) {
  let gems = '';
  for (let i = 0; i < fighter.maxMana; i += 1) {
    gems += `<span class="gem ${i < fighter.mana ? 'gem-full' : 'gem-empty'}">◆</span>`;
  }
  return `<div class="mana" title="Mana ${fighter.mana}/${fighter.maxMana}">${gems}` +
    `<span class="manatext">${fighter.mana}/${fighter.maxMana}</span></div>`;
}

export function cardHtml(card, opts) {
  const el = ELEMENTS[card.element];
  const ty = TYPES[card.type];
  const playable = opts && opts.playable;
  const verb = ty.verb;
  const valueText = card.type === 'surge' ? `+${card.value} cards` : `${verb} ${card.value}`;
  return `<div class="card el-${card.element} ${playable ? 'playable' : 'dimmed'}" ` +
    `data-card-id="${card.id}" style="--el:${el.color};--eldark:${el.dark};--ellight:${el.light}" ` +
    `title="${card.name} — cost ${card.cost}">` +
    `<div class="cost">${card.cost}</div>` +
    `<div class="glyph">${el.glyph}</div>` +
    `<div class="cname">${el.name}<br>${ty.name}</div>` +
    `<div class="cvalue">${card.value}</div>` +
    `<div class="cverb">${valueText}</div>` +
    `</div>`;
}

function faceDownHtml(index) {
  return `<div class="card facedown" style="--i:${index}"><div class="back-glyph">🔥</div>` +
    `<div class="back-text">EMBER<br>DUEL</div></div>`;
}

export function render(game) {
  const root = $('#app');
  if (game.phase === PHASE_TITLE) { root.innerHTML = titleHtml(game); return; }
  if (game.phase === PHASE_OVER) { root.innerHTML = overHtml(game); return; }
  root.innerHTML = tableHtml(game);
  const banner = $('#combo-banner');
  if (game.lastCombo && banner) {
    banner.textContent = `✦ ${game.lastCombo.label} ✦`;
    banner.classList.add('show');
  }
  const logEl = $('#log');
  if (logEl) logEl.scrollTop = 0;
}

function titleHtml(game) {
  return `<div class="screen title-screen">
    <div class="title-embers">🔥 💧 🌀 ⛰️</div>
    <h1 class="title">EMBER DUEL</h1>
    <p class="tagline">An elemental card battler — you versus the Ember Imp</p>
    <button class="bigbtn" data-action="play">▶ &nbsp;Play</button>
    <div class="howto">
      <h2>How to play</h2>
      <p>Both duelists start at <b>30 HP</b>. Mana starts at 1 and grows by 1 each turn (max 10).</p>
      <p>Click a card to play it if you can afford its <b>◆ cost</b>. End your turn and the Imp answers.</p>
      <p><b>Combo:</b> play two cards of the same element in one turn — Fire +2 damage, Water heal 3, Gale draw 1, Stone +3 block.</p>
      <p>Cards: <b>Strike</b> deals damage · <b>Guard</b> blocks · <b>Siphon</b> damages and heals you · <b>Surge</b> draws cards.</p>
      <p class="keys">Keys: 1–9 play a card · Space ends turn · M mute · R restart</p>
    </div>
    <button class="smallbtn" data-action="mute">🔊 Sound on/off (M)</button>
  </div>`;
}

function tableHtml(game) {
  const p = game.player;
  const ai = game.ai;
  const aiCards = ai.hand.map((_, i) => faceDownHtml(i)).join('');
  const handCards = p.hand.map((card, i) => {
    const playable = game.phase === 'player' && p.mana >= card.cost;
    return cardHtml(card, { playable });
  }).join('');
  const lastPlayed = game.lastPlayed ? game.lastPlayed.card : null;
  const playedHtml = lastPlayed
    ? `<div class="played-wrap"><div class="played-label">Last played — ${game.lastPlayed.by}</div>${cardHtml(lastPlayed, { playable: false })}</div>`
    : `<div class="played-wrap"><div class="played-label">No card played yet</div><div class="played-empty">—</div></div>`;
  const logHtml = game.log.map((line) => `<div class="logline">${line}</div>`).join('');
  const yourTurn = game.phase === 'player';
  return `<div class="screen table-screen">
    <header class="topbar">
      <div class="brand">🔥 EMBER DUEL</div>
      <div class="turninfo">Turn ${game.turn} — ${yourTurn ? 'Your turn' : ai.aiThinking ? 'Ember Imp is thinking…' : 'AI turn'}</div>
      <button class="smallbtn" data-action="mute">🔊</button>
    </header>
    <section class="opp-area">
      <div class="fighter">
        <div class="fname">👹 Ember Imp</div>
        ${hpBar(ai)}
        ${ai.block > 0 ? `<div class="block">🛡️ ${ai.block} block</div>` : ''}
        ${manaGems(ai)}
      </div>
      <div class="hand opp-hand">${aiCards}</div>
      <div class="piles"><div>Deck ${ai.deck.length}</div><div>Discard ${ai.discard.length}</div></div>
    </section>
    <section class="mid-area">
      ${playedHtml}
      <div class="mid-center">
        <div id="combo-banner" class="combo-banner"></div>
        <div class="vs">⚔️</div>
        <button class="bigbtn endbtn" data-action="end-turn" ${yourTurn ? '' : 'disabled'}>End Turn ⏎</button>
      </div>
      <div class="log" id="log">${logHtml}</div>
    </section>
    <section class="player-area">
      <div class="fighter">
        <div class="fname">🧑 You</div>
        ${hpBar(p)}
        ${p.block > 0 ? `<div class="block">🛡️ ${p.block} block</div>` : ''}
        ${manaGems(p)}
      </div>
      <div class="hand player-hand">${handCards || '<div class="empty-hand">No cards in hand</div>'}</div>
      <div class="piles"><div>Deck ${p.deck.length}</div><div>Discard ${p.discard.length}</div></div>
    </section>
    <footer class="hint">Click a glowing card to play it · 1–9 quick-play · Space ends turn</footer>
  </div>`;
}

function overHtml(game) {
  const win = game.winner === 'player';
  const confetti = win ? '<div class="confetti">' + '🎉✨🔥🎊⭐'.repeat(6) + '</div>' : '';
  return `<div class="screen over-screen ${win ? 'win' : 'loss'}">
    ${confetti}
    <h1 class="over-title">${win ? '🏆 VICTORY!' : '💀 DEFEAT'}</h1>
    <p class="over-sub">${win ? 'The Ember Imp burns out — you win the duel!' : 'The Ember Imp takes this duel. Your embers fade…'}</p>
    <div class="over-stats">
      <div>Turns played: <b>${game.turn}</b></div>
      <div>Your HP: <b>${game.player.hp}</b> &nbsp;·&nbsp; Imp HP: <b>${game.ai.hp}</b></div>
    </div>
    <button class="bigbtn" data-action="restart">↻ &nbsp;Play again</button>
    <p class="keys">Press R to play again</p>
  </div>`;
}

/** Flash the table edge when damage lands (called from main.js). */
export function flashDamage() {
  const root = $('#app');
  if (!root) return;
  root.classList.remove('hurt');
  void root.offsetWidth;
  root.classList.add('hurt');
}
