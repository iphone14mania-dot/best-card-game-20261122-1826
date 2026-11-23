// Ember Duel — tiny WebAudio synth. No audio files: every sound is a short
// oscillator blip, so the game stays silent on disk and offline.
// Audio starts only after a user gesture (browsers block it before that).
let ctx = null;
let muted = false;

function ensure() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function blip(freq, dur, type, gain) {
  if (muted) return;
  const c = ensure();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain || 0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export const sfx = {
  unlock() { ensure(); },
  play() { blip(660, 0.09, 'triangle', 0.09); },
  strike() { blip(180, 0.16, 'sawtooth', 0.1); setTimeout(() => blip(120, 0.14, 'sawtooth', 0.08), 60); },
  guard() { blip(320, 0.12, 'sine', 0.09); },
  heal() { blip(520, 0.12, 'sine', 0.07); setTimeout(() => blip(780, 0.14, 'sine', 0.06), 80); },
  combo() { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.12, 'triangle', 0.09), i * 70)); },
  turn() { blip(440, 0.08, 'triangle', 0.07); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.1), i * 120)); },
  lose() { [392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.09), i * 140)); },
  error() { blip(140, 0.12, 'square', 0.05); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}
export function isMuted() { return muted; }
