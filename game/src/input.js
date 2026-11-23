// Ember Duel — mouse and keyboard input.
// Clicks on cards and buttons are delegated from the table element; keys are
// a shortcut layer on top (1-9 plays a hand card, Space/Enter ends the turn,
// M mutes, R restarts after the game ends).
export function bindInput(handlers) {
  const { onCard, onEndTurn, onPlay, onRestart, onMute } = handlers;

  document.addEventListener('click', (event) => {
    const cardEl = event.target.closest('[data-card-id]');
    if (cardEl) { onCard(cardEl.dataset.cardId); return; }
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'end-turn') onEndTurn();
    else if (action === 'play') onPlay();
    else if (action === 'restart') onRestart();
    else if (action === 'mute') onMute();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '9') { onCard(event.key, true); return; }
    if (event.key === ' ' || event.key === 'Enter') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'BUTTON') return; // let the focused button handle it
      event.preventDefault();
      onEndTurn();
      return;
    }
    if (event.key === 'm' || event.key === 'M') onMute();
    if (event.key === 'r' || event.key === 'R') onRestart();
  });
}
