# Traffic Light Button — PRD

## Problem statement
A minimal native mobile app (Expo / React Native) whose ONLY visible control is a
giant circular button made from many small hexagonal LEDs, styled like a real
traffic light. Tapping runs a fixed sequence:
GREEN → YELLOW (2s) → RED (10s) → YELLOW (1s) → GREEN, with a randomized
LED transition between each colour.

## User choices
- Platform: Native mobile app (Expo/React Native), previewed as web on port 3000
- Background: Dark
- LEDs: Crisp SVG hexagons (react-native-svg)
- Colours: Realistic traffic-light red / amber / green
- Timings: keep spec values, but configurable
- Transition style (later request): DIGITAL — hexagons flip one-by-one (hard
  switch, no cross-fade), completing in 0.5s
- Border: thin, constant neutral #333333; no coloured glow
- Gaps between LEDs: pure black

## Architecture
- Expo SDK 57, React 19, react-native-svg, React Native `Animated` for fills
  (Reanimated 4 `useAnimatedProps` does NOT deliver SVG fill on web — replaced).
- `src/config.js` — all tunables (durations, colours, LED density, gap, opacity,
  flip spread, border width/colour).
- `src/hex.js` — pointy-top honeycomb generation clipped to a circle.
- `src/AnimatedLed.js` — one hexagon; per-LED digital flip via a tiny-band
  `progress.interpolate` step from `from`→`to` at a random `switchAt`.
- `src/useTrafficSequence.js` — state machine + timers + performAction.
- `src/performAction.js` — isolated placeholder (logs once at red start).
- `src/TrafficLightButton.js` — the circular button (SVG honeycomb, black gaps,
  thin neutral border, a11y).
- `App.js` — centers the single button on a dark background, responsive 1:1.

## State machine
IDLE_GREEN → TRANSITIONING_TO_YELLOW → YELLOW_PREPARATION →
TRANSITIONING_TO_RED → RED_ACTIVE (performAction) → TRANSITIONING_TO_YELLOW_COMPLETION →
YELLOW_COMPLETION → TRANSITIONING_TO_GREEN → IDLE_GREEN.
Guards: single active sequence (runningRef), taps ignored unless IDLE_GREEN,
timers tracked/cleared, every transition drives progress fully to 1.

## Configurable constants (src/config.js)
TRANSITION_DURATION=500ms, PREPARATION_DURATION=2000ms, ACTIVE_DURATION=10000ms,
COMPLETION_DURATION=1000ms, FLIP_SPREAD=1.0, LED_DENSITY=15, LED_GAP=0.16,
MIN/MAX_OPACITY, BEZEL='#333333', BEZEL_WIDTH=1.5.

## Implemented (2026-06)
- Circular hexagonal-LED button, clipped, dark bg, thin neutral border.
- Full tap sequence with digital one-by-one LED flips (~0.5s), verified via
  computed SVG fills (only pure colours mid-transition, settle exactly).
- performAction() fires exactly once per activation; taps ignored mid-sequence;
  returns to interactive green; no stuck intermediate colours (testing agent
  iteration_2: 100% of requested behaviours pass).
- Accessibility: role=button, label "Traffic light button", state text
  Ready/Preparing/Active/Completing (off-screen live region + accessibilityValue).

## Implemented (2026-06, batch 2 — all tested via testing agent iteration_3: 100% pass)
- Idle shimmer: slow brightness wave (fillOpacity) drifting left→right across the
  green LEDs with per-LED jitter; runs ONLY while IDLE_GREEN, freezes during
  sequences, resumes after. Knobs: SHIMMER_DURATION/DIM/BOOST/WIDTH in config.js.
- Speed presets: SPEED_PRESETS {CALM:1500, NORMAL:500, RAPID:200} +
  ACTIVE_SPEED_PRESET ('NORMAL' active) drive TRANSITION_DURATION.
- Tap haptics: expo-haptics Medium impact on activation (native only; no-op web).
- Digital flip band narrowed to 0.0001 → zero blended colours mid-transition.
- EAS build prep: eas.json (development/preview/production profiles), app.json
  identifiers com.emergent.trafficlight (iOS+Android), frontend/BUILD.md with
  exact `eas build` steps (user runs with their free Expo account).
- Fixed dev-console error: `collapsable` prop stripped before reaching SVG DOM
  (forwardRef wrapper around Polygon). Console now clean.

## Implemented (2026-06, batch 3 — testing agent iteration_4: 100% pass)
- Boot flicker: LEDs start unpowered (OFF_COLOR) and pop on one-by-one to green
  over ~0.5s on app open (BOOT phase reuses the digital-flip machinery).
- Double-tap cancel: two taps <300ms apart during RED_ACTIVE clear the red timer
  and flip straight back to green (skips amber completion); single taps during
  red do nothing; performAction count unaffected. A11y text during red:
  "Active, double tap to cancel".
- Sound ticks: ~20 faint Web Audio square-wave clicks scattered across each
  transition (src/sound.js). Web/preview only — silent no-op on native (haptics
  cover device feedback). Knobs: SOUND_TICKS/TICK_COUNT/TICK_VOLUME.
- Color-blind mode: CONFIG.COLOR_BLIND_MODE (default OFF). ON = green all lit,
  amber checker pattern, red large X of dimmed hexes (CUE_DIM=0.35); cue flips
  digitally with each LED's colour. Visually verified ON (checker + X render).

## Backlog / next
- P2: User runs `eas build --profile preview --platform android` per BUILD.md to
  get an installable APK; haptics verifiable only on real device.
- P2: Native device/simulator validation (all testing so far is Expo Web).
