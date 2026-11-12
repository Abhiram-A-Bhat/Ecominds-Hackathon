// Two-tone ride-hailing style alarm, synthesised with Web Audio (no asset files).
let ctx = null;
let timer = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Browsers only allow audio after a user gesture — warm the context on the first one.
if (typeof window !== 'undefined') {
  const warm = () => { audio(); window.removeEventListener('pointerdown', warm); window.removeEventListener('keydown', warm); };
  window.addEventListener('pointerdown', warm);
  window.addEventListener('keydown', warm);
}

function chirp(freq, at, dur = 0.14) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, a.currentTime + at);
  gain.gain.setValueAtTime(0.0001, a.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(0.09, a.currentTime + at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(a.currentTime + at);
  osc.stop(a.currentTime + at + dur + 0.02);
}

const canVibrate = () => !!navigator.vibrate && (navigator.userActivation?.hasBeenActive ?? true);

function ring() {
  chirp(988, 0); chirp(1319, 0.16); chirp(988, 0.32); chirp(1319, 0.48);
  if (canVibrate()) navigator.vibrate([180, 80, 180, 80, 180]);
}

export function startAlarm() {
  stopAlarm();
  ring();
  timer = setInterval(ring, 1400);
}

export function stopAlarm() {
  if (timer) clearInterval(timer);
  timer = null;
  if (canVibrate()) navigator.vibrate(0);
}

export function playSuccess() {
  chirp(784, 0, 0.12); chirp(1047, 0.12, 0.12); chirp(1568, 0.24, 0.25);
}
