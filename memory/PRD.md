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

## Backlog / next
- P2: Native device build (iOS/Android via Expo Go / EAS) — currently web preview.
- P2: Optional haptics on tap (native).
- P2: Suppress dev-only react-native-web `collapsable` console warning.
