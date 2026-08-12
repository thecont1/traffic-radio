// -----------------------------------------------------------------------------
// Central configuration. Every timing, density and visual knob lives here so the
// button, animation and state-machine logic never need to be touched to tweak
// the look or feel of the traffic light.
// -----------------------------------------------------------------------------
// --- Speed presets -----------------------------------------------------------
// How long a full colour flip (all LEDs) takes. Switch by changing
// ACTIVE_SPEED_PRESET to 'CALM', 'NORMAL' or 'RAPID'.
export const SPEED_PRESETS = {
  CALM: 1500,
  NORMAL: 500,
  RAPID: 200,
};
export const ACTIVE_SPEED_PRESET = 'NORMAL';

export const CONFIG = {
  // --- State machine durations (milliseconds) --------------------------------
  TRANSITION_DURATION: SPEED_PRESETS[ACTIVE_SPEED_PRESET], // digital flip window
  PREPARATION_DURATION: 2000, // first yellow hold (2s)
  ACTIVE_DURATION: 10000, // red hold (10s)
  COMPLETION_DURATION: 1000, // second yellow hold (1s)

  // --- LED randomised transition ---------------------------------------------
  // Each LED flips instantly (digital) at a random point in the 0..1 window,
  // so hexagons switch one-by-one across the whole transition.
  FLIP_SPREAD: 1.0, // fraction of the window over which flips are scattered

  // --- Honeycomb / LED rendering ---------------------------------------------
  LED_DENSITY: 15, // approx number of hexagons across the diameter
  LED_GAP: 0.16, // gap between neighbours as a fraction of the hex radius
  MIN_OPACITY: 0.85, // per-LED brightness variation (lower bound)
  MAX_OPACITY: 1.0, // per-LED brightness variation (upper bound)
  GLOW_OPACITY: 0.35, // ambient halo strength behind the button

  // --- Idle shimmer ------------------------------------------------------------
  // A slow brightness wave drifting across the green LEDs while idle.
  SHIMMER_DURATION: 5200, // one full sweep (ms)
  SHIMMER_DIM: 0.85, // idle base brightness multiplier (wave lifts back up)
  SHIMMER_BOOST: 0.3, // extra brightness at the wave crest
  SHIMMER_WIDTH: 0.2, // crest width as a fraction of the sweep

  // --- Interaction -------------------------------------------------------------
  DOUBLE_TAP_WINDOW: 300, // ms between taps to count as a double-tap (red cancel)

  // --- Cancel confirmation pulse ---------------------------------------------------
  PULSE_OPACITY: 0.35, // peak brightness of the white flash
  PULSE_IN: 120, // ms to reach peak
  PULSE_OUT: 300, // ms to fade out

  // --- Location -----------------------------------------------------------------
  LOCATION_REFRESH_MS: 5 * 60 * 1000, // re-check approximate location every 5 min

  // --- Color-blind mode ----------------------------------------------------------
  // When true, each state gets a shape cue readable without colour:
  // green = all hexes lit, amber = checker pattern, red = large X of dimmed hexes.
  COLOR_BLIND_MODE: false,
  CUE_DIM: 0.35, // brightness of the "dimmed" hexes forming the pattern

  // --- Sound ticks ---------------------------------------------------------------
  // A faint relay-crackle of ticks scattered across each colour transition.
  // Web Audio (web/preview only; native relies on haptics).
  SOUND_TICKS: true,
  TICK_COUNT: 20,
  TICK_VOLUME: 0.04,

  // --- Boot flicker ----------------------------------------------------------------
  OFF_COLOR: 'rgb(9,13,11)', // unpowered LED colour before boot completes

  // --- Realistic traffic-light colors (rgb for reliable interpolation) -------
  COLORS: {
    green: 'rgb(39,214,79)',
    yellow: 'rgb(255,176,31)', // amber
    red: 'rgb(255,47,47)',
  },

  // --- Surfaces --------------------------------------------------------------
  BACKGROUND: '#070a0f', // page background (dark)
  GAP_COLOR: '#000000', // pure black between the LEDs
  BEZEL: '#333333', // constant neutral border color
  BEZEL_WIDTH: 1.5, // thin border
};
