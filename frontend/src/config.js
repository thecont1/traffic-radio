// -----------------------------------------------------------------------------
// Central configuration. Every timing, density and visual knob lives here so the
// button, animation and state-machine logic never need to be touched to tweak
// the look or feel of the traffic light.
// -----------------------------------------------------------------------------
export const CONFIG = {
  // --- State machine durations (milliseconds) --------------------------------
  TRANSITION_DURATION: 500, // digital flip window (~0.5s)
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
