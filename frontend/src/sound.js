import { Platform } from 'react-native';
import { CONFIG } from './config';

// -----------------------------------------------------------------------------
// Faint "relay crackle": ~TICK_COUNT tiny clicks scattered across a colour
// transition, evoking mechanical LEDs flipping. Web Audio only (web/preview);
// on native devices the haptic pulse covers the physical feedback.
// Fails silently if audio is unavailable or blocked by autoplay policy.
// -----------------------------------------------------------------------------
let ctx = null;

export function playTickBurst(durationMs = CONFIG.TRANSITION_DURATION) {
  if (!CONFIG.SOUND_TICKS || Platform.OS !== 'web') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    for (let i = 0; i < CONFIG.TICK_COUNT; i++) {
      const t = now + (Math.random() * durationMs) / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1600 + Math.random() * 1200;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(CONFIG.TICK_VOLUME, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  } catch (e) {
    // no audio available — stay silent
  }
}
